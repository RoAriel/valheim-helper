import { readFile, writeFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const normalize = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const recipes = await readJson("data/recipes.json");
const items = await readJson("data/items.json");
const materials = await readJson("data/materials.json");
const snapshot = await readJson(".cache/valheim-helper/latest-jotunn-catalog.json");

const itemAliases = new Map([
  [normalize("Nidhgg"), "nidhogg"],
  [normalize("Nidhögg"), "nidhogg"],
]);
const itemIds = new Map(items.map((item) => [normalize(item.name.en), item.id]));
for (const [name, id] of itemAliases) itemIds.set(name, id);
const materialAliases = new Map([[normalize("Finewood"), "fine_wood"], [normalize("Corewood"), "core_wood"]]);
const materialIds = new Map(materials.map((material) => [normalize(material.name.en), material.id]));
for (const [name, id] of materialAliases) materialIds.set(name, id);

const wikiPreferred = new Set(["minor_health_mead", "minor_stamina_mead"]);
const targets = new Set([
  "arbalest", "krom", "mistwalker", "jotun_bane", "carapace_breastplate", "carapace_greaves", "carapace_helmet", "feather_cape",
  "eitr_weave_robe", "eitr_weave_trousers", "eitr_weave_hood", "staff_of_embers", "staff_of_frost", "staff_of_protection", "dead_raiser",
  "himminafl", "demolisher", "carapace_spear", "carapace_shield", "carapace_buckler", "flametal_breastplate", "flametal_greaves",
  "flametal_helmet", "ashen_cape", "ash_fang", "flametal_shield", "flametal_tower_shield", "berserkir_axes", "flametal_mace",
  "slayer", "splitnir", "abyssal_razor"
  ,"blood_fang", "storm_fang", "root_fang"
]);

function ingredient(nameEn) {
  const normalized = normalize(nameEn);
  const itemId = itemIds.get(normalized);
  if (itemId) return { itemId, amount: 1 };
  const materialId = materialIds.get(normalized);
  if (!materialId) throw new Error(`Ingrediente sin mapear: ${nameEn}`);
  return { materialId, amount: 1 };
}

for (const recipe of recipes) {
  if (!targets.has(recipe.itemId)) continue;
  const item = items.find((entry) => entry.id === recipe.itemId);
  const external = snapshot.entries.find((entry) => entry.sourceKind === "recipe" && normalize(entry.itemNameEn) === normalize(item.name.en));
  if (!external) throw new Error(`Receta externa ausente: ${item.name.en}`);
  const firstStationLevel = ["blood_fang", "storm_fang", "root_fang"].includes(recipe.itemId) ? 4 : recipe.craft.stationLevel;
  const steps = external.levels.map((level, index) => ({
    targetLevel: level.targetLevel,
    stationLevel: firstStationLevel + index,
    materials: level.materials.map((cost) => ({ ...ingredient(cost.nameEn), amount: cost.amount })),
  }));
  recipe.craft = steps[0];
  recipe.upgrades = steps.slice(1);
}

// Las variantes elementales consumen el arma base, no una imitación registrada como material.
const baseEquipmentAliases = new Map([["ash_fang", "ash_fang"], ["nidhgg", "nidhogg"], ["nidhogg", "nidhogg"], ["ripper", "ripper"], ["berserkir_axes", "berserkir_axes"], ["flametal_mace", "flametal_mace"], ["slayer", "slayer"], ["splitnir", "splitnir"]]);
for (const recipe of recipes) {
  for (const step of [recipe.craft, ...recipe.upgrades]) {
    step.materials = step.materials.map((cost) => baseEquipmentAliases.has(cost.materialId) ? { itemId: baseEquipmentAliases.get(cost.materialId), amount: cost.amount } : cost);
  }
}

const fakeMaterialIds = new Set(materials.filter((material) => baseEquipmentAliases.has(material.id)).map((material) => material.id));
const cleanedMaterials = materials.filter((material) => !fakeMaterialIds.has(material.id));

if (wikiPreferred.size !== 2) throw new Error("Contrato de excepciones wiki alterado");
await Promise.all([writeJson("data/recipes.json", recipes), writeJson("data/materials.json", cleanedMaterials)]);
console.log(`Completadas ${targets.size} recetas; retirados ${fakeMaterialIds.size} objetos duplicados como materiales.`);
