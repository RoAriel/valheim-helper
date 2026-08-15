# Despliegue en Cloudflare Workers

Esta guía publica Valheim Helper en una URL HTTPS administrada por Cloudflare. No requiere abrir puertos, configurar el router ni mantener activo el servidor doméstico. Docker continúa disponible como alternativa local.

## 1. Arquitectura

- Vinext y Vite generan el Worker y los recursos estáticos.
- `wrangler.jsonc` define el nombre, la compatibilidad y la observabilidad.
- El build genera la configuración final en `dist/server/wrangler.json`.
- Wrangler publica esa salida y entrega una dirección `*.workers.dev`.
- Los JSON del catálogo quedan incluidos en cada despliegue; no se necesita D1, KV, R2 ni un volumen persistente.

La fecha de compatibilidad se mantiene alineada con la versión de Workerd bloqueada por Vinext. Debe actualizarse junto con Vinext, el plugin de Cloudflare y Wrangler después de validar el build; no debe adelantarse de forma aislada.

La instalación activa se publica en:

```text
https://valheim-helper.roariel.workers.dev
```

## 2. Requisitos

- Node.js `22.13` o posterior.
- pnpm `11.16.0`.
- Una cuenta de Cloudflare con Workers habilitado.
- El repositorio actualizado y sin cambios locales inesperados.

Comprobar las herramientas:

```bash
node --version
pnpm --version
pnpm exec wrangler --version
```

## 3. Autenticar Wrangler

La autenticación local se realiza una sola vez mediante OAuth:

```bash
pnpm exec wrangler login
pnpm exec wrangler whoami
```

Las credenciales pertenecen al usuario local y no se guardan en el repositorio. Para automatización futura se debe usar un token de API almacenado como secreto de la plataforma, nunca dentro de `wrangler.jsonc`.

## 4. Validar sin publicar

Ejecutar desde la raíz del proyecto:

```bash
pnpm deploy:cloudflare:check
```

Este comando compila la aplicación y ejecuta `wrangler deploy --dry-run`. Debe finalizar sin errores antes de crear o actualizar el Worker remoto.

## 5. Publicar

```bash
pnpm deploy:cloudflare
```

El primer despliegue crea el Worker `valheim-helper`. Las publicaciones siguientes actualizan el mismo recurso y conservan la URL pública.

## 6. Verificar el despliegue

Reemplazar `<url-del-worker>` por la dirección informada por Wrangler:

```bash
curl --fail --silent --show-error \
  --output /dev/null \
  --write-out 'HTTP %{http_code}\n' \
  <url-del-worker>/
```

Debe responder `HTTP 200`. Verificar también el diagnóstico:

```bash
curl --fail --silent --show-error \
  <url-del-worker>/api/update-status
```

La sección `current` debe informar Aplicación `1.2.0`, Catálogo `0.1.25` y Valheim `0.221.12`.

## 7. Actualizar

Después de fusionar un cambio en `main`:

```bash
git switch main
git pull --ff-only
pnpm install --frozen-lockfile
pnpm deploy:cloudflare:check
pnpm deploy:cloudflare
```

Cada despliegue reemplaza el código y los JSON incluidos. No existen migraciones ni datos de ejecución que respaldar.

## 8. Logs y diagnóstico

Consultar registros en tiempo real:

```bash
pnpm exec wrangler tail valheim-helper
```

La observabilidad está habilitada en `wrangler.jsonc`, por lo que también se pueden revisar invocaciones y errores desde el panel de Cloudflare.

## 9. Versiones y rollback

Listar versiones publicadas:

```bash
pnpm exec wrangler versions list
```

Volver a una versión anterior:

```bash
pnpm exec wrangler rollback
```

El rollback remoto no modifica Git. Después de resolver el problema se debe volver a desplegar desde el commit aprobado correspondiente.

## 10. Límites deliberados

- No se configura un dominio personalizado en este bloque.
- No se automatiza todavía el despliegue desde GitHub.
- No se añaden bases de datos ni almacenamiento remoto.
- La URL `workers.dev` será pública; no se incorpora autenticación de usuarios.

Estas decisiones mantienen el despliegue inicial pequeño, reversible y equivalente a la aplicación local.
