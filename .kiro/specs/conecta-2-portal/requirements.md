# Documento de Requerimientos — Conecta 2.0 Portal

## Introducción

Conecta 2.0 es el Portal de Desarrolladores de APIs de grado empresarial para Seguros Bolívar. Funciona como un ecosistema de autoservicio que centraliza, expone y gobierna el consumo de activos digitales para terceros, permitiendo que aliados e intermediarios integren soluciones de seguros en tiempo real bajo el paradigma de Open Insurance.

El portal atiende dos perfiles de usuario principales: **Consumidores** (intermediarios, aliados y desarrolladores externos) que integran APIs de seguros en sus aplicaciones, y **Administradores** (gestores internos de Seguros Bolívar) que gobiernan el ecosistema, controlan accesos y aseguran cumplimiento regulatorio.

## Glosario

- **Portal**: La aplicación web Conecta 2.0 que sirve como interfaz principal para consumidores y administradores.
- **Consumidor**: Usuario externo (intermediario, aliado o desarrollador) que se registra en el Portal para integrar APIs de seguros.
- **Administrador**: Usuario interno de Seguros Bolívar con permisos de gestión sobre aliados, APIs y configuraciones del Portal.
- **Aplicación_Consumidor**: Aplicación registrada por un Consumidor en el Portal para obtener credenciales de acceso a las APIs.
- **Catálogo_API**: Módulo del Portal que lista y organiza las APIs disponibles según el perfil de negocio del Consumidor.
- **Sandbox**: Entorno aislado de pruebas con datos simulados donde los Consumidores experimentan con las APIs antes de pasar a producción.
- **Credencial_Prueba**: Par de client_id y client_secret generados automáticamente para acceso al Sandbox.
- **Credencial_Producción**: Par de client_id y client_secret aprobados por un Administrador para acceso al entorno productivo.
- **Cuota**: Límite de consumo de API asignado a una Aplicación_Consumidor, expresado en peticiones por unidad de tiempo.
- **Plan_Suscripción**: Conjunto de APIs, cuotas y condiciones de uso asignadas a un Consumidor según su contrato comercial.
- **Gateway**: Componente de infraestructura que procesa, autentica y enruta las peticiones de API entre Consumidores y los servicios internos de Seguros Bolívar.
- **Circuit_Breaker**: Mecanismo automático que detiene el tráfico hacia un servicio que presenta fallas para evitar caídas en cascada.
- **Throttling**: Control dinámico de tasa de peticiones por IP o identificador de aliado para proteger los servicios.
- **Definición_OpenAPI**: Especificación técnica de una API en formato OpenAPI 3.x que describe endpoints, esquemas y operaciones.
- **SDK**: Kit de desarrollo de software generado automáticamente a partir de una Definición_OpenAPI para un lenguaje de programación específico.
- **Notificación_Ciclo_Vida**: Alerta proactiva enviada a los Consumidores sobre cambios en las APIs (nuevas versiones, mantenimiento, deprecación).
- **Plan_Sunset**: Cronograma coordinado para el retiro de una versión antigua de API, con al menos 90 días de antelación.
- **Registro_Auditoría**: Entrada inmutable que documenta quién consumió qué dato, cuándo y desde qué aplicación.
- **Perfil_Negocio**: Clasificación del Consumidor según su línea de negocio (Salud, Autos, Vida, etc.) que determina qué APIs son visibles en el Catálogo_API.
- **Correlation_ID**: Identificador único propagado en cada petición entre capas y servicios para trazabilidad extremo a extremo.
- **MCP**: Model Context Protocol, estándar para que agentes de IA interpreten y consuman APIs de forma autónoma.

## Requerimientos

### Requerimiento 1: Onboarding de Autoservicio (Golden Path)

**Historia de Usuario:** Como Consumidor nuevo, quiero completar mi registro, crear mi primera Aplicación_Consumidor y obtener una Credencial_Prueba funcional en un flujo guiado de máximo 5 pasos, para poder enviar mi primera petición de prueba a una API en menos de 10 minutos sin requerir intervención de un Administrador.

#### Criterios de Aceptación

1. WHEN un Consumidor completa el formulario de registro con datos válidos (nombre, correo corporativo, empresa, línea de negocio), THE Portal SHALL crear la cuenta del Consumidor y enviar un correo de verificación en un máximo de 30 segundos.
2. WHEN un Consumidor verifica su correo electrónico haciendo clic en el enlace de activación, THE Portal SHALL activar la cuenta y redirigir al Consumidor al asistente de creación de Aplicación_Consumidor en un máximo de 3 segundos.
3. WHEN un Consumidor completa el asistente de creación de Aplicación_Consumidor proporcionando nombre de aplicación y descripción, THE Portal SHALL generar una Credencial_Prueba (client_id y client_secret) y mostrarla al Consumidor en pantalla de forma segura.
4. THE Portal SHALL completar el flujo completo de onboarding (registro, verificación, creación de aplicación y obtención de Credencial_Prueba) en un máximo de 5 pasos de interfaz y en un tiempo total inferior a 10 minutos de interacción del Consumidor.
5. IF un Consumidor proporciona datos de registro inválidos o incompletos, THEN THE Portal SHALL mostrar mensajes de error específicos por cada campo que no cumpla las reglas de validación, indicando el formato esperado, en un máximo de 1 segundo tras el envío del formulario.
6. IF el servicio de correo electrónico no está disponible durante el registro, THEN THE Portal SHALL encolar el correo de verificación y notificar al Consumidor en pantalla que recibirá el correo en un plazo máximo de 5 minutos.
7. WHEN un Consumidor completa el registro indicando su línea de negocio (Salud, Autos, Vida u otra), THE Portal SHALL asignar un Perfil_Negocio inicial correspondiente a la línea seleccionada y configurar la visibilidad del Catálogo_API en consecuencia.

### Requerimiento 2: Catálogo Inteligente y Personalizado

**Historia de Usuario:** Como Consumidor autenticado, quiero visualizar un catálogo filtrado que muestre únicamente las APIs relevantes para mi línea de negocio y Plan_Suscripción, para poder identificar y seleccionar los servicios que necesito integrar en menos de 3 clics desde el inicio de sesión.

#### Criterios de Aceptación

1. WHEN un Consumidor accede al Catálogo_API, THE Portal SHALL mostrar únicamente las APIs asociadas al Perfil_Negocio y Plan_Suscripción del Consumidor, excluyendo el 100% de las APIs no autorizadas para ese perfil.
2. WHEN un Consumidor aplica filtros de búsqueda (por nombre, categoría o estado) en el Catálogo_API, THE Portal SHALL actualizar los resultados en un máximo de 500 milisegundos.
3. THE Catálogo_API SHALL mostrar para cada API los siguientes campos obligatorios: nombre, descripción (mínimo 50 caracteres), versión actual, estado (activa, deprecada, en mantenimiento) y categoría de negocio.
4. WHEN un Consumidor selecciona una API del Catálogo_API, THE Portal SHALL mostrar la Definición_OpenAPI completa con documentación interactiva en un máximo de 2 segundos.
5. IF un Consumidor no tiene APIs asignadas en su Plan_Suscripción, THEN THE Portal SHALL mostrar un mensaje informativo con instrucciones paso a paso para solicitar acceso a APIs adicionales, incluyendo un enlace directo al formulario de solicitud.
6. WHILE una API se encuentra en estado deprecado, THE Catálogo_API SHALL mostrar una etiqueta visual de deprecación en color amarillo y la fecha exacta del Plan_Sunset asociado en formato DD/MM/AAAA.

### Requerimiento 3: Centro de Experimentación (Sandbox)

**Historia de Usuario:** Como Consumidor con Credencial_Prueba activa, quiero enviar peticiones de prueba a las APIs en tiempo real utilizando datos simulados y recibir respuestas detalladas, para poder validar la correcta integración de mi Aplicación_Consumidor antes de solicitar acceso al entorno de producción.

#### Criterios de Aceptación

1. WHEN un Consumidor envía una petición de prueba desde el Sandbox, THE Sandbox SHALL ejecutar la petición contra el entorno de simulación y devolver la respuesta completa en un máximo de 2 segundos.
2. THE Sandbox SHALL proporcionar datos simulados (mocking) que repliquen el 100% de la estructura, tipos de datos y formatos de las respuestas del entorno de producción para cada API disponible.
3. WHEN un Consumidor selecciona una API en el Sandbox, THE Portal SHALL pre-cargar un ejemplo de petición válida con parámetros de muestra editables en un máximo de 1 segundo.
4. THE Sandbox SHALL registrar y permitir consultar el historial de las últimas 50 peticiones de prueba por Aplicación_Consumidor, incluyendo timestamp, endpoint, código de respuesta y tiempo de ejecución.
5. IF una petición de prueba contiene parámetros inválidos según la Definición_OpenAPI, THEN THE Sandbox SHALL devolver un error descriptivo en formato JSON indicando: el nombre de cada parámetro incorrecto, el valor recibido, el formato esperado y un ejemplo válido.
6. WHILE el Consumidor opera en el Sandbox, THE Portal SHALL aislar completamente el tráfico de prueba del entorno de producción, garantizando que ninguna petición del Sandbox alcance servicios productivos.
7. WHEN un Consumidor ejecuta una petición en el Sandbox, THE Sandbox SHALL mostrar en la respuesta: el tiempo de respuesta en milisegundos, el código HTTP, los headers de respuesta y el cuerpo de la respuesta en formato JSON estructurado con indentación.

### Requerimiento 4: Consola de Analítica para el Aliado

**Historia de Usuario:** Como Consumidor con al menos una Aplicación_Consumidor activa, quiero visualizar un tablero de métricas de consumo en tiempo casi real con indicadores de uso, errores y cuota, para poder monitorear el estado de mis integraciones, detectar anomalías y anticipar el agotamiento de mi Cuota antes de que afecte el servicio.

#### Criterios de Aceptación

1. THE Portal SHALL mostrar al Consumidor un tablero con las siguientes métricas por Aplicación_Consumidor: total de peticiones (acumulado diario y mensual), tasa de éxito (porcentaje), tasa de error (porcentaje desglosado por código HTTP) y latencia promedio en milisegundos (percentiles p50, p95 y p99).
2. WHEN un Consumidor accede a la Consola de Analítica, THE Portal SHALL mostrar datos actualizados con un retraso máximo de 5 minutos respecto al tiempo real, indicando la hora de la última actualización.
3. THE Portal SHALL mostrar el porcentaje de consumo de Cuota actual respecto al límite asignado en el Plan_Suscripción mediante una barra de progreso visual con indicadores de color: verde (0-79%), amarillo (80-99%) y rojo (100%).
4. WHEN el consumo de Cuota de una Aplicación_Consumidor alcanza el 80% del límite asignado, THE Portal SHALL enviar una Notificación_Ciclo_Vida de advertencia al Consumidor propietario en un máximo de 5 minutos tras alcanzar el umbral.
5. WHEN el consumo de Cuota de una Aplicación_Consumidor alcanza el 100% del límite asignado, THE Portal SHALL enviar una Notificación_Ciclo_Vida de cuota agotada al Consumidor propietario y THE Gateway SHALL rechazar peticiones adicionales de esa Aplicación_Consumidor con código HTTP 429 y un header Retry-After.
6. THE Portal SHALL permitir al Consumidor filtrar las métricas por rango de fechas (últimas 24 horas, 7 días, 30 días o rango personalizado), API específica y código de respuesta HTTP.
7. IF no existen datos de consumo para el período seleccionado, THEN THE Portal SHALL mostrar un estado vacío con un mensaje indicando "No hay datos disponibles para el rango seleccionado" y una sugerencia para ampliar el rango de fechas.

### Requerimiento 5: Documentación y Generación de SDKs

**Historia de Usuario:** Como Consumidor que inicia una integración, quiero acceder a documentación interactiva generada automáticamente desde las Definición_OpenAPI, guías de inicio rápido y SDKs descargables en al menos 4 lenguajes de programación, para poder reducir el tiempo de integración de mi Aplicación_Consumidor y minimizar errores de implementación.

#### Criterios de Aceptación

1. THE Portal SHALL mostrar documentación interactiva generada a partir de la Definición_OpenAPI de cada API, incluyendo: descripción de cada endpoint, esquemas de request y response con tipos de datos, códigos de error con descripción y ejemplos de uso ejecutables.
2. THE Portal SHALL generar fragmentos de código listos para copiar en al menos 4 lenguajes de programación: JavaScript (Node.js), Python, Java y cURL, actualizados automáticamente con cada cambio en la Definición_OpenAPI.
3. WHEN un Consumidor solicita la generación de un SDK para un lenguaje específico, THE Portal SHALL generar el SDK a partir de la Definición_OpenAPI en el lenguaje seleccionado y proporcionar un enlace de descarga en un máximo de 60 segundos.
4. WHEN se publica una nueva versión de una API, THE Portal SHALL actualizar automáticamente la documentación interactiva, los fragmentos de código y los SDKs asociados en un máximo de 10 minutos tras la publicación.
5. THE Portal SHALL incluir guías de inicio rápido (quickstart) para cada API que cubran los siguientes pasos verificables: configuración de autenticación OAuth 2.0, ejecución de la primera llamada exitosa con ejemplo funcional y manejo de los 5 códigos de error más comunes.
6. IF la generación de un SDK falla por un error en la Definición_OpenAPI, THEN THE Portal SHALL notificar al Administrador responsable de la API con el detalle del error y mostrar al Consumidor un mensaje indicando que el SDK no está disponible temporalmente junto con la fecha estimada de resolución.

### Requerimiento 6: Notificaciones de Ciclo de Vida

**Historia de Usuario:** Como Consumidor que mantiene integraciones activas con APIs de Seguros Bolívar, quiero recibir alertas proactivas y oportunas sobre cambios planificados en las APIs que consumo (nuevas versiones, mantenimientos y deprecaciones), para poder planificar y ejecutar las actualizaciones necesarias en mi Aplicación_Consumidor con tiempo suficiente y sin interrupciones de servicio.

#### Criterios de Aceptación

1. WHEN se publica una nueva versión de una API, THE Portal SHALL enviar una Notificación_Ciclo_Vida a todos los Consumidores que consumen la versión anterior en un máximo de 1 hora tras la publicación, incluyendo un enlace a la documentación de migración.
2. WHEN se programa una ventana de mantenimiento para una API, THE Portal SHALL enviar una Notificación_Ciclo_Vida al menos 7 días calendario antes de la fecha programada, indicando fecha, hora de inicio, duración estimada y APIs afectadas.
3. WHEN se inicia un Plan_Sunset para una versión de API, THE Portal SHALL enviar una Notificación_Ciclo_Vida al menos 90 días calendario antes de la fecha de retiro, indicando la versión de reemplazo y la guía de migración.
4. THE Portal SHALL entregar las Notificación_Ciclo_Vida a través de al menos dos canales simultáneos: correo electrónico a la dirección registrada del Consumidor y notificación dentro del Portal visible en el centro de notificaciones.
5. THE Portal SHALL permitir al Consumidor configurar sus preferencias de notificación seleccionando canal (correo, portal o ambos) y tipo de evento (nueva versión, mantenimiento, deprecación, cuota) de forma independiente.
6. IF un Consumidor no ha leído una Notificación_Ciclo_Vida de tipo Plan_Sunset en 30 días calendario desde su envío, THEN THE Portal SHALL reenviar la notificación por todos los canales configurados y marcarla como urgente con indicador visual destacado.

### Requerimiento 7: Gestión Centralizada de Aliados

**Historia de Usuario:** Como Administrador del ecosistema Conecta 2.0, quiero aprobar solicitudes de acceso a producción, suspender o revocar accesos de forma granular por Consumidor o por Aplicación_Consumidor individual, para poder controlar con precisión quién consume las APIs de Seguros Bolívar y responder a incidentes de seguridad en menos de 60 segundos.

#### Criterios de Aceptación

1. WHEN un Administrador accede al módulo de gestión de aliados, THE Portal SHALL mostrar la lista paginada de Consumidores con: nombre, estado actual (activo, suspendido, revocado), número de Aplicación_Consumidor asociadas, fecha de último acceso y porcentaje de consumo de Cuota.
2. WHEN un Administrador aprueba una solicitud de acceso a producción de una Aplicación_Consumidor, THE Portal SHALL generar una Credencial_Producción (client_id y client_secret) y notificar al Consumidor propietario por correo electrónico y notificación en el Portal en un máximo de 60 segundos.
3. WHEN un Administrador suspende un Consumidor, THE Gateway SHALL rechazar todas las peticiones de las Aplicación_Consumidor asociadas con código HTTP 403 y mensaje descriptivo en un máximo de 60 segundos desde la acción de suspensión.
4. WHEN un Administrador revoca el acceso de una Aplicación_Consumidor específica, THE Gateway SHALL rechazar las peticiones de esa aplicación con código HTTP 403 sin afectar otras aplicaciones del mismo Consumidor, en un máximo de 60 segundos.
5. THE Portal SHALL registrar cada acción de gestión (aprobación, suspensión, revocación, reactivación) como un Registro_Auditoría inmutable con los siguientes campos: identificador del Administrador, identificador del Consumidor o Aplicación_Consumidor afectada, tipo de acción, fecha y hora en formato ISO 8601 y motivo obligatorio.
6. WHEN un Administrador busca un Consumidor, THE Portal SHALL permitir búsqueda por nombre, correo electrónico, identificador de aplicación o estado, devolviendo resultados en un máximo de 500 milisegundos.
7. IF un Administrador intenta revocar el acceso de un Consumidor con transacciones en curso, THEN THE Portal SHALL mostrar una advertencia con el número exacto de transacciones activas en los últimos 5 minutos y solicitar confirmación explícita antes de ejecutar la revocación.

### Requerimiento 8: Auditoría y Cumplimiento

**Historia de Usuario:** Como Administrador responsable de cumplimiento regulatorio, quiero generar reportes detallados e inmutables sobre el consumo de datos y APIs por parte de los aliados, filtrados por Consumidor, API, fecha y código de respuesta, para poder garantizar trazabilidad completa en auditorías legales, de seguridad y regulatorias de Seguros Bolívar.

#### Criterios de Aceptación

1. THE Portal SHALL registrar cada petición de API como un Registro_Auditoría que incluya los siguientes campos obligatorios: Correlation_ID, identificador del Consumidor, identificador de la Aplicación_Consumidor, endpoint consumido, método HTTP, timestamp en formato ISO 8601, código de respuesta HTTP, tiempo de respuesta en milisegundos y dirección IP de origen.
2. WHEN un Administrador solicita un reporte de auditoría, THE Portal SHALL generar el reporte filtrable por Consumidor, API, rango de fechas y código de respuesta HTTP, mostrando los primeros resultados en un máximo de 10 segundos.
3. THE Portal SHALL retener los Registro_Auditoría por un mínimo de 90 días en almacenamiento activo con consulta en tiempo real y un mínimo de 1 año en almacenamiento de archivo con recuperación en un máximo de 4 horas.
4. WHEN un Administrador exporta un reporte de auditoría de hasta 100,000 registros, THE Portal SHALL generar el archivo en formato CSV o JSON en un máximo de 120 segundos y proporcionar un enlace de descarga válido por 24 horas.
5. THE Portal SHALL garantizar la inmutabilidad de los Registro_Auditoría una vez creados, impidiendo su modificación o eliminación por cualquier usuario, incluyendo Administradores con privilegios máximos.
6. IF un Administrador solicita un reporte que excede 100,000 registros, THEN THE Portal SHALL procesar la generación de forma asíncrona, mostrar una barra de progreso estimada y notificar al Administrador por correo electrónico y notificación en el Portal cuando el archivo esté disponible para descarga.
7. THE Portal SHALL incluir un Correlation_ID único (formato UUID v4) en cada petición que atraviese el Gateway para permitir trazabilidad extremo a extremo entre el Portal, el Gateway y los servicios internos.
8. THE Portal SHALL aplicar una política de borrado automático de datos personales de Consumidores inactivos que no supere los 90 días desde la última actividad registrada, conforme a las políticas de retención de datos de Seguros Bolívar, generando un Registro_Auditoría del borrado ejecutado.

### Requerimiento 9: Gobierno de Versiones de APIs

**Historia de Usuario:** Como Administrador del catálogo de APIs, quiero publicar nuevas versiones de APIs con documentación de migración, gestionar planes de deprecación con al menos 90 días de antelación y retirar versiones antiguas de forma coordinada, para poder evolucionar el Catálogo_API sin romper las integraciones existentes de los Consumidores.

#### Criterios de Aceptación

1. WHEN un Administrador publica una nueva versión de una API proporcionando la Definición_OpenAPI y notas de cambio, THE Portal SHALL registrar la versión en el Catálogo_API, activar las Notificación_Ciclo_Vida correspondientes y hacer la nueva versión disponible en el Sandbox en un máximo de 10 minutos.
2. WHEN un Administrador crea un Plan_Sunset para una versión de API, THE Portal SHALL validar que la fecha de retiro sea al menos 90 días calendario posterior a la fecha actual y rechazar la creación si no se cumple esta condición.
3. WHILE una versión de API tiene un Plan_Sunset activo, THE Catálogo_API SHALL mostrar un banner de deprecación visible en color amarillo con la fecha de retiro en formato DD/MM/AAAA, los días restantes y un enlace directo a la documentación de migración.
4. WHEN la fecha de retiro de un Plan_Sunset se cumple, THE Gateway SHALL dejar de enrutar peticiones a la versión retirada y devolver código HTTP 410 (Gone) con un cuerpo JSON que indique la versión de reemplazo y la URL de la documentación de migración.
5. THE Portal SHALL mantener al menos dos versiones activas de cada API simultáneamente durante el período de transición entre la versión actual y la versión de reemplazo.
6. WHEN un Administrador consulta el estado de versiones de una API, THE Portal SHALL mostrar en un máximo de 2 segundos: versiones activas con fecha de publicación, versiones en deprecación con fecha de retiro y días restantes, y versiones retiradas con fecha de retiro efectiva.
7. IF un Administrador intenta retirar una versión de API que aún tiene Consumidores activos (con al menos 1 petición en los últimos 30 días) sin una versión de reemplazo publicada, THEN THE Portal SHALL bloquear la acción y mostrar la lista de Consumidores afectados con su volumen de peticiones.
8. THE Portal SHALL exponer todas las versiones de API bajo un esquema de prefijos en las rutas (ej: `/v1/api/`, `/v2/api/`), garantizando que los Consumidores puedan dirigir sus peticiones a una versión específica sin ambigüedad.

### Requerimiento 10: Seguridad B2B (mTLS y OAuth2)

**Historia de Usuario:** Como Administrador de seguridad, quiero que todas las conexiones entre los sistemas de los aliados y el Gateway estén protegidas con OAuth 2.0 (tokens JWT firmados) y mTLS para comunicaciones servidor-a-servidor, con validación de scopes, protección contra OWASP API Top 10 y enmascaramiento de datos sensibles, para poder garantizar la autenticidad, autorización y confidencialidad de cada petición en el ecosistema Conecta 2.0.

#### Criterios de Aceptación

1. THE Gateway SHALL requerir autenticación OAuth 2.0 con tokens JWT firmados (algoritmo RS256 o superior) para el 100% de las peticiones de API en el entorno de producción.
2. THE Gateway SHALL validar la firma, la expiración (con tolerancia máxima de 30 segundos de clock skew) y los scopes del token JWT en cada petición antes de enrutar al servicio interno, rechazando tokens inválidos con código HTTP 401.
3. WHERE un Consumidor opera en modo servidor-a-servidor (sin interacción de usuario final), THE Gateway SHALL requerir Mutual TLS (mTLS) como capa adicional de autenticación, validando el certificado del cliente contra la lista de certificados autorizados.
4. WHEN un token JWT expira durante una sesión activa, THE Gateway SHALL devolver código HTTP 401 con un cuerpo JSON que incluya el código de error "token_expired" y un mensaje indicando que el token debe ser renovado.
5. IF una petición presenta un certificado mTLS inválido, expirado o no registrado, THEN THE Gateway SHALL rechazar la conexión TLS antes de procesar la petición HTTP y registrar el evento como Registro_Auditoría de seguridad con nivel "critical".
6. THE Portal SHALL almacenar los tokens de refresco exclusivamente en cookies httpOnly con atributos Secure y SameSite=Strict para prevenir ataques XSS y CSRF.
7. THE Gateway SHALL validar los scopes del token JWT contra los permisos del Plan_Suscripción del Consumidor antes de permitir el acceso a cada endpoint, rechazando peticiones con scopes insuficientes con código HTTP 403.
8. THE Gateway SHALL validar que cada petición acceda únicamente a recursos autorizados para el Consumidor autenticado, impidiendo el acceso a recursos de otros Consumidores (protección contra BOLA — Broken Object Level Authorization) y rechazando violaciones con código HTTP 403.
9. THE Gateway SHALL sanitizar y validar todos los parámetros de entrada contra la Definición_OpenAPI correspondiente antes de enrutar la petición al servicio interno, rechazando peticiones con parámetros malformados o potencialmente maliciosos con código HTTP 400 y un mensaje descriptivo del error de validación.
10. THE Portal SHALL documentar la cobertura de cada uno de los 10 controles del OWASP API Security Top 10 (2023), y THE Gateway SHALL implementar protecciones activas verificables para al menos los siguientes 5 riesgos: BOLA, Broken Authentication, Excessive Data Exposure, Lack of Resources & Rate Limiting e Injection.
11. THE Gateway SHALL enmascarar datos sensibles (PII, financieros, de salud) en las respuestas de API según las políticas de clasificación de datos de Seguros Bolívar, garantizando que el 100% de los campos clasificados como confidenciales o restringidos sean enmascarados antes de llegar al Consumidor.
12. THE Portal SHALL clasificar cada campo de respuesta de API en una de las siguientes categorías: público, interno, confidencial o restringido, y THE Gateway SHALL aplicar la política de enmascaramiento correspondiente a cada clasificación de forma automática en tiempo de ejecución.

### Requerimiento 11: Capa de Abstracción de Legados

**Historia de Usuario:** Como Consumidor que integra APIs REST/JSON, quiero consumir todas las APIs del Catálogo_API en formato REST/JSON estándar independientemente de si el servicio interno de Seguros Bolívar utiliza SOAP/XML u otro protocolo, para poder integrar de forma moderna y uniforme sin conocer ni depender de la complejidad del protocolo interno.

#### Criterios de Aceptación

1. WHEN un Consumidor envía una petición REST/JSON a una API que internamente consume un servicio SOAP/XML, THE Gateway SHALL traducir la petición al formato SOAP/XML, invocar el servicio interno y traducir la respuesta de vuelta a REST/JSON de forma transparente para el Consumidor.
2. THE Gateway SHALL completar la traducción bidireccional (REST/JSON a SOAP/XML y viceversa) en un máximo de 15 milisegundos adicionales a la latencia del servicio interno, medido como overhead del proceso de traducción.
3. IF el servicio interno SOAP/XML devuelve un error (SOAP Fault), THEN THE Gateway SHALL mapear el código de error SOAP a un código HTTP estándar equivalente y devolver un cuerpo de error en formato JSON con los campos: código HTTP, código de error interno, mensaje descriptivo y Correlation_ID.
4. THE Definición_OpenAPI de cada API abstraída SHALL documentar exclusivamente la interfaz REST/JSON expuesta al Consumidor, sin exponer nombres de operaciones SOAP, namespaces XML ni detalles del protocolo interno.
5. WHEN se modifica el contrato WSDL de un servicio interno, THE Administrador SHALL actualizar el adaptador de traducción en el Gateway sin requerir cambios en la Definición_OpenAPI expuesta al Consumidor ni en las integraciones existentes de los Consumidores.

### Requerimiento 12: Resiliencia y Circuit Breakers

**Historia de Usuario:** Como Administrador de infraestructura, quiero que el Gateway implemente Circuit_Breaker con umbrales configurables y Throttling dinámico por IP y por Consumidor, para poder proteger los servicios internos de Seguros Bolívar ante fallas en cascada o picos de tráfico anómalos, garantizando la estabilidad del ecosistema.

#### Criterios de Aceptación

1. WHEN un servicio interno presenta una tasa de error superior al 50% en un período de 30 segundos (mínimo 10 peticiones evaluadas), THE Circuit_Breaker SHALL abrir el circuito y dejar de enviar peticiones al servicio afectado.
2. WHILE el Circuit_Breaker se encuentra en estado abierto, THE Gateway SHALL devolver código HTTP 503 con un header Retry-After indicando el tiempo estimado de recuperación en segundos y un cuerpo JSON con el mensaje "Servicio temporalmente no disponible".
3. WHEN el Circuit_Breaker ha permanecido abierto durante 60 segundos, THE Gateway SHALL permitir un máximo de 3 peticiones de prueba (estado semi-abierto) para verificar la recuperación del servicio.
4. WHEN las peticiones de prueba en estado semi-abierto son exitosas (tasa de éxito superior al 80%), THE Circuit_Breaker SHALL cerrar el circuito y restaurar el flujo normal de tráfico en un máximo de 5 segundos.
5. THE Gateway SHALL aplicar Throttling dinámico por IP y por identificador de Consumidor, rechazando peticiones que excedan el límite configurado en el Plan_Suscripción con código HTTP 429 y header Retry-After.
6. WHEN el Gateway detecta un patrón de tráfico anómalo (incremento superior al 300% del promedio en los últimos 60 segundos desde una misma IP), THE Gateway SHALL activar Throttling restrictivo para esa IP y registrar el evento como Registro_Auditoría de seguridad con nivel "warning".
7. THE Gateway SHALL procesar las políticas de seguridad, autenticación y cuotas con una latencia total inferior a 30 milisegundos, medida como overhead antes de enrutar la petición al servicio interno.

### Requerimiento 13: Observabilidad y Telemetría

**Historia de Usuario:** Como Administrador de operaciones, quiero disponer de telemetría completa basada en OpenTelemetry con logs estructurados, métricas en tiempo real y trazado distribuido de peticiones correlacionadas por Correlation_ID, para poder diagnosticar problemas en menos de 5 minutos y monitorear la salud del ecosistema Conecta 2.0 de forma proactiva.

#### Criterios de Aceptación

1. THE Portal SHALL instrumentar cada petición con OpenTelemetry, generando traces distribuidos, métricas de rendimiento y logs estructurados vinculados por el Correlation_ID correspondiente.
2. THE Portal SHALL enviar todos los logs en formato JSON estructurado al servicio centralizado de logging (CloudWatch) con los siguientes campos obligatorios: timestamp (ISO 8601), level (ERROR, WARN, INFO, DEBUG), service (nombre del microservicio), Correlation_ID (UUID v4), message y metadata contextual.
3. THE Portal SHALL exponer métricas de salud (health check) en un endpoint dedicado `/health` que reporte el estado (UP/DOWN) de cada componente: Portal, Gateway, base de datos y servicios internos, con tiempo de respuesta inferior a 500 milisegundos.
4. WHEN la latencia promedio del Gateway supera los 100 milisegundos durante 5 minutos consecutivos, THE Portal SHALL generar una alerta automática al equipo de operaciones a través del canal configurado (correo, Slack o PagerDuty) en un máximo de 1 minuto tras detectar la condición.
5. THE Portal SHALL retener logs en almacenamiento activo (consulta en tiempo real) por un mínimo de 90 días y en almacenamiento de archivo (recuperación bajo demanda) por un mínimo de 1 año.
6. WHEN un Administrador consulta el trazado de una petición por Correlation_ID, THE Portal SHALL mostrar la traza completa extremo a extremo en un máximo de 5 segundos, incluyendo todos los servicios involucrados, sus tiempos de respuesta individuales y el estado de cada salto.

### Requerimiento 14: Preparación para IA (Agent Experience - AX)

**Historia de Usuario:** Como Consumidor que desarrolla integraciones basadas en inteligencia artificial, quiero que las Definición_OpenAPI estén enriquecidas con metadatos semánticos y expuestas en formato MCP (Model Context Protocol), para poder habilitar que agentes de IA interpreten el Catálogo_API y consuman las APIs de forma autónoma sin intervención humana.

#### Criterios de Aceptación

1. THE Portal SHALL enriquecer cada Definición_OpenAPI con metadatos semánticos que describan en lenguaje natural: el propósito de negocio de la API, la descripción funcional de cada parámetro y el significado de cada campo de respuesta.
2. THE Portal SHALL exponer las definiciones de API en un formato compatible con el Model Context Protocol (MCP) a través de un endpoint dedicado `/mcp/apis` accesible con autenticación OAuth 2.0.
3. WHEN un agente de IA consulta el Catálogo_API a través del endpoint MCP, THE Portal SHALL devolver las definiciones enriquecidas con contexto semántico suficiente (descripción de negocio, precondiciones, postcondiciones y ejemplos) para que el agente determine qué API invocar sin intervención humana, en un máximo de 3 segundos.
4. THE Portal SHALL incluir al menos 2 ejemplos de request y 2 ejemplos de response (caso exitoso y caso de error) en cada operación de la Definición_OpenAPI para facilitar la interpretación por agentes de IA.
5. WHEN se publica o actualiza una API, THE Portal SHALL regenerar automáticamente los metadatos semánticos y la definición MCP asociada en un máximo de 10 minutos tras la publicación.

### Requerimiento 15: Alta Disponibilidad y Escalabilidad

**Historia de Usuario:** Como Administrador de infraestructura, quiero que el Portal opere con un SLA de 99.95% de disponibilidad mensual, soporte picos de al menos 1,500 TPS con latencia controlada y escale horizontalmente de forma automática, para poder garantizar la continuidad del servicio a todos los aliados incluso durante picos de demanda o fallas de infraestructura.

#### Criterios de Aceptación

1. THE Portal SHALL operar con una disponibilidad mínima de 99.95% medida mensualmente, equivalente a un máximo de 21.9 minutos de indisponibilidad no planificada por mes.
2. THE Portal SHALL soportar un mínimo de 1,500 transacciones por segundo (TPS) sin degradación de rendimiento, medido como latencia del percentil 95 inferior a 500 milisegundos y tasa de error inferior al 0.1%.
3. THE Portal SHALL desplegarse en al menos dos zonas de disponibilidad de AWS con failover automático en un máximo de 30 segundos ante la caída de una zona, sin pérdida de transacciones en curso.
4. WHEN la carga del Portal supera el 70% de la capacidad configurada (medida por CPU o memoria), THE Portal SHALL escalar horizontalmente de forma automática agregando instancias adicionales en un máximo de 120 segundos.
5. WHEN una instancia del Portal falla un health check (3 fallos consecutivos en intervalos de 10 segundos), THE Portal SHALL remover la instancia del balanceador de carga y reemplazarla con una nueva instancia saludable en un máximo de 90 segundos.
6. THE Portal SHALL completar un graceful shutdown procesando todas las transacciones en curso (con un timeout máximo de 30 segundos) antes de finalizar una instancia durante un despliegue o reinicio.
7. THE Portal SHALL comunicarse con todos los servicios internos, bases de datos y componentes de infraestructura exclusivamente mediante nombres de dominio (DNS), prohibiendo el uso de direcciones IP fijas en cualquier configuración de producción.

### Requerimiento 16: Parseo y Renderizado de Definiciones OpenAPI

**Historia de Usuario:** Como Consumidor que explora el Catálogo_API, quiero que el Portal interprete correctamente las Definición_OpenAPI en formato YAML o JSON y las presente como documentación interactiva con endpoints agrupados, esquemas expandibles y ejemplos ejecutables, para poder explorar y comprender las APIs de forma visual, precisa y sin ambigüedades.

#### Criterios de Aceptación

1. WHEN el Portal recibe una Definición_OpenAPI válida en formato YAML o JSON, THE Parser SHALL transformarla en un modelo de datos interno (Definición_API_Interna) que preserve el 100% de los endpoints, esquemas, parámetros, ejemplos y metadatos definidos en la especificación original.
2. THE Pretty_Printer SHALL formatear un modelo Definición_API_Interna de vuelta a una Definición_OpenAPI válida en formato YAML o JSON, preservando la estructura semántica y la validez contra el esquema OpenAPI 3.x.
3. FOR ALL Definición_OpenAPI válidas, parsear la definición con el Parser y luego formatearla con el Pretty_Printer y volver a parsearla SHALL producir un modelo Definición_API_Interna equivalente al original (propiedad round-trip), verificable mediante comparación campo a campo.
4. IF una Definición_OpenAPI contiene errores de sintaxis o violaciones del esquema OpenAPI 3.x, THEN THE Parser SHALL devolver una lista de errores descriptivos indicando para cada error: el número de línea, el campo afectado, la naturaleza del error y una sugerencia de corrección.
5. WHEN el Portal renderiza una Definición_API_Interna como documentación interactiva, THE Portal SHALL mostrar todos los endpoints agrupados por recurso, con esquemas expandibles, ejemplos de request/response editables y códigos de error con descripción, en un máximo de 3 segundos para definiciones de hasta 5,000 líneas.
6. THE Parser SHALL procesar una Definición_OpenAPI de hasta 5,000 líneas en un máximo de 2 segundos, y definiciones de hasta 10,000 líneas en un máximo de 5 segundos.

### Requerimiento 17: Separación de Planos (Control vs Data Plane)

**Historia de Usuario:** Como Administrador de arquitectura, quiero que el plano de control (Portal) resida en infraestructura cloud gestionando configuración y gobierno de forma centralizada, mientras los Gateways (plano de datos) operen en la DMZ o infraestructura privada procesando tráfico cerca de los servicios core, para poder minimizar la latencia de las peticiones de API, mantener el gobierno centralizado y garantizar la operación continua del plano de datos incluso ante caídas del plano de control.

#### Criterios de Aceptación

1. THE Portal (plano de control) SHALL desplegarse en infraestructura cloud y gestionar de forma centralizada la configuración de políticas, credenciales, catálogo de APIs y gobierno de versiones, sirviendo como única fuente de verdad para la configuración del ecosistema.
2. THE Gateway (plano de datos) SHALL desplegarse en la DMZ o infraestructura privada de Seguros Bolívar, procesando el tráfico de API lo más cerca posible de los servicios core para minimizar latencia, con una latencia de red al servicio interno inferior a 10 milisegundos.
3. WHEN un Administrador modifica una política, credencial o configuración de API en el plano de control, THE Portal SHALL sincronizar el cambio al plano de datos (Gateway) en un máximo de 30 segundos, confirmando la aplicación exitosa del cambio.
4. IF el plano de control se encuentra temporalmente inaccesible, THEN THE Gateway SHALL continuar operando en modo degradado utilizando la última configuración sincronizada almacenada localmente, sin interrumpir el procesamiento de peticiones de API durante un mínimo de 24 horas.
5. THE Portal SHALL mantener un registro de sincronización que documente cada cambio propagado del plano de control al plano de datos, incluyendo: timestamp (ISO 8601), tipo de cambio, versión de configuración, estado de confirmación (aplicado, pendiente, fallido) y tiempo de propagación en milisegundos.
6. THE Gateway SHALL operar de forma independiente del plano de control para el procesamiento de peticiones en tiempo real, sin requerir comunicación síncrona con el Portal para autenticar, autorizar o enrutar peticiones individuales.
7. WHEN el plano de control se recupera tras una caída, THE Portal SHALL reconciliar automáticamente cualquier discrepancia de configuración con el plano de datos en un máximo de 5 minutos y notificar al Administrador si se detectan inconsistencias, detallando los cambios aplicados durante el período de desconexión.
