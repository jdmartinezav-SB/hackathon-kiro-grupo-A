import { generateSnippet } from './generator';

describe('generateSnippet', () => {
  describe('cURL', () => {
    it('should generate a GET snippet without body', () => {
      const result = generateSnippet('curl', 'GET', '/resources');

      expect(result).toContain('curl -X GET');
      expect(result).toContain('/resources');
      expect(result).toContain('Content-Type: application/json');
      expect(result).toContain('Authorization: Bearer');
      expect(result).not.toContain("-d ");
    });

    it('should include body for POST method', () => {
      const result = generateSnippet('curl', 'POST', '/resources', { name: 'test' });

      expect(result).toContain('curl -X POST');
      expect(result).toContain("-d ");
    });

    it('should include body for PUT method', () => {
      const result = generateSnippet('curl', 'PUT', '/resources/1', { name: 'updated' });

      expect(result).toContain('curl -X PUT');
      expect(result).toContain("-d ");
    });

    it('should include body for PATCH method', () => {
      const result = generateSnippet('curl', 'PATCH', '/resources/1', { name: 'patched' });

      expect(result).toContain("-d ");
    });

    it('should NOT include body for DELETE method', () => {
      const result = generateSnippet('curl', 'DELETE', '/resources/1');

      expect(result).toContain('curl -X DELETE');
      expect(result).not.toContain("-d ");
    });
  });

  describe('JavaScript', () => {
    it('should generate fetch-based snippet with async/await', () => {
      const result = generateSnippet('javascript', 'GET', '/resources');

      expect(result).toContain('await fetch(');
      expect(result).toContain('/resources');
      expect(result).toContain("method: 'GET'");
      expect(result).toContain('Content-Type');
      expect(result).toContain('Authorization');
      expect(result).toContain('await response.json()');
    });

    it('should include body for POST', () => {
      const result = generateSnippet('javascript', 'POST', '/resources', { name: 'test' });

      expect(result).toContain('JSON.stringify');
      expect(result).toContain("method: 'POST'");
    });

    it('should NOT include body for GET', () => {
      const result = generateSnippet('javascript', 'GET', '/resources');

      expect(result).not.toContain('JSON.stringify');
    });
  });

  describe('Python', () => {
    it('should generate requests-based snippet', () => {
      const result = generateSnippet('python', 'GET', '/resources');

      expect(result).toContain('import requests');
      expect(result).toContain('requests.get(');
      expect(result).toContain('/resources');
      expect(result).toContain('Authorization');
      expect(result).toContain('response.json()');
    });

    it('should include json payload for POST', () => {
      const result = generateSnippet('python', 'POST', '/resources', { name: 'test' });

      expect(result).toContain('requests.post(');
      expect(result).toContain('json=');
    });
  });

  describe('Java', () => {
    it('should generate HttpClient-based snippet', () => {
      const result = generateSnippet('java', 'GET', '/resources');

      expect(result).toContain('HttpClient');
      expect(result).toContain('HttpRequest');
      expect(result).toContain('/resources');
      expect(result).toContain('Authorization');
    });

    it('should include body publisher for POST', () => {
      const result = generateSnippet('java', 'POST', '/resources', { name: 'test' });

      expect(result).toContain('BodyPublishers.ofString');
    });
  });

  describe('unsupported language', () => {
    it('should return a comment for unsupported language', () => {
      const result = generateSnippet('ruby', 'GET', '/resources');

      expect(result).toContain('not supported');
    });
  });
});
