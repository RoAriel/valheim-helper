import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { candidatesFromClassification } from "../data/update-candidates.ts";
import type { ExternalClassificationReport } from "../data/external-classification.ts";

const DEFAULT_REPORT_PATH = ".cache/valheim-helper/classification-report.json";
const DEFAULT_OUTPUT_PATH = "data/update-candidates.json";
const args = process.argv.slice(2);
const reportIndex = args.indexOf("--report");
const outputIndex = args.indexOf("--output");
const valueIndexes = new Set([reportIndex + 1, outputIndex + 1].filter((index) => index > 0));
const unknown = args.filter((arg, index) => !["--report", "--output", "--write"].includes(arg) && !valueIndexes.has(index));
if (unknown.length || !args.includes("--write") || (reportIndex >= 0 && !args[reportIndex + 1]) || (outputIndex >= 0 && !args[outputIndex + 1])) {
  console.error("Uso: pnpm data:candidates --write [--report informe.json] [--output candidatos.json]");
  console.error("Se exige --write porque este comando actualiza el inventario editorial versionado.");
  process.exit(64);
}
const reportPath = resolve(reportIndex >= 0 ? args[reportIndex + 1] : DEFAULT_REPORT_PATH);
const outputPath = resolve(outputIndex >= 0 ? args[outputIndex + 1] : DEFAULT_OUTPUT_PATH);
const report = JSON.parse(await readFile(reportPath, "utf8")) as ExternalClassificationReport;
let previous;
try { previous = JSON.parse(await readFile(outputPath, "utf8")); } catch { previous = undefined; }
const candidates = candidatesFromClassification(report, previous);
await writeFile(outputPath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
console.log(`Inventario editorial actualizado: ${candidates.candidates.length} entradas.`);
console.log(`Pendientes de revisión: ${candidates.candidates.filter((entry) => entry.reviewStatus === "pending").length}.`);
console.log(`Archivo: ${outputPath}`);
