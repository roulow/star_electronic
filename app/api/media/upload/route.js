/** @format */
import { requireKey } from "../../auth/_utils";
import {
  uploadFiles,
  readMediaMeta,
  writeMediaMeta,
} from "../../../../lib/storage";

const DOCUMENTS_FOLDER = "star_electronic_documents";
const MAX_INDEX_CHARS = 80000;

function isPdf(file) {
  return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
}

function toDefaultTitle(filename = "") {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

async function extractPdfText(file) {
  try {
    const parserModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = parserModule.default || parserModule;
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await pdfParse(Buffer.from(arrayBuffer));
    return String(parsed?.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_INDEX_CHARS);
  } catch {
    return "";
  }
}

export async function POST(req) {
  await requireKey(req);
  const form = await req.formData();
  const folder = form.get("folder");
  const files = form.getAll("files");
  if (!folder || !files?.length) {
    return new Response(JSON.stringify({ error: "Missing folder/files" }), {
      status: 400,
    });
  }

  const incoming =
    folder === DOCUMENTS_FOLDER ? files.filter((f) => isPdf(f)) : files;

  if (!incoming.length) {
    return new Response(JSON.stringify({ error: "No valid files to upload" }), {
      status: 400,
    });
  }

  const uploaded = (await uploadFiles(folder, incoming)) || [];

  if (folder === DOCUMENTS_FOLDER) {
    const meta = await readMediaMeta(folder);
    const descriptions = { ...(meta.descriptions || {}) };
    const contentIndex = { ...(meta.contentIndex || {}) };

    for (let i = 0; i < incoming.length; i += 1) {
      const file = incoming[i];
      const uploadedItem = uploaded[i];
      if (!uploadedItem?.id) continue;

      if (!descriptions[uploadedItem.id]) {
        descriptions[uploadedItem.id] = toDefaultTitle(file.name) || file.name;
      }
      contentIndex[uploadedItem.id] = await extractPdfText(file);
    }

    await writeMediaMeta(folder, {
      ...meta,
      descriptions,
      contentIndex,
    });
  }

  return Response.json({ ok: true, items: uploaded });
}
