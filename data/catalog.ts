import biomesData from "./biomes.json" with { type: "json" };
import foodEffectsData from "./food-effects.json" with { type: "json" };
import itemsData from "./items.json" with { type: "json" };
import manifestData from "./manifest.json" with { type: "json" };
import materialRecipesData from "./material-recipes.json" with { type: "json" };
import materialsData from "./materials.json" with { type: "json" };
import recipesData from "./recipes.json" with { type: "json" };
import sourcesData from "./sources.json" with { type: "json" };
import stationsData from "./stations.json" with { type: "json" };
import stationExtensionsData from "./station-extensions.json" with { type: "json" };
import subcategoriesData from "./subcategories.json" with { type: "json" };

export type BilingualName = { es: string; en: string };
export type Category = "Armas" | "Herramientas" | "Construcción" | "Comida" | "Defensa";
export type MaterialCost = { materialId: string; amount: number };
export type ItemCost = { itemId: string; amount: number };
export type IngredientCost = MaterialCost | ItemCost;
export type MaterialRecipe = { materialId: string; stationId: string; outputAmount: number; materials: MaterialCost[] };
export type RecipeStep = { targetLevel: number; stationLevel: number; materials: IngredientCost[] };
export type Recipe = { itemId: string; stationId: string; outputAmount?: number; craft: RecipeStep; upgrades: RecipeStep[] };
export type Item = { id: string; name: BilingualName; icon: string; category: Category; description: string; stageBiomeId: string };
export type Material = { id: string; name: BilingualName; icon: string; sourceIds: string[] };
export type Source = { id: string; name: BilingualName; biomeIds: string[]; requirement?: string };
export type BiomeTheme = { accent: string; surface: string; symbol: string };
export type Biome = { id: string; name: BilingualName; theme: BiomeTheme };
export type Subcategory = { id: string; category: Category; name: BilingualName; itemIds: string[] };
export type Station = { id: string; name: BilingualName };
export type StationExtension = { itemId: string; progressionOrder: number };
export type StationExtensionGroup = { stationId: string; stationItemId: string; maxLevel: number; extensions: StationExtension[] };
export type FoodEffect = { itemId: string; health?: number; stamina?: number; eitr?: number; healing?: number; durationSeconds?: number; effects?: string[] };
export type GoalPlan = { itemId: string; targetLevel: number; materials: MaterialCost[]; stationIds: string[]; biomeIds: string[] };
export type UpgradeCostSummary = { targetLevel: number; step: IngredientCost[]; cumulative: IngredientCost[] };

export const manifest = manifestData;
export const biomes = biomesData as Biome[];
export const subcategories = subcategoriesData as Subcategory[];
export const stations = stationsData as Station[];
export const stationExtensions = stationExtensionsData as StationExtensionGroup[];
export const sources = sourcesData as Source[];
export const materials = materialsData as Material[];
export const items = itemsData as Item[];
export const recipes = recipesData as Recipe[];
export const materialRecipes = materialRecipesData as MaterialRecipe[];
export const foodEffects = foodEffectsData as FoodEffect[];
export type Catalog = {
  biomes: Biome[];
  subcategories: Subcategory[];
  stations: Station[];
  sources: Source[];
  materials: Material[];
  items: Item[];
  recipes: Recipe[];
  materialRecipes: MaterialRecipe[];
  foodEffects: FoodEffect[];
  stationExtensions: StationExtensionGroup[];
};
export const catalog: Catalog = { biomes, subcategories, stations, sources, materials, items, recipes, materialRecipes, foodEffects, stationExtensions };

export const byId = <T extends { id: string }>(entries: T[], id: string) => entries.find((entry) => entry.id === id);

function validateUniqueIds(entries: { id: string }[], entity: string, errors: string[]) {
  const ids = new Set<string>();
  for (const { id } of entries) {
    if (ids.has(id)) errors.push(`${entity} duplicado: ${id}`);
    ids.add(id);
  }
}

function validateRecipeStep(step: RecipeStep, itemId: string, expectedLevel: number, stepName: string, materials: Material[], errors: string[], items: Item[] = []) {
  if (step.targetLevel !== expectedLevel) {
    errors.push(`${stepName} de ${itemId} debe llegar a nivel ${expectedLevel}`);
  }
  if (!Number.isInteger(step.stationLevel) || step.stationLevel < 1) {
    errors.push(`${stepName} de ${itemId} tiene un nivel de estación inválido`);
  }

  const ingredientIds = new Set<string>();
  for (const cost of step.materials) {
    const ingredientId = "materialId" in cost ? `material:${cost.materialId}` : `item:${cost.itemId}`;
    if ("materialId" in cost && !materials.some((material) => material.id === cost.materialId)) errors.push(`Material inexistente: ${cost.materialId}`);
    if ("itemId" in cost && !items.some((item) => item.id === cost.itemId)) errors.push(`Objeto ingrediente inexistente: ${cost.itemId}`);
    if ("itemId" in cost && cost.itemId === itemId) errors.push(`${stepName} de ${itemId} se referencia a sí mismo`);
    if (ingredientIds.has(ingredientId)) errors.push(`${stepName} de ${itemId} repite el ingrediente ${ingredientId}`);
    ingredientIds.add(ingredientId);
    if (!Number.isInteger(cost.amount) || cost.amount < 1) {
      errors.push(`${stepName} de ${itemId} tiene una cantidad inválida para ${"materialId" in cost ? cost.materialId : cost.itemId}`);
    }
  }
}

function validateMaterialRecipeCycles(materialRecipes: MaterialRecipe[], errors: string[]) {
  const recipesByMaterial = new Map(materialRecipes.map((recipe) => [recipe.materialId, recipe]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const reported = new Set<string>();

  function visit(materialId: string) {
    if (visiting.has(materialId)) {
      if (!reported.has(materialId)) errors.push(`Dependencia circular de materiales: ${materialId}`);
      reported.add(materialId);
      return;
    }
    if (visited.has(materialId)) return;
    visited.add(materialId);
    visiting.add(materialId);
    recipesByMaterial.get(materialId)?.materials.forEach((cost) => visit(cost.materialId));
    visiting.delete(materialId);
  }

  materialRecipes.forEach((recipe) => visit(recipe.materialId));
}

function validateItemRecipeCycles(recipes: Recipe[], errors: string[]) {
  const recipesByItem = new Map(recipes.map((recipe) => [recipe.itemId, recipe]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(itemId: string) {
    if (visiting.has(itemId)) { errors.push(`Dependencia circular de objetos: ${itemId}`); return; }
    if (visited.has(itemId)) return;
    visited.add(itemId);
    visiting.add(itemId);
    recipesByItem.get(itemId)?.craft.materials.filter((cost): cost is ItemCost => "itemId" in cost).forEach((cost) => visit(cost.itemId));
    visiting.delete(itemId);
  }
  recipes.forEach((recipe) => visit(recipe.itemId));
}

export function validateCatalog(catalogToValidate: Catalog = catalog) {
  const { biomes, subcategories, stations, sources, materials, items, recipes, materialRecipes, foodEffects, stationExtensions } = catalogToValidate;
  const errors: string[] = [];
  validateUniqueIds(biomes, "Bioma", errors);
  validateUniqueIds(stations, "Estación", errors);
  validateUniqueIds(sources, "Fuente", errors);
  validateUniqueIds(materials, "Material", errors);
  validateUniqueIds(items, "Objeto", errors);
  validateUniqueIds(foodEffects.map((effect) => ({ id: effect.itemId })), "Efecto de comida", errors);
  validateUniqueIds(subcategories, "Subcategoría", errors);
  validateUniqueIds(stationExtensions.map((entry) => ({ id: entry.stationId })), "Cadena de extensiones", errors);

  const extensionItemIds = new Set<string>();
  for (const group of stationExtensions) {
    if (!stations.some((station) => station.id === group.stationId)) errors.push(`Estación inexistente en extensiones: ${group.stationId}`);
    if (!items.some((item) => item.id === group.stationItemId)) errors.push(`Objeto de estación inexistente: ${group.stationItemId}`);
    if (group.maxLevel !== group.extensions.length + 1) errors.push(`Nivel máximo incoherente para ${group.stationId}`);
    const orders = group.extensions.map((extension) => extension.progressionOrder);
    if (new Set(orders).size !== orders.length || orders.some((order, index) => order !== index + 1)) errors.push(`Orden de extensiones inválido para ${group.stationId}`);
    for (const extension of group.extensions) {
      if (!items.some((item) => item.id === extension.itemId)) errors.push(`Extensión inexistente para ${group.stationId}: ${extension.itemId}`);
      if (extensionItemIds.has(extension.itemId)) errors.push(`Extensión repetida entre estaciones: ${extension.itemId}`);
      extensionItemIds.add(extension.itemId);
    }
  }

  const subcategoryItemIds = new Map<string, number>();
  const categorizedCategories = new Set(subcategories.map((subcategory) => subcategory.category));
  for (const subcategory of subcategories) {
    for (const itemId of subcategory.itemIds) {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) errors.push(`La subcategoría ${subcategory.id} referencia un objeto inexistente: ${itemId}`);
      else if (item.category !== subcategory.category) errors.push(`La subcategoría ${subcategory.id} no coincide con la categoría de ${itemId}`);
      subcategoryItemIds.set(itemId, (subcategoryItemIds.get(itemId) ?? 0) + 1);
    }
  }
  for (const item of items.filter((entry) => categorizedCategories.has(entry.category))) {
    const matches = subcategoryItemIds.get(item.id) ?? 0;
    if (matches !== 1) errors.push(`El objeto ${item.id} debe pertenecer a una sola subcategoría`);
  }

  for (const biome of biomes) {
    if (!biome.theme) {
      errors.push(`Tema visual faltante para ${biome.id}`);
      continue;
    }
    for (const [name, color] of Object.entries({ accent: biome.theme.accent, surface: biome.theme.surface })) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) errors.push(`Color ${name} inválido para ${biome.id}`);
    }
    if (!biome.theme.symbol) errors.push(`Identidad visual incompleta para ${biome.id}`);
  }

  for (const item of items.filter((entry) => entry.category === "Comida")) {
    if (!foodEffects.some((effect) => effect.itemId === item.id)) errors.push(`Faltan propiedades de comida para ${item.id}`);
  }
  for (const effect of foodEffects) {
    const item = items.find((entry) => entry.id === effect.itemId);
    if (!item) errors.push(`Efecto de comida para objeto inexistente: ${effect.itemId}`);
    else if (item.category !== "Comida") errors.push(`Efecto de comida asignado a objeto no comestible: ${effect.itemId}`);
    const values = [effect.health, effect.stamina, effect.eitr, effect.healing, effect.durationSeconds].filter((value) => value !== undefined);
    if (!values.length && !effect.effects?.length) errors.push(`Propiedades vacías para ${effect.itemId}`);
    values.forEach((value) => { if (!Number.isInteger(value) || value < 1) errors.push(`Valor de comida inválido para ${effect.itemId}`); });
  }

  const recipeItemIds = new Set<string>();
  for (const recipe of recipes) {
    if (recipeItemIds.has(recipe.itemId)) errors.push(`Receta duplicada para ${recipe.itemId}`);
    recipeItemIds.add(recipe.itemId);
  }

  for (const item of items) {
    const recipe = recipes.find((entry) => entry.itemId === item.id);
    if (!recipe) errors.push(`Falta una receta para ${item.id}`);
    if (!biomes.some((biome) => biome.id === item.stageBiomeId)) {
      errors.push(`Bioma de progreso inexistente para ${item.id}: ${item.stageBiomeId}`);
    }
  }
  for (const source of sources) {
    for (const biomeId of source.biomeIds) {
      if (!biomes.some((biome) => biome.id === biomeId)) {
        errors.push(`La fuente ${source.id} referencia un bioma inexistente: ${biomeId}`);
      }
    }
  }
  for (const material of materials) {
    for (const sourceId of material.sourceIds) {
      if (!sources.some((source) => source.id === sourceId)) {
        errors.push(`El material ${material.id} referencia una fuente inexistente: ${sourceId}`);
      }
    }
  }
  const materialRecipeIds = new Set<string>();
  for (const recipe of materialRecipes) {
    if (materialRecipeIds.has(recipe.materialId)) errors.push(`Receta de material duplicada para ${recipe.materialId}`);
    materialRecipeIds.add(recipe.materialId);
    if (!materials.some((material) => material.id === recipe.materialId)) {
      errors.push(`La receta de material referencia un material inexistente: ${recipe.materialId}`);
    }
    if (!stations.some((station) => station.id === recipe.stationId)) {
      errors.push(`Estación inexistente en receta de material: ${recipe.stationId}`);
    }
    if (!Number.isInteger(recipe.outputAmount) || recipe.outputAmount < 1) {
      errors.push(`Cantidad de salida inválida para ${recipe.materialId}`);
    }
    validateRecipeStep({ targetLevel: 1, stationLevel: 1, materials: recipe.materials }, recipe.materialId, 1, "Receta de material", materials, errors);
  }
  validateMaterialRecipeCycles(materialRecipes, errors);
  for (const recipe of recipes) {
    if (!items.some((item) => item.id === recipe.itemId)) errors.push(`La receta referencia un objeto inexistente: ${recipe.itemId}`);
    if (!stations.some((station) => station.id === recipe.stationId)) errors.push(`Estación inexistente: ${recipe.stationId}`);
    if (recipe.outputAmount !== undefined && (!Number.isInteger(recipe.outputAmount) || recipe.outputAmount < 1)) {
      errors.push(`Cantidad de salida inválida para ${recipe.itemId}`);
    }
    validateRecipeStep(recipe.craft, recipe.itemId, 1, "Fabricación", materials, errors, items);
    recipe.upgrades.forEach((upgrade, index) => {
      validateRecipeStep(upgrade, recipe.itemId, index + 2, `Mejora ${index + 1}`, materials, errors, items);
    });
  }
  validateItemRecipeCycles(recipes, errors);
  return errors;
}

export function expandMaterialCosts(costs: MaterialCost[], materialRecipesToUse: MaterialRecipe[] = materialRecipes) {
  const recipesByMaterial = new Map(materialRecipesToUse.map((recipe) => [recipe.materialId, recipe]));
  const totals = new Map<string, number>();
  const resolving = new Set<string>();

  function addCost({ materialId, amount }: MaterialCost) {
    const recipe = recipesByMaterial.get(materialId);
    if (!recipe) {
      totals.set(materialId, (totals.get(materialId) ?? 0) + amount);
      return;
    }
    if (resolving.has(materialId)) throw new Error(`Dependencia circular de materiales: ${materialId}`);
    resolving.add(materialId);
    const batches = Math.ceil(amount / recipe.outputAmount);
    recipe.materials.forEach((cost) => addCost({ materialId: cost.materialId, amount: cost.amount * batches }));
    resolving.delete(materialId);
  }

  costs.forEach(addCost);
  return Array.from(totals, ([materialId, amount]) => ({ materialId, amount }));
}

function mergeIngredientCosts(costs: IngredientCost[]) {
  const totals = new Map<string, number>();
  costs.forEach((cost) => {
    const key = "materialId" in cost ? `material:${cost.materialId}` : `item:${cost.itemId}`;
    totals.set(key, (totals.get(key) ?? 0) + cost.amount);
  });
  return Array.from(totals, ([key, amount]) => key.startsWith("material:") ? { materialId: key.slice(9), amount } : { itemId: key.slice(5), amount });
}

export function buildUpgradeCostSummaries(recipe: Recipe): UpgradeCostSummary[] {
  let cumulative = [...recipe.craft.materials];
  return recipe.upgrades.map((upgrade) => {
    cumulative = mergeIngredientCosts([...cumulative, ...upgrade.materials]);
    return { targetLevel: upgrade.targetLevel, step: upgrade.materials, cumulative: [...cumulative] };
  });
}

export function stationRequirement(stationId: string, stationLevel: number) {
  const group = stationExtensions.find((entry) => entry.stationId === stationId);
  if (!group || stationLevel <= 1) return null;
  return { group, extensionCount: Math.min(stationLevel - 1, group.extensions.length) };
}

export function buildGoalPlan(itemId: string, targetLevel = 1): GoalPlan {
  const recipe = recipes.find((entry) => entry.itemId === itemId);
  if (!recipe) throw new Error(`No existe receta para el objetivo: ${itemId}`);
  const maximumLevel = recipe.upgrades.at(-1)?.targetLevel ?? 1;
  if (!Number.isInteger(targetLevel) || targetLevel < 1 || targetLevel > maximumLevel) throw new Error(`Nivel objetivo inválido para ${itemId}: ${targetLevel}`);

  const stationIds = new Set<string>();
  const processedMaterialIds = new Set<string>();
  const resolvingItems = new Set<string>();
  const rawCosts: MaterialCost[] = [];
  function collectMaterialStations(materialId: string) {
    if (processedMaterialIds.has(materialId)) return;
    const materialRecipe = materialRecipes.find((entry) => entry.materialId === materialId);
    if (!materialRecipe) return;
    processedMaterialIds.add(materialId);
    stationIds.add(materialRecipe.stationId);
    materialRecipe.materials.forEach((cost) => collectMaterialStations(cost.materialId));
  }
  function expandIngredients(costs: IngredientCost[], multiplier = 1) {
    costs.forEach((cost) => {
      if ("itemId" in cost) {
        if (resolvingItems.has(cost.itemId)) throw new Error(`Dependencia circular de objetos: ${cost.itemId}`);
        const itemRecipe = recipes.find((entry) => entry.itemId === cost.itemId);
        if (!itemRecipe) throw new Error(`Objeto ingrediente sin receta: ${cost.itemId}`);
        resolvingItems.add(cost.itemId);
        stationIds.add(itemRecipe.stationId);
        expandIngredients(itemRecipe.craft.materials, multiplier * cost.amount);
        resolvingItems.delete(cost.itemId);
        return;
      }
      rawCosts.push({ materialId: cost.materialId, amount: cost.amount * multiplier });
      collectMaterialStations(cost.materialId);
    });
  }
  stationIds.add(recipe.stationId);
  resolvingItems.add(itemId);
  expandIngredients([
    ...recipe.craft.materials,
    ...recipe.upgrades.filter((upgrade) => upgrade.targetLevel <= targetLevel).flatMap((upgrade) => upgrade.materials),
  ]);

  const goalMaterials = expandMaterialCosts(mergeIngredientCosts(rawCosts) as MaterialCost[]);
  const biomeIds = biomes
    .filter((biome) => goalMaterials.some((cost) => byId(materials, cost.materialId)?.sourceIds.some((sourceId) => byId(sources, sourceId)?.biomeIds.includes(biome.id))))
    .map((biome) => biome.id);

  return { itemId, targetLevel, materials: goalMaterials, stationIds: Array.from(stationIds), biomeIds };
}

const catalogErrors = validateCatalog();
if (catalogErrors.length) throw new Error(`Catálogo inválido:\n${catalogErrors.join("\n")}`);
