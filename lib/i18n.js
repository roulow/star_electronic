/** @format */
import fs from "fs";
import path from "path";
import { defaultLocale } from "../i18n.config";
import { readJson } from "./storage.cloudinary";

function shouldUseCloudinaryMessages() {
  const storage = process.env.STORAGE?.toLowerCase();
  if (storage && storage !== "cloudinary") return false;
  return !!(
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME
  );
}

export async function getMessages(locale) {
  // Try Cloudinary first when it is configured as the active runtime source.
  if (shouldUseCloudinaryMessages()) {
    try {
      const messages = await readJson(`messages/${locale}.json`);
      if (messages) return messages;
    } catch (e) {
      console.error(
        `Failed to fetch messages for ${locale} from Cloudinary`,
        e,
      );
    }
  }

  try {
    const p = path.join(process.cwd(), "messages", `${locale}.json`);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    const p = path.join(process.cwd(), "messages", `${defaultLocale}.json`);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
}
