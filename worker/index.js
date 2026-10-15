/** @format */
// Cloudflare Worker for everything that is not a static file: the /api/*
// endpoints (dashboard + contact form) and the language redirects the
// Next.js middleware used to do. Public pages are static assets served
// directly by Cloudflare, so they never run this code.
import { locales, defaultLocale } from "../i18n.config.mjs";
import { handleApi } from "./api.js";
import { getCookie } from "./http.js";

const PUBLIC_FILE = /\.(.*)$/;

function localeRedirect(request, env, url) {
  const { pathname } = url;
  const hasLocale = locales.includes(pathname.split("/").filter(Boolean)[0]);
  const isPage =
    (request.method === "GET" || request.method === "HEAD") &&
    !pathname.startsWith("/_next") &&
    !PUBLIC_FILE.test(pathname);

  if (hasLocale || !isPage) {
    // Not a static file: let the assets layer answer with the 404 page.
    return env.ASSETS.fetch(request);
  }

  const preferred = getCookie(request, "locale");
  const to = locales.includes(preferred) ? preferred : defaultLocale;
  return new Response(null, {
    status: 307,
    headers: {
      // Relative, so it also works behind the Next.js dev server proxy.
      location: `/${to}${pathname === "/" ? "" : pathname}${url.search}`,
      "set-cookie": `locale=${to}; Path=/; Max-Age=31536000; SameSite=Lax`,
      "cache-control": "no-store",
    },
  });
}

const worker = {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx, url);
    }
    return localeRedirect(request, env, url);
  },
};

export default worker;
