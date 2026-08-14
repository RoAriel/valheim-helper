# Cierre de Aplicación 1.2.0

## Identificación

| Componente | Versión |
| --- | --- |
| Aplicación | `1.2.0` |
| Catálogo | `0.1.25` |
| Valheim de referencia | `0.221.12` |
| Fecha de cierre | `2026-08-14` |

La versión `1.2.0` es una ampliación menor compatible. Incorpora capacidades visibles y una reorganización interna de la interfaz, pero no modifica el contrato JSON, los identificadores ni los datos de Valheim. No requiere migración, volumen persistente ni reconstrucción manual del catálogo.

## Alcance funcional

- Catálogo y Mantenimiento quedan separados según su frecuencia de uso.
- El estado de consulta se conserva en la URL y admite recarga y Atrás/Adelante.
- La búsqueda puede borrarse desde el campo y `Esc` limpia progresivamente la consulta.
- Los filtros activos se presentan como etiquetas removibles.
- El Plan de objetivo permite elegir el nivel final y recalcula el acumulado.
- Los materiales procesados muestran estación, rendimiento por lote y cadena de materias primas.
- Objetos base y extensiones enlazan sus fichas relacionadas.
- Las comidas muestran estadísticas resumidas en el listado.
- El diálogo, las pestañas y los anuncios de resultados completan su navegación accesible.

## Estructura de interfaz

`app/workbench.tsx` coordina estado, URL, historial y selección. La presentación se divide entre componentes de cabecera, biomas, filtros, resultados, ficha, Mantenimiento, revisión editorial y diagnóstico.

Esta separación no cambia rutas ni contratos de datos. `CatalogFilters` es un componente controlado: comunica cada acción al coordinador mediante callbacks.

## Actualización de una instalación

```bash
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

La imagen resultante se etiqueta `valheim-helper:1.2.0`. Al no existir persistencia de ejecución, el reemplazo del contenedor no elimina información del usuario.

## Validación de cierre

- `pnpm test`: build y 36 comprobaciones aprobadas.
- `pnpm lint`: sin errores.
- `pnpm test:e2e`: 39 pruebas aprobadas en 390×844, 1440×900 y 2560×1440.
- `docker compose build`: imagen `valheim-helper:1.2.0` construida correctamente.
- `docker compose up -d`: contenedor reemplazado y marcado `healthy`.
- Respuesta principal: HTTP `200` en `http://127.0.0.1:3000/`.
- Diagnóstico: estado `current`, Catálogo `0.1.25` y Valheim `0.221.12` coincidentes.
- Imagen local validada en AMD64, usuario interno `valheim` y tamaño aproximado de 106 MB.

Durante esta validación GitHub todavía informó Aplicación `1.1.0`, resultado esperado hasta publicar y fusionar la entrega `1.2.0`. El comparador no lo interpreta como una actualización pendiente porque la versión local es posterior.

Las pruebas manuales diferidas —monitores reales e investigación de iconos SVG— permanecen registradas en [`TODO-pruebas.md`](TODO-pruebas.md) y no bloquean esta versión.
