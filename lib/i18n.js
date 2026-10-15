/** @format */
import fs from "fs";
import path from "path";
import { defaultLocale } from "../i18n.config.mjs";
import { getSnapshotMessages } from "./content";

export async function getMessages(locale) {
  // Texts edited in the dashboard live on Cloudinary and arrive via the build
  // snapshot; the bundled files are the fallback.
  const messages = getSnapshotMessages(locale);
  if (messages) return messages;

  try {
    const p = path.join(process.cwd(), "messages", `${locale}.json`);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    const p = path.join(process.cwd(), "messages", `${defaultLocale}.json`);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
}
