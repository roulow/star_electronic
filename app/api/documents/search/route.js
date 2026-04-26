/** @format */
import { listMedia, readMediaMeta, writeMediaMeta } from "@/lib/storage";

const DOCUMENTS_FOLDER = "star_electronic_documents";
const MAX_INDEX_CHARS = 80000;

function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toDefaultTitle(filename = "") {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function includesAllTerms(haystack, terms) {
  const value = normalizeForSearch(haystack);
  return terms.every((term) => value.includes(term));
}

async function extractPdfTextFromUrl(url) {
  try {
    const parserModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = parserModule.default || parserModule;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const parsed = await pdfParse(buffer);
    return String(parsed?.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_INDEX_CHARS);
  } catch {
    return null;
  }
}

function hasIndexedText(value) {
  return String(value || "").trim().length > 0;
}

function buildContentMatches(contentIndex, terms, query) {
  return Object.entries(contentIndex)
    .filter(([, content]) => content && includesAllTerms(content, terms))
    .slice(0, 20)
    .map(([id, content]) => ({
      id,
      snippet: makeSnippet(content, query),
    }));
}

function makeSnippet(text, query) {
  const source = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return "";

  const lowerSource = normalizeForSearch(source);
  const lowerQuery = normalizeForSearch(query);
  const index = lowerSource.indexOf(lowerQuery);

  if (index < 0) {
    return source.slice(0, 180) + (source.length > 180 ? "..." : "");
  }

  const start = Math.max(0, index - 70);
  const end = Math.min(source.length, index + lowerQuery.length + 110);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < source.length ? "..." : "";
  return `${prefix}${source.slice(start, end)}${suffix}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || DOCUMENTS_FOLDER;
  const query = (searchParams.get("q") || "").trim();
  const contentOnly = searchParams.get("contentOnly") === "1";
  const fileBase = `/api/documents/file?folder=${encodeURIComponent(folder)}`;

  if (!query) {
    return new Response(
      JSON.stringify({ fileMatches: [], contentMatches: [] }),
      {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }

  try {
    const terms = query
      .split(/\s+/)
      .map((t) => normalizeForSearch(t))
      .filter(Boolean);

    if (contentOnly) {
      const [items, meta] = await Promise.all([
        listMedia(folder),
        readMediaMeta(folder),
      ]);
      const contentIndex = { ...(meta?.contentIndex || {}) };

      let contentMatches = buildContentMatches(contentIndex, terms, query);

      // Lazy one-time hydration for older docs that predate content indexing.
      if (!contentMatches.length) {
        const missingContentDocs = (items || []).filter(
          (item) => item?.id && !hasIndexedText(contentIndex[item.id]),
        );

        if (missingContentDocs.length > 0) {
          const fileBase = new URL(
            `/api/documents/file?folder=${encodeURIComponent(folder)}`,
            req.url,
          ).toString();

          const extractedBatch = await Promise.all(
            missingContentDocs.map(async (doc) => ({
              id: doc.id,
              text: await extractPdfTextFromUrl(
                `${fileBase}&id=${encodeURIComponent(doc.id)}`,
              ),
            })),
          );

          for (const entry of extractedBatch) {
            if (entry.text !== null) {
              contentIndex[entry.id] = entry.text;
            }
          }

          await writeMediaMeta(folder, {
            ...(meta || {}),
            contentIndex,
          });

          contentMatches = buildContentMatches(contentIndex, terms, query);
        }
      }

      return new Response(JSON.stringify({ fileMatches: [], contentMatches }), {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      });
    }

    const [items, meta] = await Promise.all([
      listMedia(folder),
      readMediaMeta(folder),
    ]);

    const contentIndex = { ...(meta?.contentIndex || {}) };

    const documents = (items || []).map((item) => ({
      id: item.id,
      name: item.name,
      title: item.description || toDefaultTitle(item.name) || item.name,
      url: `${fileBase}&id=${encodeURIComponent(item.id)}`,
      content: contentIndex[item.id] || "",
    }));

    const fileMatches = documents
      .filter(
        (doc) =>
          includesAllTerms(doc.title, terms) ||
          includesAllTerms(doc.name, terms),
      )
      .slice(0, 12)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        name: doc.name,
        url: doc.url,
      }));

    const contentMatches = documents
      .filter((doc) => doc.content && includesAllTerms(doc.content, terms))
      .slice(0, 20)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        name: doc.name,
        url: doc.url,
        snippet: makeSnippet(doc.content, query),
      }));

    return new Response(JSON.stringify({ fileMatches, contentMatches }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
