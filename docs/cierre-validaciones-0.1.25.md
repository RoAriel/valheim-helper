# Cierre de validaciones de Datos 0.1.25

## Objetivo

Cerrar las diferencias conocidas del catálogo sin incorporar automáticamente candidatos nuevos. El bloque reconcilia recetas, modela objetos usados como ingredientes, reduce el ruido editorial, actualiza la documentación y verifica el diagnóstico dentro de Docker.

## 1. Reconciliación de recetas

El snapshot de Jötunn para Valheim `0.221.12` detectaba 34 diferencias. Se incorporaron los niveles de mejora de 32 equipos manteniendo materiales y cantidades coincidentes con Jötunn y la Valheim Wiki.

Las dos diferencias restantes eran recetas internas directas para Hidromiel curativa menor e Hidromiel de aguante menor. Se conserva la representación jugable documentada por la wiki: base en el hervidor, fermentación y salida de seis unidades. El comparador registra esa preferencia de fuente y no la vuelve a presentar como corrección pendiente.

Fuentes de contraste específicas:

- [Jötunn: recetas para Valheim 0.221.12](https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html), inventario técnico normalizado por el snapshot;
- [Valheim Wiki: Minor healing mead](https://valheim.fandom.com/wiki/Minor_healing_mead) y [Minor stamina mead](https://valheim.fandom.com/wiki/Minor_stamina_mead), para el circuito jugable y el lote de fermentación;
- [Valheim Wiki: Ash Fang](https://valheim.fandom.com/wiki/Ash_Fang), para fabricación y mejoras del objeto base;
- [Valheim Wiki: Flametal Armor](https://valheim.fandom.com/wiki/Flametal_Armor), para contrastar los niveles del equipo de Tierras Cenicientas.

Resultado esperado de `pnpm data:diff`:

- 328 coincidencias comparables;
- 328 sin diferencias;
- cero modificaciones;
- cero ingredientes sin mapear.

## 2. Objetos base

Los ingredientes pueden ser materiales u objetos fabricables. Las variantes de armas registran el objeto base —por ejemplo, `ash_fang`— y el planificador expande recursivamente su receta hasta materias primas. La validación rechaza referencias inexistentes, autorreferencias y ciclos entre objetos.

## 3. Clasificación externa

Las reglas distinguen familias reconocibles de equipo, consumibles, munición, infraestructura, decoración y entradas técnicas. Los 225 casos de revisión manual bajan a cero. Esto no aprueba las entradas restantes: deja 180 candidatos concretos para revisión humana.

| Familia pendiente | Cantidad |
| --- | ---: |
| Infraestructura | 133 |
| Equipo | 44 |
| Munición | 1 |
| Alias probables | 2 |
| **Total** | **180** |

## 4. Documentación

- `README.md` y `manifest.json` reflejan Datos `0.1.25`.
- `roadmap-actualizacion.md` registra el avance real de los bloques 7 y 8.
- `release-v1.md` queda identificado expresamente como fotografía histórica.
- `actualizacion-de-datos.md` explica la prioridad entre fuentes y la expansión de objetos base.
- El script `scripts/complete-recipe-differences-0.221.12.mjs` queda documentado como migración cerrada y reproducible, no como sincronización genérica.

## 5. Docker

La imagen debe construirse desde cero, iniciar con healthcheck saludable y permitir consultar `/api/update-status`. Una consulta sin acceso externo puede responder `inconclusive`; el criterio es que el contenedor responda correctamente y detalle qué fuentes no estuvieron disponibles.

Validación ejecutada el `2026-08-13`:

- `docker compose build`: imagen construida correctamente (la etiqueta Compose se alinea en este bloque con la aplicación `1.1.0`);
- `docker compose up -d`: contenedor iniciado y marcado `healthy`;
- `/api/update-status`: HTTP correcto y estado `current`;
- Steam y Jötunn informaron Valheim `0.221.12`;
- GitHub informó Catálogo `0.1.24`, diferencia esperada hasta fusionar el PR que publica `0.1.25`.
