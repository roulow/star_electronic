/** @format */
// Extracts searchable text from a PDF in the admin's browser (used to run on
// the server with pdf-parse). Same output rules: lines joined, whitespace
// collapsed, capped at MAX_INDEX_CHARS.
import { MAX_INDEX_CHARS } from "./cloudinary.mjs";

let pdfjsPromise = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// source: File/Blob or ArrayBuffer
export async function extractPdfText(source) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(
    source instanceof Blob ? await source.arrayBuffer() : source,
  );
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;

  let text = "";
  try {
    for (
      let n = 1;
      n <= pdf.numPages && text.length < MAX_INDEX_CHARS * 2;
      n += 1
    ) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let lastY;
      let pageText = "";
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        const y = item.transform[5];
        pageText +=
          lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
        lastY = y;
      }
      text += `\n\n${pageText}`;
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return text.replace(/\s+/g, " ").trim().slice(0, MAX_INDEX_CHARS);
}
