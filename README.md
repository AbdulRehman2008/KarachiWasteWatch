# 🗑️ Karachi WasteWatch AI

**Complete Civic Waste Intelligence, Detection & Physical Resolution System**  
*AI-powered waste detection, citizen reporting with unique IDs, municipal prioritization, physical cleanup verification, and audit tracking.*

---

## 📌 Project Overview
**Karachi WasteWatch AI** is a complete, production-grade civic waste-management system designed for Karachi's 6 municipal districts (South, East, Central, Korangi, Keamari, Malir). It bridges citizens and the Sindh Solid Waste Management Board (SSWMB) through transparent AI computer vision, unique citizen tracking, physical cleanup enforcement, and automated notification loops.

---

## 🎨 Design & Role-Based Portals

The interface features a modern, colorful, attractive civic-tech theme with tailored icons on every menu item, card, and action button.

### 1. 🌐 Public Home Page (No Login Required)
- **Features:**
  - Hero Banner: *"Report Waste. Detect Waste. Clean Karachi."*
  - 4-Step Resolution Cycle: **Upload Image → AI Detects Waste → Admin Verifies → Cleanup Verified**
  - City Pulse KPI stats & Interactive Public Waste Map.
- **Access:** Open directly at `http://localhost:3000`.

---

### 2. 👤 Citizen Portal
Each citizen registers or logs in with a **unique Citizen ID** (e.g. `CIT-10001` or auto-generated `CIT-XXXXX`). The system stores:
- **Citizen ID**
- **Full Name**
- **Email**
- **Registration Date**
- **Total Complaint Count** (auto-incremented on each new report)

#### Citizen Main Menu:
1. **📊 Dashboard:** Citizen ID badge, complaint count, unread municipal cleanup alerts, summary metrics (*Total Reports, Pending, In Progress, Resolved*), and recent report tracking.
2. **🔬 AI Waste Scanner:** Interactive computer vision scanner with sensitivity controls, object breakdown table (*Class, Confidence, Bounding Box, Area Ratio*), and AI severity explanation.
3. **📝 Report Waste (Fixed Real Flow):**
   - **Step 1:** Select waste photo from device.
   - **Step 2:** Instant live preview.
   - **Step 3:** Run AI Detection on image.
   - **Step 4:** Review AI results (*Bounding boxes overlay, detected waste types, confidence %, and severity rating*).
   - **Step 5:** Enter Karachi district and GPS coordinates.
   - **Step 6:** Click "Confirm & Submit" → Generates unique **Report ID** (e.g. `RPT-KHI-10492`), increments citizen complaint count, logs initial audit history, and alerts municipal teams!
4. **📋 My Reports:**
   - View only reports filed by the logged-in citizen.
   - Display unique Report ID, status badge, AI priority, and full **Report History Audit Trail** (*Timeline of status transitions with timestamps and notes*).
   - **Edit & Cancel:** Allowed **only while status is `Pending`**. Locked once municipal processing begins.
5. **🗺️ Waste Map:** Live Karachi map plotting civic reports across municipal districts.
6. **👤 Profile:** Profile card with Citizen ID, complaint count, registration date, and Notification Inbox.

#### Citizen Credentials (Demo):
- **Citizen ID / Email:** `CIT-10001` *(or `citizen@wastewatch.pk`)*
- **Password:** `Citizen@Karachi2026`
- *(Or click "Create New Citizen Account" to receive your own unique Citizen ID)*

---

### 3. 🛡️ Municipal Admin Portal (Strict RBAC Protected)
Admin access requires **Admin ID + Password**. Only verified administrators can access operational controls.

#### Admin Main Menu:
1. **📊 Dashboard:** Central city-wide operational metrics, urgent high-severity report queue, and dispatch shortcuts.
2. **🔬 AI Waste Scanner:** Multi-engine YOLO inspection with adjustable resolution (640 / 1024 / 1280) and detection overlays.
3. **📋 Reports Management:**
   - Every report has a unique **Report ID** (e.g. `RPT-KHI-10492`).
   - Displays **which citizen submitted each report** (*Citizen Name, Citizen ID, and their total complaint count*).
   - Search & Filters: Search by Report ID, Citizen ID, or keyword; filter by District or Status.
   - Status flow: **Pending → Verified → In Progress → Resolved**.
   - Chronological **Report History (Audit Log)** showing all status changes, timestamps, and admin notes.
   - Dispatch municipal fleets (*District South Unit, Central Unit, East Rapid Response, etc.*).
4. **🗺️ Waste Map:** Geospatial monitoring of all reports across Karachi.
5. **📈 Analytics:** City-wide resolution rate (88.6%), SLA response tracking (11.2 hours), and district breakdown.
6. **🔥 Hotspots:** Algorithmic DBSCAN geospatial clustering identifying habitual dumping spots (Empress Market, Liaquatabad, Korangi, Nipa).
7. **🧹 Cleanup Verification:**
   - *"Admin has to clean it physically → Admin Verifies Cleanup → Citizen Notification → Resolved"*
   - Select active report with Before photo.
   - Upload Post-Cleanup photo taken by field workers.
   - AI comparative analysis computes waste reduction % and verdict (*Verified Clean / Partially Clean / Still Present*).
   - 1-Click Approval marks status as **Resolved**, writes audit history, and automatically sends a celebratory **Notification** to the citizen!
8. **👥 User Management:** Table of all registered citizens and operational accounts with Citizen ID, complaints filed, registration date, and account deletion controls.

#### Admin Credentials:
- **Admin ID / Email:** `ADMIN-001` *(or `admin@wastewatch.pk`)*
- **Password:** `Admin@Karachi2026`

---

## 🔄 End-to-End Main Operational Flow

```
[Citizen Login] (with Citizen ID or Email)
       │
       ▼
[Report Waste] (Select Image → Preview → AI Detection → Enter Location)
       │
       ▼
[Report Created] (Unique Report ID e.g. RPT-KHI-10492, complaint count +1)
       │
       ▼
[Admin Dashboard] (Admin reviews report, sees Citizen ID & Complaint Count)
       │
       ▼
[Admin Verifies & Dispatches] (Status: Pending → Verified → In Progress)
       │
       ▼
[Field Staff Physically Cleans Site]
       │
       ▼
[Admin Cleanup Verification] (Upload After photo → Comparative AI confirms clean)
       │
       ▼
[Citizen Notification] (Alert sent to Citizen: "Cleanup Verified & Resolved 🎉")
       │
       ▼
[Status: Resolved] (Report successfully completed and archived in history)
```

---

## 🚀 Running the Project
 
### 1. Quick Start (Both Backend & Frontend)
Double click or run:
```powershell
.\start.bat
```
This launches the FastAPI Backend (`http://127.0.0.1:8000`) and React Frontend (`http://localhost:3000`).

### 2. Manual Launch
- **FastAPI Backend:**
  ```powershell
  .\run_backend.bat
  ```
- **React Frontend:**
  ```powershell
  cd frontend-react
  npm run dev
  ```


### 3. Run Automated Acceptance & RBAC Tests
```powershell
.\venv\Scripts\pytest.exe backend\tests\test_core_system.py -v
```
All 8 integration and unit tests pass (100%).
