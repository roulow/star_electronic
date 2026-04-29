/** @format */
import { getMediaVersion } from "@/lib/storage";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "star_electronic_gallery";

  try {
    const version = await getMediaVersion(folder, { bypassCache: true });
    return new Response(JSON.stringify({ version }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
