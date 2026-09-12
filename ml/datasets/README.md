# KabadConnect AI/ML Datasets

## Material Image Classifier Dataset
- **Source**: OpenImages v7 (e-waste category), TrashNet (academic), custom field photos (synthetic for demo)
- **Classes**: 9 (CRT, LCD, PCB, Cable, Battery, Motor, Plastic, Mixed, Other)
- **Size**: ~5,000 labeled images (target); 200 synthetic samples for demo
- **Limitations**: Limited Indian-specific condition diversity; backyard dismantled items underrepresented
- **Augmentation**: Horizontal flip, ±30° rotation, brightness ±30%, random crop
- **Train/Val/Test split**: 70/15/15

## Price Estimation Dataset
- **Source**: Platform-generated transaction records + recycler-submitted rates + publicly available scrap market data
- **Features**: category, location, date, buying_price_inr
- **Size**: 30+ seed records (grows with platform use)
- **Limitations**: Initial model trained on limited geographic and seasonal data

## Anomaly Detection Dataset
- **Source**: Price transaction records
- **Method**: Isolation Forest + z-score fallback
- **Threshold**: |z-score| > 2.0 or anomaly_score > 0.6

## Data Quality
- Validation: Range checks, category enum validation, GPS bounding box (India)
- Anonymization: Collector IDs are UUIDs; phone numbers stored as SHA-256 hashes
- Updates: Models retrained weekly (cron job) as new transaction data accumulates
