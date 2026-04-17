import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

/**
 * Integration test proving that catalog-service, sandbox-service, and
 * analytics-service can import and use authJwt + requireRole from @conecta2/shared.
 *
 * Each "service" is a minimal Express app that mounts the shared middleware
 * exactly as a real service would.
 */

// ── Mock DB layer (authJwt queries consumer status) ────────
const mockQuery = jest.fn();
jest.mock('@conecta2/shared/config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  pool: {},
}));

import { authJwt, requireRole, errorHandler } from '@conecta2/shared';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

// ── Helper: build a service-like Express app ───────────────
function buildServiceApp(serviceName: string): express.Express {
  const svc = express();
  svc.use(express.json());

  // Simulate correlationId middleware (every service uses it)
  svc.use((req: Request, _res: Response, next: NextFunction) => {
    req.correlationId = `${serviceName}-corr`;
    next();
  });

  // Protected route — any authenticated user
  svc.get('/protected', authJwt, (req: Request, res: Response) => {
    res.json({ service: serviceName, user: req.user });
  });

  // Admin-only route — authJwt + requireRole('admin')
  svc.get(
    '/admin',
    authJwt,
    requireRole('admin'),
    (_req: Request, res: Response) => {
      res.json({ service: serviceName, access: 'admin' });
    },
  );

  svc.use(errorHandler);
  return svc;
}

// ── Helpers ────────────────────────────────────────────────
function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const CONSUMER_PAYLOAD = {
  sub: 'consumer-uuid-1',
  email: 'dev@example.com',
  role: 'consumer',
  businessProfile: 'salud',
};

const ADMIN_PAYLOAD = {
  sub: 'admin-uuid-1',
  email: 'admin@example.com',
  role: 'admin',
  businessProfile: 'general',
};

// ── Test suites per simulated service ──────────────────────
describe.each([
  'catalog-service',
  'sandbox-service',
  'analytics-service',
])('%s — authJwt + requireRole integration', (serviceName) => {
  let app: express.Express;

  beforeAll(() => {
    app = buildServiceApp(serviceName);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a request without a token with 401', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_002');
  });

  it('rejects a request with an expired/invalid JWT with 401', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer totally-invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_003');
  });

  it('allows a request with a valid JWT through', async () => {
    const token = signToken(CONSUMER_PAYLOAD);
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.service).toBe(serviceName);
    expect(res.body.user).toEqual({
      id: 'consumer-uuid-1',
      email: 'dev@example.com',
      role: 'consumer',
      businessProfile: 'salud',
    });
  });

  it('requireRole("admin") blocks non-admin users with 403', async () => {
    const token = signToken(CONSUMER_PAYLOAD);
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_005');
  });

  it('requireRole("admin") allows admin users through', async () => {
    const token = signToken(ADMIN_PAYLOAD);
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.service).toBe(serviceName);
    expect(res.body.access).toBe('admin');
  });
});
