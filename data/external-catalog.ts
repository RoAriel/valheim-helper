import { items, manifest, materials, recipes, type MaterialCost, type Recipe } from "./catalog.ts";

export const JOTUNN_RECIPE_URL = "https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html";
export const JOTUNN_PIECE_URL = "https://valheim-modding.github.io/Jotunn/data/pieces/piece-list.html";
export const DEFAULT_SNAPSHOT_PATH = ".cache/valheim-helper/latest-jotunn-catalog.json";

export type ExternalMaterialCost = { nameEn: string; amount: number };
export type ExternalRecipeLevel = { targetLevel: number; materials: ExternalMaterialCost[] };
export type ExternalCatalogEntry = {
  sourceKind: "recipe" | "piece";
  externalId: string;
  assetId: string;
  itemNameEn: string;
  outputAmount: number;
  levels: ExternalRecipeLevel[];
};
export type ExternalCatalogSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  source: { id: "jotunn_docs"; gameVersion: string | null; urls: string[] };
  entries: ExternalCatalogEntry[];
  ignored: { nullNames: number; emptyNames: number };
};

export type SemanticChange = {
  field: "outputAmount" | "materials" | "levels";
  targetLevel?: number;
  local: unknown;
  external: unknown;
};
export type SemanticDiff = {
  generatedAt: string;
  local: { appVersion: string; catalogVersion: string; gameVersion: string };
  external: { gameVersion: string | null; entries: number };
  summary: {
    matched: number;
    unchanged: number;
    modified: number;
    externalOnly: number;
    localOnly: number;
    ambiguous: number;
    unresolvedMaterials: number;
  };
  modified: Array<{ itemId: string; itemNameEn: string; externalId: string; changes: SemanticChange[] }>;
  externalOnly: Array<{ externalId: string; itemNameEn: string; sourceKind: string }>;
  localOnly: Array<{ itemId: string; itemNameEn: string }>;
  ambiguous: Array<{ itemId: string; itemNameEn: string; externalIds: string[] }>;
  unresolvedMaterials: Array<{ itemId: string; itemNameEn: string; materialNamesEn: string[] }>;
};

function decodeHtml(value: string) {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&#(x?[0-9a-f]+);|&([a-z]+);/gi, (_match, numeric, name) => {
    if (numeric) return String.fromCodePoint(Number.parseInt(numeric.replace(/^x/i, ""), /^x/i.test(numeric) ? 16 : 10));
    return named[name.toLowerCase()] ?? `&${name};`;
  });
}

function textContent(value: string) {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function rows(html: string) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) =>
    [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1]),
  ).filter((cells) => cells.length);
}

function parseMaterials(html: string): ExternalMaterialCost[] {
  return [...html.matchAll(/<li[^>]*>\s*(\d+)\s+([\s\S]*?)<\/li>/gi)].map((match) => ({
    amount: Number(match[1]),
    nameEn: textContent(match[2]),
  })).filter((cost) => cost.nameEn);
}

function gameVersion(html: string) {
  return html.match(/generated from Valheim\s+([0-9.]+)/i)?.[1] ?? null;
}

export function parseJotunnRecipes(html: string): { gameVersion: string | null; entries: ExternalCatalogEntry[]; ignored: ExternalCatalogSnapshot["ignored"] } {
  const ignored = { nullNames: 0, emptyNames: 0 };
  const entries = rows(html).flatMap((cells): ExternalCatalogEntry[] => {
    if (cells.length < 5) return [];
    const itemNameEn = textContent(cells[2]);
    if (itemNameEn === "NULL") { ignored.nullNames += 1; return []; }
    if (!itemNameEn) { ignored.emptyNames += 1; return []; }
    const resourceHtml = cells[4];
    const levelMatches = [...resourceHtml.matchAll(/Level\s+(\d+)\s*:\s*<ul[^>]*>([\s\S]*?)<\/ul>/gi)];
    const levels = levelMatches.length
      ? levelMatches.map((match) => ({ targetLevel: Number(match[1]), materials: parseMaterials(match[2]) }))
      : [{ targetLevel: 1, materials: parseMaterials(resourceHtml) }];
    return [{
      sourceKind: "recipe",
      externalId: textContent(cells[0]),
      assetId: textContent(cells[1]),
      itemNameEn,
      outputAmount: Number(textContent(cells[3])) || 1,
      levels,
    }];
  });
  return { gameVersion: gameVersion(html), entries, ignored };
}

export function parseJotunnPieces(html: string): { gameVersion: string | null; entries: ExternalCatalogEntry[]; ignored: ExternalCatalogSnapshot["ignored"] } {
  const ignored = { nullNames: 0, emptyNames: 0 };
  const entries = rows(html).flatMap((cells): ExternalCatalogEntry[] => {
    if (cells.length < 6) return [];
    const itemNameEn = textContent(cells[3]);
    if (itemNameEn === "NULL") { ignored.nullNames += 1; return []; }
    if (!itemNameEn) { ignored.emptyNames += 1; return []; }
    return [{
      sourceKind: "piece",
      externalId: textContent(cells[0]).split(" ")[0],
      assetId: textContent(cells[1]),
      itemNameEn,
      outputAmount: 1,
      levels: [{ targetLevel: 1, materials: parseMaterials(cells[5]) }],
    }];
  });
  return { gameVersion: gameVersion(html), entries, ignored };
}

export function buildExternalSnapshot(recipeHtml: string, pieceHtml: string, generatedAt = new Date().toISOString()): ExternalCatalogSnapshot {
  const recipeResult = parseJotunnRecipes(recipeHtml);
  const pieceResult = parseJotunnPieces(pieceHtml);
  const versions = [recipeResult.gameVersion, pieceResult.gameVersion].filter(Boolean);
  if (new Set(versions).size > 1) throw new Error(`Las fuentes Jötunn no corresponden a la misma versión: ${versions.join(", ")}`);
  return {
    schemaVersion: 1,
    generatedAt,
    source: { id: "jotunn_docs", gameVersion: versions[0] ?? null, urls: [JOTUNN_RECIPE_URL, JOTUNN_PIECE_URL] },
    entries: [...recipeResult.entries, ...pieceResult.entries],
    ignored: {
      nullNames: recipeResult.ignored.nullNames + pieceResult.ignored.nullNames,
      emptyNames: recipeResult.ignored.emptyNames + pieceResult.ignored.emptyNames,
    },
  };
}

export function normalizeEnglishName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const externalMaterialAliases: Record<string, string> = {
  [normalizeEnglishName("Finewood")]: "fine_wood",
  [normalizeEnglishName("Corewood")]: "core_wood",
};

const externalItemAliases: Record<string, string> = {
  [normalizeEnglishName("Nidhgg the Bleeding")]: normalizeEnglishName("Nidhögg the Bleeding"),
  [normalizeEnglishName("Nidhgg the Primal")]: normalizeEnglishName("Nidhögg the Primal"),
  [normalizeEnglishName("Nidhgg the Thundering")]: normalizeEnglishName("Nidhögg the Thundering"),
};

function normalizedItemName(value: string) {
  const normalized = normalizeEnglishName(value);
  return externalItemAliases[normalized] ?? normalized;
}

function normalizedCosts(costs: MaterialCost[]) {
  return Object.fromEntries(costs.map((cost) => [cost.materialId, cost.amount]).sort(([a], [b]) => a.localeCompare(b)));
}

function compareRecipe(localRecipe: Recipe, external: ExternalCatalogEntry, materialIds: Map<string, string>) {
  const changes: SemanticChange[] = [];
  const localOutput = localRecipe.outputAmount ?? 1;
  if (localOutput !== external.outputAmount) changes.push({ field: "outputAmount", local: localOutput, external: external.outputAmount });
  const localLevels = [localRecipe.craft, ...localRecipe.upgrades];
  const localLevelNumbers = localLevels.map((level) => level.targetLevel);
  const externalLevelNumbers = external.levels.map((level) => level.targetLevel);
  if (JSON.stringify(localLevelNumbers) !== JSON.stringify(externalLevelNumbers)) {
    changes.push({ field: "levels", local: localLevelNumbers, external: externalLevelNumbers });
  }
  for (const level of external.levels) {
    const localLevel = localLevels.find((entry) => entry.targetLevel === level.targetLevel);
    if (!localLevel) continue;
    const externalCosts = level.materials.map((cost) => ({ materialId: materialIds.get(normalizeEnglishName(cost.nameEn))!, amount: cost.amount }));
    const localCosts = normalizedCosts(localLevel.materials);
    const mappedExternalCosts = normalizedCosts(externalCosts);
    if (JSON.stringify(localCosts) !== JSON.stringify(mappedExternalCosts)) {
      changes.push({ field: "materials", targetLevel: level.targetLevel, local: localCosts, external: mappedExternalCosts });
    }
  }
  return changes;
}

export function buildSemanticDiff(snapshot: ExternalCatalogSnapshot, generatedAt = new Date().toISOString()): SemanticDiff {
  const externalByName = new Map<string, ExternalCatalogEntry[]>();
  for (const entry of snapshot.entries) {
    const key = normalizedItemName(entry.itemNameEn);
    externalByName.set(key, [...(externalByName.get(key) ?? []), entry]);
  }
  const localNames = new Set(items.map((item) => normalizedItemName(item.name.en)));
  const materialIds = new Map(materials.map((material) => [normalizeEnglishName(material.name.en), material.id]));
  for (const [externalName, materialId] of Object.entries(externalMaterialAliases)) materialIds.set(externalName, materialId);
  const modified: SemanticDiff["modified"] = [];
  const localOnly: SemanticDiff["localOnly"] = [];
  const ambiguous: SemanticDiff["ambiguous"] = [];
  const unresolvedMaterials: SemanticDiff["unresolvedMaterials"] = [];
  let matched = 0;
  let unchanged = 0;

  for (const item of items) {
    const candidates = (externalByName.get(normalizedItemName(item.name.en)) ?? []).filter((entry) =>
      entry.sourceKind === "recipe" || item.category === "Construcción",
    );
    if (!candidates.length) { localOnly.push({ itemId: item.id, itemNameEn: item.name.en }); continue; }
    if (candidates.length > 1) {
      ambiguous.push({ itemId: item.id, itemNameEn: item.name.en, externalIds: candidates.map((entry) => entry.externalId) });
      continue;
    }
    matched += 1;
    const external = candidates[0];
    const unknown = [...new Set(external.levels.flatMap((level) => level.materials.map((cost) => cost.nameEn)).filter((name) => !materialIds.has(normalizeEnglishName(name))))];
    if (unknown.length) {
      unresolvedMaterials.push({ itemId: item.id, itemNameEn: item.name.en, materialNamesEn: unknown });
      continue;
    }
    const localRecipe = recipes.find((recipe) => recipe.itemId === item.id)!;
    const changes = compareRecipe(localRecipe, external, materialIds);
    if (changes.length) modified.push({ itemId: item.id, itemNameEn: item.name.en, externalId: external.externalId, changes });
    else unchanged += 1;
  }

  const externalOnly = snapshot.entries.filter((entry) => !localNames.has(normalizedItemName(entry.itemNameEn))).map((entry) => ({
    externalId: entry.externalId, itemNameEn: entry.itemNameEn, sourceKind: entry.sourceKind,
  }));
  return {
    generatedAt,
    local: { appVersion: manifest.appVersion, catalogVersion: manifest.catalogVersion, gameVersion: manifest.gameVersion },
    external: { gameVersion: snapshot.source.gameVersion, entries: snapshot.entries.length },
    summary: { matched, unchanged, modified: modified.length, externalOnly: externalOnly.length, localOnly: localOnly.length, ambiguous: ambiguous.length, unresolvedMaterials: unresolvedMaterials.length },
    modified, externalOnly, localOnly, ambiguous, unresolvedMaterials,
  };
}
