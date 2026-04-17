import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

const JWT_SECRET = 'conecta2-dev-secret';

function makeAdminToken(): string {
  return jwt.sign(
    { consumerId: 'admin-001', email: 'admin@example.com', role: 'admin', businessProfile: 'general' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const ADMIN_AUTH = { Authorization: `Bearer ${makeAdminToken()}` };

// Valid minimal OpenAPI 3.0 spec in JSON
const validSpecJson = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Test API', version: '1.0.0' },
  paths: { '/test': { get: { summary: 'Test endpoint', responses: { '200': { description: 'OK' } } } } },
});

describe('POST /v1/admin/apis', () => {
  it('should create a new API definition with status 201', async () => {
    const body = { name: 'Test API', description: 'A test API', category: 'testing' };

    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_AUTH)
      .send(body)
      .expect(201);

    expect(res.body.name).toBe('Test API');
    expect(res.body.category).toBe('testing');
    expect(res.body.status).toBe('active');
    expect(res.body.id).toBeDefined();
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_AUTH)
      .send({})
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .post('/v1/admin/apis')
      .send({ name: 'Test', description: 'Desc', category: 'cat' })
      .expect(401);
  });

  it('should return 403 with consumer token (not admin)', async () => {
    const consumerToken = jwt.sign(
      { consumerId: 'c-001', email: 'c@test.com', role: 'consumer', businessProfile: 'general' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await request(app)
      .post('/v1/admin/apis')
      .set({ Authorization: `Bearer ${consumerToken}` })
      .send({ name: 'Test', description: 'Desc', category: 'cat' })
      .expect(403);
  });
});

describe('POST /v1/admin/apis/:id/versions', () => {
  let testApiId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_AUTH)
      .send({ name: 'Version Test API', description: 'For version tests', category: 'testing' });
    testApiId = res.body.id;
  });

  it('should publish a new version with valid JSON spec (201)', async () => {
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_AUTH)
      .send({ versionTag: 'v1.0.0', openapiSpec: validSpecJson, format: 'json' })
      .expect(201);

    expect(res.body.api_definition_id).toBe(testApiId);
    expect(res.body.version_tag).toBe('v1.0.0');
    expect(res.body.format).toBe('json');
    expect(res.body.status).toBe('active');
    expect(res.body.id).toBeDefined();
  });

  it('should return 400 for invalid OpenAPI spec (missing required fields)', async () => {
    const invalidSpec = JSON.stringify({ not_openapi: true });

    await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_AUTH)
      .send({ versionTag: 'v1.0.0', openapiSpec: invalidSpec, format: 'json' })
      .expect(400);
  });

  it('should return 404 for non-existent API id', async () => {
    await request(app)
      .post('/v1/admin/apis/non-existent-id/versions')
      .set(ADMIN_AUTH)
      .send({ versionTag: 'v1.0.0', openapiSpec: validSpecJson, format: 'json' })
      .expect(404);
  });

  it('should return 400 when required fields are missing', async () => {
    await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_AUTH)
      .send({ versionTag: 'v1.0.0' })
      .expect(400);
  });

  it('should return 401 without auth token', async () => {
    await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .send({ versionTag: 'v1.0.0', openapiSpec: validSpecJson, format: 'json' })
      .expect(401);
  });
});
