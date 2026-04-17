import request from 'supertest';
import { app } from './index';

describe('Sandbox Service — Express Server', () => {
  describe('GET /health', () => {
    it('should return status ok with service name', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('sandbox-service');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Correlation-ID middleware', () => {
    it('should generate a correlation-id when none is provided', async () => {
      const res = await request(app).get('/health');

      const correlationId = res.headers['x-correlation-id'];
      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should echo back the correlation-id when provided', async () => {
      const customId = 'test-correlation-123';
      const res = await request(app)
        .get('/health')
        .set('x-correlation-id', customId);

      expect(res.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Route placeholders (501 Not Implemented)', () => {
    it('POST /v1/sandbox/execute should return 400 when body is empty (implemented)', async () => {
      const res = await request(app).post('/v1/sandbox/execute');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SANDBOX_001');
    });

    it('GET /v1/sandbox/history/:appId should be implemented (not 501)', async () => {
      const res = await request(app).get('/v1/sandbox/history/some-app-id');
      expect(res.status).not.toBe(501);
    });

    it('GET /v1/sandbox/apis/:apiId/example should be implemented (not 501)', async () => {
      const res = await request(app).get('/v1/sandbox/apis/some-api-id/example');
      expect(res.status).not.toBe(501);
    });

    it('POST /v1/gateway/proxy/:apiId/:version/* should be implemented (not 501)', async () => {
      const res = await request(app).post('/v1/gateway/proxy/api1/v1/some/path');
      expect(res.status).not.toBe(501);
    });
  });

  describe('CORS and security headers', () => {
    it('should include helmet security headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should allow CORS requests', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBeLessThan(400);
    });
  });

  describe('JSON body parsing', () => {
    it('should parse JSON request bodies', async () => {
      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({ apiId: 'test', method: 'GET' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SANDBOX_001');
    });
  });
});
