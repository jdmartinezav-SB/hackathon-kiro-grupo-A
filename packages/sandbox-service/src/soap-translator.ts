/**
 * SOAP Translator — Bidirectional REST/JSON ↔ SOAP/XML translation.
 *
 * Provides two functions:
 * - jsonToSoapXml: Converts a JSON payload into a SOAP 1.1 XML envelope.
 * - soapXmlToJson: Parses a SOAP 1.1 XML envelope and extracts the body as JSON.
 *
 * Validates: Requirements 11.1, 11.3 — Capa de Abstracción de Legados
 * Properties: 14 (round-trip preservation), 15 (SOAP error mapping)
 */

/* ─── Types ─── */

export interface SoapFault {
  faultCode: string;
  faultString: string;
}

/* ─── SOAP Error → HTTP mapping (Property 15) ─── */

const SOAP_FAULT_TO_HTTP: Record<string, number> = {
  'soap:Client': 400,
  'soap:Server': 500,
  'soap:MustUnderstand': 400,
  'soap:VersionMismatch': 400,
  Client: 400,
  Server: 500,
  MustUnderstand: 400,
  VersionMismatch: 400,
};

export function mapSoapFaultToHttp(faultCode: string): number {
  return SOAP_FAULT_TO_HTTP[faultCode] ?? 500;
}

/* ─── JSON → SOAP XML ─── */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function jsonValueToXml(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return `<${key} xsi:nil="true"/>`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => jsonValueToXml(key, item)).join('');
  }

  if (typeof value === 'object') {
    const inner = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => jsonValueToXml(k, v))
      .join('');
    return `<${key}>${inner}</${key}>`;
  }

  return `<${key}>${escapeXml(String(value))}</${key}>`;
}

/**
 * Converts a JSON object into a SOAP 1.1 XML envelope string.
 *
 * @param json      The JSON payload to wrap in a SOAP body.
 * @param operation The SOAP operation name (used as the root element inside Body).
 * @returns         A SOAP 1.1 XML string.
 */
export function jsonToSoapXml(json: Record<string, unknown>, operation: string): string {
  const bodyContent = Object.entries(json)
    .map(([key, value]) => jsonValueToXml(key, value))
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"',
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    '<soap:Body>',
    `<${operation}>`,
    bodyContent,
    `</${operation}>`,
    '</soap:Body>',
    '</soap:Envelope>',
  ].join('');
}

/* ─── SOAP XML → JSON ─── */

/**
 * Minimal XML tag parser — extracts inner content of a named tag.
 * Handles namespace-prefixed tags (e.g. soap:Body).
 */
function extractTagContent(xml: string, tagName: string): string | null {
  // Match both prefixed (soap:Body) and unprefixed (Body) opening tags
  const openPattern = new RegExp(`<([a-zA-Z0-9_-]*:?${tagName})(\\s[^>]*)?>`, 'i');
  const openMatch = xml.match(openPattern);
  if (!openMatch) return null;

  const fullTagName = openMatch[1]; // e.g. "soap:Body"
  const startIdx = (openMatch.index ?? 0) + openMatch[0].length;
  const closingTag = `</${fullTagName}>`;
  const endIdx = xml.lastIndexOf(closingTag);

  if (endIdx === -1 || endIdx < startIdx) return null;

  return xml.substring(startIdx, endIdx).trim();
}

function parseXmlElement(xml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const trimmed = xml.trim();

  if (!trimmed) return result;

  const elements = extractTopLevelElements(trimmed);

  for (const elem of elements) {
    const key = elem.name;
    const value = elem.selfClosing ? null : parseElementValue(elem.content);

    // Handle repeated keys → array
    if (key in result) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

interface XmlElement {
  name: string;
  content: string;
  selfClosing: boolean;
}

function extractTopLevelElements(xml: string): XmlElement[] {
  const elements: XmlElement[] = [];
  let pos = 0;

  while (pos < xml.length) {
    // Skip whitespace
    while (pos < xml.length && /\s/.test(xml[pos])) pos++;
    if (pos >= xml.length) break;

    if (xml[pos] !== '<') break;

    // Find tag name
    const tagStart = pos;
    const closeAngle = xml.indexOf('>', pos);
    if (closeAngle === -1) break;

    const tagContent = xml.substring(pos + 1, closeAngle);

    // Self-closing tag
    if (tagContent.endsWith('/')) {
      const name = tagContent.replace(/[\s/].*$/, '').replace(/^\//, '');
      elements.push({ name, content: '', selfClosing: true });
      pos = closeAngle + 1;
      continue;
    }

    // Check for xsi:nil="true" self-closing
    if (xml.substring(pos, closeAngle + 1).includes('xsi:nil="true"') && tagContent.endsWith('/')) {
      const name = tagContent.split(/[\s/]/)[0];
      elements.push({ name, content: '', selfClosing: true });
      pos = closeAngle + 1;
      continue;
    }

    const name = tagContent.split(/[\s/]/)[0];

    // Handle self-closing with xsi:nil
    if (xml[closeAngle - 1] === '/') {
      elements.push({ name, content: '', selfClosing: true });
      pos = closeAngle + 1;
      continue;
    }

    // Find matching closing tag (handle nesting)
    const closingTag = `</${name}>`;
    let depth = 1;
    let searchPos = closeAngle + 1;

    while (depth > 0 && searchPos < xml.length) {
      const nextOpen = xml.indexOf(`<${name}`, searchPos);
      const nextClose = xml.indexOf(closingTag, searchPos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Check it's actually an opening tag (not a different tag starting with same name)
        const charAfterName = xml[nextOpen + name.length + 1];
        if (charAfterName === '>' || charAfterName === ' ' || charAfterName === '/') {
          depth++;
        }
        searchPos = nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) {
          const content = xml.substring(closeAngle + 1, nextClose);
          elements.push({ name, content, selfClosing: false });
          pos = nextClose + closingTag.length;
        } else {
          searchPos = nextClose + closingTag.length;
        }
      }
    }

    if (depth > 0) break; // Malformed XML, stop
  }

  return elements;
}

function parseElementValue(content: string): unknown {
  const trimmed = content.trim();

  // If it contains child elements, parse recursively
  if (trimmed.startsWith('<')) {
    return parseXmlElement(trimmed);
  }

  // Unescape XML entities
  const unescaped = trimmed
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  // Try to preserve original types
  if (unescaped === 'true') return true;
  if (unescaped === 'false') return false;
  if (unescaped === '') return '';

  const asNumber = Number(unescaped);
  if (!isNaN(asNumber) && unescaped !== '') return asNumber;

  return unescaped;
}

/**
 * Parses a SOAP 1.1 XML envelope and extracts the body content as a JSON object.
 *
 * @param xml  A SOAP 1.1 XML string.
 * @returns    An object with { operation, data } where operation is the root element
 *             name inside Body, and data is the parsed JSON payload.
 * @throws     Error if the XML is not a valid SOAP envelope or contains a SOAP Fault.
 */
export function soapXmlToJson(xml: string): { operation: string; data: Record<string, unknown> } {
  // Extract SOAP Body
  const bodyContent = extractTagContent(xml, 'Body');
  if (!bodyContent) {
    throw new Error('Invalid SOAP envelope: missing Body element');
  }

  // Check for SOAP Fault
  const faultContent = extractTagContent(bodyContent, 'Fault');
  if (faultContent) {
    const faultCode =
      extractTextContent(faultContent, 'faultcode') ??
      extractTextContent(faultContent, 'Code') ??
      'soap:Server';
    const faultString =
      extractTextContent(faultContent, 'faultstring') ??
      extractTextContent(faultContent, 'Reason') ??
      'Unknown SOAP fault';

    const httpStatus = mapSoapFaultToHttp(faultCode);
    const error = new Error(`SOAP Fault: ${faultString}`) as Error & {
      soapFault: SoapFault;
      httpStatus: number;
    };
    error.soapFault = { faultCode, faultString };
    error.httpStatus = httpStatus;
    throw error;
  }

  // Extract operation element (first child of Body)
  const elements = extractTopLevelElements(bodyContent);
  if (elements.length === 0) {
    throw new Error('Invalid SOAP body: no operation element found');
  }

  const operationElement = elements[0];
  const data = operationElement.selfClosing
    ? {}
    : (parseXmlElement(operationElement.content) as Record<string, unknown>);

  return { operation: operationElement.name, data };
}

/** Helper to extract simple text content from an XML tag. */
function extractTextContent(xml: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}[^>]*>([^<]*)<\\/${tagName}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : null;
}
