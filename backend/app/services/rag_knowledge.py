"""
Citizen Assistant Knowledge Base for Karachi WasteWatch AI.
Contains structured Q&A, application workflows, policies, and operational details for RAG retrieval.
"""

KNOWLEDGE_DOCS = [
    {
        "id": "about_app",
        "title": "What is Karachi WasteWatch AI?",
        "category": "General",
        "content": (
            "Karachi WasteWatch AI is an intelligent civic waste management platform tailored for Karachi's "
            "15+ million citizens. It allows citizens to take photos of street waste, detects litter and garbage "
            "using computer vision (YOLO AI), creates official tracking reports, and dispatches municipal sanitation teams."
        )
    },
    {
        "id": "citizen_id",
        "title": "What is Citizen ID and how does it work?",
        "category": "Account",
        "content": (
            "Every registered citizen receives a unique Citizen ID in the format 'CIT-XXXXX' (e.g. CIT-10001). "
            "You can sign in to the platform using either your Citizen ID or your registered email address. "
            "Your Citizen ID connects you to your submitted complaints and allows you to view status updates and notifications."
        )
    },
    {
        "id": "how_to_report",
        "title": "How do I report garbage or waste?",
        "category": "Reporting",
        "content": (
            "To report waste: 1. Go to the 'Report Waste' menu. 2. Step 1 (Upload Photo): Drag and drop or select an image of the waste. "
            "3. Click 'Run AI Detection' to let YOLO analyze the waste coverage and items. 4. Step 2 (Location & Details): Select your "
            "Karachi district (South, East, Central, Korangi, Keamari, Malir), enter or let GPS provide latitude/longitude, and add a brief description. "
            "5. Click 'Submit Report'. You will immediately receive a unique Report ID like 'RPT-KHI-XXXXX'."
        )
    },
    {
        "id": "ai_detection",
        "title": "How does the AI Waste Scanner work?",
        "category": "AI",
        "content": (
            "The AI Waste Scanner uses an Ultralytics YOLO vision model (yolo11n) trained to spot garbage objects such as plastic bottles, "
            "cans, cartons, and waste clusters. It calculates total detections, bounding boxes, object confidence scores, and total area "
            "coverage percentage to estimate severity level (Low, Medium, High, or Critical)."
        )
    },
    {
        "id": "report_statuses",
        "title": "What do the report statuses mean?",
        "category": "Status",
        "content": (
            "Reports go through a 4-stage lifecycle: "
            "1. 'Pending': The complaint is logged and awaiting municipal administrator review. "
            "2. 'Verified': The administrator inspected the photo and location, confirming legitimate civic waste. "
            "3. 'In Progress': A municipal sanitation crew and vehicle have been dispatched to physically clean the site. "
            "4. 'Resolved': The crew completed cleanup, uploaded an 'after' photo, and AI or municipal supervisor verified the cleanup."
        )
    },
    {
        "id": "tracking_reports",
        "title": "How can I track my submitted complaints?",
        "category": "Tracking",
        "content": (
            "Citizens can track all submitted reports under the 'My Reports' menu. Clicking on any report displays its full audit history, "
            "showing transitions (Pending -> Verified -> In Progress -> Resolved), timestamps, and administrative notes. You also receive "
            "instant notifications on your Citizen Dashboard whenever an admin updates your report."
        )
    },
    {
        "id": "waste_map",
        "title": "What is the Waste Map?",
        "category": "Map",
        "content": (
            "The Waste Map is an interactive OpenStreetMap view centered over Karachi. It shows color-coded pins for waste reports across all districts. "
            "Clicking any marker opens a popup revealing the Report ID, district name, status badge, and issue description."
        )
    },
    {
        "id": "districts_covered",
        "title": "Which Karachi districts are supported?",
        "category": "Coverage",
        "content": (
            "The system supports all primary divisions of Karachi: "
            "District South (Saddar, Clifton, DHA), District East (Gulshan-e-Iqbal, Gulistan-e-Johar, PECHS), "
            "District Central (Nazimabad, North Nazimabad, Liaquatabad), District Korangi, District Keamari, and District Malir."
        )
    },
    {
        "id": "cleanup_verification",
        "title": "How does Cleanup Verification work?",
        "category": "Verification",
        "content": (
            "Once municipal workers physically clean a reported area, supervisors upload an 'after-cleanup' photo. "
            "The AI compares the original waste coverage with the after-cleanup image. If waste reduction is over 70% or remaining "
            "coverage is negligible, the report is verified clean and marked 'Resolved', triggering a citizen notification."
        )
    },
    {
        "id": "duplicate_prevention",
        "title": "What happens if multiple people report the same waste?",
        "category": "Reporting",
        "content": (
            "Karachi WasteWatch AI includes automatic duplicate detection. If another report is filed within 50 meters of an active complaint "
            "within a 48-hour window, the system flags it to prevent duplicate sanitation dispatches while counting citizen community alerts."
        )
    },
    {
        "id": "hotspots",
        "title": "What are Waste Hotspots?",
        "category": "Analytics",
        "content": (
            "Hotspots are persistent problem zones calculated using DBSCAN spatial clustering over reports. Areas with recurring trash dumps "
            "are highlighted in red on administrative heatmaps so municipal authorities can schedule regular garbage bin placements."
        )
    },
    {
        "id": "account_profile",
        "title": "How do I see my profile or complaint count?",
        "category": "Account",
        "content": (
            "Navigate to the 'Profile' section in the citizen sidebar. You can view your Citizen ID, registered email, phone number, "
            "registration date, and the total count of complaints you have submitted for a cleaner Karachi."
        )
    }
]
