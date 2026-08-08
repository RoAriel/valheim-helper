import assert from "node:assert/strict";
import test from "node:test";

const { buildGoalPlan, catalog, foodEffects, manifest, expandMaterialCosts, subcategories, validateCatalog } = await import("../data/catalog.ts");
const { filterCatalogItems, resolveSelectedItem } = await import("../data/catalog-filters.ts");
const audit = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../data/functional-crafting-audit.json", import.meta.url), "utf8"));
const consumableCoverage = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../data/consumable-coverage.json", import.meta.url), "utf8"));

test("acepta el catálogo piloto válido", () => {
  assert.deepEqual(validateCatalog(), []);
});

test("exige un tema visual válido para cada bioma", () => {
  assert.ok(catalog.biomes.every((biome) => /^#[0-9a-f]{6}$/i.test(biome.theme.accent) && /^#[0-9a-f]{6}$/i.test(biome.theme.surface) && biome.theme.symbol));
  const invalidCatalog = structuredClone(catalog);
  invalidCatalog.biomes.find((biome) => biome.id === "meadows").theme.accent = "oro";
  assert.ok(validateCatalog(invalidCatalog).includes("Color accent inválido para meadows"));
});

test("clasifica todas las armas en una sola subcategoría", () => {
  const weaponItemIds = catalog.items.filter((item) => item.category === "Armas").map((item) => item.id);
  const classifiedItemIds = subcategories.flatMap((subcategory) => subcategory.itemIds);
  assert.ok(weaponItemIds.every((itemId) => classifiedItemIds.filter((classifiedId) => classifiedId === itemId).length === 1));
  assert.deepEqual(validateCatalog(), []);
});

test("clasifica los consumibles entre alimentos preparados y bebidas funcionales", () => {
  const foodItemIds = catalog.items.filter((item) => item.category === "Comida").map((item) => item.id);
  const foodSubcategories = subcategories.filter((subcategory) => subcategory.category === "Comida");
  assert.deepEqual(foodSubcategories.map((subcategory) => subcategory.id), ["prepared_food", "brewed_consumables"]);
  assert.ok(foodItemIds.every((itemId) => foodSubcategories.flatMap((subcategory) => subcategory.itemIds).filter((classifiedId) => classifiedId === itemId).length === 1));
});

test("filtra el catálogo de forma coherente y conserva la selección sólo dentro de los resultados", () => {
  const bows = filterCatalogItems({ biomeId: "all", query: "", category: "Armas", subcategoryId: "bows", foodFocus: "all" });
  assert.ok(bows.length > 0);
  assert.ok(bows.every((item) => item.category === "Armas"));

  const noResults = filterCatalogItems({ biomeId: "meadows", query: "Nidhogg", category: "Todos", subcategoryId: "all", foodFocus: "all" });
  assert.deepEqual(noResults, []);
  assert.equal(resolveSelectedItem(noResults, "club"), null);
  assert.equal(resolveSelectedItem(bows, "club"), bows[0]);
});

test("incluye el bloque completo de progresión normal de Praderas", () => {
  const meadowsItems = catalog.items.filter((item) => item.stageBiomeId === "meadows");
  assert.equal(meadowsItems.length, 66);
  for (const itemId of ["antler_pickaxe", "leather_tunic", "beehive", "raft", "thatch_roof_45", "stakewall"]) {
    assert.ok(meadowsItems.some((item) => item.id === itemId), `falta ${itemId}`);
  }
});

test("registra la producción por lote y rechaza cantidades de salida inválidas", () => {
  const fireArrows = catalog.recipes.find((recipe) => recipe.itemId === "fire_arrow");
  assert.equal(fireArrows?.outputAmount, 20);

  const invalidCatalog = structuredClone(catalog);
  const invalidRecipe = invalidCatalog.recipes.find((recipe) => recipe.itemId === "fire_arrow");
  assert.ok(invalidRecipe);
  invalidRecipe.outputAmount = 0;
  assert.ok(validateCatalog(invalidCatalog).includes("Cantidad de salida inválida para fire_arrow"));
});

test("detecta relaciones y pasos de receta inválidos", () => {
  const invalidCatalog = structuredClone(catalog);
  const finewoodBow = invalidCatalog.items.find((item) => item.id === "finewood_bow");
  const finewoodBowRecipe = invalidCatalog.recipes.find((recipe) => recipe.itemId === "finewood_bow");
  const flintSource = invalidCatalog.sources.find((source) => source.id === "flint_shore");
  const flint = invalidCatalog.materials.find((material) => material.id === "flint");
  assert.ok(finewoodBow && finewoodBowRecipe && flintSource && flint);

  finewoodBow.stageBiomeId = "missing_biome";
  flintSource.biomeIds = ["missing_biome"];
  flint.sourceIds = ["missing_source"];
  invalidCatalog.recipes.push(structuredClone(finewoodBowRecipe));
  finewoodBowRecipe.craft.materials[0].amount = 0;
  finewoodBowRecipe.upgrades[0].targetLevel = 4;

  const errors = validateCatalog(invalidCatalog);
  assert.ok(errors.includes("Bioma de progreso inexistente para finewood_bow: missing_biome"));
  assert.ok(errors.includes("La fuente flint_shore referencia un bioma inexistente: missing_biome"));
  assert.ok(errors.includes("El material flint referencia una fuente inexistente: missing_source"));
  assert.ok(errors.includes("Receta duplicada para finewood_bow"));
  assert.ok(errors.includes("Fabricación de finewood_bow tiene una cantidad inválida para fine_wood"));
  assert.ok(errors.includes("Mejora 1 de finewood_bow debe llegar a nivel 2"));
});

test("desglosa conversiones de materiales respetando los lotes", () => {
  const karveRecipe = catalog.recipes.find((recipe) => recipe.itemId === "karve");
  assert.ok(karveRecipe);

  assert.deepEqual(expandMaterialCosts(karveRecipe.craft.materials), [
    { materialId: "fine_wood", amount: 30 },
    { materialId: "deer_hide", amount: 10 },
    { materialId: "resin", amount: 20 },
    { materialId: "copper", amount: 8 },
    { materialId: "tin", amount: 4 },
  ]);
});

test("planifica materias primas, estaciones y biomas para un objetivo", () => {
  const plan = buildGoalPlan("karve");
  assert.deepEqual(plan.materials, expandMaterialCosts(catalog.recipes.find((recipe) => recipe.itemId === "karve").craft.materials));
  assert.ok(plan.stationIds.includes("workbench_nearby"));
  assert.ok(plan.stationIds.includes("forge"));
  assert.ok(plan.biomeIds.includes("black_forest"));
});

test("rechaza dependencias circulares entre materiales", () => {
  const invalidCatalog = structuredClone(catalog);
  const bronzeRecipe = invalidCatalog.materialRecipes.find((recipe) => recipe.materialId === "bronze");
  assert.ok(bronzeRecipe);
  bronzeRecipe.materials = [{ materialId: "bronze_nails", amount: 1 }];

  assert.ok(validateCatalog(invalidCatalog).includes("Dependencia circular de materiales: bronze"));
});

test("mantiene la cobertura auditada de objetos funcionales fabricables", () => {
  assert.equal(manifest.gameVersion, audit.gameVersion);
  assert.equal(catalog.recipes.length, catalog.items.length, "cada objeto visible debe tener una receta");

  const auditedBiomeIds = new Set(audit.biomes.map((biome) => biome.biomeId));
  for (const item of catalog.items) {
    assert.ok(auditedBiomeIds.has(item.stageBiomeId), `objeto sin clasificación auditada: ${item.id}`);
  }

  for (const biome of audit.biomes) {
    const itemIds = catalog.items.filter((item) => item.stageBiomeId === biome.biomeId).map((item) => item.id);
    assert.equal(itemIds.length, biome.expectedRecipeCount, `cobertura inesperada en ${biome.biomeId}`);
    for (const itemId of biome.requiredItemIds) {
      assert.ok(itemIds.includes(itemId), `falta receta funcional auditada: ${itemId}`);
    }
  }
});

test("cubre todos los consumibles con propiedades de juego", () => {
  assert.equal(foodEffects.length, catalog.items.filter((item) => item.category === "Comida").length);
  assert.deepEqual(foodEffects.find((effect) => effect.itemId === "seeker_aspic"), { itemId: "seeker_aspic", health: 12, stamina: 13, eitr: 85, healing: 1, durationSeconds: 1500 });
  assert.deepEqual(foodEffects.find((effect) => effect.itemId === "poison_resistance_mead")?.effects, ["Resistencia al veneno"]);
});

test("cubre las familias obligatorias de hidromieles y pociones", () => {
  const required = ["minor_health_mead", "medium_health_mead", "major_health_mead", "lingering_health_mead", "minor_stamina_mead", "medium_stamina_mead", "lingering_stamina_mead", "minor_eitr_mead", "lingering_eitr_mead", "poison_resistance_mead", "frost_resistance_mead", "barley_wine", "tasty_mead", "anti_sting_concoction", "berserkir_mead", "ratatosk_tonic", "lightfoot_mead", "troll_endurance_mead", "vananidir_draught", "animal_whispers_brew"];
  assert.equal(consumableCoverage.families.length, required.length);
  for (const itemId of required) {
    assert.ok(catalog.items.some((item) => item.id === itemId), `falta consumible obligatorio: ${itemId}`);
    assert.ok(catalog.recipes.some((recipe) => recipe.itemId === itemId), `falta fermentación o receta: ${itemId}`);
    assert.ok(foodEffects.some((effect) => effect.itemId === itemId), `faltan efectos: ${itemId}`);
  }
});
