"""
SQLAlchemy Database Models for Karachi WasteWatch AI
Defines schema for users, reports, AI results, severity, assignments, verification, report history, and notifications.
"""

from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    citizen_id = Column(String(50), unique=True, index=True, nullable=True)  # e.g. CIT-10492
    admin_id = Column(String(50), unique=True, index=True, nullable=True)    # e.g. ADMIN-001
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen")  # citizen, admin, field_worker
    complaint_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="citizen", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True)  # Unique Report ID e.g. RPT-KHI-10492
    report_code = Column(String(50), unique=True, index=True)  # Legacy/compatibility alias
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")  # Pending -> Verified -> In Progress -> Resolved, Rejected, Cancelled
    photo_path = Column(String(255), nullable=False)
    district = Column(String(100), index=True)  # District South, East, Central, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    citizen = relationship("User", back_populates="reports")
    ai_detection = relationship("AIDetection", back_populates="report", uselist=False, cascade="all, delete-orphan")
    severity = relationship("SeverityScore", back_populates="report", uselist=False, cascade="all, delete-orphan")
    assignment = relationship("Assignment", back_populates="report", uselist=False, cascade="all, delete-orphan")
    verification = relationship("VerificationResult", back_populates="report", uselist=False, cascade="all, delete-orphan")
    history = relationship("ReportHistory", back_populates="report", cascade="all, delete-orphan", order_by="desc(ReportHistory.created_at)")


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), default="System")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="history")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AIDetection(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    total_detections = Column(Integer, default=0)
    waste_coverage_pct = Column(Float, default=0.0)
    raw_detections_json = Column(Text, default="[]")
    model_version = Column(String(50), default="yolo11n")
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="ai_detection")

    def get_detections(self):
        try:
            return json.loads(self.raw_detections_json)
        except Exception:
            return []


class SeverityScore(Base):
    __tablename__ = "severity_scores"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    level = Column(String(20), default="Medium")  # Low, Medium, High
    score = Column(Float, default=0.5)  # 0.0 to 1.0
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="severity")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    assigned_team = Column(String(100), nullable=False)  # e.g., "District South Municipal Sanitation Unit 3"
    worker_notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="assignment")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    after_photo_path = Column(String(255), nullable=False)
    verdict = Column(String(50), default="Needs Review")  # Verified Clean, Partially Clean, Still Present
    waste_reduction_pct = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="verification")


class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    report_count = Column(Integer, default=1)
    severity_level = Column(String(20), default="Medium")
    is_recurring = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.utcnow)
