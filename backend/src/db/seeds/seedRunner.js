// src/db/seeds/seedRunner.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Recycler, Price } = require('../../models');

const recyclerSeed = require('./recyclers.json');
const fs = require('fs');

// Parse price CSV manually
function parsePriceCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i]; });
    return obj;
  });
}

async function seed() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Seed recyclers
    let recyclerCount = 0;
    for (const r of recyclerSeed) {
      const [recycler, created] = await Recycler.findOrCreate({
  where: { authorization_number: r.authorization_number },
  defaults: {
    ...r,
    id: uuidv4(),
  },
});
      if (created) recyclerCount++;
    }
    console.log(`✅ Seeded ${recyclerCount} new recyclers (${recyclerSeed.length - recyclerCount} already existed)`);

    // Seed prices from CSV
    const csvPath = path.resolve(__dirname, '../../../..', 'ml', 'datasets', 'seed_prices.csv');
    if (fs.existsSync(csvPath)) {
      const priceRows = parsePriceCSV(csvPath);
      let priceCount = 0;
      for (const row of priceRows) {
        try {
          await Price.create({
            id: uuidv4(),
            material_category: row.category,
            sub_category: row.sub_category || null,
            location_city: row.location_city,
            location_state: row.location_state,
            date_recorded: row.date_recorded,
            buying_price_inr: parseFloat(row.buying_price_inr),
            unit: row.unit || 'kg',
            market_range_low: parseFloat(row.market_range_low) || null,
            market_range_high: parseFloat(row.market_range_high) || null,
            source: 'AdminEntered',
            is_verified: true,
          });
          priceCount++;
        } catch (e) {
          // Skip duplicates silently
        }
      }
      console.log(`✅ Seeded ${priceCount} price records`);
    } else {
      console.warn('⚠️  Price CSV not found at', csvPath, '— skipping price seed');
    }

    console.log('\n🎉 Seed complete! KabadConnect is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
