/** @format */
import { listMedia } from "../../../lib/storage";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "star_electronic_gallery";
  try {
    const items = await listMedia(folder);
    return new Response(JSON.stringify({ items }), {
      headers: {
        "content-type": "application/json",
        "cache-control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
