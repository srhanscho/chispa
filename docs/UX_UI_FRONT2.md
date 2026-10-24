# Front2: investigación y decisiones de UX/UI

Fecha: 24 de octubre de 2026. Público principal: personas de 6–12 años; acompañantes y otras personas también pueden usar los controles de lectura y navegación. Esta revisión combina investigación documental, inspección de la interfaz y pruebas funcionales. **No sustituye una prueba de usabilidad con niños ni demuestra mejoras de aprendizaje.**

## Qué aprendimos y qué cambiamos

| Evidencia consultada | Decisión aplicada en Chispa | Cómo comprobarla |
| --- | --- | --- |
| NN/g describe dificultades con instrucciones largas, navegación redundante y diferencias entre edades. [Investigación con niños](https://www.nngroup.com/articles/childrens-websites-usability-issues/) | Inicio con una acción directa, instrucciones breves, tres destinos claros y ayuda desplegable. Panel de acompañantes en el pie. | Entrar, elegir una aventura y explicar cuál es el siguiente paso. |
| La misma investigación observa expectativas de interacción con personajes y preferencia por acciones táctiles sencillas. [NN/g](https://www.nngroup.com/articles/childrens-websites-usability-issues/) | Lulo puede saludarse con un toque o teclado; la reacción es breve, sin sonido automático. Tarjetas de tema grandes. | Activar el saludo y una aventura con toque, Enter o espacio. |
| W3C explica que los objetivos grandes o suficientemente separados reducen errores de activación. El mínimo AA tiene excepciones y no equivale a recomendar botones diminutos. [Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Acciones principales de al menos 56 px de alto; opciones amplias y separadas; elegir una respuesta no la evalúa hasta pulsar Comprobar. | Cambiar de opción antes de enviar y revisar tamaño/foco en móvil. |
| W3C recomienda permitir desactivar movimiento no esencial. [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Preferencia local Sin animaciones, soporte de `prefers-reduced-motion`, entradas suaves y celebración breve. No hay movimiento continuo mientras se leen respuestas. | Desactivar movimiento y comprobar avatar, transiciones y carga. |
| CAST propone opciones de participación, percepción, autonomía y feedback orientado a la acción. [UDL 3.0](https://udlguidelines.cast.org/engagement/) | Texto más grande, voz opcional con botón Detener, pista y explicación alternativa, mensajes que indican cómo seguir y sin penalización por pedir ayuda. | Completar una aventura usando lectura, teclado y ayudas. |
| CAST incluye organización y seguimiento del avance. [UDL 3.0](https://udlguidelines.cast.org/engagement/) | Trayecto Descubre → Juega → Celebra, posición visible y Pausar y guardar. La sesión se recupera después de recargar. | Pausar antes y después de comprobar una respuesta; continuar sin sumar dos veces. |

Los tiempos de animación y la duración estimada de las aventuras son decisiones de producto, no umbrales probados por estas fuentes. Las duraciones son orientativas; no hay cronómetro ni presión para responder rápido.

## Funciones incluidas

- Tres aventuras locales completas: Dinosaurios, Planetas y El océano. Las dos últimas incluyen cuatro tarjetas y tres preguntas propias. Un tema no disponible muestra una explicación; no abre otro tema silenciosamente.
- Ilustraciones SVG locales, reutilizables y decorativas. El contenido necesario está también en texto y voz. La identidad de Lulo sigue usando el PNG original aportado.
- Respuestas con selección revisable y confirmación explícita, feedback textual y señal visual. El significado no depende solo del color.
- Recuperación validada de la aventura: tarjeta/pregunta, elección, resultado, ayudas y aciertos. Se valida la posición y el puntaje antes de restaurar datos del navegador.
- Álbum visual con logros ganados y pendientes; estrellas por participación/aciertos, sin rachas ni clasificación pública.
- Misión opcional fuera de pantalla al terminar: dibujar o explicar un descubrimiento a otra persona.
- Fuente ampliable, movimiento desactivable, foco visible, controles semánticos, ausencia de audio automático y funcionamiento sin micrófono.

Los datos permanecen en este navegador. El guardado puede no persistir si el navegador bloquea el almacenamiento. El indicador de voz refleja eventos del navegador; no hay sincronización labial ni archivo Rive.

## Contenido de las nuevas aventuras

Las explicaciones son originales y simplificadas para esta demo. Sus hechos se contrastaron con fuentes primarias:

- Planetas: ocho planetas, órbitas alrededor del Sol y Júpiter como el mayor. [NASA: About the Planets](https://science.nasa.gov/solar-system/planets/). El Sol como estrella: [NASA: Sun Facts](https://science.nasa.gov/sun/facts/).
- Océano: diferencia entre respiración con branquias y pulmones del delfín. [NOAA: Are dolphins fish?](https://oceanservice.noaa.gov/facts/dolphin.html). Cuidado frente a residuos: [NOAA: Marine Debris Impacts](https://oceanservice.noaa.gov/education/tutorial-coastal/marine-debris/md06.html).

## Ideas nuevas para las próximas versiones

| Prioridad | Idea | Beneficio previsto y condición |
| --- | --- | --- |
| P1 | Cuaderno de hallazgos favoritos | Guardar una tarjeta y contar por qué llamó la atención. Evitar convertirlo en otra tarea obligatoria. |
| P1 | Biblioteca editable para docentes | Validar JSON con el contrato existente, previsualizar y revisar contenido antes de publicarlo. Priorizar calidad frente a cantidad. |
| P1 | Modo sin conexión instalable | Descargar aventuras elegidas y sus recursos. Mostrar claramente qué está disponible sin red; no prometer IA offline. |
| P1 | Pruebas por franjas 6–8 y 9–10 | Ajustar vocabulario y densidad mediante observación, sin inferir capacidades a partir de la edad únicamente. |
| P2 | Lulo articulado con Rive | Saludo, espera, explicación y apoyo a partir de capas/rig reales; conservar controles de movimiento y fallback estático. |
| P2 | Revisión espaciada opcional | Volver a una pregunta después, sin rachas, castigos por ausencia o avisos insistentes. Requiere validar su utilidad. |
| P2 | Más opciones de lectura | Velocidad de voz, vocabulario explicado y fragmentos escuchables; probar compatibilidad de voces antes de ofrecerlo. |

Son hipótesis de producto, no funciones ya entregadas ni recomendaciones de eficacia demostrada para Chispa.

## Propuesta de validación con usuarios

Observar sesiones cortas acompañadas con personas de ambas franjas y con adultos que usen teclado o texto ampliado. No hace falta pedir nombres, fotos ni registrar audio para detectar problemas de navegación.

1. Encontrar una aventura y explicar qué cree que pasará al pulsarla.
2. Leer o escuchar una tarjeta, detener la voz y pedir otra explicación.
3. Elegir una respuesta, cambiarla antes de confirmar y comprender el feedback.
4. Pausar, cerrar/recargar y continuar donde quedó.
5. Encontrar el sticker y contar un descubrimiento con sus propias palabras.

Registrar dónde necesitan ayuda, pulsaciones accidentales, pasos que no entienden y si encuentran cómo detener voz/movimiento. Las metas iniciales son completar el recorrido sin instrucciones del facilitador, recuperar el avance y entender el siguiente paso; deben revisarse con los resultados reales.
