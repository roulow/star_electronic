/** @format */
// Build-time access to the content snapshot written by scripts/fetch-content.mjs.
// Only imported by server components, which all run during `next build`.
import fs from "fs";
import path from "path";

const SNAPSHOT_PATH = path.join(process.cwd(), ".content", "content.json");

const EMPTY = {
  messages: {},
  theme: { light: {}, dark: {} },
  media: {},
  documents: [],
  documentText: {},
};

let cached;
let warned = false;

function load() {
  // Re-read in development so `npm run content` shows up without a restart.
  if (cached && process.env.NODE_ENV === "production") return cached;
  try {
    cached = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch {
    if (!warned) {
      console.warn(
        "No content snapshot found. Run `npm run content` to download it from Cloudinary.",
      );
      warned = true;
    }
    cached = EMPTY;
  }
  return cached;
}

export function getSnapshotMessages(locale) {
  return load().messages?.[locale] || null;
}

export function getTheme() {
  return load().theme || EMPTY.theme;
}

export function getMedia(folder) {
  return load().media?.[folder] || [];
}

export function getDocuments() {
  return load().documents || [];
}

export function getDocumentSearchIndex() {
  const { documents = [], documentText = {} } = load();
  return documents.map((doc) => ({
    id: doc.id,
    text: documentText[doc.id] || "",
  }));
}
