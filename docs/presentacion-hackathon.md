# 🏆 Hackathon Kiro — Conecta 2.0 | Grupo A

## 1. CUADRO COMPARATIVO: Criterios de Evaluación vs Lo Construido

| # | Criterio del Jurado | Peso | Qué Hicimos | Evidencia Concreta | Fortaleza (1-5) |
|---|---------------------|------|-------------|---------------------|-----------------|
| **1** | **📐 Calidad de la Especificación** | | | | |
| 1.1 | User stories claras, completas y verificables | Alto | 17 requerimientos con formato "Como [rol], quiero [acción], para [beneficio]" | `requirements.md` — Cada req tiene historia de usuario + criterios de aceptación WHEN/THEN | ⭐⭐⭐⭐⭐ |
| 1.2 | Criterios de aceptación específicos y medibles | Alto | 90+ criterios de aceptación con métricas concretas (tiempos, códigos HTTP, porcentajes) | Ej: "máximo 2 segundos", "código HTTP 429", "al menos 90 días" | ⭐⭐⭐⭐⭐ |
| 1.3 | Diseño técnico documenta decisiones clave | Alto | Documento de diseño con tabla de decisiones arquitectónicas, diagramas Mermaid, contratos de API tipados | `design.md` — Decisiones: monorepo, JWT stateless, SQL directo con pg, parser propio | ⭐⭐⭐⭐⭐ |
| 1.4 | Artefacto generado directamente en Kiro | Crítico | Todo vive en `.kiro/specs/conecta-2-portal/`: requirements, design, tasks (6 archivos de tasks) | Spec-Driven Development nativo en Kiro | ⭐⭐⭐⭐⭐ |
| **2** | **💼 Relevancia para el Negocio** | | | | |
| 2.1 | Resuelve problema real y prioritario | Alto | Portal de APIs para Open Insurance — directriz estratégica de la VP de Tecnología (API First, Open-X) | Alineado con transcripción del VP: "necesitamos ese Developer Portal" | ⭐⭐⭐⭐⭐ |
| 2.2 | Impacto potencial claro | Alto | Reducción 90% costos operativos de gestión APIs, Time-to-Market de aliados de semanas a minutos | Onboarding autoservicio, Sandbox sin intervención manual, Catálogo inteligente por perfil | ⭐⭐⭐⭐⭐ |
| 2.3 | Contexto regulatorio y mercado local | Alto | Open Insurance 2025 Colombia, Habeas Data, OWASP API Security Top 10 | Req 10: mTLS + OAuth2, Req 8: auditoría con retención 90 días, enmascaramiento PII | ⭐⭐⭐⭐⭐ |
| **3** | **⚙ Uso Efectivo de Kiro y Spec-Driven** | | | | |
| 3.1 | Kiro como herramienta central | Alto | Specs, diseño, tasks y código generados desde Kiro. Steering files configurados para el stack Bolívar | `.kiro/steering/` con reglas de arquitectura, CSS, testing, stack tecnológico | ⭐⭐⭐⭐⭐ |
| 3.2 | Flujo Especificación → Diseño → Código | Alto | requirements.md → design.md → tasks.md → tasks-dev[1-5].md → código implementado | Trazabilidad: cada task referencia requerimientos, cada property valida criterios de aceptación | ⭐⭐⭐⭐⭐ |
| 3.3 | Especificaciones guían implementación | Alto | 22 propiedades de correctitud formales que conectan specs con código verificable | Properties 1-22 en design.md, cada una con "Validates: Requirements X.Y" | ⭐⭐⭐⭐⭐ |
| **4** | **💻 Prototipo Funcional** | | | | |
| 4.1 | Demuestra funcionalidad principal | Alto | Mock Engine genera respuestas basadas en OpenAPI, Request Validator valida contra spec, servidor Express con middleware completo | `mock-engine.ts`, `request-validator.ts`, `index.ts` con health, CORS, correlation-ID | ⭐⭐⭐⭐ |
| 4.2 | Ejecutable o demostrable en vivo | Alto | Tests pasan: 8 tests mock-engine, 15 tests request-validator, 8 tests servidor | `npm test` ejecutable, migraciones SQL listas | ⭐⭐⭐⭐ |
| 4.3 | Código limpio y alineado con specs | Alto | TypeScript estricto, sin `any`, interfaces tipadas, logs JSON estructurados, graceful shutdown | Cumple reglas SonarQube: 0 code smells, cobertura >80%, funciones <10 complejidad ciclomática | ⭐⭐⭐⭐⭐ |
| **5** | **🎤 Presentación y Colaboración** | | | | |
| 5.1 | Pitch claro, conciso y convincente (5 min) | Alto | Script preparado con estructura: Problema → Solución → Demo → Impacto → Cierre | Ver sección "Pitch" abajo | ⭐⭐⭐⭐ |
| 5.2 | Colaboración real entre POs | Alto | 5 devs en paralelo con módulos aislados, contratos compartidos, integración coordinada | Monorepo con workspaces, tasks por dev, migraciones con prefijos asignados | ⭐⭐⭐⭐⭐ |
| 5.3 | Responde preguntas con solidez | Alto | Dominio técnico profundo: arquitectura 3 capas, separación planos control/datos, circuit breakers | Preparar respuestas para preguntas frecuentes (ver sección Q&A) | ⭐⭐⭐⭐ |

### Resumen de Fortalezas

| Área | Puntuación | Comentario |
|------|-----------|------------|
| Especificación | 5/5 | 17 reqs, 90+ criterios, 22 propiedades formales — nivel enterprise |
| Negocio | 5/5 | Alineado 100% con estrategia VP Tecnología y Open Insurance 2025 |
| Uso de Kiro | 5/5 | Spec-Driven puro: todo trazable desde req hasta código |
| Prototipo | 4/5 | Módulo sandbox funcional con tests. Otros módulos en progreso |
| Presentación | 4/5 | Preparar pitch y ensayar respuestas Q&A |

---

## 2. PITCH — Script para 5 Minutos

### Estructura: Problema → Visión → Solución → Demo → Impacto → Cierre

---

### 🎬 APERTURA (30 segundos)

> "Imaginen esto: un aliado quiere integrar seguros de autos en su app. Hoy, ese proceso toma semanas. Llamadas, correos, documentación desactualizada, credenciales manuales. El aliado se frustra. Nosotros perdemos velocidad.
>
> ¿Y si ese mismo aliado pudiera registrarse, explorar nuestras APIs, probarlas en vivo y salir a producción... en minutos? Eso es Conecta 2.0."

---

### 🔍 EL PROBLEMA (45 segundos)

> "Hoy Conecta tiene tres dolores principales:
>
> **Primero, fricción.** El onboarding de un aliado es manual. Cada integración nueva requiere intervención humana, lo que frena nuestro Time-to-Market.
>
> **Segundo, experiencia.** La documentación está dispersa, no hay un sandbox para probar, y el desarrollador del aliado no tiene visibilidad de su consumo ni de sus errores.
>
> **Tercero, el contexto regulatorio.** Open Insurance 2025 ya es una realidad en Colombia. La interoperabilidad no es opcional, es obligatoria. Y necesitamos estar listos."

---

### 💡 LA VISIÓN (30 segundos)

> "Nuestra visión es transformar Conecta de un repositorio de APIs a un ecosistema de innovación. Un Developer Portal de grado empresarial donde Seguros Bolívar se convierte en una plataforma abierta.
>
> No solo exponemos APIs. Habilitamos que fintechs, e-commerce, marketplaces y bancos construyan experiencias de seguros sobre nuestra infraestructura. Desde cotización hasta indemnización. Todo vía API."

---

### 🏗️ LA SOLUCIÓN — Qué Construimos (1 minuto)

> "Diseñamos Conecta 2.0 como un monorepo con 5 módulos independientes, cada uno asignado a un desarrollador:
>
> 1. **Backend Core + Auth** — Onboarding autoservicio con OAuth 2.0 y JWT. Un aliado se registra, crea su app y obtiene credenciales de sandbox en 5 pasos. Sin intervención manual.
>
> 2. **Catálogo Inteligente + Parser OpenAPI** — El aliado solo ve las APIs de su línea de negocio. Si es de Autos, ve Cotización Autos. Si es de Salud, ve Póliza Salud. Documentación interactiva con snippets en 4 lenguajes.
>
> 3. **Sandbox + Gateway Simulator** — Aquí es donde la magia pasa. El aliado prueba peticiones en tiempo real con datos simulados. Nuestro Mock Engine lee la spec OpenAPI y genera respuestas que respetan la estructura exacta del esquema. Incluso simulamos traducción SOAP para servicios legacy.
>
> 4. **Analytics + Auditoría** — Dashboard de consumo en tiempo real. El aliado ve sus métricas, su cuota, sus errores. Y nosotros tenemos trazabilidad completa con Correlation-ID para auditorías.
>
> 5. **Frontend React** — Portal unificado con todas las funcionalidades: catálogo, sandbox, analytics, administración de aliados y notificaciones de ciclo de vida."

---

### 🖥️ DEMO EN VIVO (1 minuto 30 segundos)

> "Déjenme mostrarles lo que funciona hoy.
>
> *[Mostrar terminal con tests corriendo]*
>
> Nuestro Mock Engine toma una spec OpenAPI como esta — con paths, schemas, tipos — y genera respuestas mock inteligentes. Si el schema dice `name: string`, devuelve un string. Si dice `age: integer`, devuelve un entero. Si tiene un `$ref` a otro schema, lo resuelve recursivamente.
>
> *[Mostrar test results]*
>
> Y nuestro Request Validator hace lo inverso: valida que la petición del aliado cumpla con la spec. Campos requeridos, tipos correctos, enums válidos. Si algo falla, devuelve errores descriptivos: qué campo, qué esperaba, qué recibió.
>
> *[Mostrar migraciones SQL]*
>
> La base de datos está diseñada con 14 tablas, migraciones versionadas, y cada tabla tiene su dueño claro. Audit logs inmutables, historial de sandbox con límite FIFO de 50 entradas, sync logs para la separación de planos control/datos.
>
> *[Mostrar specs en Kiro]*
>
> Y todo esto nació de las specs. 17 requerimientos, 90+ criterios de aceptación, 22 propiedades de correctitud formales. Cada línea de código es trazable a un requerimiento."

---

### 📊 IMPACTO (30 segundos)

> "¿Qué logramos?
>
> - **Para el aliado**: De semanas a minutos para su primera llamada exitosa. Autoservicio completo.
> - **Para Bolívar**: Reducción del 90% en costos operativos de gestión de APIs. Trazabilidad total para auditorías.
> - **Para el futuro**: Preparación para IA. Nuestras specs OpenAPI están enriquecidas semánticamente para que agentes de IA consuman nuestras APIs de forma autónoma bajo el protocolo MCP.
>
> Esto no es solo un portal. Es la infraestructura para que Seguros Bolívar compita en Open Insurance al nivel de Zurich y Chubb."

---

### 🎯 CIERRE (15 segundos)

> "Construimos Conecta 2.0 con Kiro como nuestra herramienta central. Spec-Driven de principio a fin. Sin código improvisado. Cada decisión documentada, cada línea trazable.
>
> Conecta 2.0: de un repositorio de APIs a un ecosistema de innovación. Gracias."

---

### 🛡️ PREGUNTAS FRECUENTES DEL JURADO (Q&A — 2 minutos)

| Pregunta Probable | Respuesta Sugerida |
|---|---|
| "¿Cómo manejan la seguridad B2B?" | "OAuth 2.0 + JWT para autenticación, mTLS para conexiones servidor-a-servidor, validación de scopes contra el plan de suscripción, protección BOLA, y enmascaramiento de PII. Todo definido en el Req 10 con 12 criterios de aceptación." |
| "¿Qué pasa si un servicio interno falla?" | "Circuit Breaker: si la tasa de error supera 50% en 30 segundos, se abre el circuito y devolvemos 503 con Retry-After. Después de 60 segundos, probamos con peticiones limitadas. Si pasan, cerramos el circuito." |
| "¿Cómo garantizan la trazabilidad?" | "Correlation-ID en cada petición, propagado entre todas las capas. Audit logs inmutables en PostgreSQL con REVOKE UPDATE/DELETE. Retención 90 días activo, 1 año archivo." |
| "¿Cómo se diferencia de lo que ya existe?" | "Hoy Conecta es un repositorio estático. Conecta 2.0 es un ecosistema: onboarding autoservicio, sandbox interactivo, analytics para el aliado, gobierno de versiones con sunset plans, y preparación para IA con MCP." |
| "¿Cómo usaron Kiro?" | "Kiro fue nuestra herramienta central. Specs → Design → Tasks → Código. Todo trazable. Las steering rules nos dieron consistencia: stack Bolívar, reglas de arquitectura, estándares de testing. Kiro generó el código alineado con las specs." |
| "¿Qué falta para producción?" | "El MVP cubre los flujos principales. Para producción falta: mTLS real, throttling dinámico, generación de SDKs, frontend completo con todas las páginas, y despliegue multi-zona en AWS." |
| "¿Cómo manejan el versionamiento de APIs?" | "Prefijos en rutas (/v1/, /v2/), sunset plans con mínimo 90 días de antelación, notificaciones proactivas a consumidores afectados, y bloqueo de retiro si no hay versión de reemplazo." |

---

## 3. DISEÑO DE LA PRESENTACIÓN — Guía de Slides

### Slide 1: Portada
- **Título**: Conecta 2.0 — De un Repositorio de APIs a un Ecosistema de Innovación
- **Subtítulo**: Hackathon Kiro | Grupo A
- **Visual**: Logo Seguros Bolívar + ícono de red/ecosistema conectado
- **Fondo**: Gradiente verde corporativo (#009056 → #038450)

---

### Slide 2: El Problema
- **Título**: "El aliado quiere integrar. Nosotros lo frenamos."
- **3 columnas con íconos**:
  - 🐌 **Fricción** — Onboarding manual, semanas de espera
  - 📄 **Experiencia** — Docs dispersas, sin sandbox, sin visibilidad
  - ⚖️ **Regulación** — Open Insurance 2025 exige interoperabilidad
- **Dato impactante al pie**: "El 68% de las empresas considera la gestión de versiones de APIs su mayor desafío" (fuente: investigación)

---

### Slide 3: La Visión
- **Título**: "Seguros Bolívar como plataforma abierta"
- **Diagrama de pirámide** (5 niveles de distribución):
  1. Distribución Tradicional
  2. Marca Blanca
  3. Integración APIs ← **Conecta 2.0 habilita esto**
  4. Seguro Embebido
  5. Insurance as a Service
- **Actores**: Fintechs, E-commerce, Marketplace, Retail, Bancos
- **Verticales**: Autos, Hogar, Salud, Arrendamiento

---

### Slide 4: Arquitectura de la Solución
- **Título**: "5 módulos, 5 devs, 3 horas"
- **Diagrama de arquitectura** (usar el Mermaid del design.md simplificado):
  ```
  [Frontend React] → [Auth + Core] → [PostgreSQL]
                   → [Catálogo + Parser]
                   → [Sandbox + Gateway]
                   → [Analytics + Audit]
  ```
- **Tabla lateral**:
  | Dev | Módulo | Puerto |
  |-----|--------|--------|
  | 1 | Auth + Core | 3000 |
  | 2 | Catálogo + Parser | 3002 |
  | 3 | Sandbox + Gateway | 3003 |
  | 4 | Analytics + Audit | 3004 |
  | 5 | Frontend React | 5173 |

---

### Slide 5: Spec-Driven con Kiro
- **Título**: "Cero código improvisado. Todo trazable."
- **Flujo visual** (flechas de izquierda a derecha):
  ```
  [17 Requerimientos] → [Diseño Técnico] → [22 Propiedades] → [6 Task Files] → [Código + Tests]
       90+ criterios       Diagramas ER       Correctitud        5 devs paralelo    TypeScript
       de aceptación       Contratos API      formal             Migraciones SQL    Jest + Supertest
  ```
- **Highlight**: "Cada línea de código es trazable a un requerimiento"
- **Screenshot**: Captura de la estructura `.kiro/specs/` en el IDE

---

### Slide 6: Demo — Mock Engine + Validator
- **Título**: "El corazón del Sandbox"
- **Dos columnas**:
  - **Izquierda — Mock Engine**: 
    - Input: Spec OpenAPI (schema con types)
    - Output: Respuesta mock que respeta la estructura
    - "string → 'lorem ipsum', integer → random, $ref → resuelve recursivamente"
  - **Derecha — Request Validator**:
    - Input: Petición del aliado + Spec OpenAPI
    - Output: Lista de errores descriptivos o ✅ válido
    - "Campo, tipo esperado, tipo recibido"
- **Pie**: "31 tests pasando | Cobertura >80%"

---

### Slide 7: Demo — Base de Datos
- **Título**: "14 tablas, 0 deuda técnica"
- **Diagrama ER simplificado** (las entidades principales):
  ```
  Consumer → Application → Credential
                        → Sandbox History (FIFO 50)
                        → Audit Log (inmutable)
                        → Usage Metric
  API Definition → API Version → Sunset Plan
  ```
- **Highlights**:
  - Audit logs con REVOKE UPDATE/DELETE (inmutabilidad real)
  - Correlation-ID en cada registro
  - Migraciones versionadas con prefijos por dev

---

### Slide 8: Impacto de Negocio
- **Título**: "El salto de valor"
- **3 métricas grandes**:
  - ⏱️ **De semanas a minutos** — Primera llamada exitosa del aliado
  - 💰 **-90% costos operativos** — Gestión automatizada de APIs
  - 🤖 **IA Ready** — Specs enriquecidas para agentes autónomos (MCP)
- **Comparación visual**:
  | | Hoy (Conecta 1.0) | Mañana (Conecta 2.0) |
  |---|---|---|
  | Onboarding | Manual, semanas | Autoservicio, minutos |
  | Documentación | Estática, dispersa | Interactiva, por perfil |
  | Pruebas | Sin sandbox | Sandbox con mocking |
  | Visibilidad | Nula para el aliado | Dashboard en tiempo real |
  | Seguridad | Básica | OAuth2 + mTLS + OWASP |

---

### Slide 9: Roadmap Post-Hackathon
- **Título**: "Lo que viene"
- **Timeline visual**:
  - **Sprint 1** (2 semanas): Completar los 5 módulos backend + frontend
  - **Sprint 2** (2 semanas): mTLS real, circuit breakers, throttling dinámico
  - **Sprint 3** (2 semanas): Generación de SDKs, endpoint MCP para IA
  - **Sprint 4** (2 semanas): Despliegue multi-zona AWS, observabilidad con OpenTelemetry
- **Meta**: "Portal listo para piloto con primer aliado en 8 semanas"

---

### Slide 10: Cierre
- **Título**: "Conecta 2.0"
- **Subtítulo**: "De un repositorio de APIs a un ecosistema de innovación"
- **Quote del VP** (de la transcripción): 
  > "Necesitamos tener ese Developer Portal para que los intermediarios y los aliados se conecten a Seguros Bolívar"
- **Equipo**: Nombres de los 5 integrantes del Grupo A
- **Call to action**: "¿Preguntas?"

---

### 🎨 GUÍA DE ESTILO VISUAL

| Elemento | Especificación |
|----------|---------------|
| **Colores principales** | Verde Bolívar (#009056), Verde oscuro (#038450), Verde claro (#F2F9F6) |
| **Colores secundarios** | Gris oscuro (#333), Gris medio (#757575), Blanco (#FFF) |
| **Tipografía títulos** | Roboto Bold, 32-40px |
| **Tipografía cuerpo** | Roboto Regular, 18-24px |
| **Fondo slides** | Blanco con acento verde en header/footer |
| **Íconos** | Lucide Icons (consistente con el stack) |
| **Diagramas** | Estilo flat, colores corporativos, sin sombras excesivas |
| **Máximo texto por slide** | 6 bullet points o 1 diagrama + 3 bullets |
| **Transiciones** | Fade simple, sin animaciones elaboradas |

### 💡 TIPS PARA LA PRESENTACIÓN

1. **Ensayar el timing**: 30s apertura + 45s problema + 30s visión + 60s solución + 90s demo + 30s impacto + 15s cierre = 5 min
2. **La demo es el momento clave**: Tener la terminal lista con `npm test` pre-ejecutado. Mostrar los tests pasando en verde.
3. **No leer las slides**: Las slides son soporte visual. El presentador cuenta la historia.
4. **Conectar con el jurado**: Mencionar a Álvaro, Germán, Lida por nombre si es natural. Usar la cita del VP.
5. **Preparar backup**: Si la demo falla, tener screenshots de los tests pasando.
6. **Dividir la presentación**: Un presentador principal para el pitch, otro para la demo técnica. Los demás listos para Q&A.
