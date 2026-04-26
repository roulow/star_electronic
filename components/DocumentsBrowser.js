/** @format */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DOCUMENTS_FOLDER = "star_electronic_documents";

function includesAllTerms(haystack, terms) {
  const value = String(haystack || "").toLowerCase();
  return terms.every((term) => value.includes(term));
}

function PdfPreview({
  url,
  title,
  openAriaTemplate,
  previewTitleTemplate,
  previewUnavailableLabel,
}) {
  const [failed, setFailed] = useState(false);
  const previewUrl = `${url}${url.includes("?") ? "&" : "?"}preview=1#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0`;
  const openAria = (openAriaTemplate || "Open {title}").replace(
    "{title}",
    title,
  );
  const previewTitle = (
    previewTitleTemplate || "{title} first page preview"
  ).replace("{title}", title);

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-border bg-white">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="relative block h-64 w-full bg-neutral-100 overflow-hidden"
        aria-label={openAria}
      >
        {!failed ? (
          <iframe
            src={previewUrl}
            title={previewTitle}
            className="absolute -top-[10%] -left-[17%] h-[130%] w-[140%] max-w-none pointer-events-none"
            style={{ transformOrigin: "center" }}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <i
              className="fas fa-file-pdf text-3xl opacity-60"
              aria-hidden="true"
            ></i>
            <span className="text-xs">{previewUnavailableLabel}</span>
          </div>
        )}

        {!failed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6" />
        )}
      </a>
    </div>
  );
}

export default function DocumentsBrowser({ messages }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [contentMatches, setContentMatches] = useState([]);

  const wrapperRef = useRef(null);
  const contentSearchCacheRef = useRef(new Map());

  const t = (key, fallback) =>
    key
      .split(".")
      .reduce(
        (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
        messages,
      ) ??
    fallback ??
    key;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch(`/api/documents?folder=${encodeURIComponent(DOCUMENTS_FOLDER)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setDocuments(data.items || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setPredictionOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setContentMatches([]);
      setSearching(false);
      return;
    }

    if (value.length < 2) {
      setContentMatches([]);
      setSearching(false);
      return;
    }

    const cacheKey = value.toLowerCase();
    const cached = contentSearchCacheRef.current.get(cacheKey);
    if (Array.isArray(cached) && cached.length > 0) {
      setContentMatches(cached);
      setSearching(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setSearching(true);
      fetch(
        `/api/documents/search?folder=${encodeURIComponent(
          DOCUMENTS_FOLDER,
        )}&contentOnly=1&q=${encodeURIComponent(value)}`,
        { signal: controller.signal, cache: "no-store" },
      )
        .then((r) => r.json())
        .then((data) => {
          const nextContent = data.contentMatches || [];
          if (nextContent.length > 0) {
            contentSearchCacheRef.current.set(cacheKey, nextContent);
          } else {
            contentSearchCacheRef.current.delete(cacheKey);
          }
          setContentMatches(nextContent);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setContentMatches([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const filePredictionMatches = useMemo(() => {
    const value = query.trim();
    if (!value) return [];

    const terms = value
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    return documents
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
  }, [documents, query]);

  const documentsById = useMemo(
    () => new Map(documents.map((doc) => [doc.id, doc])),
    [documents],
  );

  const contentPredictionMatches = useMemo(
    () =>
      contentMatches
        .map((match) => {
          const doc = documentsById.get(match.id);
          if (!doc) return null;
          return {
            id: doc.id,
            title: doc.title,
            name: doc.name,
            url: doc.url,
            snippet: match.snippet,
          };
        })
        .filter(Boolean),
    [contentMatches, documentsById],
  );

  const resultIds = useMemo(() => {
    const ids = new Set();
    if (!query.trim()) return ids;
    filePredictionMatches.forEach((match) => ids.add(match.id));
    contentPredictionMatches.forEach((match) => ids.add(match.id));
    return ids;
  }, [filePredictionMatches, contentPredictionMatches, query]);

  const contentSnippetById = useMemo(() => {
    const map = new Map();
    contentPredictionMatches.forEach((match) => {
      if (!map.has(match.id) && match.snippet) {
        map.set(match.id, match.snippet);
      }
    });
    return map;
  }, [contentPredictionMatches]);

  const visibleDocuments = useMemo(() => {
    const value = query.trim();
    if (!value) return documents;
    return documents.filter((doc) => resultIds.has(doc.id));
  }, [documents, query, resultIds]);

  const hasPredictionResults =
    filePredictionMatches.length > 0 || contentPredictionMatches.length > 0;

  return (
    <div className="space-y-8">
      <div className="card relative z-50 bg-background/70 backdrop-blur-sm border border-border shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <i
            className="fas fa-file-pdf text-primary text-xl"
            aria-hidden="true"
          ></i>
          <h2 className="text-lg md:text-2xl font-bold">
            {t("documents.findTitle", "Find Documents")}
          </h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground mb-5">
          {t(
            "documents.findSubtitle",
            "Search by document title or by the text found inside each PDF.",
          )}
        </p>

        <div className="relative" ref={wrapperRef}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center">
            <i
              className="fas fa-search text-muted-foreground"
              aria-hidden="true"
            ></i>
          </div>
          <input
            className="input w-full h-12 text-sm md:text-base"
            style={{ paddingLeft: "3rem", paddingRight: "1rem" }}
            placeholder={t(
              "documents.searchPlaceholder",
              "Search by title or content...",
            )}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPredictionOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setPredictionOpen(true);
            }}
          />

          {predictionOpen && query.trim() && (
            <div className="absolute left-0 top-full mt-2 w-full z-[999] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
              <div className="max-h-[26rem] overflow-auto">
                {searching && (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    {t("documents.searching", "Searching documents...")}
                  </div>
                )}

                {!searching && (
                  <>
                    <div className="px-4 pt-4 pb-2 border-b border-border bg-muted/20">
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {t("documents.fileMatches", "File names")}
                      </div>
                    </div>
                    {filePredictionMatches.length > 0 ? (
                      <ul>
                        {filePredictionMatches.map((result) => (
                          <li
                            key={`file-${result.id}`}
                            className="border-b last:border-b-0"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--border-color) 60%, transparent)",
                            }}
                          >
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-4 py-3 hover:bg-muted/20 transition-colors"
                              onClick={() => setPredictionOpen(false)}
                            >
                              <div className="font-medium">{result.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {result.name}
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        className="px-4 py-3 text-sm text-muted-foreground border-b"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--border-color) 60%, transparent)",
                        }}
                      >
                        {t("documents.noFileMatches", "No file-name matches")}
                      </div>
                    )}

                    <div className="px-4 pt-4 pb-2 border-b border-border bg-muted/20">
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {t("documents.contentMatches", "Content inside PDFs")}
                      </div>
                    </div>
                    {contentPredictionMatches.length > 0 ? (
                      <ul>
                        {contentPredictionMatches.map((result) => (
                          <li
                            key={`content-${result.id}`}
                            className="border-b last:border-b-0"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--border-color) 60%, transparent)",
                            }}
                          >
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-4 py-3 hover:bg-muted/20 transition-colors"
                              onClick={() => setPredictionOpen(false)}
                            >
                              <div className="font-medium mb-1">
                                {result.title}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-3">
                                {result.snippet}
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        {t("documents.noContentMatches", "No content matches")}
                      </div>
                    )}

                    {!hasPredictionResults && (
                      <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
                        {t(
                          "documents.noPredictions",
                          "No suggestions yet. Try a different term.",
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton h-36 rounded-2xl"></div>
          ))}
        </div>
      ) : visibleDocuments.length ? (
        <>
          <div className="text-sm text-muted-foreground">
            {query.trim()
              ? `${visibleDocuments.length} ${t("documents.results", "results")}`
              : `${documents.length} ${t("documents.total", "documents")}`}
          </div>
          <div className="relative z-0 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDocuments.map((doc) => (
              <article
                key={doc.id}
                className="card p-4 md:p-5 border border-border rounded-2xl bg-background/70 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3 max-w-[calc(100vw-5rem)]">
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-semibold truncate">
                      {doc.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {doc.name}
                    </p>
                  </div>
                  <i
                    className="fas fa-file-pdf text-primary text-xl shrink-0 mt-1"
                    aria-hidden="true"
                  ></i>
                </div>

                {query.trim() && contentSnippetById.get(doc.id) && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {contentSnippetById.get(doc.id)}
                  </p>
                )}

                <PdfPreview
                  url={doc.url}
                  title={doc.title}
                  openAriaTemplate={t(
                    "documents.openDocumentAria",
                    "Open {title}",
                  )}
                  previewTitleTemplate={t(
                    "documents.previewFrameTitle",
                    "{title} first page preview",
                  )}
                  previewUnavailableLabel={t(
                    "documents.previewUnavailable",
                    "Preview unavailable",
                  )}
                />

                <div className="md:flex md:flex-wrap grid grid-cols-2 gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary text-sm"
                  >
                    <i className="fas fa-up-right-from-square mr-2"></i>
                    {t("documents.open", "Open")}
                  </a>
                  <a
                    href={doc.url}
                    className="btn btn-outline text-sm"
                    download
                  >
                    <i className="fas fa-download mr-2"></i>
                    {t("documents.download", "Download")}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="card p-10 text-center border-dashed">
          <i className="fas fa-folder-open text-3xl opacity-30 mb-3"></i>
          <p className="text-muted-foreground">
            {query.trim()
              ? t(
                  "documents.noResults",
                  "No documents match your current search.",
                )
              : t(
                  "documents.empty",
                  "No documents uploaded yet. Add PDFs from the dashboard.",
                )}
          </p>
        </div>
      )}
    </div>
  );
}
