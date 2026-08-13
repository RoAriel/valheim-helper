import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildExternalSnapshot, DEFAULT_SNAPSHOT_PATH, JOTUNN_PIECE_URL, JOTUNN_RECIPE_URL } from "../data/external-catalog.ts";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const unknown = args.filter((arg, index) => arg !== "--output" && index !== outputIndex + 1);
if (unknown.length || (outputIndex >= 0 && !args[outputIndex + 1])) {
  console.error("Uso: pnpm data:snapshot [--output ruta.json]");
  process.exit(64);
}
const outputPath = resolve(outputIndex >= 0 ? args[outputIndex + 1] : DEFAULT_SNAPSHOT_PATH);
const [recipeResponse, pieceResponse] = await Promise.all([fetch(JOTUNN_RECIPE_URL), fetch(JOTUNN_PIECE_URL)]);
if (!recipeResponse.ok) throw new Error(`Jötunn recetas respondió HTTP ${recipeResponse.status}`);
if (!pieceResponse.ok) throw new Error(`Jötunn piezas respondió HTTP ${pieceResponse.status}`);
const snapshot = buildExternalSnapshot(await recipeResponse.text(), await pieceResponse.text());
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Snapshot Jötunn ${snapshot.source.gameVersion ?? "sin versión"}: ${snapshot.entries.length} entradas.`);
console.log(`Artefacto temporal: ${outputPath}`);
console.log("No se modificó ningún JSON productivo de data/.");
