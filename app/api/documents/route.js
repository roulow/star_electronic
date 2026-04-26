/** @format */
import { listMedia } from "@/lib/storage";

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
  const fileBase = `/api/documents/file?folder=${encodeURIComponent(folder)}`;

  try {
    const items = await listMedia(folder);
    const documents = (items || []).map((item) => ({
      id: item.id,
      name: item.name,
      title: item.description || toDefaultTitle(item.name) || item.name,
      url: `${fileBase}&id=${encodeURIComponent(item.id)}`,
    }));

    return new Response(JSON.stringify({ items: documents }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
