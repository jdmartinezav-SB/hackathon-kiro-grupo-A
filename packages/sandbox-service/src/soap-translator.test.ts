/**
 * Tests for SOAP Translator — jsonToSoapXml & soapXmlToJson
 *
 * Validates:
 * - Property 14: Round-trip REST/JSON ↔ SOAP/XML preserves data
 * - Property 15: SOAP fault codes map to correct HTTP status codes
 */

import { jsonToSoapXml, soapXmlToJson, mapSoapFaultToHttp } from './soap-translator';
import fc from 'fast-check';

/* ─── Unit Tests ─── */

describe('soap-translator — jsonToSoapXml', () => {
  it('wraps a simple JSON payload in a SOAP envelope', () => {
    const json = { name: 'Seguros Bolívar', amount: 1500 };
    const xml = jsonToSoapXml(json, 'GetQuote');

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<soap:Envelope');
    expect(xml).toContain('<soap:Body>');
    expect(xml).toContain('<GetQuote>');
    expect(xml).toContain('<name>Seguros Bolívar</name>');
    expect(xml).toContain('<amount>1500</amount>');
    expect(xml).toContain('</GetQuote>');
    expect(xml).toContain('</soap:Body>');
    expect(xml).toContain('</soap:Envelope>');
  });

  it('handles nested objects', () => {
    const json = {
      policy: {
        type: 'auto',
        holder: { name: 'Test User', age: 30 },
      },
    };
    const xml = jsonToSoapXml(json, 'CreatePolicy');

    expect(xml).toContain('<policy>');
    expect(xml).toContain('<type>auto</type>');
    expect(xml).toContain('<holder>');
    expect(xml).toContain('<name>Test User</name>');
    expect(xml).toContain('<age>30</age>');
  });

  it('handles arrays by repeating the element', () => {
    const json = { items: [1, 2, 3] };
    const xml = jsonToSoapXml(json, 'ListItems');

    expect(xml).toContain('<items>1</items>');
    expect(xml).toContain('<items>2</items>');
    expect(xml).toContain('<items>3</items>');
  });

  it('handles null values with xsi:nil', () => {
    const json = { value: null };
    const xml = jsonToSoapXml(json, 'TestOp');

    expect(xml).toContain('xsi:nil="true"');
  });

  it('escapes special XML characters in string values', () => {
    const json = { query: 'a < b & c > d "quoted" \'apos\'' };
    const xml = jsonToSoapXml(json, 'Search');

    expect(xml).toContain('&lt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&gt;');
    expect(xml).toContain('&quot;');
    expect(xml).toContain('&apos;');
  });

  it('handles boolean values', () => {
    const json = { active: true, deleted: false };
    const xml = jsonToSoapXml(json, 'Status');

    expect(xml).toContain('<active>true</active>');
    expect(xml).toContain('<deleted>false</deleted>');
  });

  it('handles empty object', () => {
    const xml = jsonToSoapXml({}, 'EmptyOp');

    expect(xml).toContain('<EmptyOp>');
    expect(xml).toContain('</EmptyOp>');
  });
});

describe('soap-translator — soapXmlToJson', () => {
  it('extracts operation name and data from a SOAP envelope', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<GetQuoteResponse>',
      '<premium>250.5</premium>',
      '<currency>COP</currency>',
      '</GetQuoteResponse>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    const result = soapXmlToJson(xml);

    expect(result.operation).toBe('GetQuoteResponse');
    expect(result.data).toEqual({ premium: 250.5, currency: 'COP' });
  });

  it('parses nested elements into nested objects', () => {
    const xml = [
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<PolicyResponse>',
      '<policy><type>auto</type><holder><name>Test</name></holder></policy>',
      '</PolicyResponse>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    const result = soapXmlToJson(xml);
    expect(result.data).toEqual({
      policy: { type: 'auto', holder: { name: 'Test' } },
    });
  });

  it('converts boolean strings to boolean values', () => {
    const xml = [
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<CheckResponse><active>true</active><deleted>false</deleted></CheckResponse>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    const result = soapXmlToJson(xml);
    expect(result.data.active).toBe(true);
    expect(result.data.deleted).toBe(false);
  });

  it('converts numeric strings to numbers', () => {
    const xml = [
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<CalcResponse><total>42</total><rate>3.14</rate></CalcResponse>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    const result = soapXmlToJson(xml);
    expect(result.data.total).toBe(42);
    expect(result.data.rate).toBe(3.14);
  });

  it('throws on missing Body element', () => {
    const xml = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"></soap:Envelope>';
    expect(() => soapXmlToJson(xml)).toThrow('missing Body element');
  });

  it('throws on SOAP Fault with correct HTTP status', () => {
    const xml = [
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<soap:Fault>',
      '<faultcode>soap:Client</faultcode>',
      '<faultstring>Invalid input parameter</faultstring>',
      '</soap:Fault>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    try {
      soapXmlToJson(xml);
      fail('Should have thrown');
    } catch (err: unknown) {
      const error = err as Error & { soapFault: { faultCode: string; faultString: string }; httpStatus: number };
      expect(error.message).toContain('Invalid input parameter');
      expect(error.soapFault.faultCode).toBe('soap:Client');
      expect(error.httpStatus).toBe(400);
    }
  });

  it('throws on SOAP Server Fault with 500 status', () => {
    const xml = [
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
      '<soap:Body>',
      '<soap:Fault>',
      '<faultcode>soap:Server</faultcode>',
      '<faultstring>Internal service error</faultstring>',
      '</soap:Fault>',
      '</soap:Body>',
      '</soap:Envelope>',
    ].join('');

    try {
      soapXmlToJson(xml);
      fail('Should have thrown');
    } catch (err: unknown) {
      const error = err as Error & { httpStatus: number };
      expect(error.httpStatus).toBe(500);
    }
  });
});

describe('soap-translator — mapSoapFaultToHttp (Property 15)', () => {
  it.each([
    ['soap:Client', 400],
    ['soap:Server', 500],
    ['soap:MustUnderstand', 400],
    ['soap:VersionMismatch', 400],
    ['Client', 400],
    ['Server', 500],
    ['UnknownCode', 500],
  ])('maps fault code "%s" to HTTP %d', (faultCode, expectedHttp) => {
    expect(mapSoapFaultToHttp(faultCode)).toBe(expectedHttp);
  });
});

/* ─── Property-Based Tests ─── */

// Feature: conecta-2-portal, Property 14: Traducción bidireccional REST/JSON ↔ SOAP/XML preserva datos
describe('soap-translator — Property 14: Round-trip JSON→SOAP→JSON', () => {
  /** Arbitrary for simple JSON-safe values (no arrays at top level for clean round-trip). */
  const safeStringArb = fc.stringOf(
    fc.char().filter((c) => !'<>&\'"'.includes(c) && c.trim() === c),
    { minLength: 1, maxLength: 30 },
  ).filter((s) => {
    // Exclude strings that look like numbers/booleans (XML auto-converts them)
    if (s === 'true' || s === 'false') return false;
    if (!isNaN(Number(s)) && s.trim() !== '') return false;
    // Exclude strings with leading/trailing whitespace (XML trims text nodes)
    if (s !== s.trim()) return false;
    return s.length > 0;
  });

  const jsonPrimitiveArb = fc.oneof(
    safeStringArb,
    fc.integer(),
    fc.boolean(),
  );

  const JS_RESERVED_KEYS = new Set([
    'constructor', 'prototype', '__proto__', 'toString', 'valueOf',
    'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'toLocaleString',
  ]);

  const safeKeyArb = fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s) && !JS_RESERVED_KEYS.has(s));

  const flatJsonArb = fc.dictionary(safeKeyArb, jsonPrimitiveArb, { minKeys: 1, maxKeys: 5 });

  it('preserves flat JSON data through JSON→SOAP→JSON round-trip', () => {
    fc.assert(
      fc.property(flatJsonArb, fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)), (json, operation) => {
        const soapXml = jsonToSoapXml(json as Record<string, unknown>, operation);
        const result = soapXmlToJson(soapXml);

        expect(result.operation).toBe(operation);

        // Verify each key-value pair is preserved
        for (const [key, originalValue] of Object.entries(json)) {
          const recovered = result.data[key];

          if (typeof originalValue === 'boolean') {
            expect(recovered).toBe(originalValue);
          } else if (typeof originalValue === 'number') {
            expect(recovered).toBe(originalValue);
          } else {
            // String comparison
            expect(recovered).toBe(originalValue);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
