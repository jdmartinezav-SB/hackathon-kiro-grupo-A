import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// ── Mock DB layer ──────────────────────────────────────────
const mockQuery = jest.fn();
jest.mock('@conecta2/shared/config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  pool: {},
}));

// ── Mock bcrypt for deterministic hashing ──────────────────
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedPasswordMock'),
  compare: jest.fn(),
}));

import { app } from '../app';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

describe('Full Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register → verify-email → login → create app → get consumer with apps', async () => {
    const consumerId = '550e8400-e29b-41d4-a716-446655440000';
    const appId = '660e8400-e29b-41d4-a716-446655440001';
    const clientId = expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // ── Step 1: Register a new consumer ────────────────────
    // Mock: email check returns empty (no duplicate)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Mock: INSERT returns new consumer id
    mockQuery.mockResolvedValueOnce({ rows: [{ id: consumerId }] });

    const registerRes = await request(app)
      .post('/v1/auth/register')
      .send({
        email: 'aliado@empresa.com',
        password: 'SecurePass123!',
        companyName: 'Empresa Test S.A.',
        businessProfile: 'salud',
        contactName: 'Juan Pérez',
        phone: '+573001234567',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.consumerId).toBe(consumerId);
    expect(registerRes.body.message).toBe('Correo de verificación enviado');

    // ── Step 2: Verify email ───────────────────────────────
    // Mock: consumer found with email_verified=false
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: consumerId, email_verified: false }],
    });
    // Mock: UPDATE succeeds
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const verifyRes = await request(app)
      .post('/v1/auth/verify-email')
      .send({ consumerId });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.message).toBe('Email verificado exitosamente');

    // ── Step 3: Login ──────────────────────────────────────
    // Mock: consumer found with status='active'
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: consumerId,
          email: 'aliado@empresa.com',
          password_hash: '$2b$12$hashedPasswordMock',
          status: 'active',
          business_profile: 'salud',
          company_name: 'Empresa Test S.A.',
          contact_name: 'Juan Pérez',
        },
      ],
    });
    // Mock: bcrypt.compare returns true
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    // Mock: UPDATE last_activity_at
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'aliado@empresa.com', password: 'SecurePass123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();
    expect(loginRes.body.consumer.id).toBe(consumerId);
    expect(loginRes.body.consumer.email).toBe('aliado@empresa.com');
    expect(loginRes.body.consumer.businessProfile).toBe('salud');

    // Decode JWT to verify payload
    const decoded = jwt.verify(loginRes.body.accessToken, JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
      businessProfile: string;
    };
    expect(decoded.sub).toBe(consumerId);
    expect(decoded.email).toBe('aliado@empresa.com');
    expect(decoded.role).toBe('consumer');
    expect(decoded.businessProfile).toBe('salud');

    const accessToken = loginRes.body.accessToken;

    // ── Step 4: Create application ─────────────────────────
    // Mock: authJwt — DB status check for consumer
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });
    // Mock: consumer exists check
    mockQuery.mockResolvedValueOnce({ rows: [{ id: consumerId }] });
    // Mock: INSERT application returns id
    mockQuery.mockResolvedValueOnce({ rows: [{ id: appId }] });
    // Mock: INSERT credential
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const createAppRes = await request(app)
      .post(`/v1/consumers/${consumerId}/apps`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Mi App de Seguros',
        description: 'Aplicación para integrar cotizaciones de salud',
      });

    expect(createAppRes.status).toBe(201);
    expect(createAppRes.body.appId).toBe(appId);
    expect(createAppRes.body.clientId).toEqual(clientId);
    expect(createAppRes.body.clientSecret).toBeDefined();
    expect(createAppRes.body.clientSecret).toHaveLength(64); // 32 bytes hex
    expect(createAppRes.body.environment).toBe('sandbox');

    // ── Step 5: Get consumer profile with apps ─────────────
    // Mock: authJwt — DB status check
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });
    // Mock: consumer data
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: consumerId,
          email: 'aliado@empresa.com',
          company_name: 'Empresa Test S.A.',
          contact_name: 'Juan Pérez',
          phone: '+573001234567',
          business_profile: 'salud',
          status: 'active',
          email_verified: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          last_activity_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    // Mock: applications list
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: appId,
          name: 'Mi App de Seguros',
          description: 'Aplicación para integrar cotizaciones de salud',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const profileRes = await request(app)
      .get(`/v1/consumers/${consumerId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.consumer.id).toBe(consumerId);
    expect(profileRes.body.consumer.email).toBe('aliado@empresa.com');
    expect(profileRes.body.consumer.companyName).toBe('Empresa Test S.A.');
    expect(profileRes.body.consumer.businessProfile).toBe('salud');
    expect(profileRes.body.consumer.emailVerified).toBe(true);
    expect(profileRes.body.applications).toHaveLength(1);
    expect(profileRes.body.applications[0].id).toBe(appId);
    expect(profileRes.body.applications[0].name).toBe('Mi App de Seguros');
    expect(profileRes.body.applications[0].status).toBe('active');
  });
});
