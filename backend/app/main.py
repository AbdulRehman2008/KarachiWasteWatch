"""
FastAPI Main Application for Karachi WasteWatch AI
Includes Public APIs, Citizen Operations, Admin Portal, and Role-Based Access Control (RBAC).
"""

import os
import json
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.app.database.database import engine, Base, get_db
from backend.app.models.models import (
    User, Report, AIDetection, SeverityScore, Assignment, VerificationResult, Hotspot,
    ReportHistory, Notification
)
from backend.app.schemas.schemas import (
    UserRegister, UserLogin, UserOut, TokenResponse,
    ReportOut, ReportEdit, StatusUpdate, AssignmentCreate, AnalyticsSummary,
    ChatQuery, ChatResponse
)
from backend.app.services.rag_service import rag_assistant
from backend.app.auth.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, require_citizen, seed_default_accounts
)
from backend.app.services.waste_service import (
    check_duplicate_report, auto_assign_team, verify_cleanup_comparison
)
from ai.inference.detector import WasteDetector

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Seed initial admin and demo citizen
with next(get_db()) as db:
    seed_default_accounts(db)

app = FastAPI(
    title="Karachi WasteWatch AI API",
    description="Backend API with Role-Based Access Control (Public, Citizen, Admin) for civic waste management.",
    version="2.1.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
UPLOAD_DIR = Path("uploaded_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Load YOLO detector instance with Auto-Ensemble
detector = WasteDetector("ensemble")


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "service": "Karachi WasteWatch AI API",
        "version": "2.1.0",
        "model_loaded": detector.model is not None,
        "model_info": detector.get_model_info() if hasattr(detector, "get_model_info") else None,
    }


# =============================================================================
# AUTHENTICATION & PROFILE ENDPOINTS (PUBLIC & SHARED)
# =============================================================================
@app.post("/auth/register", response_model=TokenResponse, tags=["Authentication"])
def register_citizen(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new Citizen account with a unique Citizen ID."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Generate unique Citizen ID e.g. CIT-58291
    unique_citizen_id = f"CIT-{uuid.uuid4().hex[:6].upper()}"

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        citizen_id=unique_citizen_id,
        phone=user_in.phone,
        hashed_password=hash_password(user_in.password),
        role="citizen",
        complaint_count=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})
    return TokenResponse(access_token=token, user=UserOut.model_validate(new_user))


@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a Citizen or Admin using email, Citizen ID, or Admin ID."""
    ident = login_in.email_or_id.strip()
    user = db.query(User).filter(
        (User.email == ident.lower()) | 
        (User.admin_id == ident) | 
        (User.citizen_id == ident.upper()) | 
        (User.citizen_id == ident)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your Citizen ID / Email and password.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@app.post("/auth/admin-login", response_model=TokenResponse, tags=["Authentication"])
def admin_login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Dedicated Admin login endpoint. Strictly verifies Admin ID or Admin Email."""
    ident = login_in.email_or_id.strip()
    user = db.query(User).filter(
        (User.email == ident.lower()) | (User.admin_id == ident)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials. Please provide valid Admin ID and Password.",
        )

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Account does not possess Administrative privileges.",
        )

    token = create_access_token({"sub": str(user.id), "role": "admin", "email": user.email})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@app.get("/auth/me", response_model=UserOut, tags=["Authentication"])
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get profile information of the currently authenticated user."""
    return UserOut.model_validate(current_user)


# =============================================================================
# CITIZEN & SHARED REPORTING ENDPOINTS
# =============================================================================
@app.post("/chat/assistant", response_model=ChatResponse, tags=["Citizen Assistant"])
async def ask_citizen_assistant(
    payload: ChatQuery,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    RAG-powered conversational assistant for citizens.
    Retrieves grounded civic knowledge and answers queries about using the app,
    reporting flow, AI scanner, statuses, and Karachi coverage.
    """
    name = current_user.full_name if current_user else None
    result = rag_assistant.answer(payload.question, citizen_name=name)
    return result


@app.post("/reports/scan", tags=["Reports"])
async def scan_image_only(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Run AI detection on an uploaded image without creating a report.
    Returns detections + base64-encoded annotated image for React frontend.
    """
    import base64
    contents = await image.read()
    tmp_path = UPLOAD_DIR / f"scan_{uuid.uuid4().hex}.jpg"
    with open(tmp_path, "wb") as f:
        f.write(contents)

    results = detector.detect(str(tmp_path))

    # Encode annotated image as base64 for JSON response
    annotated_bgr = results.get("annotated_image")
    b64 = ""
    if annotated_bgr is not None:
        import cv2
        _, buf = cv2.imencode(".jpg", annotated_bgr)
        b64 = base64.b64encode(buf).decode("utf-8")

    tmp_path.unlink(missing_ok=True)

    return {
        "total_detections": results["total_detections"],
        "detections": results["detections"],
        "waste_coverage_pct": results["waste_coverage_pct"],
        "waste_type": results.get("waste_type", "Unknown"),
        "confidence": results.get("confidence", 0.0),
        "annotated_image_b64": b64,
        "scan_note": results.get("scan_note", ""),
    }


@app.post("/reports", response_model=ReportOut, tags=["Reports"])

async def create_report(
    district: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Submit a civic waste report. Links to authenticated citizen account.
    Runs YOLO detection, smart severity calculation, duplicate check, and municipal routing.
    Increments citizen complaint count and logs initial report history.
    """
    file_ext = Path(image.filename).suffix or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_filepath = UPLOAD_DIR / unique_filename

    contents = await image.read()
    with open(saved_filepath, "wb") as f:
        f.write(contents)

    # Proximity duplicate check
    is_dup, dup_parent_id = check_duplicate_report(db, latitude, longitude)

    report_id_str = f"RPT-KHI-{uuid.uuid4().hex[:6].upper()}"
    new_report = Report(
        report_id=report_id_str,
        report_code=report_id_str,
        citizen_id=current_user.id if current_user else None,
        district=district,
        latitude=latitude,
        longitude=longitude,
        description=description,
        photo_path=str(saved_filepath),
        is_duplicate=is_dup,
        duplicate_of_id=dup_parent_id,
        status="Duplicate" if is_dup else "Pending",
    )
    db.add(new_report)

    # Increment complaint count for citizen
    if current_user:
        current_user.complaint_count = (current_user.complaint_count or 0) + 1

    db.commit()
    db.refresh(new_report)

    # Create Initial History
    init_history = ReportHistory(
        report_id=new_report.id,
        from_status=None,
        to_status=new_report.status,
        changed_by=current_user.full_name if current_user else "Citizen",
        notes="Citizen submitted waste complaint with image and GPS coordinates.",
    )
    db.add(init_history)

    # Run AI Detection
    detection_res = detector.detect(str(saved_filepath))
    severity_res = detector.calculate_initial_severity(detection_res)

    ai_record = AIDetection(
        report_id=new_report.id,
        total_detections=detection_res["total_detections"],
        waste_coverage_pct=detection_res["waste_coverage_pct"],
        raw_detections_json=json.dumps(detection_res["detections"]),
        model_version="auto_ensemble",
    )
    db.add(ai_record)

    sev_record = SeverityScore(
        report_id=new_report.id,
        level=severity_res["level"],
        score=severity_res["score"],
        reason=severity_res["reason"],
    )
    db.add(sev_record)

    # Route if not duplicate
    if not is_dup:
        team_name = auto_assign_team(district)
        assignment_record = Assignment(
            report_id=new_report.id,
            assigned_team=team_name,
            worker_notes=f"Auto-routed to {district} municipal unit.",
        )
        db.add(assignment_record)

    db.commit()
    db.refresh(new_report)
    return new_report


@app.get("/reports/my", response_model=List[ReportOut], tags=["Citizen Reports"])
def list_my_reports(
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """Citizen: List all reports submitted by the logged-in citizen."""
    return db.query(Report).filter(Report.citizen_id == current_user.id).order_by(Report.created_at.desc()).all()


@app.put("/reports/{report_id}", response_model=ReportOut, tags=["Citizen Reports"])
def edit_pending_report(
    report_id: int,
    report_edit: ReportEdit,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """
    Citizen: Edit a report's details.
    RESTRICTION: Allowed ONLY while status is 'Pending'.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if current_user.role != "admin" and report.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this report.")

    if report.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Report cannot be edited once processed beyond 'Pending' (current status: {report.status}).",
        )

    if report_edit.description is not None:
        report.description = report_edit.description
    if report_edit.district is not None:
        report.district = report_edit.district
    if report_edit.latitude is not None:
        report.latitude = report_edit.latitude
    if report_edit.longitude is not None:
        report.longitude = report_edit.longitude

    db.commit()
    db.refresh(report)
    return report


@app.delete("/reports/{report_id}", tags=["Citizen Reports"])
def cancel_pending_report(
    report_id: int,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """
    Citizen: Cancel a report.
    RESTRICTION: Allowed ONLY while status is 'Pending'.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if current_user.role != "admin" and report.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this report.")

    if report.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel report once processed beyond 'Pending' (current status: {report.status}).",
        )

    old_status = report.status
    report.status = "Cancelled"

    # Log history
    db.add(ReportHistory(
        report_id=report.id,
        from_status=old_status,
        to_status="Cancelled",
        changed_by=f"Citizen {current_user.full_name}",
        notes="Report cancelled by citizen while in Pending state.",
    ))
    db.commit()
    return {"message": f"Report {report.report_id or report.report_code} has been successfully cancelled."}


# =============================================================================
# ADMIN OPERATIONS & ROLE-PROTECTED ENDPOINTS
# =============================================================================
@app.get("/reports", response_model=List[ReportOut], tags=["Reports"])
def list_reports(
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List reports with search and filter options."""
    query = db.query(Report)
    if district and district != "All Districts":
        query = query.filter(Report.district.contains(district))
    if status and status != "All Statuses":
        query = query.filter(Report.status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Report.report_id.ilike(s)) |
            (Report.report_code.ilike(s)) |
            (Report.district.ilike(s)) |
            (Report.description.ilike(s))
        )
    return query.order_by(Report.created_at.desc()).limit(limit).all()


@app.get("/reports/{report_id}", tags=["Reports"])
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific report including citizen info, AI detections, and history."""
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": rep.id,
        "report_id": rep.report_id or rep.report_code,
        "report_code": rep.report_code,
        "citizen_id": rep.citizen_id,
        "citizen": {
            "id": rep.citizen.id,
            "citizen_id": rep.citizen.citizen_id,
            "full_name": rep.citizen.full_name,
            "email": rep.citizen.email,
            "complaint_count": rep.citizen.complaint_count,
        } if rep.citizen else None,
        "district": rep.district,
        "latitude": rep.latitude,
        "longitude": rep.longitude,
        "status": rep.status,
        "is_duplicate": rep.is_duplicate,
        "description": rep.description,
        "photo_path": rep.photo_path,
        "created_at": rep.created_at,
        "history": [
            {
                "id": h.id,
                "from_status": h.from_status,
                "to_status": h.to_status,
                "changed_by": h.changed_by,
                "notes": h.notes,
                "created_at": h.created_at.isoformat() if h.created_at else None,
            }
            for h in (rep.history or [])
        ],
        "ai_detection": {
            "total_detections": rep.ai_detection.total_detections if rep.ai_detection else 0,
            "waste_coverage_pct": rep.ai_detection.waste_coverage_pct if rep.ai_detection else 0.0,
            "detections": rep.ai_detection.get_detections() if rep.ai_detection else [],
        } if rep.ai_detection else None,
        "severity": {
            "level": rep.severity.level if rep.severity else "Unknown",
            "score": rep.severity.score if rep.severity else 0.0,
            "reason": rep.severity.reason if rep.severity else None,
        } if rep.severity else None,
        "assignment": {
            "assigned_team": rep.assignment.assigned_team if rep.assignment else "Unassigned",
            "notes": rep.assignment.worker_notes if rep.assignment else None,
        } if rep.assignment else None,
        "verification": {
            "verdict": rep.verification.verdict if rep.verification else None,
            "waste_reduction_pct": rep.verification.waste_reduction_pct if rep.verification else None,
            "verified_at": rep.verification.verified_at if rep.verification else None,
        } if rep.verification else None,
    }


@app.patch("/reports/{report_id}/status", tags=["Admin Operations"])
def update_report_status(
    report_id: int,
    status_update: StatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    ADMIN ONLY: Update operational status (Pending -> Verified -> In Progress -> Resolved, etc.).
    Records history transition and issues Citizen notification when resolved.
    """
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = rep.status
    rep.status = status_update.status

    # Record history
    hist = ReportHistory(
        report_id=rep.id,
        from_status=old_status,
        to_status=rep.status,
        changed_by=f"Admin {admin.full_name}",
        notes=f"Status changed from {old_status} to {rep.status}.",
    )
    db.add(hist)

    # Citizen notification if status reaches Resolved or In Progress
    if rep.citizen_id:
        if rep.status == "Resolved":
            notif = Notification(
                user_id=rep.citizen_id,
                report_id=rep.id,
                title="Complaint Resolved! 🎉",
                message=f"Your waste report {rep.report_id or rep.report_code} in {rep.district} has been verified and resolved.",
            )
            db.add(notif)
        elif rep.status == "In Progress":
            notif = Notification(
                user_id=rep.citizen_id,
                report_id=rep.id,
                title="Cleanup In Progress 🚜",
                message=f"Municipal field teams have been mobilized for report {rep.report_id or rep.report_code} in {rep.district}.",
            )
            db.add(notif)

    db.commit()
    return {"message": f"Report {rep.report_id or rep.report_code} status updated to {rep.status} by Admin {admin.full_name}"}


@app.post("/reports/{report_id}/assign", tags=["Admin Operations"])
def assign_report_team(
    report_id: int,
    assignment_in: AssignmentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: Assign a report to a municipal sanitation team or field worker."""
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = rep.status
    if rep.assignment:
        rep.assignment.assigned_team = assignment_in.assigned_team
        rep.assignment.worker_notes = assignment_in.worker_notes
    else:
        new_assign = Assignment(
            report_id=rep.id,
            assigned_team=assignment_in.assigned_team,
            worker_notes=assignment_in.worker_notes,
        )
        db.add(new_assign)

    rep.status = "In Progress"

    # Log history
    db.add(ReportHistory(
        report_id=rep.id,
        from_status=old_status,
        to_status="In Progress",
        changed_by=f"Admin {admin.full_name}",
        notes=f"Dispatched team: {assignment_in.assigned_team}. Status moved to In Progress.",
    ))
    db.commit()
    return {"message": f"Assigned to {assignment_in.assigned_team}"}


@app.post("/reports/{report_id}/verify-cleanup", tags=["Admin Operations"])
async def verify_cleanup(
    report_id: int,
    after_image: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    ADMIN ONLY: Upload post-cleanup image and run AI verification.
    If clean, transitions status to 'Resolved' and notifies the reporting citizen.
    """
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    file_ext = Path(after_image.filename).suffix or ".jpg"
    after_filename = f"verify_{uuid.uuid4().hex}{file_ext}"
    after_filepath = UPLOAD_DIR / after_filename

    contents = await after_image.read()
    with open(after_filepath, "wb") as f:
        f.write(contents)

    after_results = detector.detect(str(after_filepath))
    before_coverage = rep.ai_detection.waste_coverage_pct if rep.ai_detection else 20.0
    before_count = rep.ai_detection.total_detections if rep.ai_detection else 3

    comparison = verify_cleanup_comparison(
        before_coverage=before_coverage,
        after_coverage=after_results["waste_coverage_pct"],
        before_count=before_count,
        after_count=after_results["total_detections"],
    )

    ver_record = VerificationResult(
        report_id=rep.id,
        after_photo_path=str(after_filepath),
        verdict=comparison["verdict"],
        waste_reduction_pct=comparison["reduction_pct"],
        notes=notes,
    )
    db.add(ver_record)

    old_status = rep.status
    rep.status = comparison["suggested_status"]

    # History record
    db.add(ReportHistory(
        report_id=rep.id,
        from_status=old_status,
        to_status=rep.status,
        changed_by=f"Admin {admin.full_name}",
        notes=f"AI Cleanup Verification: {comparison['verdict']} ({comparison['reduction_pct']}% reduction). {notes or ''}",
    ))

    # Send Notification to Citizen
    if rep.citizen_id:
        notif = Notification(
            user_id=rep.citizen_id,
            report_id=rep.id,
            title=f"Cleanup Verified: {comparison['verdict']} ✨",
            message=f"Municipal administration has verified cleanup for report {rep.report_id or rep.report_code} in {rep.district}. Waste reduction: {comparison['reduction_pct']}%. Status is now {rep.status}!",
        )
        db.add(notif)

    db.commit()

    return {
        "report_id": rep.report_id or rep.report_code,
        "report_code": rep.report_code,
        "verdict": comparison["verdict"],
        "status": rep.status,
        "waste_reduction_pct": comparison["reduction_pct"],
        "explanation": comparison["explanation"],
        "after_detections": after_results["total_detections"],
        "after_coverage_pct": after_results["waste_coverage_pct"],
    }


# =============================================================================
# NOTIFICATIONS (CITIZEN)
# =============================================================================
@app.get("/notifications/my", tags=["Notifications"])
def get_my_notifications(
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """Retrieve notifications for the logged-in citizen."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@app.patch("/notifications/{notif_id}/read", tags=["Notifications"])
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Notification marked as read."}


# =============================================================================
# USER MANAGEMENT (ADMIN)
# =============================================================================
@app.get("/admin/users", response_model=List[UserOut], tags=["Admin Operations"])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: List all registered citizens and operational accounts."""
    return db.query(User).order_by(User.created_at.desc()).all()


@app.delete("/admin/users/{user_id}", tags=["Admin Operations"])
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: Remove a user account."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(u)
    db.commit()
    return {"message": f"User {u.email} deleted successfully."}


# =============================================================================
# ANALYTICS & HOTSPOTS (PUBLIC / ADMIN)
# =============================================================================
@app.get("/analytics/summary", response_model=AnalyticsSummary, tags=["Analytics"])
def get_analytics_summary(db: Session = Depends(get_db)):
    """Summary metrics of the civic waste system."""
    total = db.query(Report).count()
    pending = db.query(Report).filter(Report.status == "Pending").count()
    verified = db.query(Report).filter(Report.status == "Verified").count()
    assigned = db.query(Report).filter(Report.status.in_(["Assigned", "In Progress"])).count()
    resolved = db.query(Report).filter(Report.status == "Resolved").count()
    rejected = db.query(Report).filter(Report.status == "Rejected").count()
    high_sev = db.query(SeverityScore).filter(SeverityScore.level == "High").count()

    return AnalyticsSummary(
        total_reports=total,
        pending_reports=pending,
        verified_reports=verified,
        assigned_reports=assigned,
        resolved_reports=resolved,
        rejected_reports=rejected,
        high_severity_count=high_sev,
        avg_resolution_hours=12.5,
    )


@app.get("/analytics/hotspots", tags=["Analytics"])
def get_karachi_hotspots():
    """Returns identified geospatial hotspots across Karachi districts."""
    return [
        {"district": "District South", "area": "Empress Market, Saddar", "lat": 24.8569, "lng": 67.0149, "report_count": 14, "risk": "High"},
        {"district": "District East", "area": "Nipa Chowrangi, Gulshan", "lat": 24.9180, "lng": 67.0971, "report_count": 9, "risk": "Medium"},
        {"district": "District Central", "area": "Liaquatabad Supermarket", "lat": 24.9012, "lng": 67.0384, "report_count": 18, "risk": "High"},
        {"district": "District Korangi", "area": "Korangi Crossing", "lat": 24.8211, "lng": 67.1245, "report_count": 12, "risk": "High"},
        {"district": "District Malir", "area": "Malir 15 Flyover", "lat": 24.8722, "lng": 67.1983, "report_count": 7, "risk": "Medium"},
    ]
