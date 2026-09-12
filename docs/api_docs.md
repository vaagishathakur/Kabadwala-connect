# KabadConnect — API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production:  https://api.kabadconnect.in/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

JWT payload: `{ id, role: 'collector'|'recycler', iat, exp }`

---

## Auth Endpoints

### POST `/auth/send-otp`
Send OTP to collector's phone number.

**Request:**
```json
{ "phone": "9876543210" }
```
**Response:**
```json
{ "success": true, "message": "OTP sent", "demo_otp": "123456" }
```

---

### POST `/auth/verify-otp`
Verify OTP and get JWT token.

**Request:**
```json
{ "phone": "9876543210", "otp": "123456" }
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "collector": {
    "id": "uuid",
    "display_name": "Ramesh",
    "preferred_language": "hi",
    "operating_city": "Mumbai",
    "total_earnings_inr": 12500.00
  }
}
```

---

## Lots Endpoints

### POST `/lots` 🔒
Create a new material lot.

**Request:**
```json
{
  "category": "PCB",
  "sub_category": "Motherboards",
  "approximate_weight_kg": 2.5,
  "condition": "Damaged",
  "source_type": "Household",
  "image_refs": ["https://res.cloudinary.com/..."]
}
```
**Response:**
```json
{
  "success": true,
  "lot": {
    "id": "uuid",
    "category": "PCB",
    "estimated_value_inr": 250.00,
    "price_range": { "low": 200, "high": 350 },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### GET `/lots` 🔒
List all lots for authenticated collector.

**Query params:** `?status=active&limit=20&offset=0`

### GET `/lots/:id` 🔒
Get specific lot details.

### PATCH `/lots/:id` 🔒
Update lot fields.

### DELETE `/lots/:id` 🔒
Soft-delete a lot.

---

## Prices Endpoints

### GET `/prices/board`
Get price board for all categories (cached, public).

**Query params:** `?city=Mumbai`

**Response:**
```json
{
  "success": true,
  "prices": [
    {
      "category": "PCB",
      "icon_key": "circuit",
      "avg_price_inr": 100,
      "unit": "kg",
      "trend_7d": "up",
      "trend_pct": 5.2,
      "market_range": { "low": 80, "high": 140 },
      "last_updated": "2024-01-15T08:00:00Z"
    }
  ]
}
```

### GET `/prices/trend`
Get 7-day price trend for a category.

**Query params:** `?category=PCB&city=Mumbai&days=7`

**Response:**
```json
{
  "success": true,
  "trend": [
    { "date": "2024-01-09", "avg_price": 95 },
    { "date": "2024-01-10", "avg_price": 98 }
  ]
}
```

### POST `/prices` 🔒 (recycler/admin)
Add a new price record.

---

## Recyclers Endpoints

### GET `/recyclers`
List recyclers with optional filtering.

**Query params:** `?lat=19.0760&lng=72.8777&category=PCB&radius_km=50`

**Response:**
```json
{
  "success": true,
  "recyclers": [
    {
      "id": "uuid",
      "name": "EcoGreen Recyclers Pvt Ltd",
      "distance_km": 12.3,
      "authorization_status": "Active",
      "offered_rate_inr": 100,
      "pickup_available": true,
      "contact_phone": "9876543210"
    }
  ]
}
```

### GET `/recyclers/match`
Match recyclers for a specific lot.

**Query params:** `?lot_id=uuid&collector_lat=19.07&collector_lng=72.87`

**Response:** Ranked recycler list with `match_score`.

### GET `/recyclers/:id`
Get full recycler details.

---

## Handover Endpoints

### POST `/handover/initiate` 🔒
Start a handover process and generate reference code.

**Request:**
```json
{
  "lot_id": "uuid",
  "transaction_id": "uuid",
  "weight_at_handover_kg": 2.4,
  "gps_lat": 19.0760,
  "gps_lng": 72.8777,
  "photograph_refs": ["https://cloudinary.com/..."]
}
```
**Response:**
```json
{
  "success": true,
  "handover_reference": "KC3F8A2B",
  "trace_id": "uuid",
  "qr_data": "KC3F8A2B|uuid|2024-01-15T10:30:00Z"
}
```

### POST `/handover/confirm`
Recycler confirms handover.

**Request:**
```json
{
  "handover_reference": "KC3F8A2B",
  "recycler_id": "uuid",
  "final_weight_kg": 2.4,
  "final_price_inr": 240
}
```

### GET `/handover/:reference`
Get handover details by reference code (public for verification).

---

## Sync Endpoint

### POST `/sync` 🔒
Batch sync offline changes and fetch server updates.

**Request:**
```json
{
  "collector_id": "uuid",
  "last_sync_time": "2024-01-15T08:00:00Z",
  "changes": [
    {
      "entity": "lot",
      "action": "create",
      "data": { "id": "uuid", "category": "PCB", ... },
      "client_timestamp": "2024-01-15T09:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "applied": 1,
  "server_updates": {
    "prices": [...],
    "recyclers": [...],
    "transactions": [...]
  },
  "sync_time": "2024-01-15T10:00:00Z"
}
```

---

## KabadConnect Saathi IVR Endpoints

### GET `/ivr/config`
Return public IVR configuration for demos.

**Response:**
```json
{
  "success": true,
  "feature": "KabadConnect Saathi",
  "provider": "mock",
  "phone_number": null,
  "support_configured": false
}
```

### POST `/ivr/simulator/start`
Start a browser/demo IVR session. This endpoint does not require collector app authentication because the phone channel identifies callers by hashed caller ID.

**Request:**
```json
{ "caller": "browser-demo" }
```

**Response:**
```json
{
  "success": true,
  "response": {
    "callId": "sim-uuid",
    "language": "hi",
    "stage": "language",
    "prompt": "कबाड़कनेक्ट साथी में आपका स्वागत है...",
    "expecting": "digit"
  }
}
```

### POST `/ivr/simulator/input`
Send keypad/DTMF input to the active IVR session.

**Request:**
```json
{ "callId": "sim-uuid", "digits": "3" }
```

Weight and lot-id prompts accept multi-digit input ending in `#`, for example:
```json
{ "callId": "sim-uuid", "digits": "10#" }
```

### GET `/ivr/simulator/:callId`
Return diagnostics for the active simulator session, including menu path and non-sensitive metrics.

### POST `/ivr/twilio/voice`
Twilio Voice webhook entry point. Responds with TwiML and starts the call session.

### POST `/ivr/twilio/input`
Twilio DTMF callback. Responds with the next TwiML `<Gather>`, `<Dial>`, or `<Hangup>`.

### IVR Analytics
The backend records an `IVRCall` row where possible:
```json
{
  "caller_hash": "sha256",
  "language": "hi",
  "menu_path": ["language:hi", "priceMaterial:PCB"],
  "metrics": {
    "price_requests": 1,
    "recycler_requests": 1,
    "failed_input": 0,
    "successful_completion": 1
  },
  "outcome": "recycler_connect_requested"
}
```

Raw caller phone numbers are not stored in IVR logs.

---

## ML Microservice Endpoints (Port 8001)

### POST `/classify`
Classify material from image.

**Request:** multipart/form-data with `file` field (image)

**Response:**
```json
{
  "category": "PCB",
  "confidence": 0.87,
  "all_scores": {
    "PCB": 0.87, "Cable": 0.06, "Battery": 0.04, ...
  }
}
```

### POST `/estimate`
Estimate material value.

**Request:**
```json
{ "category": "PCB", "weight_kg": 2.5, "location_city": "Mumbai" }
```
**Response:**
```json
{
  "estimated_value_inr": 250.0,
  "price_per_kg": 100.0,
  "range": { "low": 200, "high": 350 },
  "confidence": "medium"
}
```

### POST `/anomaly`
Check if a price is anomalous.

**Request:**
```json
{ "category": "PCB", "location_city": "Mumbai", "quoted_price_inr": 500 }
```
**Response:**
```json
{
  "is_anomaly": true,
  "anomaly_score": 0.82,
  "expected_range": [80, 140],
  "z_score": 4.2,
  "message": "Price is significantly above market range"
}
```

### POST `/recommend`
Get ranked recycler recommendations.

**Request:**
```json
{
  "lot": { "category": "PCB", "weight_kg": 2.5 },
  "collector_lat": 19.076,
  "collector_lng": 72.877,
  "recyclers": [...]
}
```

---

## Error Response Format

All errors return:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [{ "field": "weight_kg", "message": "Must be positive" }]
}
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |
