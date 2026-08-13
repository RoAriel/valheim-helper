# Actualización del catálogo

Este procedimiento permite actualizar Valheim Helper sin mezclar datos de versiones distintas del juego. El catálogo se publica sólo cuando las verificaciones de esta guía están completas.

## Diagnóstico desde la aplicación

El botón **Buscar actualizaciones** consulta bajo demanda y en modo de solo lectura:

- las noticias oficiales de Valheim publicadas en Steam, para detectar la última versión estable anunciada;
- el inventario automatizado de recetas de Jötunn, para conocer la versión de juego cubierta por su volcado;
- `data/manifest.json` de la rama `main` en GitHub, para comparar las versiones publicadas de la aplicación y el catálogo.

El diagnóstico se ejecuta en el servidor mediante `GET /api/update-status`. Cada fuente tiene un timeout independiente y puede fallar sin impedir que las restantes informen su estado. La interfaz no escribe JSON, no modifica el contenedor y no incorpora automáticamente datos externos.

Un resultado **Revisión recomendada** significa que al menos una versión detectada es posterior a la instalada. No confirma por sí mismo que haya recetas funcionales nuevas: el mantenedor debe continuar con el procedimiento editorial de esta guía y contrastar cada diferencia antes de cambiar `data/`.

El mismo diagnóstico puede ejecutarse sin abrir la aplicación:

```bash
pnpm data:check
```

Para integraciones automáticas se ofrecen `--json` y `--strict`. La hoja de ruta de los siguientes bloques se conserva en [`roadmap-actualizacion.md`](roadmap-actualizacion.md).

## Snapshot y comparación semántica

Desde un checkout de mantenimiento se puede descargar el inventario técnico de recetas y piezas generado por Jötunn:

```bash
pnpm data:snapshot
```

El comando normaliza nombres ingleses, identificadores externos, cantidades de salida, niveles y materiales en `.cache/valheim-helper/latest-jotunn-catalog.json`. Ese archivo es temporal, está excluido de Git y nunca reemplaza ni modifica los JSON productivos de `data/`. Si los dos inventarios externos declaran versiones diferentes de Valheim, el proceso se detiene.

Para compararlo con el catálogo local:

```bash
pnpm data:diff
pnpm data:diff --json
```

La comparación vincula objetos por nombre inglés normalizado y revisa únicamente los campos disponibles en ambas fuentes: cantidad producida, niveles y materiales. Informa por separado coincidencias sin cambios, modificaciones, entradas sólo externas, objetos sólo locales, nombres ambiguos y materiales externos sin mapear. Una entrada sólo externa es una candidata a clasificación manual, no una novedad funcional confirmada: los volcados incluyen decoración y contenido deliberadamente fuera de alcance.

Para reducir esa lista sin confundirla con altas confirmadas:

```bash
pnpm data:classify
```

El informe `.cache/valheim-helper/classification-report.json` agrupa filas repetidas por nombre y separa materiales existentes, alias probables, candidatos funcionales, decoración explícita, entradas técnicas y casos manuales. Cada decisión incluye motivo, confianza e identificadores externos. La categoría `functional_candidate` significa “merece contrastarse”, no “debe incorporarse”; la clasificación no modifica el catálogo.

Para publicar únicamente ese inventario editorial en la pestaña de revisión:

```bash
pnpm data:candidates --write
```

El comando transforma el informe en `data/update-candidates.json`. Este archivo viaja con la aplicación y Docker, pero permanece separado de `items.json`, `materials.json` y `recipes.json`: mostrar una entrada no la habilita como contenido del catálogo. La pestaña es de solo lectura; las decisiones de aprobación o rechazo siguen reservadas al flujo S/N posterior.

## Revisión interactiva S/N

Las entradas pendientes se revisan desde un checkout de mantenimiento:

```bash
pnpm data:review
pnpm data:review --family ammunition
pnpm data:review --classification probable_alias
```

Por cada candidato, `S` lo aprueba editorialmente, `N` lo rechaza, `O` lo omite y `Q` guarda y finaliza. Enter equivale a `N`, como respuesta segura predeterminada. Cada decisión se escribe de forma atómica en `update-candidates.json` y conserva fecha de revisión; una regeneración posterior mantiene aprobaciones y rechazos mientras el identificador estable siga existiendo.

Aprobar no incorpora el objeto a `items.json` ni crea materiales o recetas. El inventario actual sólo representa posibles altas y alias: el CLI no ofrece eliminaciones. Si en el futuro se incorporan candidatos de eliminación, requerirán una confirmación textual reforzada antes de poder guardar esa decisión.

Ambos comandos aceptan rutas alternativas para pruebas o conservación manual:

```bash
pnpm data:snapshot --output /tmp/valheim-snapshot.json
pnpm data:diff --snapshot /tmp/valheim-snapshot.json
```

El CLI se ejecuta desde un checkout de mantenimiento con Node.js y pnpm. La instalación Docker de uso normal no necesita esas herramientas: el botón de la interfaz realiza el mismo diagnóstico a través del servidor incluido en la imagen.

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
