/** @format */
import { requireKey } from "../../auth/_utils";
import { getMediaVersion, updateDescriptions } from "../../../../lib/storage";

export async function POST(req) {
  await requireKey(req);
  const { folder, descriptions } = await req.json();
  if (!folder || !descriptions || typeof descriptions !== "object") {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  }
  await updateDescriptions(folder, descriptions);
  const version = await getMediaVersion(folder, { bypassCache: true });
  return Response.json({ ok: true, version });
}
