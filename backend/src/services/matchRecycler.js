// src/services/matchRecycler.js
const { haversineKm } = require('../utils/haversine');

/**
 * Score and rank recyclers for a given lot.
 *
 * Scoring formula:
 *   score = 0.5 * rate_score + 0.3 * distance_score + 0.2 * auth_score
 *
 * @param {Object} lot - { category, weight_kg, collection_lat, collection_lng }
 * @param {Array}  recyclers - Array of Recycler model instances
 * @param {number} collectorLat
 * @param {number} collectorLng
 * @returns {Array} Ranked recycler objects with distance_km and match_score
 */
function matchRecyclers(lot, recyclers, collectorLat, collectorLng) {
  const { category } = lot;

  // Filter: recycler must accept this material category + be Active
  const eligible = recyclers.filter((r) => {
    const accepted = r.materials_accepted || [];
    return accepted.includes(category) && r.authorization_status === 'Active';
  });

  if (!eligible.length) return [];

  // Compute distance and offered rate for each
  const withScores = eligible.map((r) => {
    const distance_km = haversineKm(collectorLat, collectorLng, r.lat, r.lng);
    const offeredRates = r.offered_rates || {};
    const offered_rate = offeredRates[category] || 0;
    return { recycler: r, distance_km, offered_rate };
  });

  // Normalise: max offered rate in eligible set
  const maxRate = Math.max(...withScores.map((x) => x.offered_rate), 1);

  const scored = withScores.map(({ recycler, distance_km, offered_rate }) => {
    const serviceArea = recycler.service_area_km || 50;
    const rate_score = maxRate > 0 ? offered_rate / maxRate : 0;
    const distance_score = Math.max(0, 1 - distance_km / serviceArea);
    const auth_score = recycler.authorization_status === 'Active' ? 1.0 : 0.3;
    const pickup_bonus = recycler.pickup_available ? 0.05 : 0;

    const match_score = +(
      0.5 * rate_score +
      0.3 * distance_score +
      0.2 * auth_score +
      pickup_bonus
    ).toFixed(4);

    return {
      ...recycler.toJSON(),
      distance_km: +distance_km.toFixed(2),
      offered_rate_for_category: offered_rate,
      match_score,
    };
  });

  // Sort descending by match_score
  return scored.sort((a, b) => b.match_score - a.match_score);
}

module.exports = { matchRecyclers };
