import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza el catálogo ampliado de Valheim Helper", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<title>Valheim Helper — Recetas y materiales<\/title>/);
  assert.match(html, /Revisión de datos/);
  assert.match(html, /227/);
  assert.match(html, /Valheim <!-- -->0\.221\.12/);
  assert.match(html, /Buscar por objeto o nombre en inglés/);
  assert.match(html, /Limpiar filtros/);
  assert.match(html, /Progresión por bioma/);
  assert.match(html, /Praderas.*Meadows/);
  assert.match(html, /Tierras de Niebla.*Mistlands/);
  assert.match(html, /MODO PLANIFICAR/);
  assert.match(html, /356<!-- --> objetos/);
  assert.match(html, /Hacha de sílex/);
  assert.match(html, /Flint axe/);
  assert.match(html, /A mano/);
  assert.match(html, /Piedra/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|react-loading-skeleton/i);
});
