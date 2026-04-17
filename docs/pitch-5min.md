# Conecta 2.0 — Pitch 5 Minutos

## CUADRO COMPARATIVO RÁPIDO

| Criterio del Jurado | Qué Hicimos | Evidencia |
|---|---|---|
| **📐 Calidad Especificación** | 17 requerimientos, 90+ criterios de aceptación medibles, 22 propiedades de correctitud formales | Todo en `.kiro/specs/` — requirements.md, design.md |
| **💼 Relevancia Negocio** | Portal APIs para Open Insurance 2025. Alineado con directriz VP Tecnología (API First, Open-X) | Onboarding de semanas → minutos. -90% costos operativos |
| **⚙ Uso de Kiro** | Spec-Driven puro: Reqs → Diseño → Tasks → Código. Steering rules del stack Bolívar | Trazabilidad total: cada línea de código apunta a un req |
| **💻 Prototipo Funcional** | Mock Engine + Request Validator + servidor Express + 31 tests pasando + migraciones SQL | `npm test` ejecutable en vivo |
| **🎤 Presentación** | 5 devs en paralelo, monorepo con módulos aislados, contratos compartidos | Tasks por dev, integración coordinada |

---

## SCRIPT DEL PITCH

### APERTURA (30 seg)

> "Un aliado quiere integrar seguros de autos en su app. Hoy eso toma semanas: correos, llamadas, documentación desactualizada, credenciales manuales.
>
> ¿Y si pudiera registrarse, explorar APIs, probarlas en vivo y salir a producción en minutos? Eso es Conecta 2.0."

### PROBLEMA (30 seg)

> "Tres dolores:
>
> **Fricción** — Onboarding manual que frena el Time-to-Market.
> **Experiencia** — Sin sandbox, sin visibilidad de consumo, docs dispersas.
> **Regulación** — Open Insurance 2025 exige interoperabilidad. No es opcional."

### SOLUCIÓN (1 min)

> "Diseñamos 5 módulos, 5 devs en paralelo:
>
> 1. **Auth + Core** — Onboarding autoservicio. OAuth 2.0, JWT. 5 pasos, sin intervención humana.
> 2. **Catálogo Inteligente** — El aliado solo ve APIs de su línea de negocio. Docs interactivas, snippets en 4 lenguajes.
> 3. **Sandbox** — Pruebas en tiempo real con datos simulados. Nuestro Mock Engine lee la spec OpenAPI y genera respuestas que respetan el esquema exacto.
> 4. **Analytics + Auditoría** — Dashboard de consumo, cuotas, trazabilidad con Correlation-ID.
> 5. **Frontend React** — Portal unificado para todo el flujo."

### DEMO (1 min 30 seg)

> *[Mostrar tests corriendo]*
>
> "Nuestro Mock Engine toma una spec OpenAPI y genera respuestas inteligentes: strings, integers, arrays, $refs resueltos recursivamente. 8 tests pasando.
>
> El Request Validator hace lo inverso: valida que la petición del aliado cumpla la spec. Campos requeridos, tipos, enums. Si falla, errores descriptivos. 15 tests pasando.
>
> *[Mostrar specs en Kiro]*
>
> Todo nació de las specs. 17 requerimientos → 22 propiedades formales → código. Cada línea es trazable."

### IMPACTO + CIERRE (1 min)

> "Tres números:
> - ⏱️ De semanas a minutos para la primera llamada exitosa del aliado
> - 💰 -90% en costos operativos de gestión de APIs
> - 🤖 IA Ready — Specs enriquecidas para agentes autónomos con MCP
>
> Construimos esto con Kiro como herramienta central. Spec-Driven de principio a fin. Cero código improvisado.
>
> Conecta 2.0: de un repositorio de APIs a un ecosistema de innovación. Gracias."

---

## Q&A RÁPIDO

| Pregunta | Respuesta corta |
|---|---|
| ¿Seguridad? | OAuth 2.0 + JWT + mTLS + OWASP Top 10. Tokens en httpOnly cookies. |
| ¿Si un servicio falla? | Circuit Breaker: >50% errores en 30s → abre circuito → 503 + Retry-After. |
| ¿Trazabilidad? | Correlation-ID en cada petición. Audit logs inmutables (REVOKE UPDATE/DELETE en PostgreSQL). |
| ¿Cómo usaron Kiro? | Specs → Design → Tasks → Código. Steering rules para stack Bolívar. Todo trazable. |
| ¿Qué falta para producción? | mTLS real, throttling dinámico, SDKs, frontend completo, despliegue multi-zona AWS. |

---

## SLIDES (10 slides, máximo 6 bullets cada una)

| # | Título | Contenido clave |
|---|---|---|
| 1 | **Conecta 2.0** | Portada. "De repositorio de APIs a ecosistema de innovación". Logo + Grupo A |
| 2 | **El Problema** | 3 íconos: Fricción, Experiencia, Regulación |
| 3 | **La Solución** | Diagrama: 5 módulos → PostgreSQL. Tabla dev/módulo/puerto |
| 4 | **Spec-Driven con Kiro** | Flujo: 17 Reqs → Diseño → 22 Properties → Tasks → Código + Tests |
| 5 | **Demo: Mock Engine** | Input: spec OpenAPI → Output: respuesta mock. Screenshot tests verdes |
| 6 | **Demo: Validator** | Input: petición + spec → Output: errores descriptivos o ✅ |
| 7 | **Base de Datos** | ER simplificado: Consumer → App → Credential/History/Audit. 14 tablas |
| 8 | **Impacto** | 3 métricas grandes: semanas→minutos, -90% costos, IA Ready |
| 9 | **Hoy vs Mañana** | Tabla comparativa Conecta 1.0 vs 2.0 (onboarding, docs, sandbox, seguridad) |
| 10 | **Cierre** | Cita del VP + nombres del equipo + "¿Preguntas?" |
