/** @format */
// Downloads everything the public pages need from Cloudinary into
// .content/content.json. `next build` renders the static site from this file,
// so Cloudinary is only contacted once per build instead of per page view.
//
// In CI (Cloudflare Workers Builds) any failure aborts the build, so a broken
// fetch never deploys an empty site; the previous deployment stays live.

import fs from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { locales } from "../i18n.config.mjs";
import {
  CAROUSEL_FOLDER,
  DOCUMENTS_FOLDER,
  DOCUMENT_TEXT_PREFIX,
  GALLERY_FOLDER,
  documentTextPublicId,
  downloadRaw,
  getCloudinaryConfig,
  listFolder,
  listResources,
  metaPublicId,
  orderMedia,
  toDocument,
} from "../lib/cloudinary.mjs";

const root = process.cwd();
nextEnv.loadEnvConfig(root);

const OUTPUT = path.join(root, ".content", "content.json");
const strict =
  !!process.env.WORKERS_CI ||
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.CONTENT_STRICT === "1";

function emptyContent(source) {
  return {
    source,
    messages: {},
    theme: { light: {}, dark: {} },
    media: { [CAROUSEL_FOLDER]: [], [GALLERY_FOLDER]: [] },
    documents: [],
    documentText: {},
  };
}

async function fetchContent(cfg) {
  // One Admin API call lists every JSON/text file; downloads then go through
  // Cloudinary's CDN using the versioned URLs (always the latest content).
  const files = new Map(
    (await listResources(cfg, "raw", "data/")).map((r) => [r.public_id, r]),
  );
  const read = (publicId, as = "json") => {
    const file = files.get(publicId);
    return file ? downloadRaw(file.secure_url, publicId, as) : null;
  };

  const [messageEntries, settings] = await Promise.all([
    Promise.all(
      locales.map(async (locale) => [
        locale,
        await read(`data/messages/${locale}.json`),
      ]),
    ),
    read("data/settings.json"),
  ]);

  const loadFolder = async (folder) => {
    const [items, meta] = await Promise.all([
      listFolder(cfg, folder),
      read(metaPublicId(folder)),
    ]);
    return { items: orderMedia(items, meta), meta };
  };

  const [carousel, gallery, docs] = await Promise.all([
    loadFolder(CAROUSEL_FOLDER),
    loadFolder(GALLERY_FOLDER),
    loadFolder(DOCUMENTS_FOLDER),
  ]);

  const publicMedia = (items) =>
    items.map(({ id, name, url, description }) => ({
      id,
      name,
      url,
      description,
    }));

  const documents = docs.items.map(toDocument);
  // Per-document text files win; older documents may still only have text in
  // the legacy contentIndex of the documents meta file.
  const documentText = Object.fromEntries(
    await Promise.all(
      documents.map(async (doc) => {
        const publicId = documentTextPublicId(doc.id);
        const text = files.has(publicId)
          ? await read(publicId, "text")
          : docs.meta?.contentIndex?.[doc.id];
        return [doc.id, String(text || "")];
      }),
    ),
  );

  const textFiles = [...files.keys()].filter((id) =>
    id.startsWith(DOCUMENT_TEXT_PREFIX),
  ).length;

  console.info(
    `Content: ${messageEntries.filter(([, value]) => value).length}/${locales.length} locales, ` +
      `${carousel.items.length} carousel, ${gallery.items.length} gallery, ` +
      `${documents.length} documents (${textFiles} text files)`,
  );

  return {
    source: "cloudinary",
    messages: Object.fromEntries(messageEntries.filter(([, value]) => value)),
    theme: settings?.theme || { light: {}, dark: {} },
    media: {
      [CAROUSEL_FOLDER]: publicMedia(carousel.items),
      [GALLERY_FOLDER]: publicMedia(gallery.items),
    },
    documents,
    documentText,
  };
}

async function main() {
  if (strict && !process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is missing (used for canonical URLs, sitemap.xml and robots.txt).",
    );
  }

  const cfg = getCloudinaryConfig(process.env);
  let content;

  if (!cfg) {
    if (strict) {
      throw new Error(
        "Cloudinary credentials are missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
      );
    }
    console.warn(
      "Cloudinary is not configured: building with local messages and no media.",
    );
    content = emptyContent("local");
  } else {
    content = await fetchContent(cfg);
  }

  content.generatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(content));
  console.info(`Wrote ${path.relative(root, OUTPUT)}`);
}

main().catch((error) => {
  console.error(`Content snapshot failed: ${error.message}`);
  if (strict) process.exit(1);
  // Locally, keep an existing snapshot so the dev server still works offline.
  console.warn("Continuing with the previous snapshot (if any).");
});
