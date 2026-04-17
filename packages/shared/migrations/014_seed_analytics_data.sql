-- Migration 014: Seed data for Analytics, Audit & Notifications (Dev/Demo)
-- Owner: Dev 4 — Analytics + Audit + Notificaciones
-- Purpose: Populate demo data for development and hackathon demos
-- Tables: audit_log, usage_metric, notification, notification_preference

-- ============================================================
-- Demo UUIDs (agreed across all devs for hackathon)
-- ============================================================
-- Consumer 1: '11111111-1111-1111-1111-111111111111'
-- Consumer 2: '22222222-2222-2222-2222-222222222222'
-- App 1:      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- App 2:      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
-- API Ver 1:  'cccccccc-cccc-cccc-cccc-cccccccccccc'
-- API Ver 2:  'dddddddd-dddd-dddd-dddd-dddddddddddd'

-- ============================================================
-- 1. AUDIT_LOG — 30 registros variados (últimos 7 días)
-- ============================================================
INSERT INTO audit_log (id, correlation_id, consumer_id, application_id, api_version_id, endpoint, method, status_code, ip_address, response_time_ms, created_at) VALUES
-- Day 1 (6 days ago)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 201, '192.168.1.10', 120, NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 200, '192.168.1.10', 85, NOW() - INTERVAL '6 days' + INTERVAL '3 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '10.0.0.50', 95, NOW() - INTERVAL '6 days' + INTERVAL '4 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'POST', 400, '192.168.1.10', 55, NOW() - INTERVAL '6 days' + INTERVAL '5 hours'),
-- Day 2 (5 days ago)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 201, '192.168.1.10', 130, NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 200, '10.0.0.51', 78, NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 401, '192.168.1.11', 60, NOW() - INTERVAL '5 days' + INTERVAL '3 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/siniestro', 'POST', 201, '10.0.0.50', 200, NOW() - INTERVAL '5 days' + INTERVAL '5 hours'),

-- Day 3 (4 days ago)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 500, '192.168.1.10', 450, NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 200, '192.168.1.10', 90, NOW() - INTERVAL '4 days' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'PUT', 404, '10.0.0.52', 70, NOW() - INTERVAL '4 days' + INTERVAL '3 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'GET', 200, '10.0.0.50', 110, NOW() - INTERVAL '4 days' + INTERVAL '4 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '192.168.1.12', 88, NOW() - INTERVAL '4 days' + INTERVAL '6 hours'),

-- Day 4 (3 days ago)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 201, '192.168.1.10', 115, NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '10.0.0.50', 92, NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'POST', 201, '192.168.1.10', 180, NOW() - INTERVAL '3 days' + INTERVAL '3 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 200, '10.0.0.53', 75, NOW() - INTERVAL '3 days' + INTERVAL '5 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'PUT', 400, '192.168.1.10', 65, NOW() - INTERVAL '3 days' + INTERVAL '7 hours'),

-- Day 5 (2 days ago)
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/siniestro', 'GET', 200, '10.0.0.50', 100, NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 201, '192.168.1.13', 140, NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 500, '10.0.0.50', 480, NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '192.168.1.10', 82, NOW() - INTERVAL '2 days' + INTERVAL '6 hours'),

-- Day 6 (1 day ago)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'POST', 201, '192.168.1.10', 125, NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '10.0.0.54', 88, NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'POST', 400, '192.168.1.10', 58, NOW() - INTERVAL '1 day' + INTERVAL '3 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'GET', 200, '10.0.0.50', 105, NOW() - INTERVAL '1 day' + INTERVAL '5 hours'),

-- Day 7 (today)
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'POST', 201, '192.168.1.10', 160, NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/v1/apis/poliza', 'GET', 200, '10.0.0.50', 93, NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/cotizacion', 'GET', 200, '192.168.1.14', 72, NOW() - INTERVAL '30 minutes'),
(gen_random_uuid(), gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '/v1/apis/siniestro', 'POST', 201, '10.0.0.55', 175, NOW() - INTERVAL '15 minutes');

-- ============================================================
-- 2. USAGE_METRIC — 7 días × 2 apps = 14 filas
-- ============================================================
INSERT INTO usage_metric (id, application_id, api_version_id, metric_date, total_requests, success_count, error_count, avg_latency_ms, quota_used, updated_at) VALUES
-- App 1 (aaaaaaaa) — 7 days
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '6 days')::date, 150, 135, 15, 112.5, 150, NOW() - INTERVAL '6 days'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '5 days')::date, 120, 108, 12, 98.3,  120, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '4 days')::date, 180, 153, 27, 145.2, 180, NOW() - INTERVAL '4 days'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '3 days')::date, 95,  85,  10, 88.7,  95,  NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '2 days')::date, 200, 180, 20, 135.0, 200, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (NOW() - INTERVAL '1 day')::date,  160, 144, 16, 105.8, 160, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW()::date,                       75,  68,  7,  80.2,  75,  NOW()),

-- App 2 (bbbbbbbb) — 7 days
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '6 days')::date, 85,  76,  9,  95.4,  85,  NOW() - INTERVAL '6 days'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '5 days')::date, 110, 99,  11, 120.1, 110, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '4 days')::date, 130, 117, 13, 108.6, 130, NOW() - INTERVAL '4 days'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '3 days')::date, 70,  63,  7,  82.3,  70,  NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '2 days')::date, 155, 140, 15, 142.7, 155, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (NOW() - INTERVAL '1 day')::date,  190, 171, 19, 198.5, 190, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW()::date,                       50,  45,  5,  76.9,  50,  NOW());

-- ============================================================
-- 3. NOTIFICATION — 5 notificaciones demo (mix de tipos)
-- ============================================================
INSERT INTO notification (id, consumer_id, type, title, message, channel, priority, read, metadata, created_at, read_at) VALUES
-- 1. new_version — leída
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'new_version', 'Nueva versión API Cotización v2.1', 'Se ha publicado la versión 2.1 de la API de Cotización con mejoras en el cálculo de primas y nuevos campos opcionales. Revise la documentación de migración.', 'portal', 'medium', TRUE, '{"api_name": "Cotización", "old_version": "2.0", "new_version": "2.1"}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),

-- 2. maintenance — no leída
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'maintenance', 'Mantenimiento programado — API Póliza', 'Se realizará mantenimiento en la API de Póliza el próximo sábado de 02:00 a 06:00 AM COT. Durante este período el servicio no estará disponible.', 'portal', 'high', FALSE, '{"api_name": "Póliza", "maintenance_start": "2025-07-12T07:00:00Z", "maintenance_end": "2025-07-12T11:00:00Z"}', NOW() - INTERVAL '3 days', NULL),

-- 3. sunset — no leída, urgente
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'sunset', 'Deprecación API Siniestro v1.0', 'La versión 1.0 de la API de Siniestro será retirada el 2025-10-01. Migre a la versión 2.0 antes de esa fecha. Consulte la guía de migración en la documentación.', 'portal', 'urgent', FALSE, '{"api_name": "Siniestro", "sunset_date": "2025-10-01", "replacement_version": "2.0"}', NOW() - INTERVAL '2 days', NULL),

-- 4. quota_warning — leída
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'quota_warning', 'Alerta de cuota — App Aliado Digital', 'Su aplicación "Aliado Digital" ha consumido el 82% de la cuota mensual asignada. Considere optimizar sus llamadas o solicitar un aumento de cuota.', 'portal', 'high', TRUE, '{"app_name": "Aliado Digital", "quota_used_percent": 82, "quota_limit": 10000}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),

-- 5. general — no leída
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'general', 'Bienvenido a Conecta 2.0', 'Gracias por registrarse en el Portal de APIs Conecta 2.0 de Seguros Bolívar. Explore el catálogo de APIs, pruebe en el Sandbox y consulte la documentación para comenzar su integración.', 'portal', 'low', FALSE, '{}', NOW() - INTERVAL '6 days', NULL);

-- ============================================================
-- 4. NOTIFICATION_PREFERENCE — 2 preferencias para Consumer 1
-- ============================================================
INSERT INTO notification_preference (id, consumer_id, event_type, email_enabled, portal_enabled) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'new_version',    TRUE,  TRUE),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'maintenance',    TRUE,  TRUE);
