// tests/auth.test.js
const request = require('supertest');
const app = require('../src/index');

describe('Auth Routes', () => {
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for a valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.demo_otp).toBe('123456');
    });

    it('should reject invalid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: 'not-a-phone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    beforeEach(async () => {
      // Send OTP first
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' });
    });

    it('should verify correct OTP and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '123456', preferred_language: 'hi' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
    });

    it('should reject wrong OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject OTP for unregistered phone (no OTP sent)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9999999999', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
