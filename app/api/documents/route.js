/** @format */
import { getMediaVersion, listMedia } from "@/lib/storage";

const DOCUMENTS_FOLDER = "star_electronic_documents";

function toDefaultTitle(filename = "") {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || DOCUMENTS_FOLDER;
  const versionParam = searchParams.get("v");
  const fileBase = `/api/documents/file?folder=${encodeURIComponent(folder)}`;

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
    const documents = (items || []).map((item) => ({
      id: item.id,
      name: item.name,
      title: item.description || toDefaultTitle(item.name) || item.name,
      url: `${fileBase}&id=${encodeURIComponent(item.id)}`,
    }));

    const version = await getMediaVersion(folder);

    return new Response(JSON.stringify({ items: documents, version }), {
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
