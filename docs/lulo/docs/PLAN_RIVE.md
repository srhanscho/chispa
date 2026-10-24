# Plan para llevar Lulo a Rive (etapa posterior)

**Hoy hay un PNG** `../assets/lulo/lulo_referencia_original.png`. No existe un archivo `.riv` ni un rig.

## Secuencia recomendada

1. Aprobar diseño canónico de Lulo y el sombreo original; revisar seis variantes solicitadas en `../especificaciones/02_lulo_6_variantes.json`.
2. Separar arte en capas para animación: cuerpo, cabeza, ojos, párpados, boca (2–3 formas), brazos, manos, cola, sombrero, mochila y libro. Preferible SVG/PSD bien organizado. Un PNG aplanado no mueve esas piezas de forma independiente.
3. Importar en [Rive](https://rive.app/), componer artboard `LuloMascot`, pivotes/rig, animaciones y State Machine `LuloController` según JSON de especificación.
4. Animaciones P0: `idle`, `wave`, `talking`, `explain`, `reassure`, `celebrate`. Otras P1: `thinking`, `quiz_prompt`.
5. Exportar `lulo.riv` al proyecto, integrar con runtime Rive apropiado al framework, mapear eventos del frontend.
6. Fallback a PNG original si el .riv no carga; respetar movimiento reducido.

## No confundir formatos

- `02_lulo_6_variantes.json` son PROMPTS para crear ilustraciones: no imágenes generadas.
- `03_lulo_animaciones_rive.json` especifica acciones y capas: no animación ejecutable.
- `04_lulo_plan_integracion_rive.json` es un contrato conceptual: no se importa tal cual al editor.
- Lottie y GIF pueden servir para reproducción lineal, pero para respuestas a botones se prefiere Rive.

No diseñar un editor Rive propio en esta primera iteración. Dejar la arquitectura lista para reemplazar el avatar estático.
