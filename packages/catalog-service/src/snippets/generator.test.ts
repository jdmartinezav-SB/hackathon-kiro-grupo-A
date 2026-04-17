import { generateSnippet } from './generator';
import { ParsedEndpoint } from '../parser/types';

const BASE_URL = 'https://api.example.com/v1';

function makeEndpoint(overrides: Partial<ParsedEndpoint> = {}): ParsedEndpoint {
  return {
    method: 'GET',
    path: '/resources',
    summary: 'List resources',
    ...overrides,
  };
}

describe('generateSnippet', () => {
  describe('cURL', () => {
    it('should generate a GET snippet without body', () => {
      const result = generateSnippet(makeEndpoint(), BASE_URL, 'curl');

      expect(result).toContain("curl -X GET");
      expect(result).toContain(`'${BASE_URL}/resources'`);
      expect(result).toContain('Content-Type: application/json');
      expect(result).toContain('Authorization: Bearer');
      expect(result).not.toContain("-d ");
    });

    it('should include body for POST method', () => {
      const ep = makeEndpoint({ method: 'POST', path: '/resources' });
      const result = generateSnippet(ep, BASE_URL, 'curl');

      expect(result).toContain("curl -X POST");
      expect(result).toContain("-d ");
    });

    it('should include body for PUT method', () => {
      const ep = makeEndpoint({ method: 'PUT', path: '/resources/{id}' });
      const result = generateSnippet(ep, BASE_URL, 'curl');

      expect(result).toContain("curl -X PUT");
      expect(result).toContain("-d ");
    });

    it('should include body for PATCH method', () => {
      const ep = makeEndpoint({ method: 'PATCH', path: '/resources/{id}' });
      const result = generateSnippet(ep, BASE_URL, 'curl');

      expect(result).toContain("-d ");
    });

    it('should NOT include body for DELETE method', () => {
      const ep = makeEndpoint({ method: 'DELETE', path: '/resources/{id}' });
      const result = generateSnippet(ep, BASE_URL, 'curl');

      expect(result).toContain("curl -X DELETE");
      expect(result).not.toContain("-d ");
    });
  });

  describe('JavaScript', () => {
    it('should generate fetch-based snippet with async/await', () => {
      const result = generateSnippet(makeEndpoint(), BASE_URL, 'javascript');

      expect(result).toContain('await fetch(');
      expect(result).toContain(`'${BASE_URL}/resources'`);
      expect(result).toContain("method: 'GET'");
      expect(result).toContain('Content-Type');
      expect(result).toContain('Authorization');
      expect(result).toContain('await response.json()');
    });

    it('should include body for POST', () => {
      const ep = makeEndpoint({ method: 'POST' });
      const result = generateSnippet(ep, BASE_URL, 'javascript');

      expect(result).toContain('JSON.stringify');
      expect(result).toContain("method: 'POST'");
    });

    it('should NOT include body for GET', () => {
      const result = generateSnippet(makeEndpoint(), BASE_URL, 'javascript');

      expect(result).not.toContain('JSON.stringify');
    });
  });

  describe('Python', () => {
    it('should generate requests-based snippet', () => {
      const result = generateSnippet(makeEndpoint(), BASE_URL, 'python');

      expect(result).toContain('import requests');
      expect(result).toContain('requests.get(');
      expect(result).toContain(BASE_URL);
      expect(result).toContain('Authorization');
      expect(result).toContain('response.json()');
    });

    it('should include json payload for POST', () => {
      const ep = makeEndpoint({ method: 'POST' });
      const result = generateSnippet(ep, BASE_URL, 'python');

      expect(result).toContain('requests.post(');
      expect(result).toContain('json=payload');
    });
  });

  describe('Java', () => {
    it('should generate HttpClient-based snippet', () => {
      const result = generateSnippet(makeEndpoint(), BASE_URL, 'java');

      expect(result).toContain('HttpClient');
      expect(result).toContain('HttpRequest');
      expect(result).toContain(`URI.create("${BASE_URL}/resources")`);
      expect(result).toContain('Authorization');
      expect(result).toContain('BodyPublishers.noBody()');
    });

    it('should include body publisher for POST', () => {
      const ep = makeEndpoint({ method: 'POST' });
      const result = generateSnippet(ep, BASE_URL, 'java');

      expect(result).toContain('BodyPublishers.ofString(body)');
    });
  });
});
