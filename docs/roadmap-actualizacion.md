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

- Bloques 1 a 6: implementados y validados.
- Bloque 7: primera aplicación controlada completada en Datos `0.1.24`; Datos `0.1.25` añade dependencias entre objetos y deja 328/328 coincidencias comparables sin diferencias. La escritura atómica genérica continúa pendiente antes de automatizar nuevas altas.
- Bloque 8: panel de solo lectura implementado; la clasificación determinista reduce los casos manuales de 225 a cero y deja únicamente candidatos con familia o alias concreto.
- Bloque 9: pendiente. No se programarán commits ni cambios automáticos; la futura tarea sólo diagnosticará y notificará.

## Pausa acordada

Después del cierre de Aplicación `1.2.0` y del despliegue en Cloudflare, el catálogo queda en mantenimiento estable hasta Valheim `1.0`. La aplicación puede seguir ejecutando diagnósticos de solo lectura, pero los bloques de incorporación se reactivarán únicamente cuando exista una nueva versión del juego o una corrección verificable. Ningún resultado externo se añade directamente a los JSON.
