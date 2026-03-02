/** @format */
import { locales, defaultLocale } from '../../i18n.config';

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const routes = ['', '/contact', '/gallery'];
  const urls = [];

  locales.forEach(l => {
    routes.forEach(route => {
      urls.push({
        loc: `${site}/${l}${route}`,
        changefreq: 'weekly',
        priority: route === '' && l === defaultLocale ? 1.0 : 0.8,
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
