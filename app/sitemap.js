/** @format */
import { locales, defaultLocale } from "../i18n.config.mjs";

export const dynamic = "force-static";

export default function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = ["", "/contact", "/gallery", "/documents"];
  return locales.flatMap((l) =>
    routes.map((route) => ({
      url: `${site}/${l}${route}`,
      changeFrequency: "weekly",
      priority: route === "" && l === defaultLocale ? 1.0 : 0.8,
    })),
  );
}
