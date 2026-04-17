import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SbInput, SbSelect, SbTable } from '../components/ui';

/* ── Types ── */
interface MetricCard {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
}

interface RequestRow {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  latency: number;
  date: string;
}

/* ── Mock data ── */
const MOCK_METRICS: MetricCard[] = [
  { label: 'Total Peticiones', value: '12,847', icon: Activity, iconColor: 'text-indigo-600 bg-indigo-50' },
  { label: 'Tasa de Éxito', value: '98.2%', icon: CheckCircle, iconColor: 'text-green-600 bg-green-50' },
  { label: 'Tasa de Error', value: '1.8%', icon: XCircle, iconColor: 'text-red-600 bg-red-50' },
  { label: 'Latencia Promedio', value: '145ms', icon: Clock, iconColor: 'text-amber-600 bg-amber-50' },
];

const MOCK_REQUESTS: RequestRow[] = [
  { id: '1', endpoint: '/v2/cotizacion', method: 'POST', status: 200, latency: 132, date: '2026-04-17 10:23' },
  { id: '2', endpoint: '/v1/poliza/salud', method: 'GET', status: 200, latency: 98, date: '2026-04-17 10:21' },
  { id: '3', endpoint: '/v2/cotizacion/COT-001', method: 'GET', status: 404, latency: 45, date: '2026-04-17 10:18' },
  { id: '4', endpoint: '/v1/siniestros', method: 'GET', status: 200, latency: 210, date: '2026-04-17 10:15' },
  { id: '5', endpoint: '/v3/emision/vida', method: 'POST', status: 500, latency: 1520, date: '2026-04-17 10:12' },
  { id: '6', endpoint: '/v2/cotizacion', method: 'POST', status: 200, latency: 115, date: '2026-04-17 10:08' },
  { id: '7', endpoint: '/v1/recaudo/primas', method: 'GET', status: 200, latency: 87, date: '2026-04-17 10:05' },
];

const MOCK_APIS = [
  { id: '', label: 'Todas las APIs' },
  { id: '1', label: 'Cotización Autos' },
  { id: '2', label: 'Póliza Salud' },
  { id: '3', label: 'Consulta Siniestros' },
];

const QUOTA = { used: 7300, limit: 10000 };

function fetchAnalytics() {
  return Promise.resolve({ metrics: MOCK_METRICS, requests: MOCK_REQUESTS, quota: QUOTA });
}

/* ── Helpers ── */
const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

function statusBadge(code: number): string {
  if (code < 300) return 'bg-green-100 text-green-700';
  if (code < 400) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function quotaColor(pct: number): string {
  if (pct < 60) return 'bg-green-500';
  if (pct <= 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

/* ── Component ── */
export default function Analytics() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [apiFilter, setApiFilter] = useState('');

  const { data } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  const metrics = data?.metrics ?? MOCK_METRICS;
  const requests = data?.requests ?? MOCK_REQUESTS;
  const quota = data?.quota ?? QUOTA;

  const pct = Math.round((quota.used / quota.limit) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.iconColor}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-xl font-bold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quota bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Consumo de Cuota</span>
          <span className="text-gray-500">{pct}% ({quota.used.toLocaleString()} / {quota.limit.toLocaleString()})</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full transition-all ${quotaColor(pct)}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div>
          <label htmlFor="date-from" className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
          <SbInput
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(val) => setDateFrom(val)}
          />
        </div>
        <div>
          <label htmlFor="date-to" className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
          <SbInput
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(val) => setDateTo(val)}
          />
        </div>
        <div>
          <label htmlFor="api-filter" className="mb-1 block text-xs font-medium text-gray-600">API</label>
          <SbSelect
            name="api-filter"
            value={apiFilter}
            onChange={(val) => setApiFilter(val)}
          >
            {MOCK_APIS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </SbSelect>
        </div>
      </div>

      {/* Requests table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <SbTable>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Latencia</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.endpoint}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_COLORS[r.method] ?? ''}`}>{r.method}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.latency}ms</td>
                  <td className="px-4 py-3 text-gray-400">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SbTable>
      </div>
    </div>
  );
}
