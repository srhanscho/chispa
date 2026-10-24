# Verificación del frontend de Lulo

Adaptado sobre `310c4af`, conservando la configuración de pensamiento y los registros de rendimiento del backend de Gemma.

- Compilación de producción: correcta con Next.js 16.4.3, incluida la comprobación de TypeScript.
- ESLint: correcto.
- Vitest: 33 pruebas correctas en 7 archivos. Incluyen catálogo de tres aventuras, validación de sesiones recuperadas, recompensas, contratos de eventos, independencia del mock, validación HTTP y ciclo de voz.
- Navegador: recorrido de cinco tarjetas, navegación anterior/siguiente, pista, respuesta incorrecta con apoyo, respuestas correctas y recompensa.
- Inicio mediante teclado: formulario enviado con Enter, foco en encabezados al cambiar de pantalla.
- Persistencia: recarga conserva estrellas, sticker y contadores del panel adulto; no hay errores o advertencias de consola.
- Responsive: vistas de 375, 768 y 1280 px sin desbordamiento horizontal en las medidas finales. Se corrigió el desbordamiento del fondo decorativo en tablet.
- Front2: elección de respuesta revisable antes de comprobar, feedback comprensivo, pausa y recuperación exacta de tarjeta, y recuperación de una respuesta ya evaluada sin duplicar su acierto.
- Movimiento reducido: ajuste local y preferencia del sistema. Se verificó `animation-name: none` con el ajuste local activo; texto ampliado y movimiento se conservan al recargar. Trivia estática; celebraciones breves.
- Producción: recorrido completo de Planetas con 2 aciertos de 3, sumando exactamente 3 estrellas; álbum actualizado y aventura terminada sin banner de recuperación. Tema no disponible avisa sin abrir otra aventura.

La reproducción audible y el dictado real dependen de permisos, voces y servicios del navegador; no se probaron con un micrófono real. El ciclo de síntesis se comprobó con pruebas automatizadas. No se verificaron proveedores de IA con credenciales reales ni un rig de Rive, que no forma parte del paquete.

## Archivos principales

`components/ChispaApp.tsx` contiene el recorrido; `components/LuloAvatar.tsx` el avatar; `lib/lulo.ts` los eventos; `lib/lesson-service.ts` los adaptadores mock/HTTP; `lib/speech.ts` el ciclo de voz; `app/globals.css` los estilos y adaptación. Los recursos y contratos originales están en `public/assets/lulo/` y `docs/lulo/`.

Front2 añade `components/LearningCard.tsx`, `components/AdventureArt.tsx`, `lib/adventures.ts`, `lib/journey.ts`, los JSON de Planetas y El océano y la investigación en `docs/UX_UI_FRONT2.md`. Las observaciones visuales y funcionales no sustituyen la validación propuesta con usuarios reales.
