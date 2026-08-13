import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { reviewCandidate, validateUpdateCandidates, type UpdateCandidates } from "../data/update-candidates.ts";

const DEFAULT_PATH = "data/update-candidates.json";
const args = process.argv.slice(2);
const fileIndex = args.indexOf("--file");
const familyIndex = args.indexOf("--family");
const classificationIndex = args.indexOf("--classification");
const valueIndexes = new Set([fileIndex + 1, familyIndex + 1, classificationIndex + 1].filter((index) => index > 0));
const unknown = args.filter((arg, index) => !["--file", "--family", "--classification"].includes(arg) && !valueIndexes.has(index));
if (unknown.length || [fileIndex, familyIndex, classificationIndex].some((index) => index >= 0 && !args[index + 1])) {
  console.error("Uso: pnpm data:review [--family familia] [--classification clasificación] [--file candidatos.json]");
  process.exit(64);
}

const filePath = resolve(fileIndex >= 0 ? args[fileIndex + 1] : DEFAULT_PATH);
const data = JSON.parse(await readFile(filePath, "utf8")) as UpdateCandidates;
const initialErrors = validateUpdateCandidates(data);
if (initialErrors.length) throw new Error(`Inventario editorial inválido:\n- ${initialErrors.join("\n- ")}`);
const family = familyIndex >= 0 ? args[familyIndex + 1] : undefined;
const classification = classificationIndex >= 0 ? args[classificationIndex + 1] : undefined;
const pending = data.candidates.filter((candidate) => candidate.reviewStatus === "pending"
  && (!family || candidate.functionalFamily === family)
  && (!classification || candidate.classification === classification));

async function saveAtomically() {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

console.log(`Revisión editorial: ${pending.length} candidatos pendientes.`);
console.log("S = aprobar · N o Enter = rechazar · O = omitir · Q = guardar y salir");
console.log("Aprobar sólo cambia el estado editorial; no incorpora datos al catálogo.\n");
if (!pending.length) process.exit(0);

const terminal = createInterface({ input, output });
let reviewed = 0;
try {
  for (const [index, candidate] of pending.entries()) {
    console.log(`[${index + 1}/${pending.length}] ${candidate.nameEn}`);
    console.log(`${candidateClassificationLabel(candidate.classification)} · ${candidate.functionalFamily ?? "sin familia"} · confianza ${candidate.confidence}`);
    console.log(candidate.reason);
    console.log(`IDs: ${candidate.externalIds.join(" · ")}`);
    if (candidate.suggestedLocal) console.log(`Posible coincidencia: ${candidate.suggestedLocal.nameEn} (${Math.round(candidate.suggestedLocal.similarity * 100)}%)`);
    const answer = (await terminal.question("¿Aprobar candidato? [s/N/o/q] ")).trim().toLowerCase();
    if (answer === "q") break;
    if (answer === "o") { console.log("Omitido; continúa pendiente.\n"); continue; }
    const decision = answer === "s" || answer === "si" || answer === "sí" ? "approved" : "rejected";
    reviewCandidate(data, candidate.id, decision);
    await saveAtomically();
    reviewed += 1;
    console.log(decision === "approved" ? "Aprobado para un futuro bloque de aplicación.\n" : "Rechazado editorialmente.\n");
  }
} finally {
  terminal.close();
}
console.log(`Sesión terminada. Decisiones guardadas: ${reviewed}. Pendientes restantes: ${data.candidates.filter((candidate) => candidate.reviewStatus === "pending").length}.`);

function candidateClassificationLabel(value: string) {
  return value.replaceAll("_", " ");
}
