import manifestData from "./manifest.json" with { type: "json" };
import provenanceData from "./provenance.json" with { type: "json" };

export type ProvenanceStatus = "verified" | "partially_verified" | "legacy_unattributed";
export type ProvenanceSource = { id: string; type: "official" | "technical_dump" | "community"; name: string; url: string };
export type ProvenanceRecord = { id: string; scope: string; status: ProvenanceStatus; verifiedAt: string; sourceIds: string[]; evidence: string };
export type Provenance = {
  schemaVersion: number;
  catalogVersion: string;
  gameVersion: string;
  policy: string;
  sources: ProvenanceSource[];
  records: ProvenanceRecord[];
};

export const provenance = provenanceData as Provenance;

export function validateProvenance(value: Provenance = provenance) {
  const errors: string[] = [];
  if (value.schemaVersion !== 1) errors.push("Versión de contrato de procedencia no soportada");
  if (value.catalogVersion !== manifestData.catalogVersion) errors.push("La procedencia no coincide con la versión del catálogo");
  if (value.gameVersion !== manifestData.gameVersion) errors.push("La procedencia no coincide con la versión de Valheim");

  const sourceIds = new Set<string>();
  for (const source of value.sources) {
    if (sourceIds.has(source.id)) errors.push(`Fuente de procedencia duplicada: ${source.id}`);
    sourceIds.add(source.id);
    try { new URL(source.url); } catch { errors.push(`URL de procedencia inválida: ${source.id}`); }
  }

  const recordIds = new Set<string>();
  for (const record of value.records) {
    if (recordIds.has(record.id)) errors.push(`Registro de procedencia duplicado: ${record.id}`);
    recordIds.add(record.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.verifiedAt)) errors.push(`Fecha de procedencia inválida: ${record.id}`);
    if (!record.evidence.trim()) errors.push(`Evidencia de procedencia vacía: ${record.id}`);
    record.sourceIds.forEach((sourceId) => { if (!sourceIds.has(sourceId)) errors.push(`Fuente de procedencia inexistente: ${sourceId}`); });
    if (record.status === "verified" && record.sourceIds.length === 0) errors.push(`Registro verificado sin fuentes: ${record.id}`);
    if (record.status === "legacy_unattributed" && record.sourceIds.length > 0) errors.push(`Registro legacy no debe atribuir fuentes: ${record.id}`);
  }
  return errors;
}

export function provenanceSummary(value: Provenance = provenance) {
  return value.records.reduce((summary, record) => ({ ...summary, [record.status]: summary[record.status] + 1 }), {
    verified: 0,
    partially_verified: 0,
    legacy_unattributed: 0,
  } satisfies Record<ProvenanceStatus, number>);
}
