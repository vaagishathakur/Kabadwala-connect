// src/scripts/triggerRetrain.js
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

async function triggerWeeklyRetrain() {
  console.log('=====================================================');
  console.log('       KABADCONNECT ML WEEKLY RETRAIN TRIGGER        ');
  console.log('=====================================================\n');

  try {
    console.log(`Pinging ML microservice at ${ML_SERVICE_URL}/health...`);
    const health = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    console.log('Service online:', health.data);

    console.log('\nTriggering model retraining pipeline...');
    const retrainRes = await axios.post(`${ML_SERVICE_URL}/retrain`, {}, { timeout: 60000 });

    console.log('\nRetrain Pipeline Results:');
    console.log(JSON.stringify(retrainRes.data, null, 2));

    const priceModel = retrainRes.data?.price_model;
    if (priceModel) {
      console.log(`\n✅ Price Model Retrained: ${priceModel.observations_count} training samples used (${priceModel.ground_truth_transactions} from verified transactions)`);
      console.log('Updated Category Forecasts:');
      for (const [cat, info] of Object.entries(priceModel.evaluations || {})) {
        console.log(`  - ${cat}: ₹${info.predicted_rate_inr}/kg (Confidence Range: ₹${info.confidence_range[0]} - ₹${info.confidence_range[1]})`);
      }
    }

    const visionModel = retrainRes.data?.vision_model;
    if (visionModel) {
      console.log(`\nVision Dataset Status: ${visionModel.status} (${visionModel.image_count} images accumulated)`);
    }

    console.log('\n🎉 WEEKLY RETRAIN COMPLETED SUCCESSFULLY!');
    return retrainRes.data;
  } catch (err) {
    console.error('❌ Retrain Trigger Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  triggerWeeklyRetrain();
}

module.exports = { triggerWeeklyRetrain };
