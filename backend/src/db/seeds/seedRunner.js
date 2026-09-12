// src/db/seeds/seedRunner.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Recycler, Price, Collector, Material, Transaction, EPRLog, Traceability } = require('../../models');

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

    // 1. Seed recyclers
    let recyclerCount = 0;
    let firstRecycler = null;
    for (const r of recyclerSeed) {
      const [recycler, created] = await Recycler.findOrCreate({
        where: { authorization_number: r.authorization_number },
        defaults: {
          ...r,
          id: uuidv4(),
        },
      });
      if (!firstRecycler) firstRecycler = recycler;
      if (created) recyclerCount++;
    }
    console.log(`✅ Seeded ${recyclerCount} new recyclers (${recyclerSeed.length - recyclerCount} already existed)`);

    // 2. Seed prices from CSV
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
    }

    // 3. Seed demo Collector & Sample Lots & EPR Records
    const phone = '9876543210';
    const phone_hash = crypto.createHash('sha256').update(phone).digest('hex');
    const [collector] = await Collector.findOrCreate({
      where: { phone_hash },
      defaults: {
        id: uuidv4(),
        phone_hash,
        display_name: 'Ramesh Kabadiwala',
        preferred_language: 'hi',
        operating_city: 'Mumbai',
        total_earnings_inr: 8450.0,
        total_transactions: 3,
        registration_date: new Date(),
      },
    });

    if (firstRecycler) {
      const sampleLots = [
        { cat: 'PCB', sub: 'Telecom / Motherboards', cpcb: 'ITEW1', wt: 12.5, rate: 120, status: 'VERIFIED', purity: 95 },
        { cat: 'Cable', sub: 'Copper Wires', cpcb: 'ITEW3', wt: 8.0, rate: 380, status: 'VERIFIED', purity: 98 },
        { cat: 'Battery', sub: 'Lithium-Ion Packs', cpcb: 'CEEW4', wt: 15.0, rate: 45, status: 'VERIFIED', purity: 90 },
        { cat: 'CRT', sub: 'Monitors', cpcb: 'CEEW1', wt: 22.0, rate: 15, status: 'HANDOVER_PENDING', purity: 100 },
      ];

      for (const item of sampleLots) {
        const lotId = uuidv4();
        const estValue = +(item.wt * item.rate).toFixed(2);
        const lot = await Material.create({
          id: lotId,
          lot_id: lotId,
          collector_id: collector.id,
          category: item.cat,
          sub_category: item.sub,
          description: `${item.cat} lot - ${item.wt} kg`,
          approximate_weight_kg: item.wt,
          estimated_value_inr: estValue,
          status: item.status,
          cpcb_code: item.cpcb,
          condition: 'Good',
          source_type: 'Household',
        });

        if (item.status === 'VERIFIED') {
          const netWeight = +(item.wt * (item.purity / 100)).toFixed(2);
          const finalPayout = +(netWeight * item.rate).toFixed(2);
          const txnId = uuidv4();
          const timestamp = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000));

          await Transaction.create({
            id: txnId,
            lot_id: lot.id,
            collector_id: collector.id,
            recycler_id: firstRecycler.id,
            material_category: item.cat,
            total_weight_kg: netWeight,
            quoted_price_inr: estValue,
            final_price_inr: finalPayout,
            collection_lat: 19.076,
            collection_lng: 72.8777,
            handover_lat: 19.076,
            handover_lng: 72.8777,
            collection_datetime: timestamp,
            handover_datetime: timestamp,
            payment_mode: 'Cash',
            payment_status: 'Paid',
            transaction_status: 'Completed',
          });

          const auditPayload = `${lot.id}|${txnId}|${firstRecycler.authorization_number}|${netWeight}|${finalPayout}|${timestamp.toISOString()}`;
          const auditHash = crypto.createHash('sha256').update(auditPayload).digest('hex');

          await EPRLog.create({
            id: uuidv4(),
            transaction_id: txnId,
            lot_id: lot.id,
            collector_anonymized_id: phone_hash.slice(0, 16),
            recycler_id: firstRecycler.id,
            recycler_cpcb_reg_no: firstRecycler.authorization_number || 'CPCB-REG-2024-MH-0042',
            material_cpcb_code: item.cpcb,
            material_category: item.cat,
            claimed_weight_kg: item.wt,
            confirmed_net_weight_kg: netWeight,
            purity_percentage: item.purity,
            payout_amount_inr: finalPayout,
            gps_lat: 19.076,
            gps_lng: 72.8777,
            handover_timestamp: timestamp,
            audit_hash: auditHash,
          });
        }
      }
      console.log('✅ Seeded demo lots and verified CPCB EPR compliance records');
    }

    console.log('\n🎉 Seed complete! KabadConnect is fully populated and ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
