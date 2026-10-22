/** @format */
// Theme colors and email settings both live in data/settings.json.
import { readRawFile, writeRawJson } from "../../lib/cloudinary.mjs";
import { HttpError, json, readJson } from "../http.js";
import { publish } from "../publish.js";
import { cloudinary } from "./media.js";

const SETTINGS_ID = "data/settings.json";

const DEFAULT_SETTINGS = {
  emails: {
    ownerEnabled: true,
    userEnabled: true,
    ownerTemplate: "",
    userTemplate: "",
  },
};

export async function loadSettings(cfg) {
  return (
    (await readRawFile(cfg, SETTINGS_ID)) || structuredClone(DEFAULT_SETTINGS)
  );
}

// The contact form reuses settings for a minute instead of re-reading them
// from Cloudinary for every submission.
let emailSettingsCache = { value: null, expires: 0 };

export async function loadEmailSettings(cfg) {
  if (emailSettingsCache.value && emailSettingsCache.expires > Date.now()) {
    return emailSettingsCache.value;
  }
  const value = await loadSettings(cfg);
  emailSettingsCache = { value, expires: Date.now() + 60_000 };
  return value;
}

async function writeSettings(cfg, settings) {
  await writeRawJson(cfg, SETTINGS_ID, settings);
  emailSettingsCache = { value: null, expires: 0 };
}

export async function readColors({ env }) {
  const settings = await loadSettings(cloudinary(env));
  return json({ variables: settings.theme || { light: {}, dark: {} } });
}

export async function saveColors({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const body = await readJson(request);
  const settings = await loadSettings(cfg);
  const currentTheme = settings.theme || { light: {}, dark: {} };
  settings.theme = {
    light: { ...currentTheme.light, ...(body.light || {}) },
    dark: { ...currentTheme.dark, ...(body.dark || {}) },
  };
  await writeSettings(cfg, settings);
  return json({ success: true, publishing: publish(env, ctx) });
}

export async function read({ env }) {
  return json(await loadSettings(cloudinary(env)));
}

export async function save({ env, ctx, request }) {
  const cfg = cloudinary(env);
  const body = await readJson(request, 5_000_000);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Invalid settings");
  }
  const current = await readRawFile(cfg, SETTINGS_ID);
  await writeSettings(cfg, body);
  // Email templates are read at send time; only the theme is baked into pages.
  const themeChanged =
    JSON.stringify(current?.theme ?? null) !==
    JSON.stringify(body.theme ?? null);
  return json({
    success: true,
    publishing: themeChanged ? publish(env, ctx) : false,
  });
}

function defaultTemplate(text) {
  return {
    counters: { u_column: 1, u_row: 1, u_content_text: 1 },
    body: {
      rows: [
        {
          cells: [1],
          columns: [{ contents: [{ type: "text", values: { text } }] }],
        },
      ],
      values: { backgroundColor: "#ffffff", contentWidth: "500px" },
    },
  };
}

// Resets email settings and theme to the defaults.
export async function init({ env, ctx }) {
  const cfg = cloudinary(env);
  await writeSettings(cfg, {
    emails: {
      ownerEnabled: true,
      userEnabled: true,
      userSubject: "Thank you for contacting Star Electronic",
      ownerSubject: "New Inquiry: {{subject}}",
      userTemplateJson: defaultTemplate(
        '<p style="font-size: 16px; line-height: 140%;"><strong>Thank you for contacting Star Electronic!</strong><br><br>Hi {{name}},<br>We have received your message regarding "{{subject}}".<br>Our team will get back to you shortly.<br><br>Best regards,<br>Star Electronic Team</p>',
      ),
      ownerTemplateJson: defaultTemplate(
        '<p style="font-size: 16px; line-height: 140%;"><strong>New Inquiry Received</strong><br><br><strong>From:</strong> {{name}}<br><strong>Email:</strong> {{email}}<br><strong>Phone:</strong> {{phone}}<br><strong>Company:</strong> {{company}}<br><strong>Subject:</strong> {{subject}}<br><br><strong>Message:</strong><br>{{message}}</p>',
      ),
      userTemplateHtml: "",
      ownerTemplateHtml: "",
    },
    theme: { light: {}, dark: {} },
  });
  return json({
    success: true,
    message: "Settings initialized",
    publishing: publish(env, ctx),
  });
}
