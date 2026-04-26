/** @format */

import { deleteMedia } from "@/lib/storage";
import { requireKey } from "../../auth/_utils";

export async function POST(req) {
  try {
    await requireKey(req);
    const body = await req.json();
    const { folder, id } = body;

    if (!folder || !id) {
      return new Response(JSON.stringify({ error: "Missing folder or id" }), {
        status: 400,
      });
    }

    await deleteMedia(folder, id);
    return Response.json({ success: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
