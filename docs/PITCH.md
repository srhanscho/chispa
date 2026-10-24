# Pitch de Lulo (3 minutos, en vivo)

**Quién hace qué:** una persona habla; la otra maneja la demo en el celular o el portátil conectado al proyector.

**Antes de subir al escenario:**
- Abrir https://chispa-tau.vercel.app en el dispositivo de la demo, con el perfil **Sofía** y el volumen arriba.
- Tener a mano un objeto real para la foto (una fruta, un juguete, un vaso).
- Hacer una clase de prueba un rato antes para que Gemma "despierte".
- **Plan B sin internet:** la clase de **Dinosaurios** y sus imágenes están guardadas en la app y cargan al instante.

---

## Guion

### 0:00 – 0:20 · El problema
> "Levanten la mano si alguna vez entendieron algo solo cuando alguien se lo explicó *a su manera*.
> Las apps educativas enseñan igual a todos los niños: mismo menú, mismo quiz, misma explicación. Si un niño no entiende, le repiten lo mismo."

### 0:20 – 0:35 · La solución
> "Les presentamos a **Lulo**: un iguano barranquillero que es tutor con IA para niños de 6 a 12 años.
> Lulo enseña lo que al niño le da curiosidad, y **aprende cómo aprende cada niño**."

### 0:35 – 1:45 · Demo en vivo
1. **Lulo saluda.** Tocar a Lulo: salta, saluda por el nombre y habla.
   > "Lulo saluda a Sofía por su nombre y le habla en voz alta."
2. **Una foto del mundo real.** Botón *Tómale foto a algo*, foto al objeto que trajeron.
   > "Sofía le toma foto a esto. **Gemma mira la foto**, reconoce qué es y le arma una clase en unos segundos."
3. **La clase.** Pasar una tarjeta, tocar *Escuchar*.
   > "Fotos reales, texto corto y Lulo lo lee en voz alta. Si no entiende, puede tocar *No entendí*."
4. **Pregúntale a Lulo.** Escribir o dictar una pregunta.
   > "En cualquier momento puede preguntarle a Lulo, como a un profe."
5. **La trivia.** Fallar una a propósito.
   > "Cuando se equivoca, Lulo no dice *incorrecto*: dice *¡Casi!* y se lo explica de otra forma."
6. **Familia.** Abrir la pestaña Familia.
   > "Y esto es lo importante: Lulo midió cómo aprende Sofía. Le va mejor con historias. Mateo aprende mejor con imágenes. **Mismo tema, clases distintas.**"

### 1:45 – 2:30 · Cómo usamos Gemma 4
> "Todo esto funciona con **Gemma 4**, un modelo abierto, por la API de Gemini. Gemma no es un adorno: hace cinco trabajos."

1. **Crea cada clase** en uno de cinco estilos (historia, visual, analogía, paso a paso, juego), según cómo aprende el niño.
2. **Entiende las fotos** del niño y arma un tema que nombra el objeto: *"Los mangos"*, no *"Las frutas"*.
3. **Revisa sus propias imágenes con visión:** antes de mostrar una foto, mira varias candidatas y elige la que de verdad muestra el tema, o ninguna.
4. **Es un tutor agente:** responde preguntas con la clase como contexto y decide qué sigue (otra clase, la trivia).
5. **Re-explica y escribe una nota** para papás sobre cómo aprende mejor su hijo.

> "Y lo medimos: entender fotos pasó de **8 a 13 aciertos de 14**; las imágenes aciertan **11 de 12**; y bajamos el tiempo de una clase de **95 a 16 segundos** apagando el modo de razonamiento, que una clase para niños no necesita."

### 2:30 – 2:50 · Por qué importa
> "Lulo es **código abierto** con licencia MIT, y su cerebro es un **modelo de pesos abiertos**. Eso significa que un colegio de Barranquilla puede correr Lulo en su propio servidor y **los datos de los niños nunca salen del colegio**."

### 2:50 – 3:00 · Cierre
> "Gemma enseña, mira y aprende de cada niño. **Lulo convierte la curiosidad en una clase hecha a su medida.** Gracias."

---

## Preguntas probables del jurado

**¿Por qué Gemma y no otro modelo?**
Porque es abierto: un colegio puede correrlo en su propio servidor, sin pagar por cada pregunta y sin sacar datos de menores a la nube. Y es multimodal: entiende las fotos del niño y revisa sus propias imágenes.

**¿Cómo sabe Lulo cómo aprende el niño?**
Cada estilo de explicación tiene un puntaje por niño. Después de cada clase se actualiza con los aciertos de la trivia, los toques en *No entendí* y si terminó la clase. El 80 % de las veces usa el mejor estilo y el 20 % prueba otro, para seguir descubriendo.

**¿Y la seguridad para niños?**
Las fotos salen solo de Wikimedia Commons, con licencia y crédito del autor; Gemma las revisa antes de mostrarlas y descarta las que no sirven para niños. No hay ranking entre niños ni castigos. Los niños no tienen cuenta: la cuenta opcional es del papá, con permisos por fila en la base de datos.

**¿Cuánto cuesta?**
Gemma por API tiene plan gratuito en Google AI Studio. Lo que más tarda o cuesta, que son las clases e imágenes, se guarda en caché para no generarlo dos veces.

**¿Qué falta?**
Probarlo con niños reales y con un colegio, correr Gemma en un servidor local y sumar más materias del currículo.
