---
inclusion: always
---

# Reglas de Testing Fullstack — Cobertura SonarQube

## Mandato de Coherencia

Por cada cambio en lógica de negocio (Frontend o Backend), se DEBE generar automáticamente el código del test unitario correspondiente. No se acepta código de lógica sin su test asociado.

---

## Frontend (Angular)

### Framework de Testing

- Jasmine + Karma (default de Angular) o Jest como alternativa.
- Cada componente, servicio, pipe, guard, interceptor y directiva DEBE tener su archivo `.spec.ts` junto al archivo fuente.

### Reglas Obligatorias

- Simular estados de carga (`loading`), éxito (`success`) y error (`error`) en cada componente que consuma datos asíncronos.
- Usar `HttpClientTestingModule` y `HttpTestingController` para mockear llamadas HTTP. Nunca hacer llamadas reales en tests.
- Usar `ComponentFixture` y `TestBed` para tests de componentes standalone.
- Verificar renderizado condicional: elementos que aparecen/desaparecen según estado.
- Testear event handlers (`handleClick`, `handleSubmit`, etc.) y validar que emitan los eventos o llamen los servicios correctos.
- Para Web Components (`<sb-ui-datepicker>`, `<sb-ui-modal>`, etc.), usar `CUSTOM_ELEMENTS_SCHEMA` en el TestBed.

### Estructura de un Test de Componente

```typescript
describe('MiComponente', () => {
  // Setup con TestBed
  // Test: debe crear el componente
  // Test: debe mostrar spinner en estado loading
  // Test: debe mostrar datos en estado success
  // Test: debe mostrar mensaje de error en estado error
  // Test: debe llamar al servicio al ejecutar acción
});
```

### Estructura de un Test de Servicio

```typescript
describe('MiServicio', () => {
  // Setup con HttpClientTestingModule
  // Test: debe hacer GET y retornar datos
  // Test: debe manejar error HTTP 400/401/500
  // Test: debe enviar headers correctos
});
```

---

## Backend — Node.js (Express/Fastify)

### Framework de Testing

- Jest + Supertest para tests de integración de APIs.
- Jest para tests unitarios de servicios y utilidades.

### Reglas Obligatorias

- Probar las 3 capas: Controladores (rutas), Servicios (lógica) y Repositorios (acceso a datos).
- Mockear conexiones a PostgreSQL, MongoDB y cualquier API externa con `jest.mock()` o `jest.spyOn()`.
- Cada endpoint debe tener tests para: respuesta exitosa (200/201), validación fallida (400), no autorizado (401), no encontrado (404) y error interno (500).
- Validar que el `Correlation-ID` se propague correctamente entre capas.
- Testear middleware de autenticación (JWT) con tokens válidos, expirados e inválidos.

### Estructura de un Test de Controlador (Node)

```javascript
describe('POST /v1/api/recurso', () => {
  // Test: debe retornar 201 con datos válidos
  // Test: debe retornar 400 con datos inválidos
  // Test: debe retornar 401 sin token JWT
  // Test: debe retornar 500 cuando el servicio falla
});
```

### Estructura de un Test de Servicio (Node)

```javascript
describe('RecursoService', () => {
  // Setup con mocks del repositorio
  // Test: debe retornar datos del repositorio
  // Test: debe lanzar error si no encuentra recurso
  // Test: debe validar reglas de negocio antes de guardar
});
```

---

## Backend — Java (Spring Boot)

### Framework de Testing

- JUnit 5 + Mockito para tests unitarios.
- Spring Boot Test + MockMvc para tests de integración de controladores.
- `@DataJpaTest` para tests de repositorios.

### Reglas Obligatorias

- Probar las 3 capas: `@RestController`, `@Service` y `@Repository`.
- Usar `@MockBean` o `Mockito.mock()` para aislar dependencias. Nunca conectar a BD real en tests unitarios.
- Cada endpoint debe tener tests para: 200/201, 400, 401, 404 y 500.
- Validar anotaciones de seguridad (`@PreAuthorize`, roles, scopes).

### Estructura de un Test de Controlador (Java)

```java
@WebMvcTest(RecursoController.class)
class RecursoControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean RecursoService service;
    // Test: POST con datos válidos retorna 201
    // Test: POST con datos inválidos retorna 400
    // Test: GET sin token retorna 401
}
```

### Estructura de un Test de Servicio (Java)

```java
@ExtendWith(MockitoExtension.class)
class RecursoServiceTest {
    @Mock RecursoRepository repository;
    @InjectMocks RecursoService service;
    // Test: debe retornar recurso por ID
    // Test: debe lanzar excepción si no existe
    // Test: debe validar reglas de negocio
}
```

---

## Mocks Dinámicos

- PROHIBIDO hacer llamadas reales a bases de datos, APIs externas de Bolívar (CONECTA, COMUNES) o servicios de terceros en tests.
- Usar mocks/stubs que simulen respuestas reales con datos representativos.
- Los mocks deben cubrir escenarios: respuesta exitosa, timeout, error de red y respuesta con datos vacíos.
- Centralizar fixtures/mocks reutilizables en carpetas dedicadas:
  - Frontend: `src/app/testing/mocks/`
  - Backend Node: `tests/mocks/` o `__mocks__/`
  - Backend Java: `src/test/resources/fixtures/`

---

## Métricas SonarQube — Quality Gate

| Métrica | Umbral Mínimo |
|---------|---------------|
| Cobertura de líneas | > 80% |
| Code Smells críticos | 0 |
| Code Smells mayores | < 5 |
| Bugs | 0 |
| Vulnerabilidades | 0 |
| Duplicación de código | < 3% |
| Deuda técnica | < 30 min por archivo |

### Reglas para Cumplir el Quality Gate

- No dejar código muerto (funciones, variables o imports sin usar).
- No usar `any` en TypeScript; definir tipos estrictos siempre.
- No dejar `console.log` en código productivo; usar el sistema de logging centralizado.
- No ignorar errores con `catch` vacíos; siempre loguear o relanzar.
- Complejidad ciclomática máxima por función: 10.
- Máximo 300 líneas por archivo de código fuente.
- Cada función debe tener una sola responsabilidad.
