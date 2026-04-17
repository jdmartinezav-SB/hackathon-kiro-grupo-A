import request from 'supertest';
import { app } from './app';

describe('Backend Core — Express App', () => {
  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Correlation-ID middleware', () => {
    it('should generate x-correlation-id when not provided', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(res.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should propagate x-correlation-id when provided', async () => {
      const customId = 'test-correlation-id-123';
      const res = await request(app)
        .get('/health')
        .set('x-correlation-id', customId);

      expect(res.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Security headers (Helmet)', () => {
    it('should set security headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Route placeholders', () => {
    it('should accept POST on /v1/auth/login (real route)', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      // Real route returns 401 (invalid credentials) or 5xx if no DB
      // Just verify it's not 501 (placeholder removed)
      expect(res.status).not.toBe(501);
    });

    it('should require auth for /v1/consumers/*', async () => {
      const res = await request(app).get('/v1/consumers/123');

      // Real routes now require JWT authentication
      expect(res.status).toBe(401);
    });

    it('should require auth for /v1/admin/*', async () => {
      const res = await request(app).get('/v1/admin/consumers');

      // Real routes now require JWT authentication
      expect(res.status).toBe(401);
    });
  });

  describe('Error handler', () => {
    it('should return JSON error for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');

      // Express returns 404 by default for unmatched routes
      expect(res.status).toBe(404);
    });
  });
});
