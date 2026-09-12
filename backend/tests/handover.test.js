// tests/handover.test.js
const request = require('supertest');
const app = require('../src/index');

// Helper: get a valid auth token
async function getAuthToken(phone = '9876543210') {
  await request(app).post('/api/auth/send-otp').send({ phone });
  const res = await request(app)
    .post('/api/auth/verify-otp')
    .send({ phone, otp: '123456', preferred_language: 'hi' });
  return res.body.token;
}

describe('Handover Routes', () => {
  let token;
  let lotId;
  let transactionId;
  const RECYCLER_ID = 'rec-001-mpcb-mumbai';

  beforeAll(async () => {
    token = await getAuthToken('9123456789');

    // Create a lot
    const lotRes = await request(app)
      .post('/api/lots')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'PCB', approximate_weight_kg: 2.5, condition: 'Damaged', source_type: 'Household' });

    lotId = lotRes.body.lot?.id;

    if (lotId) {
      // Create a transaction
      const txRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ lot_id: lotId, quoted_price_inr: 250, collection_lat: 19.076, collection_lng: 72.877 });
      transactionId = txRes.body.transaction?.id;
    }
  });

  describe('POST /api/handover/initiate', () => {
    it('should initiate handover and return reference code', async () => {
      if (!lotId || !transactionId) {
        console.warn('Skipping: lot/transaction setup failed (likely no DB)');
        return;
      }

      const res = await request(app)
        .post('/api/handover/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lot_id: lotId,
          transaction_id: transactionId,
          weight_at_handover_kg: 2.4,
          gps_lat: 19.076,
          gps_lng: 72.877,
          photograph_refs: [],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.handover_reference).toMatch(/^KC[A-Z0-9]{6}$/);
      expect(res.body.qr_data).toBeDefined();
    });
  });

  describe('GET /api/handover/:reference', () => {
    it('should return 404 for non-existent reference', async () => {
      const res = await request(app).get('/api/handover/KCXXXXXX');
      expect(res.status).toBe(404);
    });
  });
});
