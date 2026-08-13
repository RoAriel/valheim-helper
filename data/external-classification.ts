import { items, manifest, materials } from "./catalog.ts";
import { buildSemanticDiff, normalizeEnglishName, type ExternalCatalogEntry, type ExternalCatalogSnapshot } from "./external-catalog.ts";

export type ClassificationKind =
  | "existing_material"
  | "probable_alias"
  | "functional_candidate"
  | "decorative_or_cosmetic"
  | "technical_or_non_catalog"
  | "manual_review";

export type ClassifiedExternalName = {
  normalizedName: string;
  itemNameEn: string;
  classification: ClassificationKind;
  confidence: "high" | "medium" | "low";
  reason: string;
  externalIds: string[];
  sourceKinds: Array<ExternalCatalogEntry["sourceKind"]>;
  functionalFamily?: "equipment" | "ammunition" | "consumable" | "tool" | "infrastructure";
  suggestedLocal?: { entity: "item" | "material"; id: string; nameEn: string; similarity: number };
};

export type ExternalClassificationReport = {
  schemaVersion: 1;
  generatedAt: string;
  source: ExternalCatalogSnapshot["source"];
  local: { catalogVersion: string; gameVersion: string; items: number; materials: number };
  totals: { externalRowsWithoutExactItem: number; uniqueExternalNames: number } & Record<ClassificationKind, number>;
  classifications: ClassifiedExternalName[];
};

const functionalRecipeId = /^Recipe_(Armor(?!Dress|Tunic)|Cape(?!Odin)|Arrow|Bolt|Axe|Battleaxe|Bow|Crossbow|Knife|Mace|Sword|Spear|Atgeir|Shield|Helmet|Bomb|Staff|Sledge|Pickaxe|Cultivator|Hoe|Hammer|Torch|Harpoon|Food|Cooked|Feast)/i;
const functionalPieceId = /(workbench|forge|smelter|blastfurnace|kiln|portal|teleport|ship|karve|raft|cart|bed|chest|fire|hearth|cooking|fermenter|oven|windmill|spinningwheel|batteringram|catapult|shieldgenerator|sapcollector|beehive|stonecutter|artisan|cauldron|eitrrefinery)/i;
const cosmeticPattern = /(dress|tunic\d|with (shawl|beads|cape)|headscarf|fur cap|celebratory cap|midsummer|yule|garland|banner|rug|carpet|curtain|throne|chair|stool|table|odin|maypole|jack[- ]o|wreath|decor)/i;
const technicalPattern = /^(cultivate|grass|remove|repair)$/i;
const technicalId = /^(sapling_|.*_sapling|piece_remove|piece_repair|replant|cultivate)/i;

function tokens(value: string) {
  return new Set(normalizeEnglishName(value).split(" ").filter((token) => token.length > 1));
}

export function nameSimilarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / (left.size + right.size - intersection);
}

function bestLocalMatch(name: string) {
  const candidates = [
    ...items.map((item) => ({ entity: "item" as const, id: item.id, nameEn: item.name.en })),
    ...materials.map((material) => ({ entity: "material" as const, id: material.id, nameEn: material.name.en })),
  ];
  return candidates.map((candidate) => ({ ...candidate, similarity: nameSimilarity(name, candidate.nameEn) }))
    .sort((a, b) => b.similarity - a.similarity)[0];
}

function functionalFamily(entry: ExternalCatalogEntry): ClassifiedExternalName["functionalFamily"] {
  if (entry.sourceKind === "piece") return "infrastructure";
  if (/^Recipe_(Arrow|Bolt|Bomb|CatapultPayload)/i.test(entry.externalId)) return "ammunition";
  if (/^Recipe_(Food|Cooked|Feast)/i.test(entry.externalId)) return "consumable";
  if (/^Recipe_(Pickaxe|Cultivator|Hoe|Hammer|Torch)/i.test(entry.externalId)) return "tool";
  return "equipment";
}

function classify(name: string, entries: ExternalCatalogEntry[], materialByName: Map<string, typeof materials[number]>): Omit<ClassifiedExternalName, "normalizedName" | "itemNameEn" | "externalIds" | "sourceKinds"> {
  const material = materialByName.get(normalizeEnglishName(name));
  if (material) return {
    classification: "existing_material", confidence: "high", reason: "El nombre inglés coincide con un material local.",
    suggestedLocal: { entity: "material", id: material.id, nameEn: material.name.en, similarity: 1 },
  };

  const probable = bestLocalMatch(name);
  if (probable && probable.similarity >= 0.67) return {
    classification: "probable_alias", confidence: probable.similarity === 1 ? "high" : "medium",
    reason: "El nombre es suficientemente similar a una entidad local, pero requiere confirmar que sea la misma.", suggestedLocal: probable,
  };

  if (technicalPattern.test(name) || entries.every((entry) => technicalId.test(entry.externalId)) || entries.every((entry) => entry.levels.every((level) => level.materials.length === 0))) {
    return { classification: "technical_or_non_catalog", confidence: "high", reason: "Es una acción, cultivo, prefab técnico o entrada sin coste fabricable." };
  }
  if (cosmeticPattern.test(name) || entries.some((entry) => cosmeticPattern.test(entry.externalId))) {
    return { classification: "decorative_or_cosmetic", confidence: "high", reason: "El nombre o identificador corresponde a vestimenta cosmética o decoración explícita." };
  }

  const recipes = entries.filter((entry) => entry.sourceKind === "recipe");
  if (recipes.some((entry) => functionalRecipeId.test(entry.externalId))) {
    const entry = recipes.find((candidate) => functionalRecipeId.test(candidate.externalId))!;
    return { classification: "functional_candidate", confidence: "high", functionalFamily: functionalFamily(entry), reason: "Posee una receta de una familia funcional reconocida de equipo, arma, munición, consumible o herramienta." };
  }
  if (entries.some((entry) => entry.sourceKind === "piece" && functionalPieceId.test(entry.externalId))) {
    return { classification: "functional_candidate", confidence: "medium", functionalFamily: "infrastructure", reason: "La pieza pertenece a una familia funcional reconocida de estación, transporte o infraestructura." };
  }
  if (recipes.length && recipes.some((entry) => entry.levels.some((level) => level.materials.length > 0))) {
    return { classification: "manual_review", confidence: "low", reason: "Tiene una receta real, pero la familia no permite distinguir con seguridad objeto funcional, alimento, material o decoración." };
  }
  return { classification: "manual_review", confidence: "low", reason: "La información técnica disponible no alcanza para clasificarla automáticamente." };
}

export function buildExternalClassification(snapshot: ExternalCatalogSnapshot, generatedAt = new Date().toISOString()): ExternalClassificationReport {
  const diff = buildSemanticDiff(snapshot, generatedAt);
  const externalOnlyKeys = new Set(diff.externalOnly.map((entry) => `${entry.sourceKind}:${entry.externalId}`));
  const groups = new Map<string, ExternalCatalogEntry[]>();
  for (const entry of snapshot.entries.filter((candidate) => externalOnlyKeys.has(`${candidate.sourceKind}:${candidate.externalId}`))) {
    const key = normalizeEnglishName(entry.itemNameEn);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  const materialByName = new Map(materials.map((material) => [normalizeEnglishName(material.name.en), material]));
  const classifications = [...groups.entries()].map(([normalizedName, entries]) => ({
    normalizedName,
    itemNameEn: entries[0].itemNameEn,
    ...classify(entries[0].itemNameEn, entries, materialByName),
    externalIds: [...new Set(entries.map((entry) => entry.externalId))],
    sourceKinds: [...new Set(entries.map((entry) => entry.sourceKind))],
  })).sort((a, b) => a.classification.localeCompare(b.classification) || a.itemNameEn.localeCompare(b.itemNameEn));
  const counts = Object.fromEntries((["existing_material", "probable_alias", "functional_candidate", "decorative_or_cosmetic", "technical_or_non_catalog", "manual_review"] as ClassificationKind[])
    .map((kind) => [kind, classifications.filter((entry) => entry.classification === kind).length])) as Record<ClassificationKind, number>;
  return {
    schemaVersion: 1,
    generatedAt,
    source: snapshot.source,
    local: { catalogVersion: manifest.catalogVersion, gameVersion: manifest.gameVersion, items: items.length, materials: materials.length },
    totals: { externalRowsWithoutExactItem: diff.externalOnly.length, uniqueExternalNames: classifications.length, ...counts },
    classifications,
  };
}
