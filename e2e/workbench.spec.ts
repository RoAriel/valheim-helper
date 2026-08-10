import { expect, test } from "@playwright/test";

test("el catálogo se adapta a los tamaños de referencia", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "¿Qué querés preparar?" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: /Detalle de/ })).toBeVisible();
  await expect(page.locator(".field-item-list > button").first()).toBeVisible();
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", await page.evaluate(() => window.innerWidth));

  if (testInfo.project.name === "mobile-390") {
    await expect(page.locator(".field-biome-list")).toBeVisible();
    await expect(page.getByRole("button", { name: /Praderas/ })).toBeVisible();
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
  await expect(page.getByText("250 objetos")).toBeVisible();

  await page.getByRole("button", { name: "Comida", exact: true }).click();
  await expect(page.getByRole("group", { name: "Filtrar Comida" })).toBeVisible();
  await expect(page.getByRole("combobox")).toBeVisible();
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
