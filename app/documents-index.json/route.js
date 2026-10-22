/** @format */
import { getDocumentSearchIndex } from "@/lib/content";

// Written to a static file at build time; the documents page searches it in
// the browser, so PDF content search needs no server.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ items: getDocumentSearchIndex() });
}
