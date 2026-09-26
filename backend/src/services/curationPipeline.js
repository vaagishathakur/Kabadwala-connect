// src/services/curationPipeline.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { recordTransactionPrice } = require('./dynamicPricing');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const LOTS_DIR = path.join(UPLOADS_DIR, 'lots');
const CURATED_DIR = path.join(UPLOADS_DIR, 'curated');
const ML_DATASETS_DIR = path.resolve(__dirname, '../../../ml/datasets');
const ML_IMAGES_DIR = path.join(ML_DATASETS_DIR, 'images');

// Ensure base directories exist
[LOTS_DIR, CURATED_DIR, ML_IMAGES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Persist base64 encoded photo strings or data URLs to server disk
 * @param {string} lotId
 * @param {Array<string>} imageRefs
 * @returns {Array<string>} list of persistent file URLs
 */
function persistLotPhotos(lotId, imageRefs = []) {
  if (!Array.isArray(imageRefs) || imageRefs.length === 0) return [];

  const savedPaths = [];

  imageRefs.forEach((item, index) => {
    try {
      if (typeof item !== 'string') return;

      // If it's already a saved URL/path, keep it
      if (item.startsWith('/uploads/') || item.startsWith('http')) {
        savedPaths.push(item);
        return;
      }

      // Check if it's base64 or data URL
      let base64Data = item;
      let extension = 'jpg';

      if (item.startsWith('data:image/')) {
        const matches = item.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          base64Data = matches[2];
        }
      }

      const filename = `${lotId}_${index}.${extension}`;
      const filePath = path.join(LOTS_DIR, filename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      const relativeUrl = `/uploads/lots/${filename}`;
      savedPaths.push(relativeUrl);
      logger.info(`Persisted lot photo: ${relativeUrl} (${fs.statSync(filePath).size} bytes)`);
    } catch (err) {
      logger.warn(`Failed to persist photo ${index} for lot ${lotId}: ${err.message}`);
    }
  });

  return savedPaths;
}

/**
 * Curate verified lot into ground-truth ML training dataset
 * Called immediately upon Recycler weighbridge scale confirmation
 */
async function curateVerifiedLot(lot, transaction, recycler) {
  try {
    if (!lot || !transaction) return null;

    const unitRate = transaction.total_weight_kg > 0
      ? +(transaction.final_price_inr / transaction.total_weight_kg).toFixed(2)
      : null;

    const curationRecord = {
      curated_id: `GT-${transaction.id.slice(0, 8).toUpperCase()}`,
      lot_id: lot.id,
      transaction_id: transaction.id,
      ground_truth_category: lot.category,
      sub_category: lot.sub_category || null,
      claimed_weight_kg: lot.approximate_weight_kg,
      confirmed_net_weight_kg: transaction.total_weight_kg,
      purity_percentage: transaction.purity_percentage || 100,
      payout_amount_inr: transaction.final_price_inr,
      unit_rate_inr_kg: unitRate,
      recycler_id: recycler ? recycler.id : transaction.recycler_id,
      recycler_authorization: recycler ? recycler.authorization_number : 'CPCB-AUTH',
      verified_timestamp: transaction.handover_datetime || new Date().toISOString(),
      image_refs: lot.image_refs || [],
      curated_status: 'VALIDATED_BY_RECYCLER',
    };

    // 1. Append to JSON Ground-Truth log
    const gtFilePath = path.join(CURATED_DIR, 'ground_truth.json');
    let currentLogs = [];
    if (fs.existsSync(gtFilePath)) {
      try {
        currentLogs = JSON.parse(fs.readFileSync(gtFilePath, 'utf8'));
      } catch (e) {
        currentLogs = [];
      }
    }
    currentLogs.push(curationRecord);
    fs.writeFileSync(gtFilePath, JSON.stringify(currentLogs, null, 2));

    // Also mirror to ml/datasets
    const mlGtPath = path.join(ML_DATASETS_DIR, 'ground_truth.json');
    fs.writeFileSync(mlGtPath, JSON.stringify(currentLogs, null, 2));

    // 2. Accumulate images into category-specific training folders (MobileNetV2 structure)
    const categoryFolder = path.join(ML_IMAGES_DIR, lot.category);
    if (!fs.existsSync(categoryFolder)) {
      fs.mkdirSync(categoryFolder, { recursive: true });
    }

    if (Array.isArray(lot.image_refs)) {
      lot.image_refs.forEach((ref) => {
        if (typeof ref === 'string' && ref.startsWith('/uploads/lots/')) {
          const sourceFile = path.join(UPLOADS_DIR, ref.replace('/uploads/', ''));
          if (fs.existsSync(sourceFile)) {
            const destFile = path.join(categoryFolder, path.basename(sourceFile));
            fs.copyFileSync(sourceFile, destFile);
            logger.info(`Curated training image accumulated: ${destFile}`);
          }
        }
      });
    }

    // 3. Trigger dynamic price update with this verified transaction
    if (unitRate) {
      await recordTransactionPrice(
        lot.category,
        lot.location_city || 'Mumbai',
        unitRate,
        transaction.total_weight_kg
      );
    }

    logger.info(`Ground truth lot curated: ${curationRecord.curated_id} (${lot.category}, ${transaction.total_weight_kg}kg @ ₹${unitRate}/kg)`);
    return curationRecord;
  } catch (err) {
    logger.error('Error in curation pipeline: ' + err.message);
    return null;
  }
}

/**
 * Get ground-truth dataset statistics
 */
function getDatasetStats() {
  const gtFilePath = path.join(CURATED_DIR, 'ground_truth.json');
  let records = [];
  if (fs.existsSync(gtFilePath)) {
    try {
      records = JSON.parse(fs.readFileSync(gtFilePath, 'utf8'));
    } catch (e) {}
  }

  const byCategory = {};
  records.forEach((r) => {
    byCategory[r.ground_truth_category] = (byCategory[r.ground_truth_category] || 0) + 1;
  });

  return {
    total_ground_truth_samples: records.length,
    samples_by_category: byCategory,
    accumulated_images_dir: ML_IMAGES_DIR,
    last_updated: records.length > 0 ? records[records.length - 1].verified_timestamp : null,
  };
}

module.exports = {
  persistLotPhotos,
  curateVerifiedLot,
  getDatasetStats,
  LOTS_DIR,
  CURATED_DIR,
};
