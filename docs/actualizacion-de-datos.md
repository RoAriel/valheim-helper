# Actualización del catálogo

Este procedimiento permite actualizar Valheim Helper sin mezclar datos de versiones distintas del juego. El catálogo se publica sólo cuando las verificaciones de esta guía están completas.

## 1. Abrir un bloque de actualización

1. Identificar la versión objetivo en las notas oficiales de Valheim y anotarla junto con la fecha de revisión.
2. Crear una entrada de trabajo con el alcance: recetas, estaciones, efectos de comida, biomas o correcciones afectadas.
3. No cambiar `manifest.json` hasta que todos los datos del bloque hayan sido verificados.

## 2. Verificar y registrar

Para cada dato cambiado, conservar en la revisión o commit:

| Campo | Qué registrar |
| --- | --- |
| Versión objetivo | Número exacto de Valheim. |
| Fuente primaria | Notas oficiales, cuando cubran el cambio. |
| Fuente de contraste | Volcado de Jötunn y/o Valheim.tools de la misma versión. |
| Fecha de verificación | Día en que se contrastó el dato. |
| Alcance | IDs de objetos, materiales, recetas y efectos afectados. |

Si una receta o efecto no puede contrastarse para la versión objetivo, se mantiene fuera del catálogo o se marca como pendiente: nunca se completa por inferencia.

## 3. Actualizar los datos

1. Registrar primero biomas, estaciones, fuentes y materiales nuevos.
2. Incorporar los objetos y sus recetas; incluir mejoras y cantidades de lote cuando correspondan.
3. Para consumibles, actualizar la base, salida del fermentador y `food-effects.json` en el mismo bloque.
4. Actualizar `subcategories.json` si cambia un objeto de Armas o Comida; cada objeto de una categoría con subfiltros debe pertenecer a una sola subcategoría.
5. Ajustar `functional-crafting-audit.json` y `consumable-coverage.json` cuando se modifique la cobertura declarada.

## 4. Validar y publicar

Ejecutar antes de cambiar la versión publicada:

```bash
pnpm test
pnpm lint
```

Después, ejecutar `pnpm test:e2e` para revisar automáticamente la interfaz en teléfono (390 px), escritorio (1440 px) y pantalla amplia/2K (2560 px). La prueba valida búsqueda, limpieza de filtros, estado sin resultados, subfiltros, detalle y ausencia de desborde horizontal; sus capturas quedan en `test-results/` para la revisión estética manual en Brave.

Por último, actualizar en conjunto:

- `data/manifest.json`: `gameVersion`, `catalogVersion`, `dataUpdatedAt` y `status`.
- `README.md`: versión de catálogo y de referencia de Valheim.
- `CHANGELOG.md`: alcance verificable del cambio, sin afirmar contenido que no esté activo en la interfaz.

## Decisiones de alcance

- El catálogo cubre objetos funcionales fabricables; decoración queda fuera salvo que habilite una función de juego.
- Bosque Profundo se conserva como referencia de biomas, pero se oculta de la navegación mientras no tenga objetos funcionales registrados.
- Los subfiltros se ofrecen hoy para Armas y Comida. Agregar otra taxonomía requiere datos completos, validación y una necesidad clara de navegación.
- La V1 conserva la procedencia detallada en la revisión o commit de cada bloque. Un registro estructurado por entidad queda reservado para V1.1: incorporarlo requerirá definir un contrato y una migración completa, para no publicar una cobertura parcial que dé una falsa garantía de trazabilidad.
