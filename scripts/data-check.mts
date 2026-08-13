import { buildUpdateDiagnosis } from "../data/update-check.ts";
import { formatUpdateDiagnosis, strictExitCode } from "../data/update-check-format.ts";

const args = new Set(process.argv.slice(2));
const supported = new Set(["--json", "--strict"]);
const unknown = [...args].filter((argument) => !supported.has(argument));

if (unknown.length) {
  console.error(`Opciones desconocidas: ${unknown.join(", ")}`);
  console.error("Uso: pnpm data:check [--json] [--strict]");
  process.exit(64);
}

const diagnosis = await buildUpdateDiagnosis();
console.log(args.has("--json") ? JSON.stringify(diagnosis, null, 2) : formatUpdateDiagnosis(diagnosis));
if (args.has("--strict")) process.exitCode = strictExitCode(diagnosis);
