<!-- @format -->

# Star Electronic website

Next.js 15 (App Router) site with a landing page and carousel, gallery, PDF
document library, contact form, and an admin dashboard at `/<locale>/dashboard`.
All content (texts in 8 languages, theme colors, email templates, images and
PDFs) lives on Cloudinary and is edited in the dashboard.

## How it is hosted

The site is built to run on the **Cloudflare Workers free plan** (10 ms CPU per
request, 100,000 Worker requests per day):

- **Public pages are static files.** `npm run build` downloads all content from
  Cloudinary (`scripts/fetch-content.mjs` → `.content/content.json`) and
  `next build` exports every page to `out/`. Cloudflare serves these as static
  assets: free, unlimited, and the Worker never runs for them.
- **A small Worker (`worker/`) handles only `/api/*`** (dashboard and contact
  form) plus the `/` → `/<language>` redirect. It doesn't render React and
  stays a few milliseconds of CPU per request.
- **Images, PDFs and data load straight from Cloudinary.** `next/image` uses a
  Cloudinary loader (`lib/cloudinaryLoader.js`); dashboard uploads go from the
  browser directly to Cloudinary with a signature from the Worker.
- **PDF search runs in the browser.** The build writes a search index
  (`/documents-index.json`); the dashboard extracts PDF text in the browser
  (pdf.js) when a PDF is uploaded.

### Publishing content changes

Saving anything in the dashboard writes to Cloudinary, then the Worker calls a
Workers Builds **deploy hook**, which rebuilds and redeploys the site. Changes
appear on the public site **a few minutes after saving**; the dashboard shows a
notice while that happens. Calls made while a build is still queued are merged
into that build, and the free plan includes 3,000 build minutes per month.

If the build fails (for example Cloudinary is unreachable), the previous version
of the site stays online.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Downloads content, runs `next dev` on :3000 and the API Worker (`wrangler dev`) on :8787. Requests that aren't Next.js pages (e.g. `/api/*`) are proxied to the Worker. |
| `npm run content` | Re-downloads content from Cloudinary (refresh the dev site after dashboard edits). |
| `npm run build` | Content snapshot + static export to `out/`. |
| `npm run preview` | Production build served exactly like Cloudflare does (http://127.0.0.1:8787). |
| `npm run deploy` | Build + `wrangler deploy` from your machine (needs `npx wrangler login`). |
| `npm run lint` | ESLint. |

Without Cloudinary credentials the site still builds locally, using the texts in
`messages/` and no images. `node scripts/upload-messages.mjs` uploads the texts in
`messages/` to Cloudinary (overwriting texts edited in the dashboard).

In `.env.local`, wrap values containing `#` or `$` in single quotes and write
each `$` as `\$` (for example `SMTP_PASS='ab#c\$d'`). Unquoted, `#` starts a
comment and `$NAME` is expanded, which silently changes the value.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | build + Worker | Content storage |
| `NEXT_PUBLIC_SITE_URL` | build | Canonical URLs, hreflang, sitemap, robots. Required in CI. |
| `DASHBOARD_KEY` | Worker | Dashboard password. The dashboard is disabled when unset. |
| `SESSION_SECRET` | Worker | Optional. Signs dashboard sessions (default derives from `DASHBOARD_KEY`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Worker | Contact form emails. Without them, submissions are only logged. |
| `CONTACT_TO` | Worker | Recipient of contact form emails |
| `DEPLOY_HOOK_URL` | Worker | Workers Builds deploy hook, called after content changes |

## Deploying to Cloudflare

1. **Cloudinary:** in Settings → Security, enable **Allow delivery of PDF and
   ZIP files**. PDF previews, Open and Download links load directly from
   Cloudinary and return 401 until this is enabled.
2. **Create the Worker from the Git repository.** In the Cloudflare dashboard, go
   to Workers & Pages → Create → Import a repository, and pick this repository.
   - Project name: `star-electronic` (must match `name` in `wrangler.jsonc`)
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Node version comes from `.node-version` (24).
3. **Build variables** (Settings → Build → Variables and secrets):
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `NEXT_PUBLIC_SITE_URL` (the production URL, e.g. `https://www.example.sk`).
4. **Runtime secrets** (Settings → Variables and Secrets, type *Secret*):
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `DASHBOARD_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
   `CONTACT_TO`. Paste values exactly, without quotes. Or use
   `npx wrangler secret put <NAME>`.
5. **Deploy hook:** Settings → Builds → Deploy Hooks → create a hook for the
   production branch, then save its URL as the secret `DEPLOY_HOOK_URL`.
6. **Custom domain:** Settings → Domains & Routes → Add → Custom domain.
   `*.workers.dev` URLs are marked `noindex` (`public/_headers`); once the
   domain works you can also disable the workers.dev route there.
7. Trigger a deployment (push a commit or use the deploy hook) and check that
   `/`, `/en/gallery`, the dashboard login and the contact form work.

Workers → your Worker → Metrics/Observability shows requests and CPU time per
request; on this setup only `/api/*` and redirects show up there.

### What runs where (and costs Worker requests)

| Request | Served by | Worker CPU |
| --- | --- | --- |
| Pages, page data (`*.txt`), JS/CSS, `robots.txt`, `sitemap.xml`, search index | Static assets | none |
| Images and PDFs | Cloudinary | none |
| `/` and paths without a language | Worker (redirect) | < 1 ms |
| `/api/contact` | Worker (SMTP) | a few ms |
| `/api/*` dashboard calls | Worker (Cloudinary API) | a few ms |

## Project layout

- `app/` – pages (statically exported), `robots.js`, `sitemap.js`, `documents-index.json`
- `components/` – UI; `Carousel`, `GalleryGrid` and `DocumentsBrowser` receive their data as props
- `worker/` – Cloudflare Worker: `index.js` (redirects), `api.js` (routes + auth), `routes/*`
- `lib/cloudinary.mjs` – Cloudinary REST client (fetch + Web Crypto), shared by build and Worker
- `lib/content.js` – build-time access to the content snapshot
- `scripts/fetch-content.mjs` – downloads the content snapshot before `next build`
- `messages/` – fallback texts (the live texts are on Cloudinary)
