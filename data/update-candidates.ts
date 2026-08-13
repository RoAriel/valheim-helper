import candidatesData from "./update-candidates.json" with { type: "json" };
import manifestData from "./manifest.json" with { type: "json" };
import type { ClassificationKind, ExternalClassificationReport } from "./external-classification.ts";

export type CandidateReviewStatus = "pending" | "approved" | "rejected" | "known" | "excluded";
export type UpdateCandidate = {
  id: string;
  nameEn: string;
  classification: ClassificationKind;
  confidence: "high" | "medium" | "low";
  reviewStatus: CandidateReviewStatus;
  reason: string;
  externalIds: string[];
  sourceKinds: Array<"recipe" | "piece">;
  functionalFamily?: "equipment" | "ammunition" | "consumable" | "tool" | "infrastructure";
  suggestedLocal?: { entity: "item" | "material"; id: string; nameEn: string; similarity: number };
  reviewedAt?: string;
};
export type UpdateCandidates = {
  schemaVersion: 1;
  generatedAt: string;
  source: ExternalClassificationReport["source"];
  catalogVersion: string;
  gameVersion: string;
  candidates: UpdateCandidate[];
};

export const updateCandidates = candidatesData as UpdateCandidates;

export function reviewStatusForClassification(classification: ClassificationKind): CandidateReviewStatus {
  if (classification === "existing_material") return "known";
  if (classification === "decorative_or_cosmetic" || classification === "technical_or_non_catalog") return "excluded";
  return "pending";
}

export function candidatesFromClassification(report: ExternalClassificationReport, previous?: UpdateCandidates): UpdateCandidates {
  const previousById = new Map(previous?.candidates.map((candidate) => [candidate.id, candidate]));
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    source: report.source,
    catalogVersion: report.local.catalogVersion,
    gameVersion: report.local.gameVersion,
    candidates: report.classifications.map((entry) => {
      const id = `${entry.sourceKinds.join("-")}:${entry.normalizedName}`;
      const prior = previousById.get(id);
      const defaultStatus = reviewStatusForClassification(entry.classification);
      const preservedStatus = prior && ["approved", "rejected"].includes(prior.reviewStatus) && defaultStatus === "pending" ? prior.reviewStatus : defaultStatus;
      return {
      id,
      nameEn: entry.itemNameEn,
      classification: entry.classification,
      confidence: entry.confidence,
      reviewStatus: preservedStatus,
      reason: entry.reason,
      externalIds: entry.externalIds,
      sourceKinds: entry.sourceKinds,
      ...(entry.functionalFamily ? { functionalFamily: entry.functionalFamily } : {}),
      ...(entry.suggestedLocal ? { suggestedLocal: entry.suggestedLocal } : {}),
      ...(preservedStatus !== "pending" && prior?.reviewedAt ? { reviewedAt: prior.reviewedAt } : {}),
    }; }),
  };
}

export function reviewCandidate(value: UpdateCandidates, candidateId: string, decision: "approved" | "rejected", reviewedAt = new Date().toISOString()) {
  const candidate = value.candidates.find((entry) => entry.id === candidateId);
  if (!candidate) throw new Error(`Candidato inexistente: ${candidateId}`);
  if (!["pending", "approved", "rejected"].includes(candidate.reviewStatus)) throw new Error(`El candidato ${candidateId} está clasificado automáticamente como ${candidate.reviewStatus}`);
  candidate.reviewStatus = decision;
  candidate.reviewedAt = reviewedAt;
  return candidate;
}

export function validateUpdateCandidates(value: UpdateCandidates = updateCandidates) {
  const errors: string[] = [];
  if (value.schemaVersion !== 1) errors.push("Versión de candidatos no soportada");
  if (value.catalogVersion !== manifestData.catalogVersion) errors.push("Los candidatos no corresponden al catálogo instalado");
  if (value.gameVersion !== manifestData.gameVersion) errors.push("Los candidatos no corresponden a la versión de Valheim instalada");
  const ids = new Set<string>();
  for (const candidate of value.candidates) {
    if (ids.has(candidate.id)) errors.push(`Candidato duplicado: ${candidate.id}`);
    ids.add(candidate.id);
    if (!candidate.externalIds.length) errors.push(`Candidato sin identificador externo: ${candidate.id}`);
    const defaultStatus = reviewStatusForClassification(candidate.classification);
    const allowed = defaultStatus === "pending" ? ["pending", "approved", "rejected"] : [defaultStatus];
    if (!allowed.includes(candidate.reviewStatus)) errors.push(`Estado editorial incoherente: ${candidate.id}`);
    if (["approved", "rejected"].includes(candidate.reviewStatus) && !candidate.reviewedAt) errors.push(`Decisión sin fecha de revisión: ${candidate.id}`);
  }
  return errors;
}
