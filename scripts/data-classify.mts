import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildExternalClassification } from "../data/external-classification.ts";
import { DEFAULT_SNAPSHOT_PATH, type ExternalCatalogSnapshot } from "../data/external-catalog.ts";

const DEFAULT_REPORT_PATH = ".cache/valheim-helper/classification-report.json";
const args = process.argv.slice(2);
const snapshotIndex = args.indexOf("--snapshot");
const outputIndex = args.indexOf("--output");
const valueIndexes = new Set([snapshotIndex + 1, outputIndex + 1].filter((index) => index > 0));
const unknown = args.filter((arg, index) => !["--snapshot", "--output", "--json"].includes(arg) && !valueIndexes.has(index));
if (unknown.length || (snapshotIndex >= 0 && !args[snapshotIndex + 1]) || (outputIndex >= 0 && !args[outputIndex + 1])) {
  console.error("Uso: pnpm data:classify [--snapshot ruta.json] [--output informe.json] [--json]");
  process.exit(64);
}
const snapshotPath = resolve(snapshotIndex >= 0 ? args[snapshotIndex + 1] : DEFAULT_SNAPSHOT_PATH);
const outputPath = resolve(outputIndex >= 0 ? args[outputIndex + 1] : DEFAULT_REPORT_PATH);
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as ExternalCatalogSnapshot;
const report = buildExternalClassification(snapshot);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Clasificación externa: ${report.totals.uniqueExternalNames} nombres únicos (${report.totals.externalRowsWithoutExactItem} filas).`);
  console.log(`Materiales ya registrados: ${report.totals.existing_material}`);
  console.log(`Posibles alias de datos locales: ${report.totals.probable_alias}`);
  console.log(`Candidatos funcionales: ${report.totals.functional_candidate}`);
  const families = Object.groupBy(report.classifications.filter((entry) => entry.classification === "functional_candidate"), (entry) => entry.functionalFamily ?? "sin_familia");
  console.log(`  ${Object.entries(families).map(([family, entries]) => `${family}: ${entries.length}`).join(" · ")}`);
  console.log(`Decorativos o cosméticos: ${report.totals.decorative_or_cosmetic}`);
  console.log(`Técnicos o fuera del catálogo: ${report.totals.technical_or_non_catalog}`);
  console.log(`Revisión manual: ${report.totals.manual_review}`);
  console.log(`Informe temporal: ${outputPath}`);
  console.log("Las clasificaciones son diagnósticas y no modifican los JSON productivos.");
}
