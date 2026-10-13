"""
Waste Operations & Problem Solving Services (Phase 8 & 9)
Includes:
- Haversine Geospatial Duplicate Detection
- Rule-based Municipal Team Auto-Assignment
- Cleanup Verification Comparison Logic
"""

import math
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Report, Assignment, VerificationResult


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS coordinates in meters.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def check_duplicate_report(
    db: Session,
    latitude: float,
    longitude: float,
    threshold_meters: float = 75.0,
    hours_window: int = 48,
) -> Tuple[bool, Optional[int]]:
    """
    Check if a report already exists within `threshold_meters` in the last `hours_window`.
    Returns (is_duplicate: bool, original_report_id: Optional[int]).
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours_window)

    recent_reports = (
        db.query(Report)
        .filter(Report.created_at >= cutoff_time)
        .filter(Report.status.notin_(["Resolved", "Rejected"]))
        .all()
    )

    for rep in recent_reports:
        dist = haversine_distance_meters(latitude, longitude, rep.latitude, rep.longitude)
        if dist <= threshold_meters:
            return True, rep.id

    return False, None


DISTRICT_TEAMS = {
    "District South (Saddar, Clifton, DHA)": "SSWMB - District South Rapid Response Team",
    "District East (Gulshan, Jamshed)": "SSWMB - District East Sanitation Unit",
    "District Central (Nazimabad, North Nazimabad)": "SSWMB - Central Municipal Action Fleet",
    "District Korangi": "SSWMB - Korangi Industrial & Residential Unit",
    "District Keamari": "SSWMB - Keamari Coastal & Harbor Cleanup Team",
    "District Malir": "SSWMB - Malir Rural & Urban Sanitation Cell",
}


def auto_assign_team(district: str) -> str:
    """
    Auto-route verified reports to the appropriate municipal sanitation team based on district.
    """
    return DISTRICT_TEAMS.get(district, "Karachi Municipal Solid Waste General Fleet")


def verify_cleanup_comparison(
    before_coverage: float,
    after_coverage: float,
    before_count: int,
    after_count: int,
) -> Dict[str, Any]:
    """
    Compare before and after detection results to verify cleanup efficacy (Phase 10).
    """
    if before_coverage > 0:
        reduction_pct = ((before_coverage - after_coverage) / before_coverage) * 100.0
    else:
        reduction_pct = 100.0 if after_coverage == 0 else 0.0

    if after_count == 0 or after_coverage <= 5.0 or reduction_pct >= 70.0:
        verdict = "Verified Clean"
        status = "Resolved"
        explanation = f"AI verified major cleanup: {reduction_pct:.1f}% waste reduction achieved (after coverage: {after_coverage}%)."
    elif reduction_pct >= 35.0:
        verdict = "Partially Clean"
        status = "In Progress"
        explanation = f"Waste coverage was reduced by {reduction_pct:.1f}% (from {before_coverage}% to {after_coverage}%), but some items remain."
    else:
        verdict = "Still Present"
        status = "Assigned"
        explanation = f"Significant waste remains ({after_count} items detected, {after_coverage}% coverage). Action required."

    return {
        "verdict": verdict,
        "suggested_status": status,
        "reduction_pct": round(max(0.0, reduction_pct), 2),
        "explanation": explanation,
    }
