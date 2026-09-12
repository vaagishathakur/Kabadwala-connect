# KabadConnect — Field Research Notes

> Research conducted with informal scrap collectors in Maharashtra (Mumbai & Pune), August 2026.
> All names used with verbal consent. Personal details anonymised.

---

## Research Objectives

1. Understand the daily working patterns and income sources of informal e-waste collectors
2. Identify pain points in the existing informal collection → aggregator chain
3. Gauge smartphone literacy and preferred interaction modes
4. Validate platform concept and collect usability feedback on wireframes

---

## Methodology

- **Format**: Semi-structured interviews + observation of collection workflow
- **Duration**: 45–90 minutes per participant
- **Location**: Collector's working area (Dharavi, Mumbai; Hadapsar, Pune)
- **Language**: Hindi and Marathi
- **Sample size**: 2 primary participants + 3 informal discussions with aggregators

---

## Participant 1 — "Ramesh" (Mumbai, Dharavi area)

### Profile
| Attribute | Details |
|---|---|
| Age | ~42 years |
| Experience | 8 years in scrap collection |
| Primary materials | PCBs, copper cable, mixed e-waste |
| Daily collection volume | 5–9 kg mixed materials |
| Current monthly income | ₹7,500 – ₹9,000 |
| Smartphone | Android 4G, shared with family |
| Literacy | Can read basic Hindi, prefers audio/pictures for instructions |
| Language | Hindi (primary), some Marathi |

### Current Workflow (Observed)
```
Morning (7am): Collect from households on regular route (5–6 buildings)
               ↓
Afternoon:     Sort materials — copper wire, PCBs, CRT glass, plastics
               ↓
Evening:       Bring sorted lot to local Kabadiwala (aggregator)
               ↓
Negotiation:   Aggregator quotes price (no external reference)
               ↓
Payment:       Cash on the spot (no receipt)
```

### Key Quotes (translated from Hindi)

> *"Kabadiwala bolta hai bhaav gira hua hai, lekin main kya karoon — iske paas hi toh jana hai. Aur koi jagah nahi."*
> *(The aggregator says prices have dropped, but what can I do — I have to go to him. There's nowhere else.)*

> *"Agar mujhe pata ho ki aaj PCB ka sahi daam kya hai, toh main achhi jagah bech sakta hoon."*
> *(If I knew the correct price for PCB today, I could sell at a better place.)*

> *"Photo kheenchna aata hai. WhatsApp bhi chalata hoon. App use kar sakta hoon agar mushkil na ho."*
> *(I know how to take photos. I use WhatsApp too. I can use an app if it's not too complicated.)*

### Pain Points Identified
1. **Price opacity**: No way to verify if quoted price is fair
2. **Single aggregator dependency**: Only one local buyer → no competition, no choice
3. **No documentation**: Cash-only, no receipts, no proof of transaction
4. **Backyard burning**: Aware it's harmful but says "no other way to strip copper quickly"
5. **No transport**: Cannot carry materials to distant recyclers independently
6. **Trust deficit**: Has been cheated on weight measurement before

### Platform Response
- Showed wireframe mockups (pictorial home screen + price board)
- **Reaction**: Very positive to price board concept — "yahi chahiye tha" (this is exactly what was needed)
- Understood category selection via pictograms without explanation
- Requested: audio prices, ability to call recycler directly

---

## Participant 2 — "Sunita" (Pune, Hadapsar)

### Profile
| Attribute | Details |
|---|---|
| Age | ~35 years |
| Experience | 5 years collecting, previously domestic worker |
| Primary materials | Batteries, cables, PCBs from IT firms' informal waste |
| Daily collection volume | 3–6 kg |
| Current monthly income | ₹6,000 – ₹7,500 |
| Smartphone | Shared family Android, basic model |
| Literacy | Marathi comfortable, Hindi basic, cannot read English |
| Language | Marathi (primary) |

### Current Workflow (Observed)
```
Morning: Collect from IT park back-gates and household contacts
         ↓
Store at home until enough quantity (3–5 days)
         ↓
Contact local dealer by phone
         ↓
Dealer visits, weighs material, quotes price
         ↓
Cash payment — no receipt, no verification of weight
```

### Key Quotes (translated from Marathi)

> *"Battery ghenyasathi recycler khup lamba jaato. Mazhyakade vahaan nahi."*
> *(To give batteries to a recycler, I have to travel far. I don't have a vehicle.)*

> *"Mala Marathi madhe sangayla pahije — Hindi mala jast kalat nahi."*
> *(It needs to tell me in Marathi — I don't understand Hindi much.)*

> *"Paisa milal tar nakki formal vaprein. Aata gairi-rasmi ahe karan formal kuthun milat nahi."*
> *(If money comes, I will definitely use formal. Right now informal because formal is not available nearby.)*

> *"Battery madhe kahi chemical ahe he mala maahit hote, pan kaay karayache?"*
> *(I knew there were chemicals in batteries, but what was I to do?)*

### Pain Points Identified
1. **Distance to recycler**: Nearest authorized facility is 25+ km — no vehicle, no pickup service
2. **Language barrier**: Marathi is essential; Hindi-only apps are unusable
3. **Small lot sizes**: Authorized recyclers often refuse quantities below 50 kg
4. **No formal receipt**: Cannot prove earnings for any formal financial services
5. **Battery mishandling**: Aware of risk but lacks safe handling knowledge
6. **Waiting period**: Stores materials at home for days, safety risk

### Platform Response
- Demonstrated Marathi language interface
- **Reaction**: "He changala ahe!" (This is good!) on seeing Marathi UI
- Extremely positive about pickup-available recycler filter
- Safety card about batteries — watched full card, said "he mahiti pahije hote" (needed this info)
- Expressed interest in earnings ledger as proof of income for ration card purposes

---

## Aggregator / Informal Buyer Observations (3 informal conversations)

### Key Observations
1. Local aggregators operate on **15–25% margin** over what they pay collectors
2. They claim price volatility as justification for low offers — collectors cannot verify
3. Some aggregators are open to platform integration if it brings them **verified supply**
4. Aggregators noted collectors sometimes bring **hazardous improperly dismantled material** (acid-leached PCBs, burnt cable remnants)
5. None had formal e-waste authorization; all sold to larger aggregators or informal smelters

### Quote (Mumbai aggregator, Hindi)
> *"Mujhe bhi sahi daam chahiye. Agar koi app collector ko aur mujhe dono ko daam dikhaye, toh fair hai."*
> *(I also want a fair price. If an app shows both the collector and me the price, that's fair.)*

---

## Usability Testing Findings

### Prototype tested
- Pictorial home screen with 5 icons (Create Lot, Price Board, Recyclers, Ledger, Safety)
- Price board with category pictograms and audio button
- 9-category pictogram selector for material classification

### Results

| Task | Ramesh | Sunita | Notes |
|---|---|---|---|
| Select language (Hindi/Marathi) | ✅ 8 sec | ✅ 6 sec | Both immediately understood |
| Navigate to Price Board | ✅ 12 sec | ✅ 15 sec | Icon was clear |
| Press audio button for price | ✅ 10 sec | ✅ 9 sec | Very popular feature |
| Select PCB from pictogram grid | ✅ 20 sec | ✅ 18 sec | Some confusion — "circuit" icon not familiar; added Hindi label helped |
| Enter weight (numeric pad) | ✅ 15 sec | ✅ 22 sec | Both comfortable with numeric keypad |
| Find "nearest recycler" | ✅ 30 sec | ✅ 45 sec | Needed location permission explanation |
| Understand handover QR reference | ✅ (with explanation) | ⚠️ needed help | Reference code concept unfamiliar — need more visual guidance |

### Design Changes Recommended from Research
1. ✅ Add audio TTS to ALL price board items (not just "read all")
2. ✅ Use weight icon (weighing scale) prominently — both identified it immediately
3. ✅ "PCB/Circuit Board" pictogram needs Hindi label below — icon alone insufficient
4. ✅ Handover reference: show it larger + explain it's like a "raseed number" (receipt number)
5. ✅ Add "pickup available" badge prominently on recycler card — top priority for both users
6. ✅ Safety screen: show battery fire risk card first (highest concern expressed)
7. ✅ Offline banner must be visible but not alarming — yellow, not red

---

## Key Insights Summary

| Insight | Design Impact |
|---|---|
| Price opacity is #1 pain point | Price board as primary home screen feature |
| Pickup availability is critical | Pickup filter + badge on recycler cards |
| Marathi must be first-class | Full Marathi translation, not afterthought |
| Audio > Text for low literacy | TTS on prices + safety cards |
| Cash is default, UPI is optional | No mandatory payment method |
| Trust needs to be built slowly | QR handover receipt builds trust over time |
| Collectors know safety risks | Frame safety as empowerment, not scolding |
| Small lots are a barrier | Allow lots from 0.5 kg — no minimum |
| Smartphone usage is real | WhatsApp fluency → camera + tap interactions |

---

## Conclusion

Both participants demonstrated willingness to adopt a formal platform **provided**:
1. **Prices are visibly higher** than what local aggregators offer
2. **Pickup is available** — no transport burden on collector
3. **Interface is in their language** (Marathi for Sunita, Hindi for Ramesh)
4. **The process is simple** — photo → category → done; not 10-step forms
5. **Cash payment is the default** — no bank account or UPI required

The platform's value proposition — eliminating the aggregator margin (15–25%) and connecting collectors directly to authorized recyclers — is compelling and immediately understood by both participants.
