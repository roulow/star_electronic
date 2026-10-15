/** @format */
// Document search helpers (same matching and snippet rules the server-side
// search used, now run in the browser against the static search index).

export function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSearchTerms(query) {
  return String(query || "")
    .split(/\s+/)
    .map((term) => normalizeForSearch(term))
    .filter(Boolean);
}

export function makeSnippet(text, query) {
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

// entries: [{ id, text, normalized }] where normalized = normalizeForSearch(text)
export function searchDocumentText(entries, query) {
  const terms = toSearchTerms(query);
  if (!terms.length) return [];
  return entries
    .filter(
      (entry) =>
        entry.text && terms.every((term) => entry.normalized.includes(term)),
    )
    .slice(0, 20)
    .map((entry) => ({
      id: entry.id,
      snippet: makeSnippet(entry.text, query),
    }));
}
