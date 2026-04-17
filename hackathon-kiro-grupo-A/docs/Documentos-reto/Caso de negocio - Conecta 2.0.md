# Conecta 2.0 — Caso de Negocio

Conecta 2.0 es el API Developer Portal de grado empresarial de Seguros Bolívar, diseñado como un ecosistema de autoservicio que centraliza, expone y gobierna el consumo de activos digitales para terceros, permitiendo que aliados e intermediarios integren soluciones de seguros en tiempo real bajo el paradigma de Open Insurance.

---

## 1. Requerimientos de Usuario (Perspectiva del Product Owner)

Esta sección se enfoca en "qué" debe permitir hacer la plataforma para maximizar la adopción y eficiencia de los usuarios.

### A. Para Intermediarios, Aliados y Desarrolladores (Consumidores)

El objetivo es reducir el "Tiempo promedio para la primera llamada de API exitosa" y fomentar la autonomía.

- **RU-01: Onboarding de Autoservicio (Golden Path):** El aliado debe poder registrarse, crear su aplicación y obtener credenciales de prueba en minutos sin intervención manual, siguiendo un flujo guiado.
- **RU-02: Catálogo Inteligente y Personalizado:** Visualización de APIs basada en el perfil de negocio (ej. Salud, Autos, Vida). El usuario solo debe ver lo que es relevante para su contrato.
- **RU-03: Centro de Experimentación (Sandbox):** Interfaz interactiva para probar peticiones en tiempo real con datos simulados (Mocking) antes de pasar a producción.
- **RU-04: Consola de Analítica para el Aliado:** Tablero visual donde el intermediario pueda ver su propio consumo, tasas de error y qué tan cerca está de su límite de cuota.
- **RU-05: Soporte y Documentación Evolucionada:** Acceso a guías paso a paso, fragmentos de código listos para copiar en múltiples lenguajes y generación automática de SDKs.
- **RU-06: Notificaciones de Ciclo de Vida:** Alertas proactivas sobre nuevas versiones de APIs, ventanas de mantenimiento o deprecación de servicios con al menos 3 meses de antelación.

### B. Para Administradores de Seguros Bolívar (Gestores)

El objetivo es el control total del ecosistema y la agilidad en la toma de decisiones comerciales.

- **RU-07: Gestión Centralizada de Aliados:** Módulo para aprobar, suspender o revocar accesos de forma granular por aliado o por aplicación.
- **RU-08: Auditoría y Cumplimiento:** Generación de reportes detallados sobre quién consumió qué dato y cuándo, garantizando trazabilidad para auditorías legales o de seguridad.
- **RU-09: Gobierno de Versiones:** Herramientas para publicar nuevas versiones de APIs y gestionar el plan de retiro (sunset) de versiones antiguas de forma coordinada.

---

## 2. Requerimientos Técnicos y No Funcionales (Perspectiva del Arquitecto)

Esta sección define el "cómo" se construye la plataforma para asegurar que sea segura, escalable y mantenible.

### A. Arquitectura y Conectividad Técnica (RT)

- **RT-01: Separación de Planos (Control vs. Data Plane):** El plano de control residirá en la nube para gestión, mientras que los Gateways (Data Plane) podrán estar en la DMZ o infraestructura privada para minimizar latencia hacia el core.
- **RT-02: Seguridad B2B (mTLS y OAuth2):** Implementación obligatoria de Mutual TLS para conexiones servidor a servidor y protocolos OAuth 2.0 / OpenID Connect para la autorización de aplicaciones.
- **RT-03: Capa de Abstracción de Legados:** Uso de adaptadores o microservicios que traduzcan protocolos antiguos (SOAP/XML) a estándares modernos (REST/JSON), protegiendo al aliado de la complejidad interna.
- **RT-04: Implementación de Circuit Breakers:** Mecanismos automáticos para detener el tráfico hacia servicios core que presenten fallas, evitando caídas en cascada de los sistemas de Seguros Bolívar.
- **RT-05: Preparación para IA (Agent Experience - AX):** Definiciones OpenAPI enriquecidas semánticamente para que agentes de IA puedan interpretar y consumir las APIs de forma autónoma bajo estándares como el Model Context Protocol (MCP).

### B. Requerimientos No Funcionales (RNF)

| Categoría | Especificación Técnica |
|---|---|
| **Disponibilidad** | Mínimo 99.95% de SLA mediante despliegue multi-zona y failover automático. |
| **Escalabilidad** | Arquitectura elástica basada en contenedores (K8s) capaz de soportar picos transaccionales de 1,500+ TPS sin degradación. |
| **Rendimiento** | Latencia en el Gateway inferior a 30ms para el procesamiento de políticas (seguridad, cuotas). |
| **Observabilidad** | Telemetría completa basada en OpenTelemetry, incluyendo logs distribuidos, métricas en tiempo real y trazado de peticiones extremo a extremo. |
| **Seguridad** | Alineación estricta con el OWASP API Security Top 10 (2023/2025), incluyendo protección contra BOLA, inyecciones y consumo irrestricto de recursos. |
| **Resiliencia** | Capacidad de "Throttling" dinámico por IP o ID de aliado para mitigar ataques DoS o errores de integración masivos. |

Este desglose asegura que Conecta 2.0 no solo sea un repositorio de APIs, sino una plataforma de nivel empresarial comparable con los estándares de líderes como Zurich o Chubb.

### Dignos rivales

- **Zurich:** https://exchange.zurich.com/en/api
- **Chubb:** https://studio.chubb.com/connect/
