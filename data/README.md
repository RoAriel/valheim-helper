# Contrato de datos

Este directorio es la fuente de verdad del catálogo de Valheim Helper. Los JSON se mantienen separados para evitar duplicar nombres, fuentes o materiales.

## Archivos

- `manifest.json`: versión de la aplicación y del catálogo, versión de Valheim cubierta, fecha de actualización y estado del conjunto.
- `biomes.json` y `stations.json`: catálogos de referencia.
- `subcategories.json`: clasificación contextual de los objetos para los filtros secundarios de la interfaz.
- `sources.json`: lugares, enemigos, recursos o procesos que proporcionan materiales.
- `materials.json`: materiales y sus fuentes posibles.
- `material-recipes.json`: conversiones de materiales procesados y cantidad producida por lote.
- `food-effects.json`: bonificaciones, duración y efectos especiales de cada comida o consumible visible.
- `items.json`: objetos visibles en la aplicación.
- `recipes.json`: fabricación inicial y mejoras de cada objeto.
- `functional-crafting-audit.json`: contrato de cobertura funcional por bioma para la versión de juego indicada.
- `consumable-coverage.json`: inventario de familias de hidromieles y pociones que debe cubrir la auditoría de consumibles.
- `provenance.json`: fuentes, evidencia y deuda de trazabilidad del catálogo por bloques verificables.
- `update-candidates.json`: inventario editorial de entradas externas clasificadas; no forma parte del catálogo publicado ni se usa para fabricar objetos.
- `station-extensions.json`: relación entre estaciones, objetos físicos de estación, nivel máximo y extensiones funcionales.

## Reglas de identificación y nombres

- Todos los identificadores son estables, únicos y están escritos en `snake_case` inglés.
- Toda entidad visible tiene `name.es` y `name.en`; la interfaz se escribe en español.
- Un identificador no se reutiliza para otra entidad. Si el juego renombra una entidad, se conserva el ID y se actualizan los nombres.
- Las categorías de objetos están definidas por `Category` en `catalog.ts`; no se añaden categorías sin actualizar ese tipo y la interfaz.

## Relaciones

- Un `item.stageBiomeId` debe existir en `biomes.json`.
- Un material puede referenciar una o más fuentes mediante `sourceIds`.
- Una fuente puede pertenecer a uno o más biomas mediante `biomeIds`.
- Cada objeto tiene exactamente una receta y cada receta apunta a una estación existente.
- Cada coste de receta referencia un material existente; las cantidades son enteros positivos.
- Una receta de material tiene una salida positiva, referencia una estación existente y no puede formar ciclos con otras recetas de material.
- Cada extensión de estación es un objeto fabricable único. Una extensión distinta aumenta un nivel; `progressionOrder` documenta la progresión habitual, no una obligación de colocación.

## Recetas y mejoras

- `craft` siempre representa la fabricación inicial y llega a `targetLevel: 1`. `outputAmount` es opcional y solo se registra cuando una receta produce más de una unidad; si falta, el resultado es una unidad.
- Las mejoras se guardan en orden y sus niveles son consecutivos: 2, 3, 4, etc.
- `stationLevel` es el nivel mínimo de la estación para ese paso y es un entero positivo.
- No se repite un material dentro del mismo paso: se suma su cantidad antes de guardarlo.
- Los materiales intermedios (por ejemplo, bronce o clavos) se mantienen como materiales propios. Cuando exista una entrada en `material-recipes.json`, la interfaz puede desglosarlos hasta el siguiente material sin receta registrada.

## Incorporar o corregir datos

1. Verificar que la versión objetivo coincida con las notas oficiales de Valheim. Para recetas, contrastar Valheim.tools con el volcado de Jötunn de esa misma versión; una discrepancia deja el dato pendiente.
2. Registrar primero biomas, estaciones, fuentes y materiales que todavía no existan.
3. Añadir el objeto y una única receta con sus mejoras, si corresponde.
4. Actualizar `dataUpdatedAt` y `status` del manifiesto cuando cambie el conjunto publicado.
5. Ejecutar `pnpm test` y `pnpm lint`.

Al ampliar el catálogo, se debe actualizar también `functional-crafting-audit.json` después de contrastar el inventario con la fuente de referencia. La prueba impide publicar objetos sin clasificar, recetas ausentes o una cobertura distinta de la auditada.

Los datos que no puedan verificarse no se inventan ni se publican: se dejan fuera del catálogo hasta contar con una fuente confirmable.

## Diagnóstico de versiones

El chequeo de solo lectura reutilizado por la interfaz también está disponible en terminal:

```bash
pnpm data:check
pnpm data:check --json
pnpm data:check --strict
```

El modo `--strict` devuelve código `1` cuando recomienda una revisión, código `2` si ninguna fuente permite concluir y `0` cuando no detecta versiones posteriores. El comando no modifica archivos.

Cuando el diagnóstico recomiende revisar, `pnpm data:snapshot` genera fuera de `data/` un inventario temporal normalizado de recetas y construcciones de Jötunn. `pnpm data:diff` lo compara con el catálogo y `pnpm data:classify` agrupa las entradas externas pendientes con evidencia y confianza. Ninguno de estos comandos aplica diferencias automáticamente.

Después de revisar el informe, `pnpm data:candidates --write` actualiza explícitamente `update-candidates.json` para que la pestaña **Revisión de datos** pueda mostrar el inventario también desde Docker. `--write` es obligatorio para evitar sobrescrituras accidentales.

`pnpm data:review` permite aprobar, rechazar u omitir cada pendiente en terminal. Las decisiones son editoriales, se conservan al regenerar el archivo y nunca modifican automáticamente el catálogo productivo.

El procedimiento completo, la matriz de verificación y los criterios para publicar una nueva versión se mantienen en [`../docs/actualizacion-de-datos.md`](../docs/actualizacion-de-datos.md).
