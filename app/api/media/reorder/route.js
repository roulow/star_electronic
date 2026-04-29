/** @format */
import { requireKey } from "../../auth/_utils";
import { getMediaVersion, reorderMedia } from "../../../../lib/storage";

export async function POST(req) {
  await requireKey(req);
  const { folder, order } = await req.json();
  if (!folder || !Array.isArray(order)) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  }
  await reorderMedia(folder, order);
  const version = await getMediaVersion(folder, { bypassCache: true });
  return Response.json({ ok: true, version });
}
