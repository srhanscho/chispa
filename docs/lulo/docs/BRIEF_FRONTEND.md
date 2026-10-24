# Brief UX/UI — Chispa con Lulo

## Público
- Niños de 6–10 años: lectura corta, iconografía reconocible, recompensas positivas y comunicación con voz opcional.
- Adultos responsables: una pantalla secundaria con progreso sencillo, sin lenguaje diagnóstico.

## Identidad visual
- Protagonista: **Lulo**, iguana de ojos marrones grandes, sombrero vueltiao negro/beige, libro azul y mochila.
- Referencia inmutable: `../assets/lulo/lulo_referencia_original.png`.
- Colores UI desde el PRD original: verde `#3FA34D`, turquesa `#14A3B8`, amarillo `#FFC93C`, coral `#FF6B5B`, arena `#FFF6E5`, tinta `#1F2A44`. Para ilustración, el JSON define su paleta de personaje, distinta de la paleta de la UI.
- Font: Baloo 2 títulos, Nunito cuerpo. Tarjetas con radio generoso, sombras suaves; evitar interfaz de bebé y evitar saturación.

## Pantallas

### 1 Inicio `/`
- Hero: Lulo a un lado (adaptar layout apilado en móvil), titular corto "¡Hola! Soy Lulo".
- Entrada de texto con ejemplo, sugerencias y CTA "¡Vamos a descubrir!".
- Elementos de estado: estrellas y álbum; crear experiencia funcional aunque todavía no haya login.

### 2 Cargando
- Mensaje "Estoy preparando algo chévere para ti…" + imagen oficial y una animación CSS no intrusiva.
- Evitar spinner sin fin; demo responde inmediatamente o tras espera breve simulada sin bloquear.

### 3 Lección
- Tarjeta activa de 4–5, visual de apoyo y progreso.
- Lectura opcional por `speechSynthesis`, elegir es-CO si existe y fallback.
- Botón "No entendí" => texto aclaratorio mock positivo y registro de señal.

### 4 Trivia
- Una pregunta por pantalla; opciones grandes, navegación clara, mostrar apoyo después de respuesta.
- El niño no pierde estrellas por fallar. No bloquear reintento con contenido punitivo.

### 5 Recompensa
- Celebración moderada + puntos/sticker; opción nuevo tema o revisar.

### 6 Panel de acompañamiento para adultos
- Resumen simple con conteo de preguntas y actividades, sin hacer afirmaciones de psicología educativa a partir de pocos datos.

## Adaptabilidad
- 375px móvil / 768px tablet / 1280px desktop.
- Min 56px altura CTA principal. Contraste legible, focus visible.
- `prefers-reduced-motion`: sin movimiento continuo.
- Navegación semántica; ALT en imagen Lulo, anunciadores accesibles para feedback.

## No en esta iteración
- Rive rig o archivo `.riv`, creación de seis PNG, subida de fotos, backend IA en producción, autenticación, pagos, analítica de menores.

## Evolución
1. Prototipo frontend completo usando la imagen PNG original de Lulo.
2. Generación/revisión de seis poses PNG con prompts existentes.
3. Separación de capas y Rive; reemplazar componente estático por `<LuloAvatar>` animado.
4. Conexión a Gemma 4/Claude por backend seguro, no por claves en browser.
