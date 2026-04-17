import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the DB module at the shared config level (where authJwt imports from)
const mockQuery = jest.fn();
jest.mock('@conecta2/shared/config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  pool: {},
}));

import { authJwt, requireRole } from '@conecta2/shared';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

function createTestApp() {
  const testApp = express();
  testApp.use(express.json());

  // Simulate correlationId middleware
  testApp.use((req: Request, _res, next) => {
    req.correlationId = 'test-correlation';
    next();
  });

  testApp.get('/protected', authJwt, (_req: Request, res: Response) => {
    res.json({ user: _req.user });
  });

  testApp.get(
    '/admin-only',
    authJwt,
    requireRole('admin'),
    (_req: Request, res: Response) => {
      res.json({ message: 'admin access granted' });
    },
  );

  // Error handler
  testApp.use(
    (
      err: { statusCode?: number; code?: string; message: string },
      _req: Request,
      res: Response,
      _next: express.NextFunction,
    ) => {
      const statusCode = err.statusCode ?? 500;
      res.status(statusCode).json({
        error: {
          code: err.code ?? 'INTERNAL_ERROR',
          message: err.message,
          correlationId: 'test-correlation',
        },
        statusCode,
      });
    },
  );

  return testApp;
}

describe('authJwt middleware', () => {
  let testApp: express.Express;

  beforeAll(() => {
    testApp = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no Authorization header (AUTH_002)', async () => {
    const res = await request(testApp).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_002');
  });

  it('should return 401 when Authorization header is not Bearer (AUTH_002)', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Basic abc123');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_002');
  });

  it('should return 401 with invalid token (AUTH_003)', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_003');
  });

  it('should return 200 with valid token and active consumer', async () => {
    const token = jwt.sign(
      { sub: 'uuid-123', email: 'test@example.com', role: 'consumer', businessProfile: 'salud' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('uuid-123');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('consumer');
    expect(res.body.user.businessProfile).toBe('salud');
  });

  it('should return 403 when consumer is suspended (AUTH_004)', async () => {
    const token = jwt.sign(
      { sub: 'uuid-123', email: 'test@example.com', role: 'consumer', businessProfile: 'salud' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'suspended' }] });

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_004');
  });

  it('should return 403 when consumer is revoked (AUTH_004)', async () => {
    const token = jwt.sign(
      { sub: 'uuid-123', email: 'test@example.com', role: 'consumer', businessProfile: 'salud' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'revoked' }] });

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_004');
  });

  it('should return 401 with expired token (AUTH_003)', async () => {
    const token = jwt.sign(
      { sub: 'uuid-123', email: 'test@example.com', role: 'consumer', businessProfile: 'salud' },
      JWT_SECRET,
      { expiresIn: '0s' },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_003');
  });
});

describe('requireRole middleware', () => {
  let testApp: express.Express;

  beforeAll(() => {
    testApp = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 when consumer role tries admin route (AUTH_005)', async () => {
    const token = jwt.sign(
      { sub: 'uuid-123', email: 'test@example.com', role: 'consumer', businessProfile: 'salud' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_005');
  });

  it('should return 200 when admin role accesses admin route', async () => {
    const token = jwt.sign(
      { sub: 'uuid-admin', email: 'admin@example.com', role: 'admin', businessProfile: 'general' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('admin access granted');
  });
});
