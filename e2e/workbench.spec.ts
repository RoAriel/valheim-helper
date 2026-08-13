import { expect, test } from "@playwright/test";

test("el catálogo se adapta a los tamaños de referencia", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "¿Qué querés preparar?" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: /Detalle de/ })).toBeVisible();
  await expect(page.locator(".field-item-list > button").first()).toBeVisible();
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", await page.evaluate(() => window.innerWidth));

  if (testInfo.project.name === "mobile-390") {
    await expect(page.locator(".field-biome-list")).toBeVisible();
    await expect(page.getByRole("button", { name: "ᛃ Praderas", exact: true })).toBeVisible();
    await expect(page.locator(".field-biome-list")).toHaveCSS("overflow-x", "auto");
  }

  if (testInfo.project.name === "wide-2560") {
    await expect(page.locator(".field-item-list")).toHaveCSS("grid-template-columns", /.+ .+/);
  }

  await page.screenshot({ path: testInfo.outputPath(`${testInfo.project.name}.png`) });
});

test("la búsqueda, filtros y estado vacío mantienen un detalle coherente", async ({ page }, testInfo) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Buscar por objeto o nombre en inglés" });

  await search.fill("Nidhogg");
  const nidhogg = page.locator(".field-item-list > button").filter({ hasText: "Nidhogg" }).first();
  await expect(nidhogg).toBeVisible();
  await nidhogg.click();
  await expect(page.locator(".field-detail h2")).toContainText("Nidhogg");
  if (testInfo.project.name === "mobile-390") {
    await expect(page.locator(".field-detail")).toBeInViewport();
  }

  await search.fill("objeto inexistente");
  await expect(page.getByText("No hay objetos que coincidan con estos filtros.")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Sin objeto seleccionado" })).toBeVisible();

  await page.getByRole("button", { name: "Limpiar filtros" }).last().click();
  await expect(search).toHaveValue("");
  await expect(page.getByText("356 objetos")).toBeVisible();

  await page.getByRole("button", { name: "Comida", exact: true }).click();
  await expect(page.getByRole("group", { name: "Filtrar Comida" })).toBeVisible();
  await expect(page.getByRole("combobox")).toBeVisible();

  await page.getByRole("button", { name: "Construcción", exact: true }).click();
  await page.getByRole("button", { name: "Estaciones y proceso", exact: true }).click();
  await expect(page.locator(".field-item-list")).toContainText("Banco de trabajo");
  await expect(page.locator(".field-item-list")).toContainText("Hervidor de hidromiel");
  await expect(page.locator(".field-item-list")).not.toContainText("Cama de dragón");
});

test("la ficha expone lotes, propiedades, acumulados y procedencia", async ({ page }, testInfo) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Buscar por objeto o nombre en inglés" });

  await search.fill("Flecha de fuego");
  await page.locator(".field-item-list > button").first().click();
  await expect(page.getByText("Produce").locator("..")).toContainText("×20");

  await search.fill("Áspic de seeker");
  await page.locator(".field-item-list > button").first().click();
  const properties = page.getByRole("region", { name: "Propiedades del consumible" });
  await expect(properties).toContainText("Salud");
  await expect(properties).toContainText("85");
  await expect(properties).toContainText("25 min");
  await page.screenshot({ path: testInfo.outputPath(`${testInfo.project.name}-propiedades.png`) });

  await search.fill("Hacha de sílex");
  await page.locator(".field-item-list > button").first().click();
  await page.getByText("Mejoras disponibles").click();
  const maximumCost = page.getByRole("region", { name: "Costo total desde nivel 1 hasta nivel 4" });
  await expect(maximumCost).toContainText("Costo total acumulado");
  await expect(maximumCost).toContainText("Nivel 1 → Nivel 4");
  await expect(maximumCost).toContainText("×24");

  const wood = page.locator(".field-cost-detail").filter({ hasText: "Madera" }).first();
  await wood.locator("summary").click();
  await expect(wood).toContainText("Wood");
  await expect(wood).toContainText("Ramas y árboles");
  await expect(wood).toContainText("Praderas");
  await page.screenshot({ path: testInfo.outputPath(`${testInfo.project.name}-mejoras-procedencia.png`) });
});

test("muestra extensiones y requisitos de nivel de las estaciones", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Buscar por objeto o nombre en inglés" });
  await search.fill("Banco de trabajo");
  await page.locator(".field-item-list > button").first().click();
  const extensions = page.getByRole("region", { name: "Extensiones de Banco de trabajo" });
  await expect(extensions).toContainText("Nivel máximo 5");
  await expect(extensions).toContainText("Estantería de herramientas");
  await extensions.getByText("Estantería de herramientas").click();
  const toolShelf = extensions.locator(".field-extension-detail").filter({ hasText: "Estantería de herramientas" });
  await expect(toolShelf).toContainText("Madera fina");
  await expect(toolShelf).toContainText("×10");
  await expect(toolShelf).toContainText("Hierro");
  await expect(toolShelf).toContainText("×4");
  await expect(toolShelf).toContainText("Obsidiana");

  await search.fill("Hacha de sílex");
  await page.locator(".field-item-list > button").first().click();
  await page.getByText("Mejoras disponibles").click();
  await expect(page.getByText("Requiere Banco de trabajo nivel 4")).toBeVisible();
});

test("muestra y expande los objetos base de una variante", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Buscar por objeto o nombre en inglés" });
  await search.fill("Colmillo de sangre");
  await page.locator(".field-item-list > button").first().click();

  const baseItem = page.locator(".field-cost").filter({ hasText: "Colmillo de ceniza" }).first();
  await expect(baseItem).toContainText("objeto base");
  await expect(baseItem).toContainText("×1");

  const plan = page.locator("details.field-plan");
  await plan.locator(":scope > summary").click();
  await expect(plan).toContainText("Madera de ceniza");
  await expect(plan).toContainText("Piedra de sangre");
  await expect(plan).not.toContainText("Colmillo de ceniza");
});

test("el chequeo informa novedades sin modificar el catálogo", async ({ page }) => {
  await page.route("**/api/update-status", async (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      checkedAt: "2026-08-12T17:00:00.000Z",
      current: { appVersion: "1.0.1", catalogVersion: "0.1.20", gameVersion: "0.221.12", dataUpdatedAt: "2026-08-07" },
      latest: { appVersion: "1.0.2", catalogVersion: "0.1.21", stableGameVersion: "0.222.1", jotunnGameVersion: "0.222.1" },
      updates: { app: true, catalog: true, gameData: true },
      status: "review-recommended",
      recommendation: "Hay novedades respecto de esta instalación. Actualizá el repositorio o revisá las fuentes antes de regenerar la información base.",
      sources: [
        { id: "valheim_official", label: "Noticias oficiales de Valheim en Steam", url: "https://store.steampowered.com/news/app/892970", status: "available", version: "0.222.1", detail: "Última versión estable anunciada: 0.222.1" },
        { id: "jotunn_recipes", label: "Inventario de recetas de Jötunn", url: "https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html", status: "available", version: "0.222.1", detail: "Volcado generado para Valheim 0.222.1" },
        { id: "github_catalog", label: "Catálogo publicado en GitHub", url: "https://github.com/RoAriel/valheim-helper", status: "available", version: "0.1.21", detail: "App 1.0.2 · catálogo 0.1.21 · Valheim 0.222.1" },
      ],
    }),
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Buscar actualizaciones" }).click();
  const panel = page.getByRole("dialog", { name: "Actualizaciones" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Revisión recomendada");
  await expect(panel).toContainText("Estable detectada: 0.222.1");
  await expect(panel).toContainText("no modifica los JSON ni el contenedor");
  await page.getByRole("button", { name: "Cerrar estado de actualizaciones" }).click();
  await expect(panel).toBeHidden();
});

test("la revisión de datos separa candidatos pendientes del catálogo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Revisión de datos/ }).click();
  await expect(page.getByRole("heading", { name: "Objetos pendientes" })).toBeVisible();
  await expect(page.getByText("Vista de solo lectura")).toBeVisible();
  await expect(page.getByText("180", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Funcionales", exact: true }).click();
  await page.getByLabel("Mostrar aprobados, rechazados, conocidos y excluidos").check();
  await page.getByLabel("Familia").selectOption("consumable");
  await expect(page.locator(".field-candidate").first()).toBeVisible();
  await expect(page.locator(".field-candidate-grid")).toContainText("Consumibles");

  const search = page.getByRole("textbox", { name: "Buscar candidatos" });
  await search.fill("Recipe_Feaster");
  await expect(page.getByRole("heading", { name: "Serving Tray" })).toBeVisible();

  await page.getByRole("tab", { name: "Catálogo" }).click();
  await expect(page.getByRole("heading", { name: "¿Qué querés preparar?" })).toBeVisible();
});
