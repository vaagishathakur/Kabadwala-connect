# KabadConnect Runbook & Operations Guide

This runbook contains the exact commands and instructions to launch and verify all 4 core services of **KabadConnect**:
1. **Node.js / Express / PostgreSQL API Backend** (Port `3000`)
2. **FastAPI ML Service** (Port `8001`)
3. **Vite / React Authorized Recycler Dashboard** (Port `5173`)
4. **React Native / Expo Mobile Collector App** (Port `8081`)

---

## 1. System Requirements & Prerequisites
- **Node.js**: v18+ (tested on Node v20+)
- **Python**: 3.10+ with virtual environment in `ml/.venv`
- **PostgreSQL**: Connected to Neon PostgreSQL cloud instance or local Postgres (configured in `backend/.env`)

---

## 2. Database Setup & Seeding

Before running the services, seed the database with registered authorized recyclers, baseline commodity price records, demo collector credentials, and sample CPCB Form-6 logs:

```powershell
cd "backend"
node src/db/seeds/seedRunner.js
```

### Seeded Demo Accounts:
- **Informal Collector**:
  - Name: `Ramesh Kabadiwala`
  - Phone: `9876543210`
  - Demo OTP: `123456`
  - Operating City: `Mumbai`
- **Authorized Recyclers (5 facilities)**:
  - `EcoGreen E-Waste Recyclers Pvt Ltd` (CPCB: `MPCB-HW-2024-MUM-0187`)
  - `Mahalaxmi E-Waste Processors` (CPCB: `MPCB-HW-2023-MUM-0094`)
  - `Navi Mumbai Circular Recycling Hub` (CPCB: `MPCB-HW-2024-NM-0312`)
  - `Apex Electronics Dismantlers` (CPCB: `GPCB-EW-2023-SUR-0078`)
  - `CleanEarth Solutions` (CPCB: `CPCB-REG-2024-MH-0042`)

---

## 3. Launching Services (Run in separate terminal tabs)

### Terminal 1: Backend API (Port 3000)
```powershell
cd "backend"
node src/index.js
```
- Health Check: `http://localhost:3000/health`
- API Base URL: `http://localhost:3000/api` or `http://localhost:3000`

### Terminal 2: FastAPI ML Prediction Service (Port 8001)
```powershell
cd "ml"
.\.venv\Scripts\uvicorn.exe app:app --port 8001
```
*(On Unix / macOS: `./.venv/bin/uvicorn app:app --port 8001`)*
- Health Check: `http://127.0.0.1:8001/health`
- Prediction Endpoint: `POST http://127.0.0.1:8001/predict`

### Terminal 3: Authorized Recycler Dashboard (Port 5173)
```powershell
cd "recycler-dashboard"
npm run dev
```
- Web UI: `http://localhost:5173`
- Features: Light-themed daylight UI, Weighbridge Scale Confirmation, MCX Commodity Ticker, CPCB Form-6 EPR Logs, Instant UPI Payout Simulator.

### Terminal 4: Expo Mobile Collector App (Port 8081)
```powershell
cd "mobile"
npx expo start --offline --port 8081
```
- Press `w` to open in web browser, or scan QR code in Expo Go app on mobile.

---

## 4. End-to-End Live Path Verification

To verify that the complete lifecycle operates with live data across all services without mock/stub responses:

```powershell
# Set NODE_PATH to backend dependencies and run verification script
$env:NODE_PATH = "C:\Users\vaagi\OneDrive\Desktop\Kabadwala connect\backend\node_modules"
node "C:\Users\vaagi\.gemini\antigravity\brain\dd884324-b577-4d19-a089-f91ca744c70c\scratch\test_live_path.js"
```

### Verified Path Sequence:
1. **Collector Auth**: Phone `9876543210` -> OTP `123456` -> Authenticated JWT token for Ramesh.
2. **Price Board**: Real-time market rates and trend indicators for e-waste categories.
3. **Lot Creation**: Material created with CPCB classification code (`ITEW1` for PCB) and dynamic valuation.
4. **Recycler Match**: Haversine distance-ranked active recyclers with offered rates.
5. **Inbound Transaction**: Created with anomaly detection check against market baseline.
6. **QR Code Handover**: Generates 15-minute cryptographically signed token and 8-character reference code (e.g. `KCRSVQEP`).
7. **Recycler Lookup**: Recycler enters/scans reference code to view claimed weight, category, and seller info.
8. **Scale Confirmation & Payout**: Weighbridge gross scale measurement (10.2 kg @ 95% purity) calculates net settlement (₹1,017) and issues UPI deep link / UTR.
9. **Ledger & EPR Audit**: Collector earnings balance increments by exact transaction delta (+₹1,017), transaction status marked `Completed`, and immutable SHA-256 CPCB Form-6 record is written.
