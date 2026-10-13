"""
Authentication & Role-Based Access Control (RBAC) Module
Karachi WasteWatch AI
Implements JWT tokens, bcrypt password hashing, role guard dependencies, and database seeder.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
import json
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import (
    User, Report, AIDetection, SeverityScore, Assignment, VerificationResult,
    ReportHistory, Notification
)

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "karachi-wastewatch-ai-jwt-secret-key-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash plain text password with bcrypt salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token containing user identity and role."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates current user from JWT Bearer token.
    Enforces that the user exists in database and token is valid.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Optional authentication dependency.
    Returns User if valid Bearer token provided, otherwise None without raising 401.
    """
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is not None:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        pass
    return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Strict RBAC guard: enforces that only users with role='admin' can proceed.
    Raises HTTP 403 Forbidden for citizens or unprivileged callers.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin credentials required to access this resource.",
        )
    return current_user


def require_citizen(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensures user is an authenticated user (citizen or admin).
    """
    return current_user


def seed_default_accounts(db: Session):
    """
    Seeds initial default Admin and demo Citizen accounts, sample reports, histories, and notifications.
    Admin ID: ADMIN-001 (or admin@wastewatch.pk) / Password: Admin@Karachi2026
    Citizen: citizen@wastewatch.pk (or CIT-10001) / Password: Citizen@Karachi2026
    """
    # 1. Default Admin
    admin_user = db.query(User).filter(
        (User.email == "admin@wastewatch.pk") | (User.admin_id == "ADMIN-001")
    ).first()
    if not admin_user:
        admin_user = User(
            full_name="Karachi Sanitation Control Admin",
            email="admin@wastewatch.pk",
            admin_id="ADMIN-001",
            role="admin",
            hashed_password=hash_password("Admin@Karachi2026"),
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # 2. Demo Citizen 1 (Ali Raza)
    demo_citizen = db.query(User).filter(
        (User.email == "citizen@wastewatch.pk") | (User.citizen_id == "CIT-10001")
    ).first()
    if not demo_citizen:
        demo_citizen = User(
            full_name="Ali Raza (Citizen)",
            email="citizen@wastewatch.pk",
            citizen_id="CIT-10001",
            phone="0300-1234567",
            role="citizen",
            complaint_count=3,
            hashed_password=hash_password("Citizen@Karachi2026"),
        )
        db.add(demo_citizen)
        db.commit()
        db.refresh(demo_citizen)
    elif not demo_citizen.citizen_id:
        demo_citizen.citizen_id = "CIT-10001"
        db.commit()

    # 3. Demo Citizen 2 (Fatima Noor)
    citizen_2 = db.query(User).filter(
        (User.email == "fatima@wastewatch.pk") | (User.citizen_id == "CIT-20455")
    ).first()
    if not citizen_2:
        citizen_2 = User(
            full_name="Fatima Noor",
            email="fatima@wastewatch.pk",
            citizen_id="CIT-20455",
            phone="0333-9876543",
            role="citizen",
            complaint_count=1,
            hashed_password=hash_password("Citizen@Karachi2026"),
        )
        db.add(citizen_2)
        db.commit()
        db.refresh(citizen_2)

    # 4. Seed realistic reports if none exist
    if db.query(Report).count() == 0:
        base_img_1 = "uploaded_images/sample_street_waste_1.jpg"
        base_img_2 = "uploaded_images/sample_plastic_bottles_2.jpg"
        clean_img = "uploaded_images/sample_cleaned_street_3.jpg"

        # Report 1: Pending
        r1 = Report(
            report_id="RPT-KHI-10492",
            report_code="RPT-KHI-10492",
            citizen_id=demo_citizen.id,
            district="District South (Saddar, Clifton, DHA)",
            latitude=24.8569,
            longitude=67.0149,
            description="Illegal garbage pile spilling onto roadway near Empress Market Saddar.",
            photo_path=base_img_1,
            status="Pending",
            created_at=datetime.utcnow() - timedelta(hours=5),
        )
        db.add(r1)
        db.commit()
        db.refresh(r1)

        db.add(AIDetection(
            report_id=r1.id,
            total_detections=6,
            waste_coverage_pct=18.5,
            raw_detections_json=json.dumps([
                {"class_name": "Plastic/Bottle Litter", "confidence": 0.88, "bbox": [120, 80, 240, 210], "area_ratio": 0.05},
                {"class_name": "Garbage Bag", "confidence": 0.82, "bbox": [310, 140, 480, 360], "area_ratio": 0.08},
                {"class_name": "Organic Waste", "confidence": 0.74, "bbox": [200, 220, 310, 340], "area_ratio": 0.055},
            ]),
            model_version="auto_ensemble",
        ))
        db.add(SeverityScore(
            report_id=r1.id,
            level="High",
            score=0.85,
            reason="High severity: 6 waste items detected covering 18.5% of roadway.",
        ))
        db.add(ReportHistory(
            report_id=r1.id,
            from_status=None,
            to_status="Pending",
            changed_by="Ali Raza (Citizen)",
            notes="Initial civic report filed with photo and GPS location.",
            created_at=datetime.utcnow() - timedelta(hours=5),
        ))

        # Report 2: In Progress
        r2 = Report(
            report_id="RPT-KHI-20581",
            report_code="RPT-KHI-20581",
            citizen_id=demo_citizen.id,
            district="District Central (Nazimabad, North Nazimabad)",
            latitude=24.9012,
            longitude=67.0384,
            description="Scattered plastic bottle waste and cardboard near Liaquatabad Supermarket.",
            photo_path=base_img_2,
            status="In Progress",
            created_at=datetime.utcnow() - timedelta(hours=14),
        )
        db.add(r2)
        db.commit()
        db.refresh(r2)

        db.add(AIDetection(
            report_id=r2.id,
            total_detections=4,
            waste_coverage_pct=11.2,
            raw_detections_json=json.dumps([
                {"class_name": "Plastic Bottle", "confidence": 0.91, "bbox": [150, 120, 260, 290], "area_ratio": 0.04},
                {"class_name": "Cardboard Box", "confidence": 0.79, "bbox": [320, 180, 450, 310], "area_ratio": 0.072},
            ]),
            model_version="auto_ensemble",
        ))
        db.add(SeverityScore(
            report_id=r2.id,
            level="Medium",
            score=0.55,
            reason="Medium severity: 4 items detected covering 11.2% of ground.",
        ))
        db.add(Assignment(
            report_id=r2.id,
            assigned_team="District Central Municipal Sanitation Unit 2",
            worker_notes="Dispatched 2 field workers with collection trolley.",
        ))
        db.add(ReportHistory(
            report_id=r2.id,
            from_status=None,
            to_status="Pending",
            changed_by="Ali Raza (Citizen)",
            notes="Citizen report created.",
            created_at=datetime.utcnow() - timedelta(hours=14),
        ))
        db.add(ReportHistory(
            report_id=r2.id,
            from_status="Pending",
            to_status="Verified",
            changed_by="Admin Karachi Sanitation Control Admin",
            notes="Reviewed and verified street obstruction.",
            created_at=datetime.utcnow() - timedelta(hours=10),
        ))
        db.add(ReportHistory(
            report_id=r2.id,
            from_status="Verified",
            to_status="In Progress",
            changed_by="Admin Karachi Sanitation Control Admin",
            notes="Dispatched District Central Municipal Unit 2. Physical cleaning underway.",
            created_at=datetime.utcnow() - timedelta(hours=3),
        ))
        db.add(Notification(
            user_id=demo_citizen.id,
            report_id=r2.id,
            title="Cleanup In Progress 🚜",
            message=f"Municipal field teams have mobilized to clean report {r2.report_id} in {r2.district}.",
            created_at=datetime.utcnow() - timedelta(hours=3),
        ))

        # Report 3: Resolved
        r3 = Report(
            report_id="RPT-KHI-30114",
            report_code="RPT-KHI-30114",
            citizen_id=demo_citizen.id,
            district="District East (Gulshan, Jamshed)",
            latitude=24.9180,
            longitude=67.0971,
            description="Large open dump near Nipa Chowrangi roundabout.",
            photo_path=base_img_1,
            status="Resolved",
            created_at=datetime.utcnow() - timedelta(days=1, hours=8),
        )
        db.add(r3)
        db.commit()
        db.refresh(r3)

        db.add(AIDetection(
            report_id=r3.id,
            total_detections=5,
            waste_coverage_pct=21.0,
            raw_detections_json=json.dumps([
                {"class_name": "Garbage Pile", "confidence": 0.85, "bbox": [100, 100, 400, 350], "area_ratio": 0.21},
            ]),
            model_version="auto_ensemble",
        ))
        db.add(SeverityScore(
            report_id=r3.id,
            level="High",
            score=0.85,
            reason="High severity dumping near intersection.",
        ))
        db.add(Assignment(
            report_id=r3.id,
            assigned_team="District East Rapid Response Unit 1",
            worker_notes="Heavy compactor truck deployed.",
        ))
        db.add(VerificationResult(
            report_id=r3.id,
            after_photo_path=clean_img,
            verdict="Verified Clean",
            waste_reduction_pct=95.0,
            notes="Area thoroughly cleaned, swept, and municipal bin placed.",
            verified_at=datetime.utcnow() - timedelta(hours=2),
        ))
        db.add(ReportHistory(
            report_id=r3.id,
            from_status=None,
            to_status="Pending",
            changed_by="Ali Raza (Citizen)",
            notes="Initial submission.",
            created_at=datetime.utcnow() - timedelta(days=1, hours=8),
        ))
        db.add(ReportHistory(
            report_id=r3.id,
            from_status="Pending",
            to_status="Verified",
            changed_by="Admin Karachi Sanitation Control Admin",
            notes="Verified high priority civic complaint.",
            created_at=datetime.utcnow() - timedelta(days=1, hours=4),
        ))
        db.add(ReportHistory(
            report_id=r3.id,
            from_status="Verified",
            to_status="In Progress",
            changed_by="Admin Karachi Sanitation Control Admin",
            notes="Team deployed for physical collection.",
            created_at=datetime.utcnow() - timedelta(hours=10),
        ))
        db.add(ReportHistory(
            report_id=r3.id,
            from_status="In Progress",
            to_status="Resolved",
            changed_by="Admin Karachi Sanitation Control Admin",
            notes="AI comparative analysis verified 95.0% waste reduction. Verified Clean!",
            created_at=datetime.utcnow() - timedelta(hours=2),
        ))
        db.add(Notification(
            user_id=demo_citizen.id,
            report_id=r3.id,
            title="Waste Cleanup Verified & Resolved! 🎉",
            message=f"Good news! Municipal administration has physically cleaned and verified report {r3.report_id} in {r3.district}. Waste reduction: 95.0%. Thank you for helping clean Karachi!",
            created_at=datetime.utcnow() - timedelta(hours=2),
        ))

        db.commit()
