# TODO de pruebas manuales

Este documento registra verificaciones manuales que no bloquean la validación automatizada, pero deben revisarse durante el uso real de la aplicación.

## Revisión funcional actual

Revisión realizada el 14 de agosto de 2026.

- [x] Mantenimiento, Revisión de datos y regreso al catálogo.
- [x] Selector de nivel objetivo en equipos mejorables.
- [x] Materiales procesados de un nivel, incluidos metales.
- [x] Materiales procesados con varios niveles de transformación.
- [x] Procesos largos de hidromieles, comidas y materiales refinados.
- [x] Ajustes de usabilidad en jerarquía, áreas clicables, textos y cadenas anidadas.
- [ ] Comportamiento visual en otros monitores y resoluciones reales.

## Pendiente: monitores y resoluciones

La suite E2E ya comprueba automáticamente los viewports de 390×844, 1440×900 y 2560×1440. Esta tarea pendiente busca complementar esas pruebas con monitores, escalado del sistema y navegadores reales.

## Pendiente: iconos SVG

- [ ] Buscar conjuntos de iconos SVG con una estética coherente con Valheim Helper.
- [ ] Verificar que exista cobertura suficiente para objetos, materiales, comidas, estaciones y construcciones.
- [ ] Confirmar licencia, atribución y posibilidad de redistribuir los archivos dentro de una aplicación local.
- [ ] Comparar al menos dos alternativas mediante una muestra visual antes de adoptarlas.
- [ ] Evitar dependencias de CDN o recursos remotos durante el uso de la aplicación.
- [ ] Mantener un fallback legible para cualquier entidad que no tenga icono.
- [ ] Evaluar peso total, consistencia entre plataformas y legibilidad en tarjetas pequeñas.

### Teléfono o ventana estrecha

- [ ] Confirmar que los biomas forman una tira horizontal utilizable.
- [ ] Revisar que filtros y procesos anidados no produzcan desplazamiento horizontal.
- [ ] Comprobar que **Volver a resultados** recupera una posición cómoda de la lista.
- [ ] Verificar que el selector de nivel utiliza correctamente el ancho disponible.
- [ ] Abrir Mantenimiento y Revisión de datos sin cortes ni controles inaccesibles.

### Escritorio 1080p o equivalente

- [ ] Confirmar que la lista y el detalle se desplazan de forma independiente.
- [ ] Revisar el aprovechamiento de las columnas del catálogo.
- [ ] Abrir una cadena larga y comprobar que el detalle no cambia de ancho.
- [ ] Verificar alineación y legibilidad del selector de nivel y sus costos.

### Monitor 2K o superior

- [ ] Revisar tamaño y legibilidad de las fuentes con el escalado real del sistema.
- [ ] Confirmar que las tarjetas aprovechan el espacio sin quedar excesivamente anchas.
- [ ] Revisar el equilibrio visual entre progresión, catálogo y detalle.
- [ ] Abrir Karve, una hidromiel y Ballesta defensiva para evaluar cadenas largas.
- [ ] Confirmar que Mantenimiento conserva un ancho de lectura cómodo.

## Registro de hallazgos

Al detectar un problema, anotar:

- Fecha y dispositivo o monitor.
- Resolución y porcentaje de escalado.
- Navegador y nivel de zoom.
- Objeto o pantalla utilizada.
- Resultado observado y, si es posible, una captura.
