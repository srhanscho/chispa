# Contratos de datos e integración futura

## Lección mock

Datos de muestra: `../demo/lesson_dinosaurios.json`. Basado en la estructura del PRD: `topic`, `style`, `level`, `cover`, `cards[]`, `quiz[]`, `sticker`. El frontend no debe exponer ninguna API key.

## Servicio extensible

Interfaz orientativa (conceptual, no obligatoria):

- `getLesson(topic, age, style, level): Promise<Lesson>` — por ahora lee fixture JSON; más adelante `POST /api/lesson`.
- `getReexplanation(question, chosenAnswer, correctAnswer, style): Promise<{text: string; speech: string}>` — por ahora mock; más adelante `POST /api/reexplain` con Gemma.
- `getAdultNote(sessionSummary): Promise<{note: string; nextStyle: string}>` — por ahora mock; más adelante `POST /api/note` con Gemma.
- `getTopicFromPhoto(image): Promise<...>` — P1; no es funcionalidad del primer prototipo.

## Estado del personaje

Emitir los eventos: `APP_READY`, `LESSON_REQUESTED`, `LESSON_CARD_SHOWN`, `SPEECH_STARTED`, `SPEECH_ENDED`, `QUIZ_STARTED`, `CHILD_NEEDS_HELP`, `REWARD_EARNED`.

En esta entrega el componente Lulo muestra el PNG canónico. Para la futura integración Rive ver `../especificaciones/04_lulo_plan_integracion_rive.json`. **Estos estados son propuesta de integración, no API certificada de Rive**.

## Perfil demo no sensible

Guardar localmente solo contadores de estrellas, sticker ganado y resumen de sesión para demo. Si se soportan perfiles, utilizar seudónimos ficticios y datos precargados; no usar información identificable de niños.

## Independencia de servicios

No meter `fetch` de proveedores dentro de componentes. Centralizar en `lib/services` o similar. El servicio mock debe permitir probar la app sin conexión.

## Safety

- Tratar entradas de texto como no confiables; validación de longitud y campos.
- La transición a servicios de IA se realizará en backend; no enviar historial íntegro a terceros por defecto.
- El panel adulto no debe decir que Lulo diagnostica o determina estilos permanentes.
