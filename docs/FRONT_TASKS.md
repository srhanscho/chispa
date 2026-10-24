# Actualización de experiencia — front2

Implementación de `chispa-tareas-front.md` sobre `origin/main` (872f87c), conservando la rama `front2` y el PNG oficial de Lulo solicitados previamente.

| Tarea           | Entregado                                                                                                      | Validación o límite                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Inicio          | Nombre y edad del perfil; dictado opcional; carga con mensajes rotativos; preferencias de lectura y movimiento | Sin cuenta: Sofía y Mateo, persistencia local                              |
| Clase y trivia  | Texto primero, fotos con créditos, aparición suave, ayuda amable, premio y sticker                             | Fotos externas conservan atribución y respaldo local                       |
| Panel adulto    | Barras de estilos, dominio con `levelFor`, nota de sesión, comparación historia/visual                         | `/api/note`; si falla, el resumen se identifica como local                 |
| Chat            | Burbujas, últimos 10 mensajes, voz y acciones `start_lesson`, `start_quiz`, `none`                             | `/api/tutor`; la generación real requiere configurar el servidor           |
| Cuenta y cursos | Login opcional, niños de `/api/me`, crear niño, guardar clase y resultado, sincronizar perfil y repetir cursos | Usa `accountFetch`; integración real de Supabase pendiente de credenciales |
| Sugerencias     | Tres temas en inicio y premio con motivo                                                                       | `/api/suggest`, con alternativas locales si falla                          |
| Foto            | Selección/cámara opcional, vista previa, JPEG máximo 1024 px y confirmación antes de enviar                    | `/api/topic-from-photo`; reconocimiento real pendiente de credenciales     |
| Álbum           | Stickers por perfil, estrellas, niveles y racha por fecha de Bogotá                                            | Sin ranking ni castigos                                                    |
| Pitch           | `/pitch`: 5 diapositivas, guion de 3 minutos y PowerPoint descargable                                          | Los dos ensayos con el compañero quedan pendientes; no se simulan          |

## Comportamiento sin servicios

Las lecciones usan HTTP por defecto. Si la API falla, se recurre al catálogo local. `NEXT_PUBLIC_LESSON_SOURCE=demo` permite practicar con clases incluidas sin generación. Los perfiles y cursos de invitados se guardan por niño; la aventura pausada comprueba su propietario. El cambio de cuenta invalida la sesión anterior. Las imágenes pueden mostrar el respaldo de Lulo cuando no haya conexión. La voz depende del navegador.

No se añadieron librerías de interfaz. Esta actualización no cambia los contratos, rutas ni el comportamiento del motor; conserva los cambios previos de `front2`. La investigación UX y sus fuentes están en [UX_UI_FRONT2.md](UX_UI_FRONT2.md).

## Ensayo sugerido (3 minutos)

1. 0:00–0:25: problema y presentación de Lulo.
2. 0:25–1:15: iniciar Dinosaurios; leer una tarjeta y contestar una trivia.
3. 1:15–1:50: abrir el panel adulto y comparar Sofía con Mateo.
4. 1:50–2:25: preguntar a Lulo y mostrar una sugerencia o un curso guardado.
5. 2:25–3:00: explicar el motor, Gemma y los siguientes pasos.

Realizar dos ensayos humanos con el compañero antes de la presentación. No incluir claves en grabaciones ni diapositivas.

