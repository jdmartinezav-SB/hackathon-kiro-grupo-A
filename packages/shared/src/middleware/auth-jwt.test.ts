import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

/**
 * Verifies that authJwt and requireRole are properly exported from @conecta2/shared
 * and can be used by any service (Dev 2, 3, 4) via:
 *   import { authJwt, requireRole } from '@conecta2/shared';
 */

// Mock the DB query at the config level (authJwt imports query from '../config/db')
const mockQuery = jest.fn();
jest.mock('@conecta2/shared/config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  pool: {},
}));

// Import from the shared barrel — proves other services can do the same
import { authJwt, requireRole, errorHandler } from '@conecta2/shared';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

/** Build a minimal Express app simulating another service (e.g. catalog-service). */
function createServiceApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Simulate correlationId middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.correlationId = 'svc-correlation';
    next();
  });

  // Public route — no auth
  app.get('/public', (_req: Request, res: Response) => {
    res.json({ message: 'public' });
  });

  // Protected route — authJwt only
  app.get('/protected', authJwt, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // Admin route — authJwt + requireRole
  app.get(
    '/admin',
    authJwt,
    requireRole('admin'),
    (_req: Request, res: Response) => {
      res.json({ message: 'admin ok' });
    },
  );

  app.use(errorHandler);
  return app;
}

describe('Shared middleware exports — cross-service usage', () => {
  it('authJwt is exported and is a function', () => {
    expect(typeof authJwt).toBe('function');
  });

  it('requireRole is exported and is a factory function', () => {
    expect(typeof requireRole).toBe('function');
    const middleware = requireRole('admin');
    expect(typeof middleware).toBe('function');
  });
});

describe('authJwt used by another service', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createServiceApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without a token with 401', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_002');
  });

  it('rejects requests with an invalid token with 401', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_003');
  });

  it('accepts requests with a valid token and attaches req.user', async () => {
    const token = jwt.sign(
      {
        sub: 'consumer-uuid',
        email: 'dev2@example.com',
        role: 'consumer',
        businessProfile: 'salud',
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    // DB returns active consumer
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: 'consumer-uuid',
      email: 'dev2@example.com',
      role: 'consumer',
      businessProfile: 'salud',
    });
  });

  it('rejects suspended consumers with 403', async () => {
    const token = jwt.sign(
      {
        sub: 'suspended-uuid',
        email: 'suspended@example.com',
        role: 'consumer',
        businessProfile: 'autos',
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'suspended' }] });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_004');
  });
});

describe('requireRole used by another service', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createServiceApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-admin role with 403', async () => {
    const token = jwt.sign(
      {
        sub: 'consumer-uuid',
        email: 'user@example.com',
        role: 'consumer',
        businessProfile: 'salud',
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_005');
  });

  it('allows admin role through', async () => {
    const token = jwt.sign(
      {
        sub: 'admin-uuid',
        email: 'admin@example.com',
        role: 'admin',
        businessProfile: 'general',
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('admin ok');
  });
});
