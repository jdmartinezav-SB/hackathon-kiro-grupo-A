/**
 * In-memory data store for hackathon MVP.
 * Replaces PostgreSQL queries with simple arrays for rapid prototyping.
 */

// ---------------------------------------------------------------------------
// Record interfaces (mirror DB schema)
// ---------------------------------------------------------------------------

export interface ApiDefinitionRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'deprecated' | 'retired' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface ApiVersionRecord {
  id: string;
  api_definition_id: string;
  version_tag: string;
  openapi_spec: string;
  format: 'yaml' | 'json';
  status: 'active' | 'deprecated' | 'retired';
  semantic_metadata: Record<string, unknown>;
  published_at: string;
}

export interface SunsetPlanRecord {
  id: string;
  api_version_id: string;
  replacement_version_id: string | null;
  sunset_date: string;
  migration_guide_url: string | null;
  created_at: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  quota_limit: number;
  quota_period: 'daily' | 'monthly';
  profiles: string[];
  created_at: string;
}

export interface SubscriptionApiRecord {
  id: string;
  plan_id: string;
  api_version_id: string;
}

export interface ConsumerRecord {
  id: string;
  email: string;
  company_name: string;
  business_profile: string;
  plan_id: string | null;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const apiDefinitions: ApiDefinitionRecord[] = [
  {
    id: 'api-001',
    name: 'Cotización Autos',
    description: 'API para cotizar seguros de vehículos. Permite obtener tarifas en tiempo real según modelo, año y cobertura.',
    category: 'autos',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-01T12:00:00Z',
  },
  {
    id: 'api-002',
    name: 'Póliza Salud',
    description: 'Gestión de pólizas de salud. Consulta, emisión y renovación de pólizas para planes individuales y familiares.',
    category: 'salud',
    status: 'active',
    created_at: '2024-02-10T08:00:00Z',
    updated_at: '2024-05-20T14:00:00Z',
  },
  {
    id: 'api-003',
    name: 'Consulta Siniestros',
    description: 'Consulta el estado de siniestros reportados. Incluye seguimiento, documentos adjuntos y timeline de eventos.',
    category: 'general',
    status: 'deprecated',
    created_at: '2023-06-01T09:00:00Z',
    updated_at: '2024-04-15T16:00:00Z',
  },
  {
    id: 'api-004',
    name: 'Emisión Vida',
    description: 'API para emisión de seguros de vida. Cálculo de primas y generación de pólizas.',
    category: 'vida',
    status: 'active',
    created_at: '2024-03-01T11:00:00Z',
    updated_at: '2024-06-10T09:00:00Z',
  },
  {
    id: 'api-005',
    name: 'Hogar Protegido',
    description: 'Cotización y emisión de seguros para el hogar. Cobertura contra incendio, robo y desastres naturales.',
    category: 'hogar',
    status: 'maintenance',
    created_at: '2024-01-20T07:00:00Z',
    updated_at: '2024-06-05T10:00:00Z',
  },
];

export const apiVersions: ApiVersionRecord[] = [
  {
    id: 'ver-001',
    api_definition_id: 'api-001',
    version_tag: 'v2.1.0',
    openapi_spec: JSON.stringify({
      openapi: '3.0.3',
      info: {
        title: 'Cotización Autos API',
        description: 'API para cotizar seguros de vehículos en tiempo real.',
        version: '2.1.0',
        contact: { name: 'Equipo Autos', email: 'autos@example.com' },
      },
      servers: [
        { url: 'https://api.conecta2.bolivar.com/v2', description: 'Producción' },
      ],
      paths: {
        '/cotizaciones': {
          get: {
            summary: 'Listar cotizaciones',
            operationId: 'listarCotizaciones',
            tags: ['cotizaciones'],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer' } },
            ],
            responses: { '200': { description: 'Lista de cotizaciones' } },
          },
          post: {
            summary: 'Crear cotización',
            operationId: 'crearCotizacion',
            tags: ['cotizaciones'],
            requestBody: {
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/CotizacionRequest' } } },
            },
            responses: { '201': { description: 'Cotización creada' } },
          },
        },
        '/cotizaciones/{id}': {
          get: {
            summary: 'Obtener cotización por ID',
            operationId: 'obtenerCotizacion',
            tags: ['cotizaciones'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: { '200': { description: 'Detalle de cotización' } },
          },
        },
        '/vehiculos/marcas': {
          get: {
            summary: 'Listar marcas de vehículos',
            operationId: 'listarMarcas',
            tags: ['vehiculos'],
            responses: { '200': { description: 'Lista de marcas' } },
          },
        },
      },
      components: {
        schemas: {
          CotizacionRequest: {
            type: 'object',
            properties: {
              marca: { type: 'string' },
              modelo: { type: 'string' },
              anio: { type: 'integer' },
              cobertura: { type: 'string', enum: ['basica', 'completa', 'premium'] },
            },
            required: ['marca', 'modelo', 'anio', 'cobertura'],
          },
        },
      },
    }),
    format: 'json',
    status: 'active',
    semantic_metadata: {},
    published_at: '2024-06-01T12:00:00Z',
  },
  {
    id: 'ver-002',
    api_definition_id: 'api-002',
    version_tag: 'v1.3.0',
    openapi_spec: JSON.stringify({
      openapi: '3.0.3',
      info: {
        title: 'Póliza Salud API',
        description: 'Gestión de pólizas de salud. Consulta, emisión y renovación de pólizas para planes individuales y familiares.',
        version: '1.3.0',
        contact: { name: 'Equipo Salud', email: 'salud@example.com' },
      },
      servers: [
        { url: 'https://api.conecta2.bolivar.com/v1', description: 'Producción' },
      ],
      paths: {
        '/polizas': {
          get: {
            summary: 'Listar pólizas de salud',
            operationId: 'listarPolizas',
            tags: ['polizas'],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Número de página' },
              { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Cantidad de resultados por página' },
              { name: 'estado', in: 'query', schema: { type: 'string', enum: ['vigente', 'vencida', 'cancelada'] }, description: 'Filtrar por estado de la póliza' },
            ],
            responses: {
              '200': {
                description: 'Lista de pólizas de salud',
                content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/PolizaSaludResponse' } } } },
              },
            },
          },
          post: {
            summary: 'Crear póliza de salud',
            operationId: 'crearPoliza',
            tags: ['polizas'],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/PolizaSaludRequest' } } },
            },
            responses: {
              '201': {
                description: 'Póliza creada exitosamente',
                content: { 'application/json': { schema: { '$ref': '#/components/schemas/PolizaSaludResponse' } } },
              },
              '400': { description: 'Datos de la póliza inválidos' },
            },
          },
        },
        '/polizas/{id}': {
          get: {
            summary: 'Obtener detalle de póliza por ID',
            operationId: 'obtenerPoliza',
            tags: ['polizas'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador único de la póliza' },
            ],
            responses: {
              '200': {
                description: 'Detalle de la póliza de salud',
                content: { 'application/json': { schema: { '$ref': '#/components/schemas/PolizaSaludResponse' } } },
              },
              '404': { description: 'Póliza no encontrada' },
            },
          },
        },
        '/polizas/{id}/renovar': {
          put: {
            summary: 'Renovar póliza de salud',
            operationId: 'renovarPoliza',
            tags: ['polizas'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador único de la póliza a renovar' },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      periodo_meses: { type: 'integer', description: 'Duración de la renovación en meses', example: 12 },
                      plan: { type: 'string', enum: ['individual', 'familiar', 'empresarial'], description: 'Tipo de plan a renovar' },
                    },
                    required: ['periodo_meses'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Póliza renovada exitosamente',
                content: { 'application/json': { schema: { '$ref': '#/components/schemas/PolizaSaludResponse' } } },
              },
              '404': { description: 'Póliza no encontrada' },
              '422': { description: 'La póliza no es elegible para renovación' },
            },
          },
        },
      },
      components: {
        schemas: {
          PolizaSaludRequest: {
            type: 'object',
            properties: {
              titular: { type: 'string', description: 'Nombre completo del titular', example: 'Juan Pérez' },
              documento_identidad: { type: 'string', description: 'Número de documento del titular', example: '1020304050' },
              tipo_documento: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PP'], description: 'Tipo de documento de identidad' },
              fecha_nacimiento: { type: 'string', format: 'date', description: 'Fecha de nacimiento del titular' },
              plan: { type: 'string', enum: ['individual', 'familiar', 'empresarial'], description: 'Tipo de plan de salud' },
              beneficiarios: { type: 'integer', description: 'Número de beneficiarios adicionales', example: 3 },
              cobertura: { type: 'string', enum: ['basica', 'estandar', 'premium'], description: 'Nivel de cobertura' },
            },
            required: ['titular', 'documento_identidad', 'tipo_documento', 'fecha_nacimiento', 'plan', 'cobertura'],
          },
          PolizaSaludResponse: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Identificador único de la póliza' },
              numero_poliza: { type: 'string', description: 'Número de póliza asignado', example: 'SAL-2024-00123' },
              titular: { type: 'string', description: 'Nombre del titular' },
              documento_identidad: { type: 'string', description: 'Documento del titular' },
              plan: { type: 'string', description: 'Tipo de plan contratado' },
              cobertura: { type: 'string', description: 'Nivel de cobertura' },
              estado: { type: 'string', enum: ['vigente', 'vencida', 'cancelada', 'en_renovacion'], description: 'Estado actual de la póliza' },
              prima_mensual: { type: 'number', format: 'double', description: 'Valor de la prima mensual en COP', example: 185000 },
              fecha_inicio: { type: 'string', format: 'date', description: 'Fecha de inicio de vigencia' },
              fecha_fin: { type: 'string', format: 'date', description: 'Fecha de fin de vigencia' },
              beneficiarios: { type: 'integer', description: 'Número de beneficiarios' },
              created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación del registro' },
            },
          },
        },
      },
    }),
    format: 'json',
    status: 'active',
    semantic_metadata: {},
    published_at: '2024-05-20T14:00:00Z',
  },
  {
    id: 'ver-003',
    api_definition_id: 'api-003',
    version_tag: 'v1.0.0',
    openapi_spec: JSON.stringify({
      openapi: '3.0.3',
      info: {
        title: 'Consulta Siniestros API',
        description: 'Consulta el estado de siniestros reportados. Incluye seguimiento, documentos adjuntos y timeline de eventos.',
        version: '1.0.0',
        contact: { name: 'Equipo Siniestros', email: 'siniestros@example.com' },
      },
      servers: [
        { url: 'https://api.conecta2.bolivar.com/v1', description: 'Producción' },
      ],
      paths: {
        '/siniestros': {
          get: {
            summary: 'Listar siniestros reportados',
            operationId: 'listarSiniestros',
            tags: ['siniestros'],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Número de página' },
              { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Cantidad de resultados por página' },
              { name: 'estado', in: 'query', schema: { type: 'string', enum: ['abierto', 'en_revision', 'aprobado', 'rechazado', 'cerrado'] }, description: 'Filtrar por estado del siniestro' },
              { name: 'fecha_desde', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filtrar desde esta fecha' },
              { name: 'fecha_hasta', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filtrar hasta esta fecha' },
            ],
            responses: {
              '200': {
                description: 'Lista de siniestros',
                content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/Siniestro' } } } },
              },
            },
          },
        },
        '/siniestros/{id}': {
          get: {
            summary: 'Obtener detalle de siniestro por ID',
            operationId: 'obtenerSiniestro',
            tags: ['siniestros'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador único del siniestro' },
            ],
            responses: {
              '200': {
                description: 'Detalle del siniestro',
                content: { 'application/json': { schema: { '$ref': '#/components/schemas/Siniestro' } } },
              },
              '404': { description: 'Siniestro no encontrado' },
            },
          },
        },
        '/siniestros/{id}/documentos': {
          get: {
            summary: 'Listar documentos adjuntos del siniestro',
            operationId: 'listarDocumentosSiniestro',
            tags: ['siniestros'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador único del siniestro' },
            ],
            responses: {
              '200': {
                description: 'Lista de documentos del siniestro',
                content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/Documento' } } } },
              },
              '404': { description: 'Siniestro no encontrado' },
            },
          },
        },
        '/siniestros/{id}/timeline': {
          get: {
            summary: 'Obtener timeline de eventos del siniestro',
            operationId: 'obtenerTimelineSiniestro',
            tags: ['siniestros'],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador único del siniestro' },
            ],
            responses: {
              '200': {
                description: 'Timeline de eventos del siniestro',
                content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/TimelineEvent' } } } },
              },
              '404': { description: 'Siniestro no encontrado' },
            },
          },
        },
      },
      components: {
        schemas: {
          Siniestro: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Identificador único del siniestro' },
              numero_radicado: { type: 'string', description: 'Número de radicado del siniestro', example: 'SIN-2024-00456' },
              poliza_id: { type: 'string', description: 'ID de la póliza asociada' },
              tipo: { type: 'string', enum: ['accidente_vehicular', 'robo', 'incendio', 'desastre_natural', 'salud', 'otro'], description: 'Tipo de siniestro' },
              descripcion: { type: 'string', description: 'Descripción detallada del siniestro' },
              fecha_ocurrencia: { type: 'string', format: 'date-time', description: 'Fecha y hora del siniestro' },
              fecha_reporte: { type: 'string', format: 'date-time', description: 'Fecha y hora del reporte' },
              estado: { type: 'string', enum: ['abierto', 'en_revision', 'aprobado', 'rechazado', 'cerrado'], description: 'Estado actual del siniestro' },
              monto_reclamado: { type: 'number', format: 'double', description: 'Monto reclamado en COP', example: 5000000 },
              monto_aprobado: { type: 'number', format: 'double', description: 'Monto aprobado en COP (si aplica)', example: 4500000 },
              ajustador: { type: 'string', description: 'Nombre del ajustador asignado' },
              created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación del registro' },
            },
          },
          Documento: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Identificador único del documento' },
              siniestro_id: { type: 'string', description: 'ID del siniestro asociado' },
              nombre: { type: 'string', description: 'Nombre del archivo', example: 'foto_dano_frontal.jpg' },
              tipo: { type: 'string', enum: ['foto', 'factura', 'informe_policia', 'dictamen_medico', 'otro'], description: 'Tipo de documento' },
              url: { type: 'string', format: 'uri', description: 'URL de descarga del documento' },
              tamano_bytes: { type: 'integer', description: 'Tamaño del archivo en bytes', example: 2048576 },
              subido_por: { type: 'string', description: 'Usuario que subió el documento' },
              created_at: { type: 'string', format: 'date-time', description: 'Fecha de carga del documento' },
            },
          },
          TimelineEvent: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Identificador único del evento' },
              siniestro_id: { type: 'string', description: 'ID del siniestro asociado' },
              tipo_evento: { type: 'string', enum: ['creacion', 'asignacion_ajustador', 'solicitud_documentos', 'revision', 'aprobacion', 'rechazo', 'pago', 'cierre'], description: 'Tipo de evento en el timeline' },
              descripcion: { type: 'string', description: 'Descripción del evento' },
              usuario: { type: 'string', description: 'Usuario que generó el evento' },
              fecha: { type: 'string', format: 'date-time', description: 'Fecha y hora del evento' },
              metadata: { type: 'object', description: 'Datos adicionales del evento', additionalProperties: true },
            },
          },
        },
      },
    }),
    format: 'json',
    status: 'deprecated',
    semantic_metadata: {},
    published_at: '2023-06-01T09:00:00Z',
  },
  {
    id: 'ver-004',
    api_definition_id: 'api-004',
    version_tag: 'v1.0.0',
    openapi_spec: '{}',
    format: 'yaml',
    status: 'active',
    semantic_metadata: {},
    published_at: '2024-06-10T09:00:00Z',
  },
  {
    id: 'ver-005',
    api_definition_id: 'api-005',
    version_tag: 'v0.9.0',
    openapi_spec: '{}',
    format: 'json',
    status: 'active',
    semantic_metadata: {},
    published_at: '2024-06-05T10:00:00Z',
  },
];

export const sunsetPlans: SunsetPlanRecord[] = [
  {
    id: 'sun-001',
    api_version_id: 'ver-003',
    replacement_version_id: null,
    sunset_date: '2025-01-01',
    migration_guide_url: 'https://docs.conecta2.bolivar.com/migration/siniestros-v2',
    created_at: '2024-04-15T16:00:00Z',
  },
];

export const subscriptionPlans: SubscriptionPlanRecord[] = [
  {
    id: 'plan-001',
    name: 'Plan Salud Básico',
    quota_limit: 1000,
    quota_period: 'monthly',
    profiles: ['salud'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-002',
    name: 'Plan Autos Premium',
    quota_limit: 5000,
    quota_period: 'monthly',
    profiles: ['autos'],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-003',
    name: 'Plan General',
    quota_limit: 10000,
    quota_period: 'monthly',
    profiles: ['general', 'salud', 'autos', 'vida', 'hogar'],
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const subscriptionApis: SubscriptionApiRecord[] = [
  { id: 'sa-001', plan_id: 'plan-001', api_version_id: 'ver-002' },
  { id: 'sa-002', plan_id: 'plan-002', api_version_id: 'ver-001' },
  { id: 'sa-003', plan_id: 'plan-003', api_version_id: 'ver-001' },
  { id: 'sa-004', plan_id: 'plan-003', api_version_id: 'ver-002' },
  { id: 'sa-005', plan_id: 'plan-003', api_version_id: 'ver-003' },
  { id: 'sa-006', plan_id: 'plan-003', api_version_id: 'ver-004' },
  { id: 'sa-007', plan_id: 'plan-003', api_version_id: 'ver-005' },
];

export const consumers: ConsumerRecord[] = [
  { id: 'consumer-001', email: 'aliado-salud@example.com', company_name: 'Clínica ABC', business_profile: 'salud', plan_id: 'plan-001' },
  { id: 'consumer-002', email: 'aliado-autos@example.com', company_name: 'Concesionario XYZ', business_profile: 'autos', plan_id: 'plan-002' },
  { id: 'consumer-003', email: 'aliado-general@example.com', company_name: 'Broker General', business_profile: 'general', plan_id: 'plan-003' },
];
