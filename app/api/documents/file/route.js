/** @format */
import { listMedia } from "@/lib/storage";
import { v2 as cloudinary } from "cloudinary";

const DOCUMENTS_FOLDER = "star_electronic_documents";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isPdfBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 // F
  );
}

function cloudinaryCandidates(id) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return [];

  const publicId = String(id || "").replace(/^\/+/, "");
  return [
    `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`,
    `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`,
    `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.pdf`,
    `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
  ];
}

function cloudinarySignedCandidates(id) {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return [];
  }

  const publicId = String(id || "").replace(/^\/+/, "");
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const candidates = [];

  for (const resourceType of ["raw", "image"]) {
    for (const deliveryType of ["upload", "private", "authenticated"]) {
      try {
        const signed = cloudinary.utils.private_download_url(publicId, "pdf", {
          resource_type: resourceType,
          type: deliveryType,
          expires_at: expiresAt,
          attachment: false,
          use_root_path: false,
        });
        if (signed) candidates.push(signed);
      } catch {
        // Ignore invalid combinations and keep trying.
      }
    }
  }

  return candidates;
}

async function fetchPdfBytes(candidates) {
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { cache: "force-cache" });
      if (!res.ok) continue;

      const bytes = new Uint8Array(await res.arrayBuffer());
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (type.includes("pdf") || isPdfBytes(bytes)) {
        return bytes;
      }
    } catch {
      // Try next candidate URL.
    }
  }
  return null;
}

function contentDisposition(filename, download) {
  const safe = String(filename || "document.pdf")
    .replace(/[\r\n"]/g, "")
    .trim();
  const ensured = /\.pdf$/i.test(safe) ? safe : `${safe}.pdf`;
  return `${download ? "attachment" : "inline"}; filename="${ensured}"`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || DOCUMENTS_FOLDER;
  const id = (searchParams.get("id") || "").trim();
  const download = searchParams.get("download") === "1";

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const items = await listMedia(folder);
    const item = (items || []).find((entry) => entry.id === id);
    if (!item?.url) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const candidates = [
      item.url,
      ...cloudinaryCandidates(id),
      ...cloudinarySignedCandidates(id),
    ];
    const deduped = [...new Set(candidates.filter(Boolean))];
    const bytes = await fetchPdfBytes(deduped);

    if (!bytes) {
      return new Response(JSON.stringify({ error: "Failed to load PDF" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(bytes, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": contentDisposition(item.name || id, download),
        "cache-control": "public, max-age=2592000, s-maxage=2592000, immutable",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
