import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildSemanticDiff, DEFAULT_SNAPSHOT_PATH, type ExternalCatalogSnapshot } from "../data/external-catalog.ts";

const args = process.argv.slice(2);
const snapshotIndex = args.indexOf("--snapshot");
const json = args.includes("--json");
const unknown = args.filter((arg, index) => arg !== "--json" && arg !== "--snapshot" && index !== snapshotIndex + 1);
if (unknown.length || (snapshotIndex >= 0 && !args[snapshotIndex + 1])) {
  console.error("Uso: pnpm data:diff [--snapshot ruta.json] [--json]");
  process.exit(64);
}
const snapshotPath = resolve(snapshotIndex >= 0 ? args[snapshotIndex + 1] : DEFAULT_SNAPSHOT_PATH);
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as ExternalCatalogSnapshot;
if (snapshot.schemaVersion !== 1) throw new Error(`Versión de snapshot no soportada: ${snapshot.schemaVersion}`);
const diff = buildSemanticDiff(snapshot);
if (json) {
  console.log(JSON.stringify(diff, null, 2));
} else {
  console.log(`Comparación semántica: catálogo ${diff.local.catalogVersion} / Jötunn ${diff.external.gameVersion ?? "sin versión"}`);
  console.log(`Coincidencias: ${diff.summary.matched} (${diff.summary.unchanged} sin cambios, ${diff.summary.modified} modificadas)`);
  console.log(`Sólo externo: ${diff.summary.externalOnly} · Sólo local: ${diff.summary.localOnly}`);
  console.log(`Ambiguos: ${diff.summary.ambiguous} · Materiales sin mapear: ${diff.summary.unresolvedMaterials}`);
  if (diff.modified.length) {
    console.log("\nModificados:");
    diff.modified.forEach((entry) => console.log(`- ${entry.itemNameEn} (${entry.itemId}): ${entry.changes.map((change) => change.targetLevel ? `${change.field} nivel ${change.targetLevel}` : change.field).join(", ")}`));
  }
  console.log("\nLas entradas sólo externas son candidatas a clasificación, no altas automáticas.");
}
