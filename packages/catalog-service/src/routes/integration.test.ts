/**
 * Integration tests — Frontend (Dev 5) ↔ Catalog Service (Dev 2)
 *
 * Validates that the full middleware stack (CORS, Helmet, Correlation-ID)
 * works correctly and response shapes match what the frontend expects.
 */
import request from 'supertest';
import { app } from '../index';

describe('Frontend Integration — Full Middleware Stack', () => {
  // -----------------------------------------------------------------------
  // CORS headers
  // -----------------------------------------------------------------------
  describe('CORS headers', () => {
    it('should include Access-Control-Allow-Origin on GET /v1/catalog/apis', async () => {
      const res = await request(app)
        .get('/v1/catalog/apis')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should respond to preflight OPTIONS request', async () => {
      const res = await request(app)
        .options('/v1/catalog/apis')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBeDefined();
      expect(res.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Correlation-ID propagation
  // -----------------------------------------------------------------------
  describe('Correlation-ID', () => {
    it('should accept x-correlation-id from frontend', async () => {
      const res = await request(app)
        .get('/v1/catalog/apis')
        .set('x-correlation-id', 'frontend-trace-123');

      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // GET /v1/catalog/apis — Catalog list shape
  // -----------------------------------------------------------------------
  describe('GET /v1/catalog/apis — response shape for frontend', () => {
    it('should return apis[], total, and filters with expected fields', async () => {
      const res = await request(app).get('/v1/catalog/apis');

      expect(res.status).toBe(200);

      // Top-level keys
      expect(res.body).toHaveProperty('apis');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('filters');
      expect(Array.isArray(res.body.apis)).toBe(true);
      expect(typeof res.body.total).toBe('number');

      // Filters shape
      expect(Array.isArray(res.body.filters.profiles)).toBe(true);
      expect(Array.isArray(res.body.filters.statuses)).toBe(true);
      expect(Array.isArray(res.body.filters.categories)).toBe(true);

      // Each API summary has the fields the frontend card component needs
      const api = res.body.apis[0];
      expect(api).toHaveProperty('id');
      expect(api).toHaveProperty('name');
      expect(api).toHaveProperty('description');
      expect(api).toHaveProperty('category');
      expect(api).toHaveProperty('status');
      expect(api).toHaveProperty('currentVersion');
      expect(api).toHaveProperty('deprecationBadge');
      expect(api).toHaveProperty('sunsetDate');
    });
  });

  // -----------------------------------------------------------------------
  // GET /v1/catalog/apis/:id — API detail shape
  // -----------------------------------------------------------------------
  describe('GET /v1/catalog/apis/:id — response shape for frontend', () => {
    it('should return id, name, description, and versions[]', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('description');
      expect(res.body).toHaveProperty('versions');
      expect(Array.isArray(res.body.versions)).toBe(true);

      const version = res.body.versions[0];
      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('version_tag');
      expect(version).toHaveProperty('status');
      expect(version).toHaveProperty('published_at');
    });

    it('should return 404 with error field for unknown API', async () => {
      const res = await request(app).get('/v1/catalog/apis/unknown-id');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // -----------------------------------------------------------------------
  // GET /v1/catalog/apis/:id/docs — Docs shape
  // -----------------------------------------------------------------------
  describe('GET /v1/catalog/apis/:id/docs — response shape for frontend', () => {
    it('should return resources[], schemas, and info', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001/docs');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('resources');
      expect(res.body).toHaveProperty('schemas');
      expect(res.body).toHaveProperty('info');
      expect(Array.isArray(res.body.resources)).toBe(true);
      expect(typeof res.body.schemas).toBe('object');
      expect(typeof res.body.info).toBe('object');
    });
  });

  // -----------------------------------------------------------------------
  // GET /v1/catalog/apis/:id/snippets/:lang — Snippets shape
  // -----------------------------------------------------------------------
  describe('GET /v1/catalog/apis/:id/snippets/javascript — response shape for frontend', () => {
    it('should return snippets[] with endpoint and code fields', async () => {
      const res = await request(app).get('/v1/catalog/apis/api-001/snippets/javascript');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('snippets');
      expect(Array.isArray(res.body.snippets)).toBe(true);
      expect(res.body.snippets.length).toBeGreaterThan(0);

      const snippet = res.body.snippets[0];
      expect(snippet).toHaveProperty('endpoint');
      expect(snippet).toHaveProperty('code');
      expect(typeof snippet.endpoint).toBe('string');
      expect(typeof snippet.code).toBe('string');
    });
  });

  // -----------------------------------------------------------------------
  // Simulated frontend flow (browse → detail → docs → snippets)
  // -----------------------------------------------------------------------
  describe('Full frontend navigation flow', () => {
    it('should support browse → detail → docs → snippets', async () => {
      // Step 1: Frontend loads catalog page
      const listRes = await request(app).get('/v1/catalog/apis');
      expect(listRes.status).toBe(200);
      expect(listRes.body.apis.length).toBeGreaterThan(0);

      // Step 2: User clicks on first API card
      const apiId = listRes.body.apis[0].id;
      const detailRes = await request(app).get(`/v1/catalog/apis/${apiId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.id).toBe(apiId);

      // Step 3: User opens docs tab (only if API has active versions)
      if (detailRes.body.versions.some((v: { status: string }) => v.status === 'active')) {
        const docsRes = await request(app).get(`/v1/catalog/apis/${apiId}/docs`);
        expect(docsRes.status).toBe(200);
        expect(docsRes.body.resources).toBeDefined();

        // Step 4: User switches to code snippets tab
        const snippetsRes = await request(app).get(`/v1/catalog/apis/${apiId}/snippets/javascript`);
        expect(snippetsRes.status).toBe(200);
        expect(snippetsRes.body.snippets.length).toBeGreaterThan(0);
      }
    });
  });
});
