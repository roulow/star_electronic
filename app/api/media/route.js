/** @format */
import { getMediaVersion, listMedia } from "../../../lib/storage";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "star_electronic_gallery";
  const versionParam = searchParams.get("v");
  try {
    const items = await listMedia(
      folder,
      versionParam
        ? {
            cacheKey: `${folder}@${versionParam}`,
            bypassMetaCache: true,
          }
        : undefined,
    );
    const version = await getMediaVersion(folder);
    return new Response(JSON.stringify({ items, version }), {
      headers: {
        "content-type": "application/json",
        "cache-control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
