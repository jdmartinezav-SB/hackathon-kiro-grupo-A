import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

const JWT_SECRET = 'conecta2-dev-secret';

function makeToken(overrides: Partial<{ consumerId: string; email: string; role: string; businessProfile: string }> = {}): string {
  return jwt.sign(
    {
      consumerId: 'consumer-001',
      email: 'test@example.com',
      role: 'consumer',
      businessProfile: 'general',
      ...overrides,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const AUTH = { Authorization: `Bearer ${makeToken()}` };

describe('GET /v1/catalog/apis', () => {
  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/v1/catalog/apis');
    expect(res.status).toBe(401);
  });

  it('should return a list of APIs with auth token', async () => {
    const res = await request(app).get('/v1/catalog/apis').set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);

    const first = res.body[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('description');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('status');
  });

  it('should filter by status=deprecated', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis?status=deprecated')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Consulta Siniestros');
  });

  it('should include sunsetDate for deprecated APIs with sunset plans', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis?status=deprecated')
      .set(AUTH);

    expect(res.status).toBe(200);
    const siniestros = res.body.find(
      (a: { name: string }) => a.name === 'Consulta Siniestros',
    );
    expect(siniestros).toBeDefined();
    expect(siniestros.sunsetDate).toBe('2025-01-01');
  });

  it('should filter by category', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis?category=autos')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('autos');
  });

  it('should search by text in name or description', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis?search=siniestros')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array for non-matching filters', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis?category=nonexistent')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /v1/catalog/apis/:id', () => {
  it('should return 200 with full detail for an existing API', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('api-001');
    expect(res.body.name).toBe('Cotización Autos');
    expect(res.body.description).toBeDefined();
    expect(res.body.category).toBe('autos');
    expect(res.body.status).toBe('active');
  });

  it('should return 404 for a non-existent API', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-nonexistent')
      .set(AUTH);

    expect(res.status).toBe(404);
  });

  it('should include versions array', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.versions)).toBe(true);
    expect(res.body.versions.length).toBe(1);
  });
});

describe('GET /v1/catalog/apis/:id/docs', () => {
  it('should return 200 with parsed docs for existing API with valid spec', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/docs')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Cotización Autos API');
    expect(res.body.endpoints).toBeDefined();
    expect(Array.isArray(res.body.endpoints)).toBe(true);
    expect(res.body.endpoints.length).toBeGreaterThan(0);
    expect(res.body.schemas).toBeDefined();
  });

  it('should return 404 when API has no active versions', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-003/docs')
      .set(AUTH);

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/catalog/apis/:id/snippets/:lang', () => {
  it('should return 200 with curl snippet for a valid API', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/snippets/curl')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('curl');
    expect(res.body.snippet).toContain('curl');
    expect(res.body.snippet).toContain('Authorization');
  });

  it('should return snippets for javascript language', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/snippets/javascript')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('javascript');
    expect(res.body.snippet).toContain('fetch');
  });

  it('should return snippets for python language', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/snippets/python')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('python');
    expect(res.body.snippet).toContain('requests');
  });

  it('should return snippets for java language', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/snippets/java')
      .set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('java');
    expect(res.body.snippet).toContain('HttpClient');
  });

  it('should return 400 for unsupported language', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-001/snippets/ruby')
      .set(AUTH);

    expect(res.status).toBe(400);
  });

  it('should return 404 when API has no active versions', async () => {
    const res = await request(app)
      .get('/v1/catalog/apis/api-003/snippets/curl')
      .set(AUTH);

    expect(res.status).toBe(404);
  });
});
