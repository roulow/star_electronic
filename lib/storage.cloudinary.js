/** @format */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const DOCUMENTS_FOLDER = "star_electronic_documents";
const JSON_CACHE_TTL_MS = Number(
  process.env.CLOUDINARY_JSON_CACHE_TTL_MS || 30 * 60 * 1000,
);
const MEDIA_CACHE_TTL_MS = Number(
  process.env.CLOUDINARY_MEDIA_CACHE_TTL_MS || 15 * 60 * 1000,
);
const CACHE_MISS = Symbol("cache-miss");

const jsonCache = new Map();
const mediaCache = new Map();

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function getCachedValue(cache, key) {
  const entry = cache.get(key);
  if (!entry) return CACHE_MISS;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return CACHE_MISS;
  }
  return cloneValue(entry.value);
}

function setCachedValue(cache, key, value, ttlMs) {
  cache.set(key, {
    value: cloneValue(value),
    expiresAt: Date.now() + ttlMs,
  });
}

function folderFromMetaFilename(filename) {
  const match = String(filename || "").match(/^(.+)\.meta\.json$/);
  return match ? match[1] : null;
}

function invalidateFolderCaches(folder) {
  if (!folder) return;
  for (const key of mediaCache.keys()) {
    if (key === folder || String(key).startsWith(`${folder}@`)) {
      mediaCache.delete(key);
    }
  }
  jsonCache.delete(`${folder}.meta.json`);
}

// Helper to read JSON from Cloudinary (public raw file)
export async function readJson(filename, options = {}) {
  const cached = options?.bypassCache
    ? CACHE_MISS
    : getCachedValue(jsonCache, filename);
  if (cached !== CACHE_MISS) {
    return cached;
  }

  try {
    // Use Admin API to resolve the current public URL for this JSON blob.
    const resource = await cloudinary.api.resource(`data/${filename}`, {
      resource_type: "raw",
    });

    const res = await fetch(resource.secure_url, { cache: "force-cache" });
    if (res.status === 404) {
      setCachedValue(jsonCache, filename, null, JSON_CACHE_TTL_MS);
      return null;
    }

    const data = await res.json();
    setCachedValue(jsonCache, filename, data, JSON_CACHE_TTL_MS);
    return data;
  } catch (e) {
    // If file doesn't exist, Admin API throws 404
    if (e.error && e.error.http_code === 404) {
      setCachedValue(jsonCache, filename, null, JSON_CACHE_TTL_MS);
      return null;
    }
    return null;
  }
}

// Helper to write JSON to Cloudinary
export async function writeJson(filename, content) {
  const buffer = Buffer.from(JSON.stringify(content, null, 2));
  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: `data/${filename}`,
        resource_type: "raw",
        invalidate: true, // Clear CDN cache
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });

  setCachedValue(jsonCache, filename, content, JSON_CACHE_TTL_MS);
  const folder = folderFromMetaFilename(filename);
  if (folder) invalidateFolderCaches(folder);
}

export async function listMedia(folder, options = {}) {
  const cacheKey = options?.cacheKey || folder;
  const cached = options?.bypassCache
    ? CACHE_MISS
    : getCachedValue(mediaCache, cacheKey);
  if (cached !== CACHE_MISS) {
    return cached;
  }

  const isDocuments = folder === DOCUMENTS_FOLDER;
  // 1. Fetch items from Cloudinary folder using Admin API for consistency
  let cloudItems = [];
  try {
    // Some Cloudinary setups store uploaded PDFs as raw assets, others as image assets.
    const results = isDocuments
      ? await Promise.all([
          cloudinary.api.resources({
            type: "upload",
            prefix: folder + "/",
            max_results: 500,
            resource_type: "raw",
          }),
          cloudinary.api.resources({
            type: "upload",
            prefix: folder + "/",
            max_results: 500,
            resource_type: "image",
          }),
        ])
      : [
          await cloudinary.api.resources({
            type: "upload",
            prefix: folder + "/",
            max_results: 500,
            resource_type: "image",
          }),
        ];

    const normalized = results
      .flatMap((res) => res.resources || [])
      .map((r) => {
        const baseName = r.public_id.split("/").pop();
        const withExt = /\.[a-z0-9]+$/i.test(baseName)
          ? baseName
          : r.format
            ? `${baseName}.${r.format}`
            : baseName;
        return {
          id: r.public_id,
          name: withExt,
          url: r.secure_url,
          created_at: r.created_at,
          format: r.format,
        };
      })
      .filter((item) => (isDocuments ? /\.pdf$/i.test(item.name) : true));

    // Dedupe by public id while preferring the most recent timestamp.
    const deduped = new Map();
    for (const item of normalized) {
      const current = deduped.get(item.id);
      if (!current) {
        deduped.set(item.id, item);
        continue;
      }
      if (new Date(item.created_at) > new Date(current.created_at)) {
        deduped.set(item.id, item);
      }
    }
    cloudItems = [...deduped.values()];
  } catch (e) {
    console.error("Cloudinary list failed", e);
    // Fallback to empty if API fails (e.g. folder doesn't exist yet)
    return [];
  }

  // 2. Fetch metadata (order, descriptions)
  const meta = (await readJson(`${folder}.meta.json`, {
    bypassCache: options?.bypassMetaCache,
  })) || {
    order: [],
    descriptions: {},
    contentIndex: {},
    version: 0,
  };

  // 3. Merge and Order
  const map = new Map(cloudItems.map((i) => [i.id, i]));
  const ordered = [];

  // Add items in specific order
  for (const id of meta.order) {
    const it = map.get(id);
    if (it) {
      ordered.push(it);
      map.delete(id);
    }
  }
  // Add remaining items (newest first)
  // Sort remaining by created_at desc
  const remaining = [...map.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  ordered.push(...remaining);

  // Attach descriptions
  for (const it of ordered) {
    it.description = meta.descriptions?.[it.id] || "";
  }

  setCachedValue(mediaCache, cacheKey, ordered, MEDIA_CACHE_TTL_MS);
  return ordered;
}

export async function uploadFiles(folder, blobs) {
  // Upload in parallel
  const uploaded = await Promise.all(
    blobs.map(async (blob) => {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: "auto",
            use_filename: true,
            unique_filename: true, // Ensure unique filenames to prevent overwriting
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else
              resolve({
                id: result.public_id,
                name: result.original_filename
                  ? `${result.original_filename}${result.format ? `.${result.format}` : ""}`
                  : result.public_id.split("/").pop(),
                url: result.secure_url,
              });
          },
        );
        stream.end(buffer);
      });
    }),
  );

  invalidateFolderCaches(folder);
  return uploaded;
}

export async function reorderMedia(folder, order) {
  const meta = (await readJson(`${folder}.meta.json`)) || {
    order: [],
    descriptions: {},
    contentIndex: {},
    version: 0,
  };
  meta.order = order; // Array of IDs
  meta.version = Date.now();
  await writeJson(`${folder}.meta.json`, meta);
  invalidateFolderCaches(folder);
}

export async function updateDescriptions(folder, descriptions) {
  const meta = (await readJson(`${folder}.meta.json`)) || {
    order: [],
    descriptions: {},
    contentIndex: {},
    version: 0,
  };
  meta.descriptions = descriptions;
  meta.version = Date.now();
  await writeJson(`${folder}.meta.json`, meta);
  invalidateFolderCaches(folder);
}

export async function deleteMedia(folder, id) {
  try {
    const isDocuments = folder === DOCUMENTS_FOLDER;
    // 1. Delete from Cloudinary
    if (isDocuments) {
      const [rawResult, imageResult] = await Promise.all([
        cloudinary.uploader.destroy(id, {
          resource_type: "raw",
          type: "upload",
        }),
        cloudinary.uploader.destroy(id, {
          resource_type: "image",
          type: "upload",
        }),
      ]);

      if (
        rawResult?.result !== "ok" &&
        imageResult?.result !== "ok" &&
        rawResult?.result !== "not found" &&
        imageResult?.result !== "not found"
      ) {
        throw new Error("Document deletion failed");
      }
    } else {
      await cloudinary.uploader.destroy(id, {
        resource_type: "image",
        type: "upload",
      });
    }

    // 2. Update meta
    const meta = (await readJson(`${folder}.meta.json`)) || {
      order: [],
      descriptions: {},
      contentIndex: {},
      version: 0,
    };

    if (meta.order) {
      meta.order = meta.order.filter((x) => x !== id);
    }
    if (meta.descriptions && meta.descriptions[id]) {
      delete meta.descriptions[id];
    }

    meta.version = Date.now();

    await writeJson(`${folder}.meta.json`, meta);
    invalidateFolderCaches(folder);
  } catch (e) {
    console.error("Error deleting media:", e);
    throw e;
  }
}
