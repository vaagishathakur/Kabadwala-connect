# KabadConnect 🗑️♻️

> **Vernacular, offline-first mobile platform connecting informal e-waste scrap collectors with authorized recyclers in India**

KabadConnect bridges the gap between India's informal scrap collection ecosystem and the formal Extended Producer Responsibility (EPR) recycling chain under the E-Waste (Management) Rules, 2022.

---

## 📦 Project Structure

```
kabadwala-connect/
├── mobile/                  # React Native (Expo) — Collector App
├── backend/                 # Node.js + Express + PostgreSQL — API Server
├── ml/                      # Python — ML Microservice (FastAPI)
├── recycler-dashboard/      # React.js — Recycler Web Portal
└── docs/                    # Dataset schema, API docs, field research
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 14
- Expo CLI: `npm install -g expo-cli`
- Android device / emulator

### 1. Backend
```bash
cd backend
cp .env.example .env        # fill in DB credentials
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

### 2. ML Microservice
```bash
cd ml
pip install -r requirements.txt
uvicorn app:app --port 8001
```

### 3. Collector Mobile App
```bash
cd mobile
npm install
npx expo start
```

### 4. Recycler Dashboard
```bash
cd recycler-dashboard
npm install
npm run dev
```

---

## 🎯 Core Features

| Feature | Description |
|---|---|
| 📷 Lot Creation | Photo → AI category suggestion → weight → instant valuation |
| 💰 Price Board | Live + cached buying rates by material category, Hindi/Marathi audio |
| 🏭 Recycler Match | Nearest authorized recyclers ranked by rate + distance + authorization |
| 📋 Digital Handover | QR-based verifiable handover record with GPS + photos |
| 📊 Earnings Ledger | Transaction history + pending dues |
| 🛡️ Safety Guidance | Pictorial + audio safety cards (Hindi/Marathi) |
| 🌐 Offline-first | Works on 2G/no connectivity; syncs when online |
| 🗣️ Vernacular UI | Hindi + Marathi; pictogram-first for low literacy |

---

## 📞 KabadConnect Saathi IVR

KabadConnect Saathi is a phone-call access channel for collectors who may not have mobile data or may prefer keypad/call flows. It is implemented inside the existing Node backend as a thin IVR layer over current price estimation, recycler matching, collector, lot, and transaction data.

### Local IVR Simulator
1. Start the backend:
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

2. Open `kabadi-setu.html` in a browser.
3. On the Prices home screen, tap **Call KabadConnect Saathi** / **IVR Simulator खोलें**.
4. Press **Start call** and use the keypad.

If the backend is reachable, the simulator calls:
```text
POST http://localhost:3000/api/ivr/simulator/start
POST http://localhost:3000/api/ivr/simulator/input
```

If the backend is not reachable, the page falls back to a local demo flow so the phone-style journey still works.

### Environment Variables
```bash
IVR_PROVIDER=mock                 # mock or twilio
IVR_API_KEY=                      # provider credential, if required
IVR_API_SECRET=                   # provider credential, if required
IVR_PHONE_NUMBER=                 # assigned IVR number
IVR_SUPPORT_NUMBER=               # human support/agent number for transfer
IVR_BASE_URL=https://your-domain   # public backend URL for provider webhooks
IVR_PHONE_HASH_SALT=              # salt for caller phone hashing
IVR_DEFAULT_CITY=Pune
IVR_DEFAULT_LAT=18.6200
IVR_DEFAULT_LNG=73.8100
```

Do not commit real provider credentials or phone numbers.

### Twilio Voice Setup
Twilio is the implemented webhook adapter because it supports DTMF/TwiML and Hindi/Marathi TTS voices. For an India production rollout, evaluate local procurement and compliance with India-focused providers such as Knowlarity or Exotel; the backend IVR state machine is provider-independent.

Configure a Twilio Voice number or demo number webhook:
```text
POST {IVR_BASE_URL}/api/ivr/twilio/voice
```

The backend responds with TwiML `<Gather>` menus for DTMF. When a recycler/support transfer is requested and a configured phone number exists, the Twilio adapter emits `<Dial>`.

For local testing with Twilio, expose the backend using a tunnel and set:
```bash
IVR_PROVIDER=twilio
IVR_BASE_URL=https://your-tunnel-url
IVR_SUPPORT_NUMBER=your-support-number
```

### Judge Demo Flow
Flow 1: price to recycler
```text
Start call
1 Hindi
3 Today's prices
1 PCB
4 Find recycler
1 Connect/simulate recycler call
```

Flow 2: sell e-waste
```text
Start call
1 Hindi
2 Sell e-waste
1 PCB
10#
1 Create selling request
```

Flow 3: payments
```text
Start call
1 Hindi
5 Transactions/payment
1 Latest transaction
```

### IVR API Endpoints
```text
GET  /api/ivr/config
POST /api/ivr/simulator/start
POST /api/ivr/simulator/input
GET  /api/ivr/simulator/:callId
POST /api/ivr/twilio/voice
POST /api/ivr/twilio/input
```

### Current Limitations
- A real inbound phone number requires a configured telephony provider account.
- Call transfer works only when the provider supports it and `IVR_SUPPORT_NUMBER` or recycler phone data is configured.
- Browser speech uses the device/browser speech synthesis voices; production calls use provider TTS.
- The IVR accepts numeric lot-id suffixes for phone usability because UUIDs are not practical to type over DTMF.

---

## 📊 Datasets

1. **Material Dataset** — Category, sub-category, image refs, weight, estimated value
2. **Price Dataset** — Buying prices by category, location, date with trend data
3. **Recycler Dataset** — Authorization details, accepted materials, rates, service area
4. **Transaction Dataset** — Lot ID, collector, recycler, prices, payment status
5. **Traceability Dataset** — Photos, GPS, timestamp, handover reference
6. **Collector Dataset** — Minimal profile, language preference, earnings history

See [docs/dataset_schema.md](./docs/dataset_schema.md) for full field-level schema.

---

## 🤖 AI/ML Features

| Feature | Method | Where |
|---|---|---|
| Material classification | MobileNetV2 → TFLite | On-device |
| Price estimation | Gradient Boosting | Server |
| Recycler ranking | Weighted scoring | Server |
| Price anomaly detection | Isolation Forest | Server |

---

## 🌍 Supported Languages
- 🇮🇳 **Hindi** (हिंदी)
- 🇮🇳 **Marathi** (मराठी)

---

## 📄 License
MIT
