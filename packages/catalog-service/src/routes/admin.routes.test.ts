import request from 'supertest';
import { app } from '../index';
import { apiDefinitions, apiVersions } from '../data/store';

// Valid minimal OpenAPI 3.0 spec in JSON
const validSpecJson = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Test API', version: '1.0.0' },
  paths: { '/test': { get: { summary: 'Test endpoint', responses: { '200': { description: 'OK' } } } } },
});

// Valid minimal OpenAPI 3.0 spec in YAML
const validSpecYaml = `openapi: "3.0.3"
info:
  title: Test API
  version: "1.0.0"
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        "200":
          description: OK`;

const ADMIN_HEADERS = { 'x-admin-role': 'admin' };

describe('POST /v1/admin/apis', () => {
  const initialCount = apiDefinitions.length;

  afterEach(() => {
    // Clean up any APIs added during tests
    apiDefinitions.length = initialCount;
  });

  it('should create a new API definition with status 201', async () => {
    const body = { name: 'Test API', description: 'A test API', category: 'testing' };

    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_HEADERS)
      .send(body)
      .expect(201);

    expect(res.body).toMatchObject({
      name: 'Test API',
      description: 'A test API',
      category: 'testing',
      status: 'active',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
    expect(res.body.updated_at).toBeDefined();
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_HEADERS)
      .send({ name: 'Only name' })
      .expect(400);

    expect(res.body.error).toContain('description');
    expect(res.body.error).toContain('category');
  });

  it('should return 400 when all fields are missing', async () => {
    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_HEADERS)
      .send({})
      .expect(400);

    expect(res.body.error).toContain('name');
    expect(res.body.error).toContain('description');
    expect(res.body.error).toContain('category');
  });

  it('should return 403 without x-admin-role header', async () => {
    const res = await request(app)
      .post('/v1/admin/apis')
      .send({ name: 'Test', description: 'Desc', category: 'cat' })
      .expect(403);

    expect(res.body.error).toContain('admin');
  });

  it('should set status to active by default', async () => {
    const body = { name: 'Active API', description: 'Should be active', category: 'general' };

    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_HEADERS)
      .send(body)
      .expect(201);

    expect(res.body.status).toBe('active');
  });
});

describe('POST /v1/admin/apis/:id/versions', () => {
  let testApiId: string;
  const initialDefCount = apiDefinitions.length;
  const initialVerCount = apiVersions.length;

  beforeEach(async () => {
    // Create a test API to attach versions to
    const res = await request(app)
      .post('/v1/admin/apis')
      .set(ADMIN_HEADERS)
      .send({ name: 'Version Test API', description: 'For version tests', category: 'testing' });
    testApiId = res.body.id;
  });

  afterEach(() => {
    apiDefinitions.length = initialDefCount;
    apiVersions.length = initialVerCount;
  });

  it('should publish a new version with valid JSON spec (201)', async () => {
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0', openapi_spec: validSpecJson, format: 'json' })
      .expect(201);

    expect(res.body).toMatchObject({
      api_definition_id: testApiId,
      version_tag: 'v1.0.0',
      format: 'json',
      status: 'active',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.published_at).toBeDefined();
    expect(res.body.semantic_metadata).toBeDefined();
  });

  it('should publish a new version with valid YAML spec (201)', async () => {
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v2.0.0', openapi_spec: validSpecYaml, format: 'yaml' })
      .expect(201);

    expect(res.body.version_tag).toBe('v2.0.0');
    expect(res.body.format).toBe('yaml');
  });

  it('should return 400 for invalid OpenAPI spec', async () => {
    const invalidSpec = JSON.stringify({ not_openapi: true });

    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0', openapi_spec: invalidSpec, format: 'json' })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.details).toBeDefined();
  });

  it('should return 409 for duplicate version_tag', async () => {
    // First version
    await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0', openapi_spec: validSpecJson, format: 'json' })
      .expect(201);

    // Duplicate
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0', openapi_spec: validSpecJson, format: 'json' })
      .expect(409);

    expect(res.body.error).toContain('v1.0.0');
  });

  it('should return 404 for non-existent API id', async () => {
    const res = await request(app)
      .post('/v1/admin/apis/non-existent-id/versions')
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0', openapi_spec: validSpecJson, format: 'json' })
      .expect(404);

    expect(res.body.error).toContain('not found');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .set(ADMIN_HEADERS)
      .send({ version_tag: 'v1.0.0' })
      .expect(400);

    expect(res.body.error).toContain('openapi_spec');
  });

  it('should return 403 without x-admin-role header', async () => {
    const res = await request(app)
      .post(`/v1/admin/apis/${testApiId}/versions`)
      .send({ version_tag: 'v1.0.0', openapi_spec: validSpecJson, format: 'json' })
      .expect(403);

    expect(res.body.error).toContain('admin');
  });
});
