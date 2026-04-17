import { validate } from './validator';

const validSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
};

describe('validate()', () => {
  it('should return no errors for a valid minimal spec', () => {
    expect(validate(validSpec)).toEqual([]);
  });

  it('should return error when "openapi" field is missing', () => {
    const { openapi: _, ...spec } = validSpec;
    const errors = validate(spec);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('openapi');
    expect(errors[0].message).toContain('Missing');
  });

  it('should return error for invalid openapi version (e.g. "2.0")', () => {
    const errors = validate({ ...validSpec, openapi: '2.0' });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('openapi');
    expect(errors[0].message).toContain('3.');
  });

  it('should return error when "info" field is missing', () => {
    const { info: _, ...spec } = validSpec;
    const errors = validate(spec);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('info');
    expect(errors[0].message).toContain('Missing');
  });

  it('should return error when "info.title" is missing', () => {
    const errors = validate({ ...validSpec, info: { version: '1.0.0' } });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('info.title');
  });

  it('should return error when "info.version" is missing', () => {
    const errors = validate({ ...validSpec, info: { title: 'API' } });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('info.version');
  });

  it('should return error when "paths" field is missing', () => {
    const { paths: _, ...spec } = validSpec;
    const errors = validate(spec);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('paths');
    expect(errors[0].message).toContain('Missing');
  });

  it('should return multiple errors at once', () => {
    const errors = validate({});
    expect(errors.length).toBeGreaterThanOrEqual(3);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('openapi');
    expect(fields).toContain('info');
    expect(fields).toContain('paths');
  });

  it('should include line number in every error', () => {
    const errors = validate({});
    errors.forEach((e) => expect(e.line).toBe(1));
  });
});
