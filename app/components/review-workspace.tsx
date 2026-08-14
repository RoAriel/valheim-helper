"use client";

import { useMemo, useState } from "react";
import { updateCandidates, type UpdateCandidate } from "@/data/update-candidates";

const classifications = ["all", "functional_candidate", "probable_alias", "manual_review", "existing_material", "decorative_or_cosmetic", "technical_or_non_catalog"] as const;
const classificationLabels: Record<(typeof classifications)[number], string> = {
  all: "Todos", functional_candidate: "Funcionales", probable_alias: "Posibles alias", manual_review: "Revisión manual",
  existing_material: "Materiales existentes", decorative_or_cosmetic: "Decorativos", technical_or_non_catalog: "Técnicos",
};
const familyLabels: Record<NonNullable<UpdateCandidate["functionalFamily"]>, string> = {
  equipment: "Equipo", ammunition: "Munición", consumable: "Consumibles", tool: "Herramientas", infrastructure: "Infraestructura",
};

export function ReviewWorkspace({ onBack }: { onBack?: () => void }) {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState<(typeof classifications)[number]>("all");
  const [family, setFamily] = useState<"all" | NonNullable<UpdateCandidate["functionalFamily"]>>("all");
  const [showResolved, setShowResolved] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => updateCandidates.candidates.filter((candidate) => {
    if (!showResolved && candidate.reviewStatus !== "pending") return false;
    if (classification !== "all" && candidate.classification !== classification) return false;
    if (family !== "all" && candidate.functionalFamily !== family) return false;
    return !normalizedQuery || [candidate.nameEn, ...candidate.externalIds, candidate.suggestedLocal?.nameEn ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery));
  }), [classification, family, normalizedQuery, showResolved]);
  const pending = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending");
  const functional = pending.filter((entry) => entry.classification === "functional_candidate").length;
  const approved = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "approved").length;
  const rejected = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "rejected").length;

  return <section className="field-review" aria-label="Revisión de datos pendientes">
    <header className="field-review-header">
      <div>{onBack && <button className="field-maintenance-back" onClick={onBack}>← Volver a Mantenimiento</button>}<p className="eyebrow">INVENTARIO EDITORIAL</p><h1>Objetos pendientes</h1><p>Entradas detectadas en Jötunn que todavía no forman parte confirmada del catálogo.</p></div>
      <div className="field-review-meta"><small>Valheim analizado</small><strong>{updateCandidates.source.gameVersion ?? updateCandidates.gameVersion}</strong><span>Generado {new Date(updateCandidates.generatedAt).toLocaleDateString("es")}</span></div>
    </header>
    <div className="field-review-notice"><strong>Vista de solo lectura</strong><span>“Candidato funcional” significa que merece contraste; no confirma que deba incorporarse.</span></div>
    <div className="field-review-stats">
      <div><small>Pendientes</small><strong>{pending.length}</strong></div>
      <div><small>Candidatos funcionales</small><strong>{functional}</strong></div>
      <div><small>Aprobados / rechazados</small><strong>{approved} / {rejected}</strong></div>
      <div><small>Total analizado</small><strong>{updateCandidates.candidates.length}</strong></div>
    </div>
    <section className="field-review-controls">
      <label className="field-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar candidatos" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o identificador externo…" /></label>
      <div className="field-filter-row" role="group" aria-label="Clasificación editorial">
        {classifications.map((value) => <button key={value} className={classification === value ? "active" : ""} aria-pressed={classification === value} onClick={() => setClassification(value)}>{classificationLabels[value]}</button>)}
      </div>
      <div className="field-review-secondary">
        <label>Familia <select value={family} onChange={(event) => setFamily(event.target.value as typeof family)}><option value="all">Todas</option>{Object.entries(familyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-review-toggle"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> Mostrar aprobados, rechazados, conocidos y excluidos</label>
        <span aria-live="polite">{visible.length} resultados</span>
      </div>
    </section>
    <div className="field-candidate-grid">
      {visible.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}
      {!visible.length && <p className="field-empty">No hay entradas que coincidan con estos filtros.</p>}
    </div>
  </section>;
}

function CandidateCard({ candidate }: { candidate: UpdateCandidate }) {
  return <article className={`field-candidate ${candidate.classification}`}>
    <header><div><p>{classificationLabels[candidate.classification]}</p><h2>{candidate.nameEn}</h2></div><span className={`confidence ${candidate.confidence}`}>{candidate.confidence === "high" ? "Alta" : candidate.confidence === "medium" ? "Media" : "Baja"}</span></header>
    <p>{candidate.reason}</p>
    <div className="field-candidate-tags">
      {candidate.functionalFamily && <span>{familyLabels[candidate.functionalFamily]}</span>}
      {candidate.sourceKinds.map((kind) => <span key={kind}>{kind === "recipe" ? "Receta" : "Pieza"}</span>)}
      <span>{reviewStatusLabel(candidate.reviewStatus)}</span>
    </div>
    {candidate.suggestedLocal && <p className="field-candidate-match">Posible coincidencia local: <strong>{candidate.suggestedLocal.nameEn}</strong> <small>{Math.round(candidate.suggestedLocal.similarity * 100)}%</small></p>}
    <details><summary>Identificadores externos ({candidate.externalIds.length})</summary><code>{candidate.externalIds.join(" · ")}</code></details>
  </article>;
}

function reviewStatusLabel(status: UpdateCandidate["reviewStatus"]) {
  return { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", known: "Ya conocido", excluded: "Excluido" }[status];
}
