# KabadConnect — Dataset Schema Reference

> Full field-level schema for all 6 core datasets + AI/ML training dataset.

---

## 1. Material Dataset

Tracks individual material lots created by collectors.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `material_id` | UUID | PK, NOT NULL | Auto-generated unique identifier |
| `lot_id` | UUID | FK → Transaction | Parent lot reference |
| `collector_id` | UUID | FK → Collector | Owner collector |
| `category` | ENUM | NOT NULL | CRT / LCD / PCB / Cable / Battery / Motor / Plastic / Mixed / Other |
| `sub_category` | VARCHAR(100) | nullable | e.g. "Li-ion 18650", "CRT Color TV 21-inch" |
| `description` | TEXT | nullable | Auto-generated + collector-editable description |
| `image_refs` | JSON | nullable | Array of Cloudinary URLs |
| `approximate_weight_kg` | DECIMAL(8,3) | NOT NULL, > 0 | Collector-entered weight |
| `condition` | ENUM | NOT NULL | Good / Damaged / Unknown |
| `source_type` | ENUM | NOT NULL | Household / Commercial / Industrial |
| `estimated_value_inr` | DECIMAL(10,2) | nullable | AI + price model output in INR |
| `ai_confidence` | DECIMAL(4,3) | nullable | ML classifier confidence (0.0–1.0) |
| `created_at` | TIMESTAMP | NOT NULL | ISO 8601 UTC |
| `updated_at` | TIMESTAMP | NOT NULL | Auto-updated |

**Indexes:** `collector_id`, `category`, `created_at`

---

## 2. Price Dataset

Tracks buying prices for material categories by location over time.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `price_id` | UUID | PK, NOT NULL | |
| `material_category` | ENUM | NOT NULL | Same enum as Material.category |
| `sub_category` | VARCHAR(100) | nullable | |
| `location_city` | VARCHAR(100) | NOT NULL | City name (e.g., "Mumbai") |
| `location_state` | VARCHAR(100) | NOT NULL | State name (e.g., "Maharashtra") |
| `date_recorded` | DATE | NOT NULL | Date of price observation |
| `buying_price_inr` | DECIMAL(10,2) | NOT NULL, > 0 | Buying price per unit in INR |
| `unit` | ENUM | NOT NULL | kg / piece / tonne |
| `market_range_low` | DECIMAL(10,2) | nullable | Lowest observed market price |
| `market_range_high` | DECIMAL(10,2) | nullable | Highest observed market price |
| `recycler_id` | UUID | FK → Recycler, nullable | Source recycler (null = market data) |
| `source` | ENUM | NOT NULL | RecyclerSubmitted / AdminEntered / MarketScrape |
| `is_verified` | BOOLEAN | DEFAULT false | Admin-verified price |
| `created_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `material_category`, `location_city`, `date_recorded`, `recycler_id`

**Usage:** Price board, trend calculation, value estimation, anomaly detection

---

## 3. Recycler Dataset

Registry of authorized e-waste recyclers/aggregators.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `recycler_id` | UUID | PK, NOT NULL | |
| `name` | VARCHAR(200) | NOT NULL | Facility / company name |
| `facility_address` | TEXT | NOT NULL | Full postal address |
| `lat` | DECIMAL(10,7) | NOT NULL | GPS latitude |
| `lng` | DECIMAL(10,7) | NOT NULL | GPS longitude |
| `materials_accepted` | JSON | NOT NULL | Array of accepted category enums |
| `authorization_body` | VARCHAR(100) | NOT NULL | e.g., "MPCB", "CPCB", "KSPCB" |
| `authorization_number` | VARCHAR(100) | NOT NULL | Official authorization certificate number |
| `authorization_expiry` | DATE | NOT NULL | Expiry date of authorization |
| `authorization_status` | ENUM | NOT NULL | Active / Expired / Suspended |
| `contact_phone` | VARCHAR(20) | NOT NULL | Primary contact number |
| `contact_email` | VARCHAR(200) | nullable | Optional email |
| `offered_rates` | JSON | nullable | `{category: rate_inr_per_kg}` map |
| `pickup_available` | BOOLEAN | DEFAULT false | Offers doorstep pickup |
| `service_area_km` | INTEGER | DEFAULT 50 | Maximum service radius in km |
| `last_verified` | DATE | nullable | Date authorization was last verified |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `authorization_status`, `lat+lng` (spatial), `materials_accepted` (GIN)

---

## 4. Transaction Dataset

Records each material exchange between collector and recycler.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `transaction_id` | UUID | PK, NOT NULL | |
| `lot_id` | UUID | FK → Material, NOT NULL | |
| `collector_id` | UUID | FK → Collector, NOT NULL | |
| `recycler_id` | UUID | FK → Recycler, nullable | Assigned after matching |
| `material_category` | ENUM | NOT NULL | |
| `total_weight_kg` | DECIMAL(8,3) | NOT NULL | |
| `quoted_price_inr` | DECIMAL(10,2) | NOT NULL | Price at time of lot creation |
| `final_price_inr` | DECIMAL(10,2) | nullable | Agreed price at handover |
| `collection_lat` | DECIMAL(10,7) | nullable | GPS at collection |
| `collection_lng` | DECIMAL(10,7) | nullable | |
| `handover_lat` | DECIMAL(10,7) | nullable | GPS at handover |
| `handover_lng` | DECIMAL(10,7) | nullable | |
| `collection_datetime` | TIMESTAMP | NOT NULL | |
| `handover_datetime` | TIMESTAMP | nullable | Set on confirmation |
| `payment_mode` | ENUM | DEFAULT 'Pending' | Cash / UPI / Pending |
| `payment_status` | ENUM | DEFAULT 'Pending' | Paid / Pending / Disputed |
| `transaction_status` | ENUM | DEFAULT 'Created' | Created / Matched / Confirmed / Completed / Cancelled |
| `anomaly_flag` | BOOLEAN | DEFAULT false | ML-detected price anomaly |
| `anomaly_score` | DECIMAL(5,4) | nullable | Isolation Forest anomaly score |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `collector_id`, `recycler_id`, `transaction_status`, `payment_status`, `created_at`

---

## 5. Traceability Dataset

Immutable audit trail for each material handover event.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `trace_id` | UUID | PK, NOT NULL | |
| `lot_id` | UUID | FK → Material, NOT NULL | |
| `transaction_id` | UUID | FK → Transaction, NOT NULL | |
| `photograph_refs` | JSON | NOT NULL | Array of Cloudinary URLs (handover photos) |
| `weight_at_handover_kg` | DECIMAL(8,3) | nullable | Actual weighed amount at handover |
| `timestamp` | TIMESTAMP | NOT NULL | Handover initiation time |
| `gps_lat` | DECIMAL(10,7) | nullable | GPS at handover |
| `gps_lng` | DECIMAL(10,7) | nullable | |
| `handover_reference` | VARCHAR(8) | UNIQUE, NOT NULL | 8-char alphanumeric code (e.g., KC3F8A2B) |
| `collector_signed` | BOOLEAN | DEFAULT false | Collector confirmed |
| `recycler_confirmed` | BOOLEAN | DEFAULT false | Recycler confirmed |
| `recycler_confirm_time` | TIMESTAMP | nullable | Time of recycler confirmation |
| `subsequent_status` | ENUM | DEFAULT 'Pending' | Pending / ReceivedAtFacility / Processing / Completed |
| `created_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `handover_reference` (UNIQUE), `lot_id`, `transaction_id`

---

## 6. Collector Dataset (Minimal PII)

Minimal collector profile — deliberately limited personal information.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `collector_id` | UUID | PK, NOT NULL | |
| `display_name` | VARCHAR(100) | nullable | Optional first name or alias only |
| `phone_hash` | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 hash of phone number |
| `preferred_language` | ENUM | DEFAULT 'hi' | hi (Hindi) / mr (Marathi) |
| `operating_city` | VARCHAR(100) | nullable | General city, not precise address |
| `registration_date` | DATE | NOT NULL | |
| `total_transactions` | INTEGER | DEFAULT 0 | Denormalized counter |
| `total_earnings_inr` | DECIMAL(12,2) | DEFAULT 0 | Denormalized total |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

> **Privacy Note:** Phone numbers are never stored in plaintext. SHA-256 hash is used for identity matching. No address, UID/Aadhaar, or bank details are collected.

---

## 7. AI/ML Training Dataset

| Dataset | Source | Size | Features | Target |
|---|---|---|---|---|
| Material Images | OpenImages v7, TrashNet, synthetic | ~5,000 images | 224×224 RGB | Category (9 classes) |
| Price Records | Platform + seed data | 50+ seed, grows live | category, city, date | buying_price_inr |
| Anomaly Records | Transaction history | Grows live | category, city, price | is_anomaly (bool) |
| Recycler Profiles | Admin-entered + field research | 5 seed, grows | all Recycler fields | match_score |

### Data Lifecycle
```
Field Collection → Platform Entry → Validation → SQLite (device)
                                                       ↓ sync
                                              PostgreSQL (server)
                                                       ↓
                                     Weekly ML retraining (cron)
                                                       ↓
                                          Updated model deployed
```

### Validation Rules
- Category must be one of 9 valid enums
- GPS coordinates must be within India bounding box (lat 6–37, lng 68–97)
- Weight must be > 0 and < 10,000 kg
- Price must be > 0 and < 100,000 INR/kg
- Handover reference must be exactly 8 alphanumeric chars
- Phone hash must be 64-char hex string (SHA-256)

### Anonymization
- Collector phone → SHA-256 hash
- Collector IDs are UUIDs (not sequential)
- GPS coordinates rounded to 3 decimal places in public APIs
- No Aadhaar, PAN, bank account, or biometric data collected
