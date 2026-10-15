/** @format */
import { locales } from "../i18n.config.mjs";

export const dynamic = "force-static";

export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...locales.map((l) => `/${l}/dashboard`)],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
