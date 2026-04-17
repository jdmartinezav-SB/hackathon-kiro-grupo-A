import { useState, useCallback } from 'react';
import { Play, Trash2, Plus, Clock, ChevronDown, ChevronRight } from 'lucide-react';

/* ── Types ── */
interface Header {
  key: string;
  value: string;
}

interface HistoryEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  time: number;
  timestamp: Date;
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
}

/* ── Constants ── */
const MOCK_APIS = [
  { id: '1', name: 'Cotización Autos', versions: ['v2.1', 'v2.0'] },
  { id: '2', name: 'Póliza Salud', versions: ['v1.3'] },
  { id: '3', name: 'Consulta Siniestros', versions: ['v1.0'] },
  { id: '4', name: 'Emisión Vida', versions: ['v3.0'] },
  { id: '5', name: 'Recaudo Primas', versions: ['v1.2'] },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
};

function statusColor(code: number): string {
  if (code < 300) return 'bg-green-100 text-green-700';
  if (code < 400) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

/* ── Sub-components ── */
function HeaderRow({ header, onChange, onRemove }: { header: Header; onChange: (h: Header) => void; onRemove: () => void }) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Key"
        value={header.key}
        onChange={(e) => onChange({ ...header, key: e.target.value })}
        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
      />
      <input
        type="text"
        placeholder="Value"
        value={header.value}
        onChange={(e) => onChange({ ...header, value: e.target.value })}
        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
      />
      <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label="Eliminar header">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResponsePanel({ response }: { response: MockResponse | null }) {
  const [headersOpen, setHeadersOpen] = useState(false);

  if (!response) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Ejecuta una petición para ver la respuesta
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor(response.statusCode)}`}>
          {response.statusCode}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {response.responseTimeMs}ms
        </span>
      </div>

      {/* Response headers */}
      <button
        type="button"
        onClick={() => setHeadersOpen(!headersOpen)}
        className="flex items-center gap-1 text-sm font-medium text-gray-700"
      >
        {headersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Headers
      </button>
      {headersOpen && (
        <div className="rounded-lg bg-gray-50 p-3 text-xs">
          {Object.entries(response.headers).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-medium text-gray-700">{k}:</span>
              <span className="text-gray-500">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Response body */}
      <div>
        <h4 className="mb-1 text-sm font-medium text-gray-700">Body</h4>
        <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-900 p-4 text-sm text-green-300">
          <code>{JSON.stringify(response.body, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Sandbox() {
  const [apiId, setApiId] = useState(MOCK_APIS[0]?.id ?? '');
  const [version, setVersion] = useState(MOCK_APIS[0]?.versions[0] ?? '');
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/cotizacion');
  const [headers, setHeaders] = useState<Header[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [body, setBody] = useState('{\n  "tipo": "autos",\n  "placa": "ABC123"\n}');
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const selectedApi = MOCK_APIS.find((a) => a.id === apiId);

  const handleApiChange = useCallback((newId: string) => {
    setApiId(newId);
    const api = MOCK_APIS.find((a) => a.id === newId);
    if (api?.versions[0]) setVersion(api.versions[0]);
  }, []);

  const execute = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const mock: MockResponse = {
        statusCode: 200,
        headers: { 'content-type': 'application/json', 'x-correlation-id': crypto.randomUUID() },
        body: { cotizacionId: 'COT-2026-001', prima: 1250000, moneda: 'COP', vigencia: '2026-04-17' },
        responseTimeMs: Math.floor(Math.random() * 200) + 50,
      };
      setResponse(mock);
      setHistory((prev) => [
        { id: crypto.randomUUID(), method, path, statusCode: mock.statusCode, time: mock.responseTimeMs, timestamp: new Date() },
        ...prev,
      ].slice(0, 20));
      setLoading(false);
    }, 300);
  }, [method, path]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sandbox</h1>

      <div className="flex gap-6">
        {/* Left panel — Request */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            {/* API + Version */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sandbox-api" className="mb-1 block text-xs font-medium text-gray-600">API</label>
                <select id="sandbox-api" value={apiId} onChange={(e) => handleApiChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  {MOCK_APIS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sandbox-version" className="mb-1 block text-xs font-medium text-gray-600">Versión</label>
                <select id="sandbox-version" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  {selectedApi?.versions.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Method + Path */}
            <div className="flex gap-2">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500" aria-label="Método HTTP">
                {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/endpoint"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Headers */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Headers</span>
                <button type="button" onClick={() => setHeaders([...headers, { key: '', value: '' }])} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <Plus className="h-3 w-3" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <HeaderRow
                    key={i}
                    header={h}
                    onChange={(updated) => { const next = [...headers]; next[i] = updated; setHeaders(next); }}
                    onRemove={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </div>

            {/* Body */}
            {BODY_METHODS.has(method) && (
              <div>
                <label htmlFor="sandbox-body" className="mb-1 block text-xs font-medium text-gray-600">Body (JSON)</label>
                <textarea
                  id="sandbox-body"
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={execute}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Ejecutando…' : 'Ejecutar'}
            </button>
          </div>
        </div>

        {/* Right panel — Response + History */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 min-h-[300px]">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Respuesta</h3>
            <ResponsePanel response={response} />
          </div>

          {/* History */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700"
            >
              Historial ({history.length})
              {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {historyOpen && history.length > 0 && (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-bold ${METHOD_COLORS[entry.method] ?? ''}`}>{entry.method}</span>
                    <span className="flex-1 truncate font-medium text-gray-700">{entry.path}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${statusColor(entry.statusCode)}`}>{entry.statusCode}</span>
                    <span className="text-gray-400">{entry.time}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
