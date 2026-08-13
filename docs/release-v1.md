# Valheim Helper V1

> Este documento conserva la fotografía histórica del cierre V1. El estado activo se mantiene en `README.md` y actualmente corresponde a Aplicación `1.1.0`, Catálogo `0.1.25` y Valheim `0.221.12`.

## Identificación

| Componente | Versión |
| --- | --- |
| Aplicación | `1.0.1` |
| Catálogo | `0.1.20` |
| Valheim de referencia | `0.221.12` |
| Fecha de cierre | `2026-08-08` |

La V1 es una aplicación de uso interno y ejecución local. No requiere cuenta, backend, conexión al juego ni servicios externos durante su uso.

## Alcance funcional cerrado

- Catálogo de 250 objetos funcionales fabricables de los ocho biomas jugables cubiertos.
- Recetas iniciales, mejoras por nivel, cantidades producidas por lote y descomposición de materiales procesados.
- Costos individuales y acumulados para llevar un objeto hasta cada nivel de mejora.
- Estaciones, fuentes y biomas de obtención.
- Procedencia desplegable con nombres bilingües, requisitos y fuentes alternativas.
- Propiedades visibles de alimentos y cobertura de 20 familias de hidromieles, tónicos y pociones.
- Búsqueda bilingüe de objetos, filtros por bioma y categoría, y subfiltros de armas y comida.
- Plan de objetivo con materias primas, estaciones necesarias y biomas de recolección.
- Interfaz adaptable con detalle desplazable en escritorio y navegación horizontal por biomas en móvil.

Quedan fuera de alcance la decoración sin función de juego, el checklist persistente, las cuentas de usuario, la sincronización y el historial de múltiples versiones de Valheim.

## Controles de calidad

| Control | Comando | Cobertura |
| --- | --- | --- |
| Catálogo y build | `pnpm test` | Tipos, referencias, lotes, ciclos, auditorías, filtros y HTML renderizado. |
| Estilo de código | `pnpm lint` | TypeScript, React y accesibilidad estática. |
| Interfaz | `pnpm test:e2e` | Búsqueda, filtros, estado vacío, selección, navegación móvil y ausencia de desborde. |
| Revisión visual | Capturas de Playwright | Viewports de 390×844, 1440×900 y 2560×1440. |

La revisión `1.0.1` se cerró con 16 pruebas de catálogo/renderizado y 9 escenarios E2E aprobados.

## Política de mantenimiento

1. Mantener separados `appVersion`, `catalogVersion` y `gameVersion`; un cambio visual no implica una nueva versión del catálogo.
2. Actualizar datos mediante el procedimiento de [`actualizacion-de-datos.md`](actualizacion-de-datos.md).
3. Registrar en `CHANGELOG.md` solamente contenido activo y verificado.
4. No publicar datos inferidos ni mezclar recetas de versiones diferentes del juego.
5. Ejecutar los tres comandos de calidad antes de declarar estable un bloque.

## Decisiones posteriores a V1

- V1.1 podrá incorporar procedencia estructurada por entidad, siempre mediante una migración completa del catálogo.
- Bosque Profundo permanece en los datos de referencia y oculto en navegación mientras no tenga objetos funcionales.
- Nuevas taxonomías de filtros se incorporarán sólo si cubren completamente su categoría.
- Una migración de framework, persistencia o publicación web debe tratarse como un bloque independiente de los datos del juego.
