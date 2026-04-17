# 🎤 Pitch Final — Conecta 2.0 (3 minutos)

> Guión para presentar al jurado. Tono: cercano, seguro, con energía. Nada de leer — contar una historia.

---

## 🟢 APERTURA — El gancho (30 seg)

**[Sonreír, contacto visual con el jurado]**

> "Imagínense esto: una fintech en Bogotá quiere ofrecer seguros de autos dentro de su app. Hoy, para lograrlo, tiene que mandar correos, esperar aprobaciones, leer PDFs de 80 páginas y rezar para que las credenciales funcionen. Semanas. A veces meses.
>
> ¿Y si ese aliado pudiera registrarse solo, explorar nuestras APIs, probarlas en vivo y salir a producción... en minutos?
>
> Eso es **Conecta 2.0**."

---

## 🔴 EL PROBLEMA — 3 dolores (30 seg)

**[Levantar un dedo por cada dolor]**

> "Hoy tenemos tres dolores:
>
> **Uno: Demoras.** El aliado quiere arrancar y nosotros lo frenamos con trámites manuales.
>
> **Dos: Va a ciegas.** No tiene dónde probar, no sabe cuánto consume, y la documentación está regada.
>
> **Tres: El mundo cambió.** Open Insurance 2026 nos obliga a abrir nuestros servicios. No es opcional. Quien no se adapte, se queda atrás."

---

## 🟢 LA SOLUCIÓN — Qué construimos (1 min)

**[Señalar la pantalla con el diagrama de arquitectura]**

> "Somos 5 desarrolladores. Trabajamos en paralelo, cada uno en su módulo, dentro de un solo repositorio compartido. Sin pisarnos. Sin conflictos.
>
> **Dev 1** construyó el corazón: registro, login, seguridad con OAuth y JWT. El aliado se registra solo en 5 pasos.
>
> **Dev 2** armó el catálogo inteligente. El aliado solo ve las APIs de su línea de negocio, con documentación interactiva y código listo para copiar en 4 lenguajes.
>
> **Dev 3** creó el Sandbox. Nuestro Motor de Mocks lee la especificación OpenAPI y genera respuestas realistas. El aliado prueba en vivo sin tocar producción.
>
> **Dev 4** montó Analytics y Auditoría. Dashboard de consumo en tiempo real, cuotas, y un registro de auditoría que nadie puede borrar ni modificar.
>
> **Dev 5** unió todo en un portal React donde el aliado hace su viaje completo: registrarse, explorar, probar, medir.
>
> Todo esto nació de las especificaciones en Kiro. 17 requerimientos, diseño técnico, y luego código. Cero improvisación."

---

## 💥 IMPACTO — Los 3 números (30 seg)

**[Pausa dramática antes de cada número]**

> "Tres cosas que cambian con Conecta 2.0:
>
> **De semanas a minutos** para que un aliado haga su primera llamada exitosa.
>
> **IA Ready.** Nuestras especificaciones están preparadas para que agentes de inteligencia artificial consuman nuestros servicios de forma autónoma.
>
> Y lo más importante: **pasamos de una visión local a una visión global.** Ya no solo vendemos seguros en Colombia. Con Conecta 2.0, cualquier aliado del mundo puede conectarse a nuestra plataforma. Open Insurance sin fronteras. Jugamos en la misma liga que Zurich y Chubb."

---

## 🏁 CIERRE — La frase que queda (20 seg)

**[Mirar al jurado, bajar la voz un poco, hablar con convicción]**

> "Construimos esto en 3 horas, 5 personas, con Kiro como copiloto.
>
> Conecta 2.0 no es un repositorio de APIs. Es el ecosistema que convierte a Seguros Bolívar en una plataforma abierta para el mundo.
>
> Gracias."

**[Silencio. Sonreír. Esperar aplausos 😄]**

---

## 🛡️ Q&A — Respuestas rápidas

| Pregunta probable | Respuesta |
|---|---|
| ¿Cómo manejan la seguridad? | OAuth 2.0 + JWT + tokens en httpOnly cookies. OWASP API Top 10. |
| ¿Si un servicio se cae? | Circuit Breaker: detecta fallas, corta el tráfico, responde con retry. |
| ¿Cómo se coordinaron 5 devs? | Monorepo con módulos aislados. Cada dev tiene sus tablas, su puerto, sus migraciones. Contratos compartidos en /shared. |
| ¿Cómo usaron Kiro? | Spec-Driven: Requirements → Design → Tasks → Código. Steering rules del stack Bolívar. Trazabilidad total. |
| ¿Qué falta para producción? | mTLS real, throttling dinámico, SDKs auto-generados, despliegue multi-zona en AWS. |

---

> 💡 **Tips para el presentador:**
> - No leas. Cuenta la historia.
> - Usa las manos: señala la pantalla, levanta dedos para los números.
> - Haz pausas antes de los datos de impacto. El silencio genera expectativa.
> - Cierra mirando al jurado, no a la pantalla.
> - Si te preguntan algo que no sabes: "Gran pregunta, eso está en nuestro roadmap para la siguiente fase."
