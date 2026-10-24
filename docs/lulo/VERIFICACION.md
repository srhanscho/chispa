# Verificación del frontend de Lulo

Adaptado sobre `310c4af`, conservando la configuración de pensamiento y los registros de rendimiento del backend de Gemma.

- Compilación de producción: correcta con Next.js 16.4.3, incluida la comprobación de TypeScript.
- ESLint: correcto.
- Vitest: 26 pruebas correctas en 5 archivos. Incluyen contratos de eventos, independencia del mock, validación HTTP y cancelación/error/eventos tardíos de voz.
- Navegador: recorrido de cinco tarjetas, navegación anterior/siguiente, pista, respuesta incorrecta con apoyo, respuestas correctas y recompensa.
- Inicio mediante teclado: formulario enviado con Enter, foco en encabezados al cambiar de pantalla.
- Persistencia: recarga conserva estrellas, sticker y contadores del panel adulto; no hay errores o advertencias de consola.
- Responsive: vistas de 375, 768 y 1280 px sin desbordamiento horizontal en las medidas finales. Se corrigió el desbordamiento del fondo decorativo en tablet.
- Movimiento reducido: regla CSS que desactiva animaciones y transiciones. Trivia estática; celebraciones breves.

La reproducción audible y el dictado real dependen de permisos, voces y servicios del navegador; no se probaron con un micrófono real. El ciclo de síntesis se comprobó con pruebas automatizadas. No se verificaron proveedores de IA con credenciales reales ni un rig de Rive, que no forma parte del paquete.

## Archivos principales

`components/ChispaApp.tsx` contiene el recorrido; `components/LuloAvatar.tsx` el avatar; `lib/lulo.ts` los eventos; `lib/lesson-service.ts` los adaptadores mock/HTTP; `lib/speech.ts` el ciclo de voz; `app/globals.css` los estilos y adaptación. Los recursos y contratos originales están en `public/assets/lulo/` y `docs/lulo/`.
