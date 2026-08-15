# Cambios

## Infraestructura — 2026-08-15

- Se añadió una configuración reproducible para publicar la aplicación `1.2.0` en Cloudflare Workers sin depender del router doméstico.
- El despliegue incorpora una validación en seco, observabilidad y documentación de autenticación, publicación, actualización y rollback.
- Se completó el mapa documental del proyecto y se añadieron diagramas SVG mantenibles de arquitectura, estructura del repositorio y flujo de actualización/despliegue.

## Aplicación 1.2.0 — 2026-08-14

- La entrega se validó con build, 36 comprobaciones automatizadas, lint, 39 pruebas E2E y una imagen Docker `1.2.0` saludable.
- Se reforzaron las áreas clicables, la alineación de desplegables y la adaptación de cadenas de materiales y del selector de nivel en pantallas estrechas.
- Mantenimiento usa explicaciones menos técnicas y conserva el sistema visual original de emoji y runas mientras se evalúa una alternativa SVG.
- La consulta cotidiana queda concentrada en **Catálogo**; el diagnóstico de versiones y la revisión editorial se agrupan bajo **Mantenimiento**.
- El Plan de objetivo permite elegir fabricar el nivel 1 o reunir el acumulado hasta cualquiera de los niveles disponibles.
- Los materiales procesados despliegan su estación, producción por lote y materias primas calculadas para la cantidad requerida.
- La navegación del catálogo conserva bioma, búsqueda, categoría, subcategoría, beneficio, función y objeto seleccionado en la URL; recargar y usar Atrás/Adelante ya no pierde el contexto.
- Los filtros activos se muestran como etiquetas removibles y el contador anuncia los cambios de resultados.
- La búsqueda incorpora un botón `×` para borrar el texto sin limpiar el resto de los filtros.
- En computadora, `Esc` cierra primero el diagnóstico, luego borra la búsqueda y finalmente limpia los filtros activos.
- En teléfono, el detalle ofrece una acción visible para volver al punto de resultados.
- La ficha enlaza objetos base y extensiones con sus propias fichas, relajando automáticamente los filtros incompatibles.
- El Plan de objetivo aparece abierto y ubicado inmediatamente después de la fabricación.
- Las tarjetas de Comida muestran salud, aguante, eitr y duración para comparar opciones sin abrir cada ficha.
- El diálogo de actualizaciones gestiona foco, Escape, fondo modal y retorno al control de apertura.
- Las pestañas admiten flechas, Inicio y Fin, y los cambios de resultados o selección se anuncian a tecnologías de asistencia.
- La cabecera, la progresión, la lista, la ficha, el mantenimiento, la revisión editorial y el diálogo se extrajeron de `workbench.tsx` como componentes independientes.
- Los controles de búsqueda, filtros contextuales, resumen y etiquetas activas se extrajeron a `CatalogFilters`; `workbench.tsx` queda como coordinador de estado y URL.

## Datos 0.1.25 — 2026-08-13

- Se reconciliaron las 34 diferencias informadas por el comparador: 32 equipos recibieron sus mejoras faltantes y las dos hidromieles menores conservaron el circuito jugable verificado de hervidor, fermentador y lote de seis.
- Colmillo sangrante, tormentoso y de raíces consumen ahora `ash_fang` como objeto base; el planificador expande objetos intermedios hasta sus materias primas y estaciones.
- El diagnóstico alcanza 328 coincidencias sin diferencias y cero ingredientes sin mapear.
- La clasificación externa eliminó los 225 casos manuales genéricos: quedan 180 candidatos concretos por revisar, agrupados por infraestructura, equipo, munición y alias.
- Se documentó la validación del actualizador dentro del contenedor doméstico.

## Datos 0.1.24 — 2026-08-13

- Se incorporaron los 60 candidatos funcionales aprobados: ocho banquetes, el huevo cocinado y 51 armas o piezas de defensa.
- Cada banquete registra sus diez porciones como efecto de uso y muestra salud, aguante, eitr, curación y duración; se añadió la Mesa de preparación de alimentos como estación propia.
- Las recetas de equipo incluyen fabricación, mejoras consecutivas y niveles requeridos de banco de trabajo, forja, forja negra o mesa Galdr.
- Se registraron 36 ingredientes faltantes y nueve fuentes de obtención para mantener completa la procedencia mostrada por el planificador.
- El catálogo alcanza 356 objetos funcionales para Valheim `0.221.12`.

## Auditoría editorial — 2026-08-13

- Se revisaron los 10 candidatos de consumibles y los 70 de equipo para Valheim `0.221.12`.
- Se aprobaron 60 altas funcionales futuras y se rechazaron 20 falsos positivos, equivalencias, artículos de comerciante, cosméticos o armas no fabricables.
- Los candidatos pendientes bajaron de 310 a 230 sin modificar todavía el catálogo productivo.
- Las decisiones y sus criterios quedaron documentados en `docs/auditoria-consumibles-equipo-0.221.12.md`.

## Datos 0.1.23 — 2026-08-13

- Se incorporaron doce construcciones funcionales verificadas: estaciones, almacenamiento, descanso, cartografía, fuego, portal y defensa de base.
- El Hervidor de hidromiel se modeló como estación independiente y las veinte bases pasaron del caldero a esa estación.
- La Prensa artesanal amplía la Mesa de artesano al nivel 2 y el Núcleo de escudo conserva su receta procesable.
- Construcción ofrece el filtro **Estaciones y proceso**, que reúne estaciones, extensiones y procesadores esenciales para la progresión.
- El Cofre del tesoro se excluyó expresamente por ser una pieza puramente decorativa.
- El catálogo alcanza 296 objetos funcionales para Valheim `0.221.12`.

## Datos 0.1.22 — 2026-08-13

- Se incorporaron el Pico de metal negro y las 21 municiones funcionales pendientes: flechas, virotes, bombas de blob, bombas arrojadizas y carga de catapulta.
- Se registraron lotes de salida, niveles de estación, mejoras y seis materiales con sus fuentes de obtención.
- La comparación externa reconoce `Finewood` y `Corewood` como alias de los materiales locales y deja de informar falsos cambios por esa diferencia de escritura.
- `Stone Pickaxe` y `[item_torchmist]` se clasifican como entradas técnicas, fuera del catálogo jugable publicado.
- El catálogo alcanza 284 objetos funcionales para Valheim `0.221.12`.

## Aplicación 1.1.0 / Datos 0.1.21 — 2026-08-13

- Se añadió el flujo editorial de actualización: diagnóstico, snapshot, comparación semántica, clasificación, candidatos y revisión S/N.
- La pestaña **Revisión de datos** permite consultar candidatos externos sin mezclarlos con el catálogo productivo.
- Se estructuraron las extensiones del banco de trabajo, forja, caldero y forja negra, y la ficha muestra cómo alcanzar el nivel de estación exigido por cada receta.
- Cada extensión de estación permite desplegar sus materias primas y la estación necesaria para construirla.
- Se incorporaron doce extensiones funcionales faltantes, incluida la Estantería de herramientas, y la Piedra de afilar como material procesado.
- El catálogo alcanza 262 objetos funcionales para Valheim `0.221.12`.

## Aplicación 1.0.1 — 2026-08-10

- La ficha muestra la cantidad producida por lote para flechas, hidromieles y demás recetas múltiples.
- Las comidas y consumibles exponen salud, aguante, eitr, curación, duración y efectos especiales.
- El bloque de mejoras separa los costos individuales por nivel de un resumen destacado con el total acumulado desde nivel 1 hasta el nivel máximo.
- Los materiales permiten consultar nombre inglés, fuentes, biomas, requisitos y alternativas de obtención.
- Se retiraron los ejemplos y dependencias sin uso de ChatGPT Auth, D1 y Drizzle; el paquete se renombró a `valheim-helper`.
- Se ampliaron las pruebas de datos e interfaz para cubrir la información incorporada.

## Aplicación 1.0.0 — 2026-08-08

- Se corrigió el estado sin resultados para evitar que el detalle muestre un objeto fuera de los filtros activos.
- La interfaz toma la versión de Valheim desde el manifiesto y permite limpiar todos los filtros desde el catálogo o el estado vacío.
- Se mejoraron los nombres accesibles, estados de selección y estilos de foco de la navegación.
- Se separó la lógica de filtros de la interfaz y se eliminaron estilos y recursos visuales obsoletos.
- Se añadieron pruebas E2E para móvil, escritorio y 2K, junto con el procedimiento de actualización del catálogo.
- En móvil, seleccionar un objeto desplaza la vista a su detalle para evitar recorrer manualmente el catálogo completo.
- Se corrigió y verificó la tira horizontal de biomas en móvil.
- La procedencia estructurada por entidad queda planificada para V1.1; V1 conserva la evidencia de cada bloque en su revisión o commit.

## Datos 0.1.20 — 2026-08-07

- Los temas de bioma incluyen runas y color para mejorar su diferenciación visual.
- El catálogo usa dos columnas compactas cuando su espacio disponible lo permite; conserva una columna en pantallas menores y móvil.

## Datos 0.1.19 — 2026-08-07

- Se clasificaron los 48 consumibles en alimentos preparados e hidromieles, tónicos y pócimas.
- El filtro de beneficio —salud, curación, resistencia, aguante, eitr y movilidad— ahora se muestra sólo dentro de Comida.
- La auditoría exige que cada consumible pertenezca a exactamente uno de esos dos tipos.

## Datos 0.1.18 — 2026-08-07

- Se adoptó la interfaz de mesa de trabajo como pantalla principal: progresión por bioma, catálogo compacto y detalle de planificación.
- La navegación de biomas en móvil ahora es horizontal.
- Se añadió una taxonomía validada para todas las armas: arcos, espadas, mazas, hachas de batalla, bastones y demás familias, visible como subfiltros contextuales.

## Datos 0.1.17 — 2026-08-07

- Cada bioma declara un tema visual validado, aplicado a las tarjetas del catálogo, su etiqueta y el detalle del objeto.
- Se añadió el planificador de objetivo: desglosa materias primas, estaciones y biomas de recolección para la fabricación inicial.
- Las pruebas exigen temas visuales válidos y verifican la planificación de dependencias de la carabela.

## Datos 0.1.16 — 2026-08-07

- Se auditó la cobertura funcional de los ocho biomas jugables actuales, con conteos y objetos testigo obligatorios por bioma.
- Se corrigió el filtro de movilidad para reconocer efectos de velocidad, salto y nado.
- Se actualizó el mensaje de la interfaz para reflejar el catálogo completo.

## Datos 0.1.15 — 2026-08-07

- Se completaron las 20 familias de hidromieles y pociones para Valheim `0.221.12`, incluidas las de eitr, efectos persistentes y las siete familias de la Bruja del Pantano.
- Cada familia registra la base, ingredientes, fermentación, cantidad de salida y efectos/duración.
- La prueba de cobertura exige que cada familia tenga objeto, receta y propiedades. El catálogo renderizado alcanza 250 objetos.

## Datos 0.1.14 — 2026-08-07

- Se añadieron las hidromieles fermentables clásicas faltantes: curación menor, aguante menor, resistencia al frío y sabrosa, con sus bases de caldero y lotes de seis.
- Los filtros de consumibles ahora distinguen curación, resistencia, aguante, eitr y movilidad.
- La auditoría funcional exige las nuevas hidromieles dentro de Bosque Negro y Montañas.

## Datos 0.1.13 — 2026-08-07

- Se añadieron propiedades de consumo para los 33 alimentos e hidromieles visibles: salud, aguante, eitr, curación, duración y efectos especiales.
- La interfaz muestra las propiedades del consumible y permite filtrar por salud, aguante, eitr o efecto especial.
- Se incorporó una validación que exige propiedades para cada objeto de categoría Comida.

## Datos 0.1.12 — 2026-08-07

- Se completó la revisión de Océano con el escudo de escamas de serpiente, sus mejoras y el cebo de pesca pesado.
- Se modelaron el trofeo de serpiente y el cebo base adquirido al mercader para conservar la trazabilidad de la pesca oceánica.
- El catálogo renderizado alcanza 234 objetos.

## Datos 0.1.11 — 2026-08-07

- Se completó el bloque funcional de Océano con quitina de leviatanes, navaja y arpón abisales, pesca, carne de serpiente y escamas.
- Se añadieron las conversiones de cocción y las recetas de estofado de serpiente y rollos de pescado.
- El catálogo renderizado alcanza 232 objetos.

## Datos 0.1.10 — 2026-08-07

- Se completó el alcance funcional de Tierras Cenicientas con armas base de flametal, hachas berserkir, Nidhogg, Slayer, Splitnir, silla de asksvin y proyectiles de flametal.
- Se añadieron las variantes de gema de Colmillo de ceniza y las fuentes de piedra de sangre, iolita, jade y azufre.
- El catálogo renderizado alcanza 228 objetos.

## Datos 0.1.9 — 2026-08-07

- Se inició el bloque funcional de Tierras Cenicientas con fuentes y materiales de ceniza, flametal, asksvin, morgen, volture y fortalezas carbonizadas.
- Se añadieron armadura, capa, arco y escudos de flametal; Drakkar, ariete y catapulta para navegación y asedio.
- Se incorporaron carne machacada y mezcla abrasadora. El catálogo renderizado alcanza 218 objetos.

## Datos 0.1.8 — 2026-08-07

- Se completó el bloque funcional de Tierras de Niebla: armas y defensas de caparazón, bastones, equipo mágico, ballesta defensiva y antorcha de luz errante.
- Se añadieron las comidas avanzadas de horno —liebre suprema, hongo relleno y bandeja de carne— junto con sus preparaciones intermedias.
- El catálogo renderizado alcanza 206 objetos.

## Datos 0.1.7 — 2026-08-07

- Se inició el bloque funcional de Tierras de Niebla con extractor de savia, refinería de eitr, forja negra, mesa Galdr y fuente de luces errantes.
- Se añadieron recursos, fuentes y conversiones de mármol negro, núcleos negros, madera de Yggdrasil, savia y eitr refinado.
- Se incorporaron armas, armadura de caparazón, capa de plumas, equipo de eitr y comidas centrales de Niebla.
- El catálogo renderizado alcanza 195 objetos.

## Datos 0.1.6 — 2026-08-06

- Se completó el bloque funcional de Llanuras: agricultura de cebada y lino, horno alto, molino, rueca y las cadenas de metal negro, hilo y harina.
- Se añadieron el equipo acolchado, armas y defensas de metal negro, capas, silla de lox y flecha de aguja.
- Se incorporaron pan, morcilla, pastel de lox y vino de cebada, con sus transformaciones intermedias y lotes de producción.
- El catálogo renderizado alcanza 173 objetos.

## Datos 0.1.5 — 2026-08-06

- Se completó el bloque funcional de Pantanos: equipo y defensas de hierro, hacha de batalla, mazo de hierro, estación de cocina de hierro, portón de hierro, sopas, batido de lodo e hidromieles medias.
- Se completó el bloque funcional de Montañas: recursos de obsidiana, cebolla, cristal y lágrima de dragón; equipo de plata, arcos y flechas; comida de Montañas; mesa de artesano y horno de piedra.
- Se añadieron las fuentes de todos los materiales introducidos y las recetas incluyen costos de mejora cuando el objeto es mejorable.
- El catálogo renderizado pasa de 127 a 151 objetos, con validación de referencias, renderizado y lint satisfactoria.

## Datos 0.1.4 — 2026-08-06

- Se añadieron las estaciones, metalurgia y mejoras tempranas de Bosque Negro: horno de carbón, fundición, forja, yunques, refrigerador de forja, azuele, caldero y fermentador.
- Se añadieron carro y piezas básicas de construcción con madera de núcleo.
- Se añadieron cecina de jabalí, mermelada de reina, estofado de ciervo y salsa de carne picada, incluyendo sus lotes de producción cuando corresponde.
- La carne de ciervo cocinada se modela como material intermedio para conservar la trazabilidad del estofado.

## Datos 0.1.3 — 2026-08-06

- Se completó el catálogo de progresión normal de Praderas: herramientas, armas, defensas, equipo de cuero, flechas y comida cocinada.
- Se incorporaron la estación de cocina, estaciones y mejoras de banco de trabajo, balsa, colmena, almacenamiento y todas las piezas básicas de construcción de madera.
- Se añadieron las fuentes y materiales necesarios: asta dura, plumas, carne cruda, cola de Neck y reina abeja.
- Se contrastaron las recetas del bloque con el listado automatizado de Jötunn para Valheim `0.221.12`.

## Datos 0.1.2 — 2026-08-06

- Se añadieron Hacha de piedra, Martillo, Azada, Garrote, Cuchillo de sílex, Lanza de sílex y Escudo de madera.
- Se añadieron Piedra, su fuente de Praderas y la estación de fabricación manual.
- Se añadió la categoría Defensa para separar escudos de armas y herramientas.

## Datos 0.1.1 — 2026-08-06

- Se añadieron Hacha de sílex y Arco tosco como primer lote de Praderas.
- Se añadieron Sílex, Cobre y Estaño junto con sus fuentes.
- Se modelaron las conversiones de Bronce y Clavos de bronce.
- La interfaz puede desglosar materiales procesados hasta los materiales base registrados.
- Se añadieron validaciones de catálogo y pruebas automatizadas de datos y renderizado.

## Aplicación 0.1.0

- Primera versión local de Valheim Helper para recetas, mejoras y procedencia de materiales.
