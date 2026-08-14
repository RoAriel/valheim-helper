# Stack tecnológico

## Objetivo técnico

Valheim Helper es una aplicación local, de consulta rápida y en español. El catálogo se mantiene como datos versionados en JSON; la interfaz permite filtrarlo y calcular dependencias sin requerir una cuenta de usuario, API ni base de datos en tiempo de ejecución.

## Stack actual

| Capa | Tecnología | Uso en el proyecto |
| --- | --- | --- |
| Lenguaje | TypeScript | Tipos del catálogo y componentes. |
| Interfaz | React 19 | Estado de filtros, selección, mejoras y planificador. |
| Rutas y renderizado | Vinext | Estructura compatible con App Router (`app/`) y renderizado de la página. |
| Compilación | Vite 8 | Desarrollo y build rápido. |
| Ejecución local | Wrangler / Cloudflare Workers | Entorno de desarrollo y servidor de producción local de la plantilla. |
| Estilos | CSS propio + Tailwind CSS 4 | El diseño se escribe en `app/globals.css`; Tailwind forma parte del pipeline, sin utilidades dispersas en JSX. |
| Datos | JSON + `data/catalog.ts` | Entidades, recetas, efectos y reglas de integridad separados de la interfaz. |
| Pruebas de datos | `node:test` | Validación de referencias, auditorías funcionales, filtros puros y HTML renderizado. |
| Pruebas de interfaz | Playwright + Chromium | Interacciones y revisión visual en móvil, escritorio y 2K. |
| Gestor de paquetes | pnpm | Instalación y scripts reproducibles. |
| Despliegue doméstico | Docker Compose | Imagen Linux portable para AMD64, ARM64 y Windows mediante WSL 2 o Docker Desktop. |

## Justificación

### React

El contenido base es estático, pero la consulta no lo es: búsqueda, filtros, selección de objeto, niveles de mejora, propiedades de comida y planificador cambian sin recargar la página. React concentra ese estado de interfaz en un único componente y mantiene la lógica de presentación cerca de los controles que la usan.

La navegación y coordinación del catálogo permanecen en `app/workbench.tsx`. Las superficies independientes se extraen en `app/components/`: la revisión editorial y el diálogo de actualizaciones mantienen estado, accesibilidad y pruebas propios sin duplicar el modelo de datos ni fragmentar artificialmente el flujo principal.

### JSON versionado y TypeScript

Los datos del juego cambian por versión y necesitan auditoría. Los JSON separados permiten revisar un bloque sin mezclarlo con la interfaz; `data/catalog.ts` define sus relaciones, valida referencias y expone cálculos reutilizables, como costos base y planes de objetivo.

### Vite + Vinext + Wrangler

Vite proporciona compilación rápida. Vinext preserva una estructura conocida de App Router y permite ejecutar el mismo proyecto sobre Workers mediante Wrangler. Es útil si en el futuro se decide alojar la herramienta, aunque hoy el uso principal sea local.

### CSS propio

La interfaz usa una identidad visual específica —paleta, temas por bioma, scroll del detalle y tarjetas— que se entiende mejor como reglas CSS centralizadas que como muchas utilidades en cada componente.

### Pruebas por capas

`node:test` cubre los contratos de datos, filtros puros y el HTML renderizado con herramientas nativas de Node. Playwright comprueba las interacciones y el layout en los tres tamaños definidos en `docs/actualizacion-de-datos.md`; sus capturas complementan las aserciones automáticas con una revisión visual.

### Docker

El build de Vinext genera una salida `standalone` que se copia a una imagen final basada en Node.js 22 sobre Debian slim. La etapa final no incluye pnpm, Wrangler, el código fuente ni la instalación completa usada para desarrollar y compilar. La misma definición funciona en Linux AMD64, Linux ARM64 y Windows mediante WSL 2 o Docker Desktop.

## Límites actuales deliberados

- No hay persistencia de usuario, autenticación ni backend de aplicación.
- No se incluyen ORM, esquema D1 ni ejemplos de base de datos mientras el producto no requiera persistencia.
- No se usan APIs externas en ejecución: las fuentes se usan durante la curación de datos, no desde la interfaz.
- La aplicación no depende de imágenes remotas para funcionar.

## Alternativas evaluadas

### Astro

Astro encaja bien con páginas mayormente estáticas y podría hidratar sólo el catálogo como una isla React. Sería una opción fuerte si se priorizara publicación web, rendimiento de contenido estático o varias páginas editoriales.

No se adopta ahora porque la pantalla principal ya es una herramienta interactiva única y una migración no habilitaría una función nueva. Se reconsiderará si el proyecto se convierte en un sitio de documentación con muchas páginas estáticas.

### Vite + React sin Vinext

Sería más simple para una herramienta exclusivamente local. Vinext se mantiene mientras aporte compatibilidad de estructura y una posible salida a Workers. Si esa integración deja de ser útil o su estado beta representa un coste, ésta es la simplificación preferida.

## Criterios para cambios futuros

- Añadir persistencia local: `localStorage` primero; base de datos sólo si hay datos compartidos o sincronización.
- Añadir rutas de contenido extensas: evaluar Astro.
- Publicar con funciones de usuario o datos editables: evaluar una API y una capa de persistencia de forma explícita.
- Sustituir Vinext: hacerlo en un bloque propio, conservando las pruebas de catálogo y renderizado como criterio de aceptación.
