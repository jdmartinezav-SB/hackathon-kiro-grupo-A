import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Code, GitBranch } from 'lucide-react';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'deprecated' | 'maintenance';
  category: string;
  sunsetDate?: string;
}

const MOCK_APIS: ApiItem[] = [
  { id: '1', name: 'Cotización Autos', description: 'API para cotizar seguros de vehículos', version: 'v2.1', status: 'active', category: 'Autos' },
  { id: '2', name: 'Póliza Salud', description: 'Gestión de pólizas de salud', version: 'v1.3', status: 'active', category: 'Salud' },
  { id: '3', name: 'Consulta Siniestros', description: 'Consulta y seguimiento de siniestros', version: 'v1.0', status: 'deprecated', category: 'General', sunsetDate: '2026-07-15' },
  { id: '4', name: 'Emisión Vida', description: 'Emisión de pólizas de vida', version: 'v3.0', status: 'active', category: 'Vida' },
  { id: '5', name: 'Recaudo Primas', description: 'Gestión de recaudo de primas', version: 'v1.2', status: 'maintenance', category: 'General' },
];

const MOCK_ENDPOINTS = [
  { method: 'GET', path: '/cotizacion', description: 'Listar cotizaciones' },
  { method: 'POST', path: '/cotizacion', description: 'Crear nueva cotización' },
  { method: 'GET', path: '/cotizacion/:id', description: 'Obtener cotización por ID' },
];

const MOCK_VERSIONS = [
  { tag: 'v1.0', status: 'retired', publishedAt: '2024-03-10' },
  { tag: 'v2.0', status: 'deprecated', publishedAt: '2025-01-15' },
  { tag: 'v2.1', status: 'active', publishedAt: '2025-11-20' },
];

type SnippetLang = 'javascript' | 'python' | 'java' | 'curl';

const MOCK_SNIPPETS: Record<SnippetLang, string> = {
  javascript: `const response = await fetch('https://api.conecta2.com/v2/cotizacion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ tipo: 'autos', placa: 'ABC123' })
});
const data = await response.json();`,
  python: `import requests

response = requests.post(
    'https://api.conecta2.com/v2/cotizacion',
    headers={'Authorization': 'Bearer <token>'},
    json={'tipo': 'autos', 'placa': 'ABC123'}
)
data = response.json()`,
  java: `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.conecta2.com/v2/cotizacion"))
    .header("Authorization", "Bearer <token>")
    .header("Content-Type", "application/json")
    .POST(BodyPublishers.ofString("{\\"tipo\\":\\"autos\\",\\"placa\\":\\"ABC123\\"}"))
    .build();
HttpResponse<String> response = client.send(request, BodyHandlers.ofString());`,
  curl: `curl -X POST https://api.conecta2.com/v2/cotizacion \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"tipo":"autos","placa":"ABC123"}'`,
};

function fetchApiDetail(id: string): Promise<ApiItem | undefined> {
  return Promise.resolve(MOCK_APIS.find((a) => a.id === id));
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700',
};

const VERSION_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-green-100 text-green-700' },
  deprecated: { label: 'Deprecada', className: 'bg-yellow-100 text-yellow-700' },
  retired: { label: 'Retirada', className: 'bg-red-100 text-red-700' },
};

const TABS = [
  { key: 'docs', label: 'Documentación', icon: FileText },
  { key: 'snippets', label: 'Snippets', icon: Code },
  { key: 'versions', label: 'Versiones', icon: GitBranch },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const LANG_OPTIONS: { key: SnippetLang; label: string }[] = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
  { key: 'java', label: 'Java' },
  { key: 'curl', label: 'cURL' },
];

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('docs');
  const [snippetLang, setSnippetLang] = useState<SnippetLang>('javascript');

  const { data: api } = useQuery({
    queryKey: ['catalog-api', id],
    queryFn: () => fetchApiDetail(id ?? ''),
    enabled: Boolean(id),
  });

  if (!api) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-gray-400">API no encontrada</p>
        <button type="button" onClick={() => navigate('/catalog')} className="text-sm text-indigo-600 hover:underline">
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/catalog')} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{api.name}</h1>
          <p className="text-sm text-gray-500">{api.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Endpoints</h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {MOCK_ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-3 px-4 py-3">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[ep.method] ?? ''}`}>
                  {ep.method}
                </span>
                <code className="text-sm font-medium text-gray-800">{ep.path}</code>
                <span className="text-sm text-gray-500">{ep.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'snippets' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {LANG_OPTIONS.map((lang) => (
              <button
                key={lang.key}
                type="button"
                onClick={() => setSnippetLang(lang.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  snippetLang === lang.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-900 p-4 text-sm text-green-300">
            <code>{MOCK_SNIPPETS[snippetLang]}</code>
          </pre>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {MOCK_VERSIONS.map((v) => {
            const vs = VERSION_STATUS[v.status] ?? { label: v.status, className: 'bg-gray-100 text-gray-700' };
            return (
              <div key={v.tag} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{v.tag}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${vs.className}`}>
                    {vs.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(v.publishedAt).toLocaleDateString('es-CO')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
