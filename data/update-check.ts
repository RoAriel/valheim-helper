import manifestData from "./manifest.json" with { type: "json" };

export type UpdateSourceStatus = "available" | "unavailable";

export type UpdateSource = {
  id: "valheim_official" | "jotunn_recipes" | "github_catalog";
  label: string;
  url: string;
  status: UpdateSourceStatus;
  version?: string;
  detail: string;
};

export type UpdateDiagnosis = {
  checkedAt: string;
  current: {
    appVersion: string;
    catalogVersion: string;
    gameVersion: string;
    dataUpdatedAt: string;
  };
  latest: {
    appVersion?: string;
    catalogVersion?: string;
    stableGameVersion?: string;
    jotunnGameVersion?: string;
  };
  updates: {
    app: boolean;
    catalog: boolean;
    gameData: boolean;
  };
  status: "current" | "review-recommended" | "inconclusive";
  recommendation: string;
  sources: UpdateSource[];
};

type SteamNewsResponse = {
  appnews?: { newsitems?: Array<{ title?: string; contents?: string; feedlabel?: string }> };
};

type RemoteManifest = {
  appVersion?: string;
  catalogVersion?: string;
  gameVersion?: string;
};

const sourceUrls = {
  steam: "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=892970&count=30&maxlength=500&format=json",
  steamPage: "https://store.steampowered.com/news/app/892970",
  jotunn: "https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html",
  githubManifest: "https://raw.githubusercontent.com/RoAriel/valheim-helper/main/data/manifest.json",
  githubRepo: "https://github.com/RoAriel/valheim-helper",
} as const;

export function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function versionFromText(text: string) {
  return text.match(/\b0\.\d{2,4}(?:\.\d+)?\b/)?.[0];
}

export function stableVersionFromSteam(news: SteamNewsResponse) {
  const versions = (news.appnews?.newsitems ?? [])
    .filter((item) => !/public\s+test|ptb/i.test(`${item.title ?? ""} ${item.contents ?? ""}`))
    .filter((item) => /patch|update/i.test(item.title ?? ""))
    .map((item) => versionFromText(item.title ?? ""))
    .filter((version): version is string => Boolean(version));
  return versions.sort(compareVersions).at(-1);
}

export function versionFromJotunn(html: string) {
  return html.match(/generated\s+from\s+Valheim\s+(0\.\d{2,4}(?:\.\d+)?)/i)?.[1];
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("user-agent", "Valheim-Helper-Update-Check/1.0");
  return fetch(url, { ...init, signal: AbortSignal.timeout(8_000), headers });
}

async function checkSteam(): Promise<UpdateSource> {
  try {
    const response = await fetchWithTimeout(sourceUrls.steam, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const version = stableVersionFromSteam(await response.json() as SteamNewsResponse);
    if (!version) throw new Error("No se encontró una versión estable en las noticias recientes");
    return { id: "valheim_official", label: "Noticias oficiales de Valheim en Steam", url: sourceUrls.steamPage, status: "available", version, detail: `Última versión estable anunciada: ${version}` };
  } catch (error) {
    return { id: "valheim_official", label: "Noticias oficiales de Valheim en Steam", url: sourceUrls.steamPage, status: "unavailable", detail: error instanceof Error ? error.message : "No se pudo consultar" };
  }
}

async function checkJotunn(): Promise<UpdateSource> {
  try {
    const response = await fetchWithTimeout(sourceUrls.jotunn, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const version = versionFromJotunn(await response.text());
    if (!version) throw new Error("La fuente no declaró su versión de Valheim");
    return { id: "jotunn_recipes", label: "Inventario de recetas de Jötunn", url: sourceUrls.jotunn, status: "available", version, detail: `Volcado generado para Valheim ${version}` };
  } catch (error) {
    return { id: "jotunn_recipes", label: "Inventario de recetas de Jötunn", url: sourceUrls.jotunn, status: "unavailable", detail: error instanceof Error ? error.message : "No se pudo consultar" };
  }
}

async function checkGitHub(): Promise<{ source: UpdateSource; manifest?: RemoteManifest }> {
  try {
    const response = await fetchWithTimeout(sourceUrls.githubManifest, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json() as RemoteManifest;
    if (!manifest.appVersion || !manifest.catalogVersion) throw new Error("El manifiesto remoto está incompleto");
    return {
      manifest,
      source: { id: "github_catalog", label: "Catálogo publicado en GitHub", url: sourceUrls.githubRepo, status: "available", version: manifest.catalogVersion, detail: `App ${manifest.appVersion} · catálogo ${manifest.catalogVersion} · Valheim ${manifest.gameVersion ?? "sin versión"}` },
    };
  } catch (error) {
    return { source: { id: "github_catalog", label: "Catálogo publicado en GitHub", url: sourceUrls.githubRepo, status: "unavailable", detail: error instanceof Error ? error.message : "No se pudo consultar" } };
  }
}

export async function buildUpdateDiagnosis(): Promise<UpdateDiagnosis> {
  const [steam, jotunn, github] = await Promise.all([checkSteam(), checkJotunn(), checkGitHub()]);
  const stableGameVersion = steam.version;
  const jotunnGameVersion = jotunn.version;
  const remote = github.manifest;
  const updates = {
    app: Boolean(remote?.appVersion && compareVersions(remote.appVersion, manifestData.appVersion) > 0),
    catalog: Boolean(remote?.catalogVersion && compareVersions(remote.catalogVersion, manifestData.catalogVersion) > 0),
    gameData: Boolean(
      (stableGameVersion && compareVersions(stableGameVersion, manifestData.gameVersion) > 0)
      || (jotunnGameVersion && compareVersions(jotunnGameVersion, manifestData.gameVersion) > 0),
    ),
  };
  const sources = [steam, jotunn, github.source];
  const hasUpdates = Object.values(updates).some(Boolean);
  const noSourceAvailable = sources.every((source) => source.status === "unavailable");

  return {
    checkedAt: new Date().toISOString(),
    current: {
      appVersion: manifestData.appVersion,
      catalogVersion: manifestData.catalogVersion,
      gameVersion: manifestData.gameVersion,
      dataUpdatedAt: manifestData.dataUpdatedAt,
    },
    latest: {
      appVersion: remote?.appVersion,
      catalogVersion: remote?.catalogVersion,
      stableGameVersion,
      jotunnGameVersion,
    },
    updates,
    status: noSourceAvailable ? "inconclusive" : hasUpdates ? "review-recommended" : "current",
    recommendation: noSourceAvailable
      ? "No se pudo completar el diagnóstico. Revisá la conexión del servidor y volvé a intentarlo."
      : hasUpdates
        ? "Hay novedades respecto de esta instalación. Actualizá el repositorio o revisá las fuentes antes de regenerar la información base."
        : "No se detectaron versiones posteriores. El catálogo instalado coincide con las fuentes disponibles.",
    sources,
  };
}
