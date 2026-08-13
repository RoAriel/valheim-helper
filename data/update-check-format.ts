import type { UpdateDiagnosis } from "./update-check";

export function strictExitCode(diagnosis: UpdateDiagnosis) {
  if (diagnosis.status === "inconclusive") return 2;
  if (diagnosis.status === "review-recommended") return 1;
  return 0;
}

export function formatUpdateDiagnosis(diagnosis: UpdateDiagnosis) {
  const status = diagnosis.status === "current" ? "INFORMACIÓN AL DÍA" : diagnosis.status === "review-recommended" ? "REVISIÓN RECOMENDADA" : "DIAGNÓSTICO INCOMPLETO";
  const lines = [
    "Valheim Helper — Diagnóstico de actualizaciones",
    "",
    `Aplicación instalada:  ${diagnosis.current.appVersion}`,
    `Catálogo instalado:    ${diagnosis.current.catalogVersion}`,
    `Valheim cubierto:      ${diagnosis.current.gameVersion}`,
    `Datos actualizados:    ${diagnosis.current.dataUpdatedAt}`,
    `Aplicación publicada:  ${diagnosis.latest.appVersion ?? "no disponible"}`,
    `Catálogo publicado:    ${diagnosis.latest.catalogVersion ?? "no disponible"}`,
    `Valheim estable:       ${diagnosis.latest.stableGameVersion ?? "no disponible"}`,
    `Jötunn cubre:          ${diagnosis.latest.jotunnGameVersion ?? "no disponible"}`,
    "",
    "Fuentes:",
    ...diagnosis.sources.map((source) => `${source.status === "available" ? "✓" : "!"} ${source.label}: ${source.detail}`),
    "",
    `Estado: ${status}`,
    diagnosis.recommendation,
    `Comprobado: ${diagnosis.checkedAt}`,
  ];
  return lines.join("\n");
}
