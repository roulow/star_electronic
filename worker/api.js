/** @format */
import { isAuthenticated } from "./auth.js";
import { HttpError, json } from "./http.js";
import * as auth from "./routes/auth.js";
import { contact } from "./routes/contact.js";
import * as content from "./routes/content.js";
import * as media from "./routes/media.js";
import * as settings from "./routes/settings.js";

const PUBLIC = false;
const ADMIN = true;

const routes = {
  "/api/auth": {
    GET: [auth.status, PUBLIC],
    POST: [auth.login, PUBLIC],
    DELETE: [auth.logout, PUBLIC],
  },
  "/api/contact": { POST: [contact, PUBLIC] },
  "/api/media": { GET: [media.list, ADMIN] },
  "/api/media/sign-upload": { POST: [media.signUpload, ADMIN] },
  "/api/media/upload": { POST: [media.registerUpload, ADMIN] },
  "/api/media/reorder": { POST: [media.reorder, ADMIN] },
  "/api/media/descriptions": { POST: [media.saveDescriptions, ADMIN] },
  "/api/media/delete": { POST: [media.remove, ADMIN] },
  "/api/documents": { GET: [media.listDocuments, ADMIN] },
  "/api/documents/text": { POST: [media.saveDocumentText, ADMIN] },
  "/api/content": {
    GET: [content.read, ADMIN],
    POST: [content.save, ADMIN],
  },
  "/api/colors": {
    GET: [settings.readColors, ADMIN],
    POST: [settings.saveColors, ADMIN],
  },
  "/api/settings": {
    GET: [settings.read, ADMIN],
    POST: [settings.save, ADMIN],
  },
  "/api/init-settings": { POST: [settings.init, ADMIN] },
};

// Cross-site form posts never carry our SameSite cookie; checking Origin as
// well rejects them before any work is done. In local development the
// request arrives through the Next.js dev server, which sets X-Forwarded-Host.
function isSameOrigin(request, url) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false; // "null" and other opaque origins
  }
  return host === url.host || host === request.headers.get("x-forwarded-host");
}

export async function handleApi(request, env, ctx, url) {
  const route = routes[url.pathname.replace(/\/+$/, "")];
  if (!route) return json({ error: "Not found" }, { status: 404 });

  const entry = route[request.method];
  if (!entry) {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { allow: Object.keys(route).join(", ") } },
    );
  }

  const [handler, adminOnly] = entry;
  try {
    if (request.method !== "GET" && !isSameOrigin(request, url)) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    if (adminOnly && !(await isAuthenticated(request, env))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    return await handler({ request, env, ctx, url });
  } catch (error) {
    if (error instanceof HttpError) {
      return json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
