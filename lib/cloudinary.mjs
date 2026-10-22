/** @format */
// Minimal Cloudinary client built on fetch + Web Crypto, so the same code runs
// in Node (build-time content snapshot) and in the Cloudflare Worker (admin API).

export const CAROUSEL_FOLDER = "star_electronic_carousel";
export const GALLERY_FOLDER = "star_electronic_gallery";
export const DOCUMENTS_FOLDER = "star_electronic_documents";
export const MEDIA_FOLDERS = [
  CAROUSEL_FOLDER,
  GALLERY_FOLDER,
  DOCUMENTS_FOLDER,
];

// Extracted PDF text lives in one raw file per document so admin requests
// never have to parse an index that grows with the library.
export const DOCUMENT_TEXT_PREFIX = "data/document-text/";
export const MAX_INDEX_CHARS = 80000;

const API_BASE = "https://api.cloudinary.com/v1_1";

export function getCloudinaryConfig(env) {
  const cloudName = env?.CLOUDINARY_CLOUD_NAME;
  const apiKey = env?.CLOUDINARY_API_KEY;
  const apiSecret = env?.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function emptyMeta() {
  return { order: [], descriptions: {}, contentIndex: {}, version: 0 };
}

export function metaPublicId(folder) {
  return `data/${folder}.meta.json`;
}

export function documentTextPublicId(documentId) {
  return `${DOCUMENT_TEXT_PREFIX}${documentId}.txt`;
}

function encodePublicId(publicId) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

async function adminGet(cfg, path, params = {}) {
  const url = new URL(`${API_BASE}/${cfg.cloudName}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null)
      url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(`${cfg.apiKey}:${cfg.apiSecret}`)}`,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Cloudinary ${path} failed (${res.status})`);
  }
  return res.json();
}

// All assets of one resource type under a prefix (follows pagination).
export async function listResources(cfg, resourceType, prefix) {
  const resources = [];
  let cursor;
  do {
    const page = await adminGet(cfg, `resources/${resourceType}/upload`, {
      prefix,
      max_results: 500,
      next_cursor: cursor,
    });
    resources.push(...(page?.resources || []));
    cursor = page?.next_cursor;
  } while (cursor);
  return resources;
}

export function getResource(cfg, resourceType, publicId) {
  return adminGet(
    cfg,
    `resources/${resourceType}/upload/${encodePublicId(publicId)}`,
  );
}

// Downloads the current version of a raw file. Returns null only when the file
// does not exist; any other failure throws so callers never overwrite data
// based on a failed read.
export async function readRawFile(cfg, publicId, as = "json") {
  const resource = await getResource(cfg, "raw", publicId);
  if (!resource?.secure_url) return null;
  return downloadRaw(resource.secure_url, publicId, as);
}

export async function downloadRaw(url, label, as = "json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${label} (${res.status})`);
  return as === "json" ? res.json() : res.text();
}

async function sha1Hex(text) {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Cloudinary request signature: params sorted by name, joined as k=v&k=v,
// followed by the API secret, hashed with SHA-1.
export function signParams(cfg, params) {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return sha1Hex(toSign + cfg.apiSecret);
}

async function signedPost(cfg, path, params, file) {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  for (const [key, value] of Object.entries(signed))
    form.append(key, String(value));
  form.append("api_key", cfg.apiKey);
  form.append("signature", await signParams(cfg, signed));
  if (file) form.append("file", file.blob, file.name);
  const res = await fetch(`${API_BASE}/${cfg.cloudName}/${path}`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || `Cloudinary ${path} failed (${res.status})`,
    );
  }
  return data;
}

export function uploadRaw(cfg, publicId, body, contentType) {
  return signedPost(
    cfg,
    "raw/upload",
    { public_id: publicId, overwrite: true, invalidate: true },
    {
      blob: new Blob([body], { type: contentType }),
      name: publicId.split("/").pop(),
    },
  );
}

export function writeRawJson(cfg, publicId, value) {
  return uploadRaw(
    cfg,
    publicId,
    JSON.stringify(value, null, 2),
    "application/json",
  );
}

export function destroyResource(cfg, resourceType, publicId) {
  return signedPost(cfg, `${resourceType}/destroy`, {
    public_id: publicId,
    type: "upload",
  });
}

// Parameters the browser needs to upload a file straight to Cloudinary,
// so file bytes never pass through the Worker.
export async function signBrowserUpload(cfg, params) {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  return {
    uploadUrl: `${API_BASE}/${cfg.cloudName}/auto/upload`,
    apiKey: cfg.apiKey,
    signature: await signParams(cfg, signed),
    params: signed,
  };
}

// --- Media lists (same ordering rules the site has always used) ---

function toMediaItem(resource) {
  const baseName = resource.public_id.split("/").pop();
  const name = /\.[a-z0-9]+$/i.test(baseName)
    ? baseName
    : resource.format
      ? `${baseName}.${resource.format}`
      : baseName;
  return {
    id: resource.public_id,
    name,
    url: resource.secure_url,
    created_at: resource.created_at,
    resource_type: resource.resource_type,
  };
}

export async function listFolder(cfg, folder) {
  const isDocuments = folder === DOCUMENTS_FOLDER;
  // PDFs may have been stored as raw or image assets depending on upload settings.
  const types = isDocuments ? ["raw", "image"] : ["image"];
  const results = await Promise.all(
    types.map((type) => listResources(cfg, type, `${folder}/`)),
  );

  const latest = new Map();
  for (const item of results.flat().map(toMediaItem)) {
    if (isDocuments && !/\.pdf$/i.test(item.name)) continue;
    const current = latest.get(item.id);
    if (!current || new Date(item.created_at) > new Date(current.created_at)) {
      latest.set(item.id, item);
    }
  }
  return [...latest.values()];
}

// Items listed in meta.order come first, the rest follow newest first.
export function orderMedia(items, meta) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = [];
  for (const id of meta?.order || []) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      byId.delete(id);
    }
  }
  ordered.push(
    ...[...byId.values()].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    ),
  );
  return ordered.map((item) => ({
    ...item,
    description: meta?.descriptions?.[item.id] || "",
  }));
}

export function toDefaultTitle(filename = "") {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

// Cloudinary sends Content-Disposition: attachment for fl_attachment URLs.
// Raw assets don't support delivery flags, so they keep their plain URL.
export function attachmentUrl(item) {
  if (item.resource_type !== "image") return item.url;
  return item.url.replace("/image/upload/", "/image/upload/fl_attachment/");
}

export function toDocument(item) {
  return {
    id: item.id,
    name: item.name,
    title: item.description || toDefaultTitle(item.name) || item.name,
    url: item.url,
    downloadUrl: attachmentUrl(item),
  };
}
