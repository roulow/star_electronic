/** @format */
import {
  DOCUMENTS_FOLDER,
  DOCUMENT_TEXT_PREFIX,
  GALLERY_FOLDER,
  MAX_INDEX_CHARS,
  MEDIA_FOLDERS,
  destroyResource,
  documentTextPublicId,
  emptyMeta,
  getCloudinaryConfig,
  listFolder,
  listResources,
  metaPublicId,
  orderMedia,
  readRawFile,
  signBrowserUpload,
  toDocument,
  uploadRaw,
  writeRawJson,
} from "../../lib/cloudinary.mjs";
import { HttpError, json, readJson } from "../http.js";
import { publish } from "../publish.js";

export function cloudinary(env) {
  const cfg = getCloudinaryConfig(env);
  if (!cfg) throw new HttpError(503, "Cloudinary is not configured");
  return cfg;
}

function requireFolder(folder) {
  if (!MEDIA_FOLDERS.includes(folder))
    throw new HttpError(400, "Invalid payload");
  return folder;
}

async function readMeta(cfg, folder) {
  return {
    ...emptyMeta(),
    ...((await readRawFile(cfg, metaPublicId(folder))) || {}),
  };
}

async function writeMeta(cfg, folder, meta) {
  meta.version = Date.now();
  await writeRawJson(cfg, metaPublicId(folder), meta);
  return meta.version;
}

function saveDocumentTextFile(cfg, documentId, text) {
  return uploadRaw(
    cfg,
    documentTextPublicId(documentId),
    String(text).slice(0, MAX_INDEX_CHARS),
    "text/plain; charset=utf-8",
  );
}

export async function list({ env, url }) {
  const cfg = cloudinary(env);
  const folder = requireFolder(
    url.searchParams.get("folder") || GALLERY_FOLDER,
  );
  const [items, meta] = await Promise.all([
    listFolder(cfg, folder),
    readMeta(cfg, folder),
  ]);
  return json({
    items: orderMedia(items, meta).map(({ id, name, url, description }) => ({
      id,
      name,
      url,
      description,
    })),
    version: meta.version || 0,
  });
}

export async function listDocuments({ env }) {
  const cfg = cloudinary(env);
  const [items, meta, textFiles] = await Promise.all([
    listFolder(cfg, DOCUMENTS_FOLDER),
    readMeta(cfg, DOCUMENTS_FOLDER),
    listResources(cfg, "raw", DOCUMENT_TEXT_PREFIX),
  ]);
  const textIds = new Set(textFiles.map((file) => file.public_id));
  return json({
    items: orderMedia(items, meta).map((item) => ({
      ...toDocument(item),
      // false = no searchable text yet; the dashboard extracts it in the browser.
      indexed:
        textIds.has(documentTextPublicId(item.id)) ||
        String(meta.contentIndex?.[item.id] || "").trim().length > 0,
    })),
    version: meta.version || 0,
  });
}

// The browser uploads files straight to Cloudinary with this signature.
export async function signUpload({ env, request }) {
  const cfg = cloudinary(env);
  const folder = requireFolder((await readJson(request, 10_000)).folder);
  const params = {
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };
  if (folder === DOCUMENTS_FOLDER) params.allowed_formats = "pdf";
  return json(await signBrowserUpload(cfg, params));
}

// Called after the browser finished uploading: stores document titles and
// extracted PDF text, then publishes.
export async function registerUpload({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const body = await readJson(request, 5_000_000);
  const folder = requireFolder(body.folder);
  const items = (Array.isArray(body.items) ? body.items : []).filter(
    (item) => typeof item?.id === "string" && item.id.startsWith(`${folder}/`),
  );
  if (!items.length) throw new HttpError(400, "Missing folder/files");

  let version = null;
  if (folder === DOCUMENTS_FOLDER) {
    const texts =
      body.texts && typeof body.texts === "object" ? body.texts : {};
    await Promise.all(
      items
        .filter((item) => typeof texts[item.id] === "string")
        .map((item) => saveDocumentTextFile(cfg, item.id, texts[item.id])),
    );
    const meta = await readMeta(cfg, folder);
    for (const item of items) {
      if (!meta.descriptions[item.id]) {
        meta.descriptions[item.id] = String(
          item.title || item.name || "",
        ).slice(0, 300);
      }
    }
    version = await writeMeta(cfg, folder, meta);
  }

  return json({
    ok: true,
    items: items.map(({ id, name, url }) => ({ id, name, url })),
    version,
    publishing: publish(env, ctx),
  });
}

export async function saveDocumentText({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const { texts } = await readJson(request, 5_000_000);
  const entries = Object.entries(
    texts && typeof texts === "object" ? texts : {},
  ).filter(
    ([id, text]) =>
      id.startsWith(`${DOCUMENTS_FOLDER}/`) && typeof text === "string",
  );
  if (!entries.length || entries.length > 20) {
    throw new HttpError(400, "Invalid payload");
  }
  await Promise.all(
    entries.map(([id, text]) => saveDocumentTextFile(cfg, id, text)),
  );
  return json({ ok: true, publishing: publish(env, ctx) });
}

export async function reorder({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const { folder, order } = await readJson(request);
  requireFolder(folder);
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    throw new HttpError(400, "Invalid payload");
  }
  const meta = await readMeta(cfg, folder);
  meta.order = order;
  const version = await writeMeta(cfg, folder, meta);
  return json({ ok: true, version, publishing: publish(env, ctx) });
}

export async function saveDescriptions({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const { folder, descriptions } = await readJson(request);
  requireFolder(folder);
  if (
    !descriptions ||
    typeof descriptions !== "object" ||
    Array.isArray(descriptions)
  ) {
    throw new HttpError(400, "Invalid payload");
  }
  const meta = await readMeta(cfg, folder);
  meta.descriptions = Object.fromEntries(
    Object.entries(descriptions).filter(
      ([, value]) => typeof value === "string",
    ),
  );
  const version = await writeMeta(cfg, folder, meta);
  return json({ ok: true, version, publishing: publish(env, ctx) });
}

export async function remove({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const { folder, id } = await readJson(request);
  if (
    !MEDIA_FOLDERS.includes(folder) ||
    typeof id !== "string" ||
    !id.startsWith(`${folder}/`)
  ) {
    throw new HttpError(400, "Missing folder or id");
  }

  if (folder === DOCUMENTS_FOLDER) {
    // PDFs may exist as raw or image assets.
    const [raw, image] = await Promise.all([
      destroyResource(cfg, "raw", id),
      destroyResource(cfg, "image", id),
    ]);
    const done = (result) =>
      result?.result === "ok" || result?.result === "not found";
    if (!done(raw) && !done(image)) throw new Error("Document deletion failed");
    await destroyResource(cfg, "raw", documentTextPublicId(id));
  } else {
    await destroyResource(cfg, "image", id);
  }

  const meta = await readMeta(cfg, folder);
  meta.order = meta.order.filter((x) => x !== id);
  delete meta.descriptions[id];
  if (meta.contentIndex) delete meta.contentIndex[id];
  const version = await writeMeta(cfg, folder, meta);
  return json({ success: true, version, publishing: publish(env, ctx) });
}
