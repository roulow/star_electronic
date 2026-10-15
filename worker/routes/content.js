/** @format */
import { locales } from "../../i18n.config.mjs";
import {
  getCloudinaryConfig,
  readRawFile,
  writeRawJson,
} from "../../lib/cloudinary.mjs";
import { HttpError, json, readJson } from "../http.js";
import { publish } from "../publish.js";
import cs from "../../messages/cs.json";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import hu from "../../messages/hu.json";
import pl from "../../messages/pl.json";
import sk from "../../messages/sk.json";
import uk from "../../messages/uk.json";

// Bundled copies are shown when a language has never been saved to Cloudinary.
const bundled = { cs, de, en, fr, hu, pl, sk, uk };

export async function read({ env, url }) {
  const locale = url.searchParams.get("locale");
  if (!locale) throw new HttpError(400, "Locale is required");
  if (!locales.includes(locale)) {
    throw new HttpError(404, "File not found or invalid");
  }

  const cfg = getCloudinaryConfig(env);
  if (cfg) {
    try {
      const messages = await readRawFile(cfg, `data/messages/${locale}.json`);
      if (messages) {
        return json({ messages, source: "cloudinary", editable: true });
      }
    } catch (error) {
      console.error("Cloudinary read failed", error);
    }
  }
  return json({ messages: bundled[locale], source: "local", editable: false });
}

export async function save({ env, ctx, request }) {
  const { locale, content } = await readJson(request);
  if (!locale || !content) {
    throw new HttpError(400, "Locale and content are required");
  }
  if (
    !locales.includes(locale) ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    throw new HttpError(400, "Invalid locale or content");
  }

  const cfg = getCloudinaryConfig(env);
  if (!cfg) {
    throw new HttpError(
      503,
      "Cloudinary not configured - content editing unavailable",
    );
  }
  await writeRawJson(cfg, `data/messages/${locale}.json`, content);
  return json({ success: true, publishing: publish(env, ctx) });
}
