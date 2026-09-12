import { getDb } from './database';

export const saveLot = async (lot) => {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO lots (id, collector_id, category, sub_category, description, image_refs, approximate_weight_kg, condition, source_type, estimated_value_inr, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [lot.id, lot.collector_id, lot.category, lot.sub_category, lot.description, JSON.stringify(lot.image_refs), lot.approximate_weight_kg, lot.condition, lot.source_type, lot.estimated_value_inr, lot.created_at]
  );
};

export const getLots = async (collector_id) => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM lots WHERE collector_id = ? ORDER BY created_at DESC', [collector_id]);
};

export const getLotById = async (id) => {
  const db = getDb();
  return await db.getFirstAsync('SELECT * FROM lots WHERE id = ?', [id]);
};

export const updateLot = async (id, updates) => {
  const db = getDb();
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setString = keys.map(k => `${k} = ?`).join(', ');
  await db.runAsync(`UPDATE lots SET ${setString} WHERE id = ?`, [...values, id]);
};

export const saveTransaction = async (tx) => {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO transactions (id, lot_id, collector_id, recycler_id, material_category, total_weight_kg, quoted_price_inr, final_price_inr, payment_mode, payment_status, transaction_status, collection_datetime, handover_datetime, collection_lat, collection_lng, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [tx.id, tx.lot_id, tx.collector_id, tx.recycler_id, tx.material_category, tx.total_weight_kg, tx.quoted_price_inr, tx.final_price_inr, tx.payment_mode, tx.payment_status, tx.transaction_status, tx.collection_datetime, tx.handover_datetime, tx.collection_lat, tx.collection_lng]
  );
};

export const getTransactions = async (collector_id) => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM transactions WHERE collector_id = ? ORDER BY collection_datetime DESC', [collector_id]);
};

export const updateTransaction = async (id, updates) => {
  const db = getDb();
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setString = keys.map(k => `${k} = ?`).join(', ');
  await db.runAsync(`UPDATE transactions SET ${setString} WHERE id = ?`, [...values, id]);
};

export const saveTraceability = async (record) => {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO traceability (id, lot_id, transaction_id, photograph_refs, weight_at_handover_kg, timestamp, gps_lat, gps_lng, handover_reference, collector_signed, recycler_confirmed, subsequent_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.id, record.lot_id, record.transaction_id, JSON.stringify(record.photograph_refs), record.weight_at_handover_kg, record.timestamp, record.gps_lat, record.gps_lng, record.handover_reference, record.collector_signed, record.recycler_confirmed, record.subsequent_status]
  );
};

export const getTraceabilityByRef = async (reference) => {
  const db = getDb();
  return await db.getFirstAsync('SELECT * FROM traceability WHERE handover_reference = ?', [reference]);
};

export const cachePrices = async (prices) => {
  const db = getDb();
  await db.runAsync('DELETE FROM prices_cache');
  for (const p of prices) {
    await db.runAsync(
      `INSERT INTO prices_cache (id, category, sub_category, location_city, buying_price_inr, unit, market_range_low, market_range_high, date_recorded, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.category, p.sub_category, p.location_city, p.buying_price_inr, p.unit, p.market_range_low, p.market_range_high, p.date_recorded, new Date().toISOString()]
    );
  }
};

export const getCachedPrices = async (category, city) => {
  const db = getDb();
  let query = 'SELECT * FROM prices_cache WHERE 1=1';
  let params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (city) { query += ' AND location_city = ?'; params.push(city); }
  return await db.getAllAsync(query, params);
};

export const getPriceBoard = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM prices_cache');
};

export const cacheRecyclers = async (recyclers) => {
  const db = getDb();
  await db.runAsync('DELETE FROM recyclers_cache');
  for (const r of recyclers) {
    await db.runAsync(
      `INSERT INTO recyclers_cache (id, name, facility_address, lat, lng, materials_accepted, authorization_status, contact_phone, offered_rates, pickup_available, service_area_km)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.name, r.facility_address, r.lat, r.lng, JSON.stringify(r.materials_accepted), r.authorization_status, r.contact_phone, JSON.stringify(r.offered_rates), r.pickup_available ? 1 : 0, r.service_area_km]
    );
  }
};

export const getNearbyRecyclers = async (category) => {
  const db = getDb();
  const all = await db.getAllAsync('SELECT * FROM recyclers_cache');
  if (!category) return all;
  return all.filter(r => {
    try {
      const accepted = JSON.parse(r.materials_accepted || '[]');
      return accepted.includes(category);
    } catch {
      return false;
    }
  });
};

export const addToSyncQueue = async (entity, action, data) => {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (entity, action, data, client_timestamp, synced) VALUES (?, ?, ?, ?, 0)`,
    [entity, action, JSON.stringify(data), new Date().toISOString()]
  );
};

export const getUnsyncedItems = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY id ASC');
};

export const markSynced = async (ids) => {
  if (!ids || ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE sync_queue SET synced = 1 WHERE id IN (${placeholders})`, ids);
};

export const getCollectorProfile = async () => {
  const db = getDb();
  return await db.getFirstAsync('SELECT * FROM collectors LIMIT 1');
};

export const saveCollectorProfile = async (profile) => {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO collectors (id, display_name, phone_hash, preferred_language, operating_city, total_transactions, total_earnings_inr, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [profile.id, profile.display_name, profile.phone_hash, profile.preferred_language, profile.operating_city, profile.total_transactions, profile.total_earnings_inr, profile.created_at]
  );
};

export const updateEarnings = async (amount) => {
  const db = getDb();
  await db.runAsync(`UPDATE collectors SET total_earnings_inr = total_earnings_inr + ?`, [amount]);
};
