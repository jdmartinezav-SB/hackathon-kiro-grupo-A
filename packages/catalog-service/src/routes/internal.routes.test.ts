import request from 'supertest';
import express from 'express';
import internalRouter from './internal.routes';

const app = express();
app.use(express.json());
app.use('/v1/internal/versions', internalRouter);

describe('GET /v1/internal/versions/:versionId/spec', () => {
  it('should return 200 with spec for an existing version', async () => {
    const res = await request(app).get('/v1/internal/versions/ver-001/spec');

    expect(res.status).toBe(200);
    expect(res.body.versionId).toBe('ver-001');
    expect(res.body.apiDefinitionId).toBe('api-001');
    expect(res.body.versionTag).toBe('v2.1.0');
    expect(res.body.format).toBe('json');
    expect(typeof res.body.openapiSpec).toBe('string');

    const parsed = JSON.parse(res.body.openapiSpec);
    expect(parsed.openapi).toBe('3.0.3');
    expect(parsed.info.title).toBe('Cotización Autos API');
  });

  it('should return 404 for a non-existent version', async () => {
    const res = await request(app).get('/v1/internal/versions/ver-nonexistent/spec');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Version not found');
  });

  it('should return the correct format and spec content for each version', async () => {
    const res = await request(app).get('/v1/internal/versions/ver-002/spec');

    expect(res.status).toBe(200);
    expect(res.body.versionId).toBe('ver-002');
    expect(res.body.apiDefinitionId).toBe('api-002');
    expect(res.body.versionTag).toBe('v1.3.0');
    expect(res.body.format).toBe('json');

    const parsed = JSON.parse(res.body.openapiSpec);
    expect(parsed.info.title).toBe('Póliza Salud API');
  });
});
