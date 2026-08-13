import { readFile, writeFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const slug = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const spanishNames = {
  "Ashlands Gourmet Bowl": "Cuenco gourmet de las Tierras Cenicientas",
  "Asksvin Cloak": "Capa de asksvin",
  "Black Forest Buffet Platter": "Fuente de bufé del Bosque Negro",
  "Bleeding Berserkir Axes": "Hachas berserker sangrantes",
  Bloodgeon: "Maza sanguinaria",
  "Bone Tower Shield": "Escudo torre de hueso",
  "Breastplate of Ask": "Coraza de Ask",
  "Brutal Slayer": "Matadora brutal",
  "Butcher Knife": "Cuchillo de carnicero",
  "Cooked Egg": "Huevo cocinado",
  "Copper Knife": "Cuchillo de cobre",
  Dundr: "Dundr",
  Dyrnwyn: "Dyrnwyn",
  "Early Axes": "Hachas antiguas",
  "Fang Spear": "Lanza de colmillo",
  "Fenris Coat": "Abrigo de Fenris",
  "Fenris Hood": "Capucha de Fenris",
  "Fenris Leggings": "Leotardos de Fenris",
  "Fishing Hat": "Sombrero de pesca",
  "Hearty Mountain Logger's Stew": "Estofado sustancioso del leñador de Montañas",
  "Hood of Ask": "Capucha de Ask",
  "Hood of Embla": "Capucha de Embla",
  "Huntsman Bow": "Arco de cazador",
  Klossen: "Klossen",
  "Loincloth of the Bear": "Taparrabos del oso",
  "Mushrooms Galore la Mistlands": "Banquete de setas de las Tierras Nubladas",
  "Nidhgg the Bleeding": "Nidhögg sangrante",
  "Nidhgg the Primal": "Nidhögg primigenia",
  "Nidhgg the Thundering": "Nidhögg atronadora",
  "Patterns of the Bear": "Atavío del oso",
  "Plains Pie Picnic": "Pícnic de tartas de las Llanuras",
  "Primal Berserkir Axes": "Hachas berserker primigenias",
  "Primal Slayer": "Matadora primigenia",
  Ripper: "Desgarradora",
  "Robes of Embla": "Túnica de Embla",
  "Root Ripper": "Desgarradora de raíces",
  "Sailor's Bounty": "Botín del marinero",
  "Scourging Slayer": "Matadora fulminante",
  "Skoll and Hati": "Sköll y Hati",
  "Skull Splittur": "Partecráneos",
  Spinesnap: "Rompeespinas",
  "Splitnir the Bleeding": "Splitnir sangrante",
  "Splitnir the Primal": "Splitnir primigenia",
  "Splitnir the Storming": "Splitnir tormentosa",
  "Staff of Fracturing": "Bastón de fractura",
  "Staff of the Wild": "Bastón de lo salvaje",
  "Storm Ripper": "Desgarradora tormentosa",
  "Storm Star": "Estrella de tormenta",
  "Swamp Dweller's Delight": "Delicia del habitante del Pantano",
  "Thundering Berserkir Axes": "Hachas berserker atronadoras",
  "Troll Leather Hood": "Capucha de cuero de trol",
  Trollstav: "Bastón de trol",
  "Trousers of Ask": "Pantalones de Ask",
  "Trousers of Embla": "Pantalones de Embla",
  "Vilebone Cage": "Jaula de hueso vil",
  "Vilebone Drapes": "Faldones de hueso vil",
  "Vilebone Visage": "Semblante de hueso vil",
  "Whole Roasted Meadow Boar": "Jabalí entero asado de las Praderas",
  "Wooden Sword": "Espada de madera",
  "Wound Ripper": "Desgarradora de heridas"
};

const idOverrides = {
  "Mushrooms Galore la Mistlands": "mistlands_mushroom_feast",
  "Nidhgg the Bleeding": "nidhogg_bleeding",
  "Nidhgg the Primal": "nidhogg_primal",
  "Nidhgg the Thundering": "nidhogg_thundering",
  "Whole Roasted Meadow Boar": "meadows_roasted_boar_feast"
};

const feasts = new Map([
  ["Whole Roasted Meadow Boar", ["meadows", 35, 35, undefined, 2]],
  ["Black Forest Buffet Platter", ["black_forest", 35, 35, undefined, 3]],
  ["Swamp Dweller's Delight", ["swamp", 35, 35, undefined, 3]],
  ["Sailor's Bounty", ["ocean", 45, 45, undefined, 3]],
  ["Hearty Mountain Logger's Stew", ["mountains", 45, 45, undefined, 3]],
  ["Plains Pie Picnic", ["plains", 55, 55, undefined, 4]],
  ["Mushrooms Galore la Mistlands", ["mistlands", 65, 65, 33, 5]],
  ["Ashlands Gourmet Bowl", ["ashlands", 75, 75, 38, 6]]
]);

const defense = new Set(["Asksvin Cloak", "Bone Tower Shield", "Breastplate of Ask", "Fenris Coat", "Fenris Hood", "Fenris Leggings", "Fishing Hat", "Hood of Ask", "Hood of Embla", "Loincloth of the Bear", "Patterns of the Bear", "Robes of Embla", "Troll Leather Hood", "Trousers of Ask", "Trousers of Embla", "Vilebone Cage", "Vilebone Drapes", "Vilebone Visage"]);
const tools = new Set(["Butcher Knife"]);
const blackForest = new Set(["Bone Tower Shield", "Butcher Knife", "Copper Knife", "Loincloth of the Bear", "Patterns of the Bear", "Troll Leather Hood"]);
const mountains = new Set(["Fang Spear", "Fenris Coat", "Fenris Hood", "Fenris Leggings"]);
const plains = new Set(["Vilebone Cage", "Vilebone Drapes", "Vilebone Visage"]);
const swamp = new Set(["Huntsman Bow"]);
const mistlands = new Set(["Skoll and Hati", "Skull Splittur", "Spinesnap"]);
const meadows = new Set(["Early Axes", "Wooden Sword"]);
const magic = new Set(["Dundr", "Staff of Fracturing", "Staff of the Wild", "Trollstav"]);
const workbenchBase = new Map([["Bone Tower Shield", 3], ["Fenris Coat", 2], ["Fenris Hood", 2], ["Fenris Leggings", 2], ["Fishing Hat", 1], ["Loincloth of the Bear", 2], ["Patterns of the Bear", 2], ["Troll Leather Hood", 3], ["Early Axes", 1], ["Wooden Sword", 1]]);
const forgeBase = new Map([["Butcher Knife", 1], ["Copper Knife", 1], ["Fang Spear", 3], ["Huntsman Bow", 1], ["Vilebone Cage", 2], ["Vilebone Drapes", 2], ["Vilebone Visage", 2]]);

const blackForgeBase = (name) => {
  if (["Skoll and Hati", "Spinesnap"].includes(name)) return 1;
  if (name === "Skull Splittur") return 2;
  if (["Breastplate of Ask", "Hood of Ask", "Trousers of Ask", "Ripper"].includes(name)) return 3;
  return 4;
};

const stationFor = (name) => {
  if (feasts.has(name)) return ["food_preparation_table", 1];
  if (name === "Cooked Egg") return ["cauldron", 1];
  if (workbenchBase.has(name)) return ["workbench", workbenchBase.get(name)];
  if (forgeBase.has(name)) return ["forge", forgeBase.get(name)];
  if (magic.has(name) || name === "Asksvin Cloak" || name.includes("Embla")) return ["galdr_table", 2];
  return ["black_forge", blackForgeBase(name)];
};

const biomeFor = (name) => {
  if (feasts.has(name)) return feasts.get(name)[0];
  if (name === "Cooked Egg" || plains.has(name)) return "plains";
  if (blackForest.has(name)) return "black_forest";
  if (mountains.has(name)) return "mountains";
  if (swamp.has(name)) return "swamp";
  if (name === "Fishing Hat") return "ocean";
  if (mistlands.has(name)) return "mistlands";
  if (meadows.has(name)) return "meadows";
  return "ashlands";
};

const subcategoryFor = (name) => {
  if (feasts.has(name) || name === "Cooked Egg") return "prepared_food";
  if (name.includes("Axe")) return "battleaxes";
  if (["Bloodgeon", "Klossen", "Storm Star"].includes(name)) return "clubs";
  if (["Brutal Slayer", "Dyrnwyn", "Nidhgg the Bleeding", "Nidhgg the Primal", "Nidhgg the Thundering", "Primal Slayer", "Scourging Slayer", "Wooden Sword"].includes(name)) return "swords";
  if (["Copper Knife", "Skoll and Hati"].includes(name)) return "knives";
  if (["Fang Spear", "Splitnir the Bleeding", "Splitnir the Primal", "Splitnir the Storming"].includes(name)) return "spears";
  if (["Huntsman Bow", "Spinesnap"].includes(name)) return "bows";
  if (name.includes("Ripper")) return "crossbows";
  if (magic.has(name)) return "staves";
  if (name === "Skull Splittur") return "battleaxes";
  return undefined;
};

const materialTranslations = {
  Anglerfish: "Rape abisal", "Bear Hide": "Piel de oso", "Bear Paw": "Pata de oso", "Celestial Feather": "Pluma celestial",
  "Cooked Asksvin Tail": "Cola de asksvin cocinada", "Cooked Boar Meat": "Carne de jabalí cocinada", "Cooked Seeker Meat": "Carne de buscador cocinada",
  "Coral Cod": "Bacalao coralino", "Cultist Trophy": "Trofeo de cultista", "Curious Axe Head": "Cabeza de hacha curiosa",
  "Dyrnwyn Blade Fragment": "Fragmento de hoja de Dyrnwyn", "Dyrnwyn Hilt Fragment": "Fragmento de empuñadura de Dyrnwyn", "Dyrnwyn Tip Fragment": "Fragmento de punta de Dyrnwyn",
  Egg: "Huevo", "Fenris Hair": "Pelo de Fenris", "Fiery Spice Powder": "Polvo de especias ardientes", "Giant Herring": "Arenque gigante",
  "Grasslands Herbalist Harvest": "Cosecha del herbolario de las Llanuras", "Herbs of the Hidden Hills": "Hierbas de las colinas ocultas", Magmafish: "Pez magma",
  "Mountain Peak Pepper Powder": "Polvo de pimienta de las cumbres", "Mysterious Axe Head": "Cabeza de hacha misteriosa", "Northern Salmon": "Salmón del norte",
  Pike: "Lucio", Pufferfish: "Pez globo", "Seafarer's Herbs": "Hierbas del navegante", Tetra: "Tetra", "Troll Trophy": "Trofeo de trol", Tuna: "Atún",
  "Vile Ribcage": "Caja torácica vil", "Vile Trophy": "Trofeo vil", "Woodland Herb Blend": "Mezcla de hierbas del bosque"
};

const sourceDefinitions = [
  { id: "bear", name: { es: "Osos", en: "Bears" }, biomeIds: ["black_forest"] },
  { id: "mountain_caves", name: { es: "Cuevas de las Montañas", en: "Mountain caves" }, biomeIds: ["mountains"] },
  { id: "abandoned_houses", name: { es: "Cofres de casas abandonadas", en: "Abandoned house chests" }, biomeIds: ["meadows"] },
  { id: "hens_and_haldor", name: { es: "Gallinas o Haldor", en: "Hens or Haldor" }, biomeIds: ["plains", "black_forest"], requirement: "Derrotar a Yagluth para comprar el primer huevo a Haldor." },
  { id: "world_fishing", name: { es: "Pesca en los distintos biomas", en: "Fishing across biomes" }, biomeIds: ["meadows", "black_forest", "swamp", "mountains", "plains", "mistlands", "ashlands", "ocean"] },
  { id: "food_preparation", name: { es: "Cocina, caldero o mesa de preparación", en: "Cooking, cauldron or food preparation" }, biomeIds: ["meadows", "black_forest", "swamp", "mountains", "plains", "mistlands", "ashlands", "ocean"] },
  { id: "fallen_valkyries", name: { es: "Valquirias caídas", en: "Fallen Valkyries" }, biomeIds: ["ashlands"] },
  { id: "vile", name: { es: "Viles", en: "Viles" }, biomeIds: ["plains"] },
  { id: "crafted_equipment", name: { es: "Equipo fabricado previamente", en: "Previously crafted equipment" }, biomeIds: ["mistlands", "ashlands"] }
];

const sourceForMaterial = (name) => {
  if (["Bear Hide", "Bear Paw"].includes(name)) return ["bear"];
  if (["Fenris Hair", "Cultist Trophy"].includes(name)) return ["mountain_caves"];
  if (["Curious Axe Head", "Mysterious Axe Head"].includes(name)) return ["abandoned_houses"];
  if (name === "Egg") return ["hens_and_haldor"];
  if (["Anglerfish", "Coral Cod", "Giant Herring", "Magmafish", "Northern Salmon", "Pike", "Pufferfish", "Tetra", "Tuna"].includes(name)) return ["world_fishing"];
  if (name === "Celestial Feather") return ["fallen_valkyries"];
  if (["Vile Ribcage", "Vile Trophy"].includes(name)) return ["vile"];
  if (["Dyrnwyn Blade Fragment", "Dyrnwyn Hilt Fragment", "Dyrnwyn Tip Fragment"].includes(name)) return ["charred_fortresses"];
  if (["Fiery Spice Powder", "Grasslands Herbalist Harvest", "Herbs of the Hidden Hills", "Mountain Peak Pepper Powder", "Seafarer's Herbs", "Woodland Herb Blend"].includes(name)) return ["bog_witch"];
  if (["Nidhgg", "Ripper"].includes(name)) return ["crafted_equipment"];
  return ["food_preparation"];
};

const candidatesData = await readJson("data/update-candidates.json");
const approved = candidatesData.candidates.filter((entry) => entry.reviewStatus === "approved");
const snapshot = await readJson(".cache/valheim-helper/latest-jotunn-catalog.json");
const items = await readJson("data/items.json");
const recipes = await readJson("data/recipes.json");
const materials = await readJson("data/materials.json");
const sources = await readJson("data/sources.json");
const stations = await readJson("data/stations.json");
const subcategories = await readJson("data/subcategories.json");
const effects = await readJson("data/food-effects.json");

for (const source of sourceDefinitions) if (!sources.some((entry) => entry.id === source.id)) sources.push(source);
if (!stations.some((entry) => entry.id === "food_preparation_table")) stations.push({ id: "food_preparation_table", name: { es: "Mesa de preparación de alimentos", en: "Food preparation table" } });

const materialByNormalizedName = new Map(materials.map((entry) => [normalize(entry.name.en), entry.id]));
const materialIdFor = (name) => {
  const known = materialByNormalizedName.get(normalize(name));
  if (known) return known;
  const id = slug(name);
  materials.push({ id, name: { es: materialTranslations[name] ?? name, en: name }, icon: "◈", sourceIds: sourceForMaterial(name) });
  materialByNormalizedName.set(normalize(name), id);
  return id;
};

for (const candidate of approved) {
  const externalName = candidate.nameEn;
  const recipeSource = snapshot.entries.find((entry) => entry.sourceKind === "recipe" && (candidate.externalIds.includes(entry.externalId) || entry.itemNameEn === externalName));
  if (!recipeSource) throw new Error(`No se encontró receta externa para ${externalName}`);
  const id = idOverrides[externalName] ?? slug(externalName);
  if (items.some((entry) => entry.id === id)) continue;
  const category = feasts.has(externalName) || externalName === "Cooked Egg" ? "Comida" : defense.has(externalName) ? "Defensa" : tools.has(externalName) ? "Herramientas" : "Armas";
  const [stationId, firstStationLevel] = stationFor(externalName);
  const displayEn = externalName.replace(/^Nidhgg/, "Nidhögg");
  const description = category === "Comida" ? "Consumible funcional que refuerza la progresión y la preparación para explorar." : category === "Defensa" ? "Pieza de equipo defensivo funcional para esta etapa de progresión." : category === "Herramientas" ? "Herramienta funcional para tareas de supervivencia." : "Arma funcional para esta etapa de progresión.";
  items.push({ id, name: { es: spanishNames[externalName], en: displayEn }, icon: category === "Comida" ? "🍲" : category === "Defensa" ? "🛡️" : category === "Herramientas" ? "🔪" : magic.has(externalName) ? "🪄" : "⚔️", category, description, stageBiomeId: biomeFor(externalName) });
  const steps = recipeSource.levels.map((level, index) => ({ targetLevel: level.targetLevel, stationLevel: firstStationLevel + index, materials: level.materials.map((material) => ({ materialId: materialIdFor(material.nameEn), amount: material.amount })) }));
  recipes.push({ itemId: id, stationId, craft: steps[0], upgrades: steps.slice(1) });
  const subcategoryId = subcategoryFor(externalName);
  if (subcategoryId) subcategories.find((entry) => entry.id === subcategoryId).itemIds.push(id);
  if (feasts.has(externalName)) {
    const [, health, stamina, eitr, healing] = feasts.get(externalName);
    effects.push({ itemId: id, health, stamina, ...(eitr ? { eitr } : {}), healing, durationSeconds: 3000, effects: ["Banquete compartido: 10 porciones"] });
  }
  if (externalName === "Cooked Egg") effects.push({ itemId: id, health: 35, stamina: 12, healing: 2, durationSeconds: 1200 });
}

await Promise.all([
  writeJson("data/items.json", items), writeJson("data/recipes.json", recipes), writeJson("data/materials.json", materials),
  writeJson("data/sources.json", sources), writeJson("data/stations.json", stations), writeJson("data/subcategories.json", subcategories), writeJson("data/food-effects.json", effects)
]);

console.log(`Incorporados ${approved.length} candidatos aprobados; catálogo: ${items.length} objetos, ${materials.length} materiales.`);
