# Hoja de ruta del sistema de actualización

Esta lista conserva el orden acordado para convertir el diagnóstico de versiones en un flujo editorial reproducible. Ningún bloque debe incorporar datos externos directamente al catálogo productivo sin revisión humana y validación.

1. **Procedencia estructurada.** Definir fuentes, estados de evidencia y cobertura gradual mediante `data/provenance.json`.
2. **CLI de diagnóstico.** Exponer el chequeo compartido como `pnpm data:check`, con salida humana, JSON y modo estricto.
3. **Snapshot externo normalizado.** Descargar y transformar el inventario técnico a un artefacto temporal que no modifique `data/`.
4. **Comparación semántica.** Informar objetos nuevos, modificados, ausentes y sin mapeo por identificador y campo funcional.
5. **Candidatos de actualización.** Guardar diferencias seleccionadas con estados editoriales separados del catálogo publicado.
6. **Revisión interactiva S/N.** Aprobar o rechazar candidatos desde terminal, con respuesta segura predeterminada y confirmación reforzada para eliminaciones.
7. **Aplicación controlada.** Aplicar sólo candidatos aprobados sobre una copia temporal, validar y escribir los JSON de forma atómica.
8. **Panel ampliado.** Mostrar cantidades de novedades, traducciones, discrepancias y candidatos pendientes sin permitir escrituras desde la app.
9. **Automatización periódica.** Ejecutar el diagnóstico programado y abrir una notificación o issue, sin commits automáticos.

## Estado

- Bloques 1 a 4: implementados y validados en la rama del PR del diagnóstico de actualizaciones.
- Bloques 5 y 6: inventario editorial y revisión interactiva S/N implementados; las decisiones permanecen separadas del catálogo productivo.
- Bloque 8: panel de solo lectura implementado de forma anticipada para visualizar y filtrar candidatos.
- Bloques 7 y 9: pendientes; requieren cerrar y validar el contrato del bloque anterior antes de comenzar.
