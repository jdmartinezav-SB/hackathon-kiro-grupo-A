import request from 'supertest';
import { app } from '../app';

// Mock the DB query function
const mockQuery = jest.fn();
jest.mock('@conecta2/shared', () => {
  const actual = jest.requireActual('@conecta2/shared');
  return {
    ...actual,
    query: (...args: unknown[]) => mockQuery(...args),
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('POST /v1/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = {
    email: 'test@example.com',
    password: 'SecurePass123',
    companyName: 'Acme Corp',
    businessProfile: 'salud',
    contactName: 'Juan Pérez',
    phone: '+573001234567',
  };

  it('should return 201 with valid registration data', async () => {
    // No existing email
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Insert returns new consumer id
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'uuid-123' }] });

    const res = await request(app)
      .post('/v1/auth/register')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.consumerId).toBe('uuid-123');
    expect(res.body.message).toBe('Correo de verificación enviado');
    expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 12);
  });

  it('should return 400 with invalid data (missing email)', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ ...validBody, email: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 with invalid businessProfile', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ ...validBody, businessProfile: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 when email already exists (AUTH_001)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

    const res = await request(app)
      .post('/v1/auth/register')
      .send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('AUTH_001');
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ ...validBody, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid JWT on successful login', async () => {
    // Restore real jwt.sign for this test to verify token validity
    const realJwt = jest.requireActual<typeof import('jsonwebtoken')>('jsonwebtoken');
    (jwt.sign as jest.Mock)
      .mockImplementationOnce((...args: Parameters<typeof realJwt.sign>) => realJwt.sign(...args))
      .mockImplementationOnce((...args: Parameters<typeof realJwt.sign>) => realJwt.sign(...args));

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashed',
        status: 'active',
        business_profile: 'salud',
        company_name: 'Acme Corp',
        contact_name: 'Juan Pérez',
      }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    // Update last_activity_at
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePass123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.consumer.id).toBe('uuid-123');
    expect(res.body.consumer.businessProfile).toBe('salud');

    // Decode and verify the accessToken is a valid JWT
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    const decoded = realJwt.verify(res.body.accessToken, secret) as Record<string, unknown>;
    expect(decoded.sub).toBe('uuid-123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('consumer');
    expect(decoded.businessProfile).toBe('salud');
    expect(decoded.exp).toBeDefined();
  });

  it('should return 401 with wrong password (AUTH_006)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashed',
        status: 'active',
        business_profile: 'salud',
        company_name: 'Acme Corp',
        contact_name: 'Juan Pérez',
      }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_006');
  });

  it('should return 401 when email does not exist (generic message)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'pass1234' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_006');
    // Should NOT reveal that the email doesn't exist
    expect(res.body.error.message).not.toContain('email');
  });

  it('should return 403 when consumer is pending (AUTH_007)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashed',
        status: 'pending',
        business_profile: 'salud',
        company_name: 'Acme Corp',
        contact_name: 'Juan Pérez',
      }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePass123' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_007');
  });

  it('should return 400 with invalid login data', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /v1/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and activate consumer', async () => {
    const consumerId = '550e8400-e29b-41d4-a716-446655440000';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: consumerId, email_verified: false }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/auth/verify-email')
      .send({ consumerId });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verificado exitosamente');
  });

  it('should return 200 if already verified', async () => {
    const consumerId = '550e8400-e29b-41d4-a716-446655440000';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: consumerId, email_verified: true }],
    });

    const res = await request(app)
      .post('/v1/auth/verify-email')
      .send({ consumerId });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('ya fue verificado');
  });

  it('should return 404 when consumer not found', async () => {
    const consumerId = '550e8400-e29b-41d4-a716-446655440000';
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/auth/verify-email')
      .send({ consumerId });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 with invalid consumerId', async () => {
    const res = await request(app)
      .post('/v1/auth/verify-email')
      .send({ consumerId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept token as query param', async () => {
    const consumerId = '550e8400-e29b-41d4-a716-446655440000';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: consumerId, email_verified: false }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/v1/auth/verify-email?token=${consumerId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verificado exitosamente');
  });
});
