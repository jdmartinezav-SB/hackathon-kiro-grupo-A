import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from '@conecta2/shared';
import { adminRouter } from './admin';

// Mock the DB query function
const mockQuery = jest.fn();
jest.mock('@conecta2/shared', () => {
  const actual = jest.requireActual('@conecta2/shared');
  return {
    ...actual,
    query: (...args: unknown[]) => mockQuery(...args),
    // Bypass authJwt — inject req.user directly in test middleware
    authJwt: (_req: Request, _res: Response, next: NextFunction) => next(),
    // Bypass requireRole — already tested in middleware tests
    requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

/**
 * Helper: build a minimal Express app that injects req.user
 * before the admin router so we can control the authenticated user.
 */
function createAdminApp(user: { id: string; email: string; role: string; businessProfile: string }) {
  const testApp = express();
  testApp.use(express.json());

  // Simulate correlationId middleware
  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    req.correlationId = 'test-correlation';
    next();
  });

  // Inject authenticated user
  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = user;
    next();
  });

  testApp.use('/v1/admin', adminRouter);
  testApp.use(errorHandler);

  return testApp;
}

const adminUser = {
  id: '00000000-0000-4000-a000-000000000010',
  email: 'admin@segurosbolivar.com',
  role: 'admin',
  businessProfile: 'general',
};

const consumerId = '00000000-0000-4000-a000-000000000011';

describe('PUT /v1/admin/consumers/:id/status', () => {
  let testApp: express.Express;

  beforeAll(() => {
    testApp = createAdminApp(adminUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should change status and register in admin_action_log', async () => {
    // 1. Consumer exists with status='active'
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: consumerId,
        email: 'aliado1@empresa.com',
        company_name: 'Empresa Salud SA',
        contact_name: 'Carlos Gómez',
        business_profile: 'salud',
        status: 'active',
      }],
    });
    // 2. UPDATE consumer SET status
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    // 3. UPDATE application SET status (suspend apps)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 });
    // 4. INSERT INTO admin_action_log
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(testApp)
      .put(`/v1/admin/consumers/${consumerId}/status`)
      .send({ status: 'suspended', reason: 'Violación de términos' });

    expect(res.status).toBe(200);
    expect(res.body.consumer.status).toBe('suspended');
    expect(res.body.consumer.previousStatus).toBe('active');
    expect(res.body.message).toContain('suspended');

    // Verify INSERT INTO admin_action_log was called
    const auditCall = mockQuery.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('admin_action_log'),
    );
    expect(auditCall).toBeDefined();
    expect(auditCall![1]).toEqual(
      expect.arrayContaining([
        adminUser.id,
        'status_change_suspended',
        consumerId,
        'Violación de términos',
      ]),
    );
  });

  it('should return 404 when consumer does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(testApp)
      .put(`/v1/admin/consumers/${consumerId}/status`)
      .send({ status: 'suspended', reason: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CONSUMER_001');
  });

  it('should return 400 when status is the same as current', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: consumerId,
        email: 'aliado1@empresa.com',
        company_name: 'Empresa Salud SA',
        contact_name: 'Carlos Gómez',
        business_profile: 'salud',
        status: 'suspended',
      }],
    });

    const res = await request(testApp)
      .put(`/v1/admin/consumers/${consumerId}/status`)
      .send({ status: 'suspended', reason: 'Duplicate' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ADMIN_001');
  });

  it('should return 400 with invalid status value', async () => {
    const res = await request(testApp)
      .put(`/v1/admin/consumers/${consumerId}/status`)
      .send({ status: 'invalid', reason: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when reason is missing', async () => {
    const res = await request(testApp)
      .put(`/v1/admin/consumers/${consumerId}/status`)
      .send({ status: 'suspended' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 with invalid consumer UUID', async () => {
    const res = await request(testApp)
      .put('/v1/admin/consumers/not-a-uuid/status')
      .send({ status: 'suspended', reason: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
