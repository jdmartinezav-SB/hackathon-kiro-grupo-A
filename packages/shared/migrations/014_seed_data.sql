-- Migration 014: Seed data for all services (Dev/Demo)
-- Purpose: Core entities needed by all services

-- ============================================================
-- 1. SUBSCRIPTION PLAN
-- ============================================================
INSERT INTO subscription_plan (id, name, description, quota_limit, quota_period) VALUES
('99999999-9999-9999-9999-999999999999', 'Plan Estándar', 'Plan estándar con 10,000 peticiones mensuales', 10000, 'monthly')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. CONSUMERS (password is 'demo123' hashed with bcrypt)
-- ============================================================
INSERT INTO consumer (id, email, password_hash, company_name, contact_name, phone, business_profile, status, role, email_verified, subscription_plan_id) VALUES
('11111111-1111-1111-1111-111111111111', 'demo@aliado.com', '$2b$10$rQEY7GhLqO5eN5h5h5h5h.5h5h5h5h5h5h5h5h5h5h5h5h5h5h5h5', 'Aliado Digital S.A.S', 'Carlos Rodríguez', '+573001234567', 'enterprise', 'active', 'consumer', TRUE, '99999999-9999-9999-9999-999999999999'),
('22222222-2222-2222-2222-222222222222', 'test@broker.com', '$2b$10$rQEY7GhLqO5eN5h5h5h5h.5h5h5h5h5h5h5h5h5h5h5h5h5h5h5h5', 'Broker Test Ltda', 'María López', '+573009876543', 'broker', 'suspended', 'consumer', TRUE, '99999999-9999-9999-9999-999999999999'),
('00000000-0000-0000-0000-000000000001', 'admin@bolivar.com', '$2b$10$rQEY7GhLqO5eN5h5h5h5h.5h5h5h5h5h5h5h5h5h5h5h5h5h5h5h5', 'Seguros Bolívar', 'Admin Portal', NULL, 'enterprise', 'active', 'admin', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. APPLICATIONS
-- ============================================================
INSERT INTO application (id, consumer_id, name, description, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'App Cotizador', 'Aplicación de cotización de seguros', 'active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'App Broker Portal', 'Portal de gestión para brokers', 'active'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111111', 'App Siniestros', 'Consulta de siniestros', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. API DEFINITIONS
-- ============================================================
INSERT INTO api_definition (id, name, description, category, status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Cotización Autos', 'API para cotizar seguros de vehículos con cálculo de primas y coberturas', 'Autos', 'active'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Póliza Salud', 'Gestión integral de pólizas de salud: emisión, consulta y modificación', 'Salud', 'active'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'Consulta Siniestros', 'Consulta y seguimiento de siniestros reportados', 'General', 'deprecated')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. API VERSIONS (with embedded OpenAPI specs)
-- ============================================================
INSERT INTO api_version (id, api_definition_id, version_tag, openapi_spec, format, status, semantic_metadata) VALUES
-- Cotización Autos v2.1
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'v2.1',
'{"openapi":"3.0.3","info":{"title":"Cotización Autos","version":"2.1.0","description":"API para cotizar seguros de vehículos"},"paths":{"/v2/cotizacion":{"post":{"summary":"Crear cotización","operationId":"crearCotizacion","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["tipo","placa","modelo"],"properties":{"tipo":{"type":"string","enum":["autos","motos"],"description":"Tipo de vehículo"},"placa":{"type":"string","pattern":"^[A-Z]{3}\\d{3}$","description":"Placa del vehículo"},"modelo":{"type":"integer","minimum":2000,"description":"Año del modelo"},"valor_comercial":{"type":"number","description":"Valor comercial en COP"}}}}}},"responses":{"201":{"description":"Cotización creada","content":{"application/json":{"schema":{"type":"object","properties":{"cotizacionId":{"type":"string"},"prima":{"type":"number"},"moneda":{"type":"string"},"vigencia":{"type":"string","format":"date"}}}}}},"400":{"description":"Datos inválidos"}}},"get":{"summary":"Consultar cotización","operationId":"consultarCotizacion","parameters":[{"name":"cotizacionId","in":"query","required":true,"schema":{"type":"string"}}],"responses":{"200":{"description":"Cotización encontrada"},"404":{"description":"No encontrada"}}}},"/v2/cotizacion/{id}":{"get":{"summary":"Obtener cotización por ID","operationId":"obtenerCotizacion","parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],"responses":{"200":{"description":"Detalle de cotización"},"404":{"description":"No encontrada"}}}}},"components":{"schemas":{"Cotizacion":{"type":"object","properties":{"cotizacionId":{"type":"string"},"tipo":{"type":"string"},"placa":{"type":"string"},"prima":{"type":"number"},"moneda":{"type":"string"},"vigencia":{"type":"string","format":"date"}}}}}}',
'json', 'active', '{"endpoints_count": 3, "resources": ["cotizacion"]}'),

-- Póliza Salud v1.3
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'v1.3',
'{"openapi":"3.0.3","info":{"title":"Póliza Salud","version":"1.3.0","description":"Gestión de pólizas de salud"},"paths":{"/v1/poliza/salud":{"get":{"summary":"Listar pólizas","operationId":"listarPolizas","parameters":[{"name":"estado","in":"query","schema":{"type":"string","enum":["vigente","vencida","cancelada"]}}],"responses":{"200":{"description":"Lista de pólizas","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/Poliza"}}}}}}},"post":{"summary":"Emitir póliza","operationId":"emitirPoliza","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["titular","plan","vigencia_inicio"],"properties":{"titular":{"type":"string"},"plan":{"type":"string","enum":["basico","plus","premium"]},"vigencia_inicio":{"type":"string","format":"date"},"beneficiarios":{"type":"array","items":{"type":"object","properties":{"nombre":{"type":"string"},"parentesco":{"type":"string"}}}}}}}}},"responses":{"201":{"description":"Póliza emitida"},"400":{"description":"Datos inválidos"}}}},"/v1/poliza/salud/{id}":{"get":{"summary":"Consultar póliza","operationId":"consultarPoliza","parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],"responses":{"200":{"description":"Detalle de póliza"},"404":{"description":"No encontrada"}}},"put":{"summary":"Modificar póliza","operationId":"modificarPoliza","parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","properties":{"plan":{"type":"string"},"beneficiarios":{"type":"array","items":{"type":"object"}}}}}}},"responses":{"200":{"description":"Póliza modificada"},"404":{"description":"No encontrada"}}}}},"components":{"schemas":{"Poliza":{"type":"object","properties":{"polizaId":{"type":"string"},"titular":{"type":"string"},"plan":{"type":"string"},"estado":{"type":"string"},"vigencia_inicio":{"type":"string","format":"date"},"vigencia_fin":{"type":"string","format":"date"}}}}}}',
'json', 'active', '{"endpoints_count": 4, "resources": ["poliza"]}'),

-- Consulta Siniestros v1.0 (deprecated)
('cccccccc-cccc-cccc-cccc-cccccccccccd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'v1.0',
'{"openapi":"3.0.3","info":{"title":"Consulta Siniestros","version":"1.0.0","description":"Consulta y seguimiento de siniestros"},"paths":{"/v1/siniestros":{"get":{"summary":"Listar siniestros","operationId":"listarSiniestros","parameters":[{"name":"estado","in":"query","schema":{"type":"string","enum":["abierto","en_proceso","cerrado"]}}],"responses":{"200":{"description":"Lista de siniestros"}}}},"/v1/siniestros/{id}":{"get":{"summary":"Consultar siniestro","operationId":"consultarSiniestro","parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],"responses":{"200":{"description":"Detalle del siniestro"},"404":{"description":"No encontrado"}}}}},"components":{"schemas":{"Siniestro":{"type":"object","properties":{"siniestroId":{"type":"string"},"tipo":{"type":"string"},"estado":{"type":"string"},"fecha_reporte":{"type":"string","format":"date"},"descripcion":{"type":"string"}}}}}}',
'json', 'deprecated', '{"endpoints_count": 2, "resources": ["siniestros"]}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SUNSET PLAN for deprecated API
-- ============================================================
INSERT INTO sunset_plan (api_version_id, replacement_version_id, sunset_date, migration_guide_url) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccd', NULL, '2026-07-15', 'https://docs.conecta2.bolivar.com/migration/siniestros-v2')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. SUBSCRIPTION_API — Link plan to API versions
-- ============================================================
INSERT INTO subscription_api (subscription_plan_id, api_version_id) VALUES
('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccd')
ON CONFLICT DO NOTHING;
