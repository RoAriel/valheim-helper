import { buildUpdateDiagnosis } from "@/data/update-check";

export async function GET() {
  const diagnosis = await buildUpdateDiagnosis();
  return Response.json(diagnosis, { headers: { "cache-control": "no-store" } });
}
