// tests/prices.test.js
const request = require('supertest');
const app = require('../src/index');

describe('Price Routes', () => {
  describe('GET /api/prices/board', () => {
    it('should return price board with all categories', async () => {
      const res = await request(app)
        .get('/api/prices/board')
        .query({ city: 'Mumbai' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.prices)).toBe(true);
      expect(res.body.prices.length).toBeGreaterThan(0);

      // Each price entry should have required fields
      const price = res.body.prices[0];
      expect(price).toHaveProperty('category');
      expect(price).toHaveProperty('icon_key');
      expect(price).toHaveProperty('trend');
    });

    it('should default to Mumbai when no city provided', async () => {
      const res = await request(app).get('/api/prices/board');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/prices/trend', () => {
    it('should return trend data for a valid category', async () => {
      const res = await request(app)
        .get('/api/prices/trend')
        .query({ category: 'PCB', city: 'Mumbai', days: 7 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBe('PCB');
      expect(Array.isArray(res.body.trend)).toBe(true);
    });

    it('should return 400 when category is missing', async () => {
      const res = await request(app)
        .get('/api/prices/trend')
        .query({ city: 'Mumbai' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/prices', () => {
    it('should return paginated price records', async () => {
      const res = await request(app)
        .get('/api/prices')
        .query({ limit: 10, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(Array.isArray(res.body.prices)).toBe(true);
    });
  });
});
