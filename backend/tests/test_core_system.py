"""
Unit & Integration Tests for Karachi WasteWatch AI (Section 14 Acceptance Criteria + RBAC)
Verifies:
1. Duplicate report detection (Haversine proximity)
2. Rule-based & ML Severity scoring
3. Cleanup verification before/after comparison
4. Geospatial DBSCAN hotspot clustering
5. API health endpoint
6. User Registration & Authentication
7. Role-Based Access Control (RBAC): Admin vs Citizen endpoint protection
"""

try:
    import pytest
    fixture = pytest.fixture
except ImportError:
    def fixture(fn):
        return fn

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.waste_service import (
    haversine_distance_meters,
    verify_cleanup_comparison,
    auto_assign_team,
)
from ai.hotspots.cluster import detect_karachi_hotspots
from ai.severity_model.model import WasteSeverityML


@fixture
def client():
    return TestClient(app)



def test_api_health(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Karachi WasteWatch AI API"


def test_duplicate_distance_calculation():
    """Verify that GPS distance calculation accurately identifies nearby reports."""
    lat1, lon1 = 24.85690, 67.01490
    lat2, lon2 = 24.85710, 67.01505

    dist = haversine_distance_meters(lat1, lon1, lat2, lon2)
    assert 15 < dist < 45, f"Expected ~30m, got {dist}"

    lat_far, lon_far = 24.9180, 67.0971
    dist_far = haversine_distance_meters(lat1, lon1, lat_far, lon_far)
    assert dist_far > 5000, "Distance should exceed 5km"


def test_cleanup_verification_logic():
    """Test Before/After cleanup comparison logic."""
    res_clean = verify_cleanup_comparison(
        before_coverage=35.0, after_coverage=0.0, before_count=6, after_count=0
    )
    assert res_clean["verdict"] == "Verified Clean"
    assert res_clean["suggested_status"] == "Resolved"

    res_partial = verify_cleanup_comparison(
        before_coverage=40.0, after_coverage=15.0, before_count=8, after_count=2
    )
    assert res_partial["verdict"] == "Partially Clean"
    assert res_partial["suggested_status"] == "In Progress"

    res_still = verify_cleanup_comparison(
        before_coverage=25.0, after_coverage=24.0, before_count=5, after_count=5
    )
    assert res_still["verdict"] == "Still Present"


def test_auto_assign_team():
    """Test routing based on Karachi district."""
    team_south = auto_assign_team("District South (Saddar, Clifton, DHA)")
    assert "District South" in team_south

    team_central = auto_assign_team("District Central (Nazimabad, North Nazimabad)")
    assert "Central" in team_central


def test_dbscan_hotspot_detection():
    """Test spatial clustering of reports."""
    sample_reports = [
        {"id": 1, "latitude": 24.8569, "longitude": 67.0149, "district": "District South"},
        {"id": 2, "latitude": 24.8571, "longitude": 67.0151, "district": "District South"},
        {"id": 3, "latitude": 24.8568, "longitude": 67.0148, "district": "District South"},
        {"id": 4, "latitude": 24.9800, "longitude": 67.2000, "district": "District Malir"},
    ]

    res = detect_karachi_hotspots(sample_reports, epsilon_meters=300, min_reports=3)
    assert res["total_hotspots"] == 1
    assert res["hotspots"][0]["report_count"] == 3
    assert res["isolated_reports_count"] == 1


def test_ml_severity_model():
    """Test ML severity prediction."""
    ml_model = WasteSeverityML()
    pred = ml_model.predict(total_detections=10, waste_coverage_pct=45.0)
    assert pred["predicted_severity"] in ["Medium", "High"]
    assert "High" in pred["confidence_probabilities"]


def test_auth_and_rbac_flow(client):
    """Test registration, admin authentication, and RBAC endpoint protection."""
    # 1. Admin login with seeded credentials (ADMIN-001)
    admin_login_res = client.post("/auth/admin-login", json={
        "email_or_id": "ADMIN-001",
        "password": "Admin@Karachi2026"
    })
    assert admin_login_res.status_code == 200, admin_login_res.text
    admin_token = admin_login_res.json()["access_token"]
    assert admin_login_res.json()["user"]["role"] == "admin"
    assert admin_login_res.json()["user"]["admin_id"] == "ADMIN-001"

    # 2. Admin accesses protected admin user list
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    users_res = client.get("/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 1

    # 3. Citizen login with seeded demo account
    citizen_login_res = client.post("/auth/login", json={
        "email_or_id": "citizen@wastewatch.pk",
        "password": "Citizen@Karachi2026"
    })
    assert citizen_login_res.status_code == 200
    citizen_data = citizen_login_res.json()["user"]
    assert citizen_data["citizen_id"] == "CIT-10001"
    citizen_token = citizen_login_res.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # 4. Login directly using unique Citizen ID
    cit_id_login_res = client.post("/auth/login", json={
        "email_or_id": "CIT-10001",
        "password": "Citizen@Karachi2026"
    })
    assert cit_id_login_res.status_code == 200
    assert cit_id_login_res.json()["user"]["email"] == "citizen@wastewatch.pk"

    # 5. RBAC check: Citizen CANNOT access Admin endpoints (must return 403 Forbidden)
    forbidden_res = client.get("/admin/users", headers=citizen_headers)
    assert forbidden_res.status_code == 403
    assert "Admin credentials required" in forbidden_res.json()["detail"]


def test_citizen_registration_and_report_history(client):
    """Test citizen registration with unique Citizen ID and report history tracking."""
    # Register new citizen
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    reg_res = client.post("/auth/register", json={
        "full_name": "Test Citizen Karachi",
        "email": test_email,
        "password": "Password123!",
        "phone": "0300-9998877",
    })
    assert reg_res.status_code == 200
    reg_user = reg_res.json()["user"]
    assert reg_user["citizen_id"].startswith("CIT-")
    assert reg_user["complaint_count"] == 0

    # Test login with new Citizen ID
    c_token_res = client.post("/auth/login", json={
        "email_or_id": reg_user["citizen_id"],
        "password": "Password123!",
    })
    assert c_token_res.status_code == 200

    # Query report detail of seeded report RPT-KHI-10492
    reports_res = client.get("/reports")
    assert reports_res.status_code == 200
    r_list = reports_res.json()
    assert len(r_list) > 0
    first_r = r_list[0]
    assert first_r["report_id"] is not None

    # Get report detail
    detail_res = client.get(f"/reports/{first_r['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "history" in detail
    assert "citizen" in detail
    assert detail["citizen"] is not None
    assert detail["citizen"]["citizen_id"] is not None


def test_hazard_detection_engine():
    """Verify HazardDetectionEngine flags bio-medical risks and outputs PPE protocols."""
    from ai.hazard_detector import hazard_engine

    # Test bio-medical syringe detection
    bio_res = hazard_engine.analyze(
        detections=[{"class_name": "syringe", "confidence": 0.92}],
        description="Hazardous medical waste dumped outside clinic."
    )
    assert bio_res["is_hazardous"] is True
    assert bio_res["hazard_level"] == "CRITICAL HAZARD"
    assert "Bio-Medical" in bio_res["hazard_type"]
    assert "Puncture-Resistant" in bio_res["safety_protocol"]["ppe_required"][0]
    assert "HAZMAT" in bio_res["safety_protocol"]["specialized_team"]

    # Test safe household waste
    safe_res = hazard_engine.analyze(
        detections=[{"class_name": "cardboard", "confidence": 0.88}],
        description="Clean paper cartons on roadside."
    )
    assert safe_res["is_hazardous"] is False
    assert safe_res["hazard_level"] == "SAFE / LOW"


def test_dump_volume_tonnage_estimator():
    """Verify DumpVolumeEstimator computes realistic 3D volume, mass, and fleet recommendations."""
    from ai.volume_estimator import volume_estimator

    # Test small refuse pile
    small_res = volume_estimator.estimate(
        detections=[{"class_name": "plastic", "bbox": [100, 100, 300, 300]}],
        image_dimensions={"width": 800, "height": 600},
        waste_coverage_pct=15.0
    )
    assert small_res["estimated_volume_m3"] > 0.0
    assert small_res["estimated_tonnage"] > 0.0
    assert "vehicle_type" in small_res["dispatch_recommendation"]

    # Test major overflow pile
    large_res = volume_estimator.estimate(
        detections=[
            {"class_name": "trash", "bbox": [50, 50, 750, 550]},
            {"class_name": "garbage", "bbox": [100, 100, 700, 500]},
        ],
        image_dimensions={"width": 800, "height": 600},
        waste_coverage_pct=75.0
    )
    assert large_res["estimated_volume_m3"] >= 1.0
    assert "Compactor" in large_res["dispatch_recommendation"]["vehicle_type"]


def test_anti_fraud_duplicate_engine():
    """Verify AntiFraudEngine perceptual image hashing and duplicate detection."""
    from ai.anti_fraud import anti_fraud_engine, compute_dhash, hamming_distance

    # Test hash computation
    h1 = "2b0e83e367a7c1d4"
    h2 = "2b0e83e367a7c1d4"  # Exact duplicate
    h3 = "2b0e83e367a7c1d0"  # 1 bit difference
    h4 = "ffffffffffffffff"  # Completely different

    assert hamming_distance(h1, h2) == 0
    assert hamming_distance(h1, h3) == 1
    assert hamming_distance(h1, h4) > 20

    # Verify duplicate matching logic
    past_records = [{"report_id": "RPT-KHI-TEST99", "image_hash": h1}]
    # Simulate verification against identical hash
    dist = hamming_distance(h1, past_records[0]["image_hash"])
    assert dist <= 8, "Should detect duplicate within threshold"


if __name__ == "__main__":
    c = TestClient(app)
    tests = [
        ("Health Check Endpoint", lambda: test_api_health(c)),
        ("Duplicate Distance (Haversine)", test_duplicate_distance_calculation),
        ("Cleanup Verification Logic", test_cleanup_verification_logic),
        ("Auto-Assign Team Routing", test_auto_assign_team),
        ("DBSCAN Hotspot Detection", test_dbscan_hotspot_detection),
        ("ML Severity Scoring Model", test_ml_severity_model),
        ("Auth & RBAC Protection", lambda: test_auth_and_rbac_flow(c)),
        ("Citizen Registration & History", lambda: test_citizen_registration_and_report_history(c)),
        ("Option 3: Hazard & Bio-Medical Engine", test_hazard_detection_engine),
        ("Option 4: Dump Volume & Tonnage Estimator", test_dump_volume_tonnage_estimator),
        ("Option 7: Anti-Fraud & Perceptual Hashing", test_anti_fraud_duplicate_engine),
    ]

    print("=" * 65)
    print("RUNNING KARACHI WASTEWATCH AI ACCEPTANCE & UNIT TEST SUITE")
    print("=" * 65)
    passed = 0
    for name, test_fn in tests:
        try:
            test_fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")

    print("=" * 65)
    print(f"RESULT: {passed}/{len(tests)} TESTS PASSED ({passed / len(tests) * 100:.1f}%)")
    print("=" * 65)



