// tests/epr.test.js
const request = require('supertest');
const app = require('../src/index');
const { sequelize, Collector, Recycler, Material, Transaction, EPRLog } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

describe('EPR Compliance & Handover Flow', () => {
  let collectorToken;
  let collectorId;
  let recyclerId;
  let lotId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Collector and get token
    const phone = '9876543210';
    await request(app).post('/api/auth/send-otp').send({ phone });
    const authRes = await request(app).post('/api/auth/verify-otp').send({
      phone,
      otp: '123456',
      role: 'collector',
      display_name: 'Ramesh Kabadiwala',
      operating_city: 'Mumbai',
    });
    collectorToken = authRes.body.token;
    collectorId = authRes.body.user.id;

    // 2. Create Recycler
    const recycler = await Recycler.create({
      id: uuidv4(),
      name: 'EcoRecycle India Pvt Ltd',
      facility_address: 'Plot 42, Turbhe MIDC, Navi Mumbai',
      lat: 19.076,
      lng: 72.8777,
      authorization_number: 'CPCB-REG-2024-MH-0042',
      authorization_status: 'Active',
      contact_phone: '9123456780',
      materials_accepted: ['PCB', 'Cable', 'Battery'],
      offered_rates: { PCB: 120, Cable: 380 },
    });
    recyclerId = recycler.id;
  });

  it('1. should create a material lot with ESTIMATED status and CPCB code', async () => {
    const res = await request(app)
      .post('/api/lots')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({
        category: 'PCB',
        sub_category: 'Motherboards',
        approximate_weight_kg: 5.0,
        condition: 'Good',
        source_type: 'Household',
        location_city: 'Mumbai',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.lot.category).toBe('PCB');
    expect(res.body.lot.status).toBe('ESTIMATED');
    expect(res.body.lot.cpcb_code).toBe('ITEW1');
    lotId = res.body.lot.id;
  });

  it('2. should generate a cryptographic handover QR token', async () => {
    const res = await request(app)
      .post(`/api/lots/${lotId}/generate-qr`)
      .set('Authorization', `Bearer ${collectorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.qr_data).toBeDefined();
    expect(res.body.reference).toBeDefined();
    expect(res.body.expires_in_seconds).toBe(900);
    expect(res.body.lot.status).toBe('HANDOVER_PENDING');
  });

  it('3. should verify handover with scale weight, purity deduction, and generate EPRLog', async () => {
    const res = await request(app)
      .post('/api/handover/verify')
      .send({
        lot_id: lotId,
        recycler_id: recyclerId,
        confirmed_weight_kg: 5.2,
        purity_percentage: 95.0, // 5% deduction
        final_price_inr: 592.8,
        payment_mode: 'Cash',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lot_status).toBe('VERIFIED');
    expect(res.body.transaction.total_weight_kg).toBe(4.94); // 5.2 * 0.95
    expect(res.body.epr_log.cpcb_reg_no).toBe('CPCB-REG-2024-MH-0042');
    expect(res.body.epr_log.material_cpcb_code).toBe('ITEW1');
    expect(res.body.epr_log.audit_hash).toBeDefined();

    // Verify lot status in DB
    const updatedLot = await Material.findByPk(lotId);
    expect(updatedLot.status).toBe('VERIFIED');
  });

  it('4. should list EPR logs with regulatory details', async () => {
    const res = await request(app).get('/api/epr/logs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const log = res.body.logs[0];
    expect(log.material_cpcb_code).toBe('ITEW1');
    expect(log.collector_anonymized_id).toBeDefined();
  });

  it('5. should provide EPR category aggregate summary', async () => {
    const res = await request(app).get('/api/epr/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total_records).toBeGreaterThanOrEqual(1);
    expect(res.body.total_weight_kg).toBeGreaterThan(0);
    expect(res.body.by_cpcb_code.length).toBeGreaterThanOrEqual(1);
  });

  it('6. should download CPCB CSV manifest', async () => {
    const res = await request(app).get('/api/epr/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Transaction_UUID');
    expect(res.text).toContain('CPCB_Registration_No');
    expect(res.text).toContain('Material_CPCB_Code');
    expect(res.text).toContain('ITEW1');
  });

  it('7. should test IVR simulator endpoint with DTMF input', async () => {
    const startRes = await request(app).post('/api/ivr/simulator').send({
      caller: '9876543210',
    });
    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);
    expect(startRes.body.callId).toBeDefined();

    // Select Hindi (1)
    const inputRes = await request(app).post('/api/ivr/simulator').send({
      callId: startRes.body.callId,
      digits: '1',
    });
    expect(inputRes.status).toBe(200);
    expect(inputRes.body.success).toBe(true);
    expect(inputRes.body.response).toBeDefined();
  });

  it('8. should support English language in IVR and playout English prompts', async () => {
    const startRes = await request(app).post('/api/ivr/simulator').send({
      caller: '9876543211',
    });
    expect(startRes.status).toBe(200);

    // Select English (3)
    const langRes = await request(app).post('/api/ivr/simulator').send({
      callId: startRes.body.callId,
      digits: '3',
    });
    expect(langRes.status).toBe(200);
    expect(langRes.body.response.language).toBe('en');
    expect(langRes.body.response.prompt).toContain('Main menu');

    // Select Price Board (3)
    const priceMenuRes = await request(app).post('/api/ivr/simulator').send({
      callId: startRes.body.callId,
      digits: '3',
    });
    expect(priceMenuRes.status).toBe(200);
    expect(priceMenuRes.body.response.prompt).toContain('Choose material');

    // Select PCB (1)
    const pcbPriceRes = await request(app).post('/api/ivr/simulator').send({
      callId: startRes.body.callId,
      digits: '1',
    });
    expect(pcbPriceRes.status).toBe(200);
    expect(pcbPriceRes.body.response.prompt).toContain('PCB average price today is about');
  });
});
