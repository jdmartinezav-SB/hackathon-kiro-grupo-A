/**
 * Integration tests — Frontend (Dev 5) ↔ Catalog Service (Dev 2)
 *
 * Validates that the full middleware stack (CORS, Helmet, Correlation-ID)
 * works correctly and response shapes match what the frontend expects.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

const JWT_SECRET = 'conecta2-dev-secret';

function makeToken(): string {
  return jwt.sign(
    { consumerId: 'consumer-001', email: 'test@example.com', role: 'consumer', businessProfile: 'general' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const AUTH = { Authorization: `Bearer ${makeToken()}` };

describe('Frontend Integration — Full Middleware Stack', () => {
  describe('CORS headers', () => {
    it('should respond to preflight OPTIONS request', async () => {
      const res = await request(app)
        .options('/v1/catalog/apis')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Correlation-ID', () => {
    it('should accept x-correlation-id from frontend', async () => {
      const res = await request(app)
        .get('/v1/catalog/apis')
        .set(AUTH)
        .set('x-correlation-id', 'frontend-trace-123');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/catalog/apis — response shape for frontend', () => {
    it('should return an array of API summaries', async () => {
      const res = await request(app).get('/v1/catalog/apis').set(AUTH);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const api = res.body[0];
      expect(api).toHaveProperty('id');
      expect(api).toHaveProperty('name');
      expect(api).toHaveProperty('description');
      expect(api).toHaveProperty('category');
      expect(api).toHaveProperty('status');
    });
  });

  describe('GET /v1/catalog/apis/:id — response shape for frontend', () => {
    it('should return id, name, description, and versions[]', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001').set(AUTH);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('description');
      expect(res.body).toHaveProperty('versions');
      expect(Array.isArray(res.body.versions)).toBe(true);
    });

    it('should return 404 with error field for unknown API', async () => {
      const res = await request(app).get('/v1/catalog/apis/unknown-id').set(AUTH);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /v1/catalog/apis/:id/docs — response shape for frontend', () => {
    it('should return endpoints[] and schemas', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001/docs').set(AUTH);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body).toHaveProperty('schemas');
      expect(Array.isArray(res.body.endpoints)).toBe(true);
      expect(typeof res.body.schemas).toBe('object');
    });
  });

  describe('GET /v1/catalog/apis/:id/snippets/:lang — response shape for frontend', () => {
    it('should return language and snippet fields', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001/snippets/javascript').set(AUTH);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('language');
      expect(res.body).toHaveProperty('snippet');
      expect(typeof res.body.snippet).toBe('string');
    });
  });

  describe('Full frontend navigation flow', () => {
    it('should support browse → detail → docs → snippets', async () => {
      // Step 1: Frontend loads catalog page
      const listRes = await request(app).get('/v1/catalog/apis').set(AUTH);
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThan(0);

      // Step 2: User clicks on first API card
      const apiId = listRes.body[0].id;
      const detailRes = await request(app).get(`/v1/catalog/apis/${apiId}`).set(AUTH);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.id).toBe(apiId);

      // Step 3: User opens docs tab
      if (detailRes.body.versions.some((v: { status: string }) => v.status === 'active')) {
        const docsRes = await request(app).get(`/v1/catalog/apis/${apiId}/docs`).set(AUTH);
        expect(docsRes.status).toBe(200);
        expect(docsRes.body.endpoints).toBeDefined();

        // Step 4: User switches to code snippets tab
        const snippetsRes = await request(app).get(`/v1/catalog/apis/${apiId}/snippets/javascript`).set(AUTH);
        expect(snippetsRes.status).toBe(200);
        expect(snippetsRes.body.snippet).toBeDefined();
      }
    });
  });
});
