/** @format */

import fs from "fs";
import path from "path";
import { readJson, writeJson } from "../../../lib/storage.cloudinary";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");

  if (!locale) {
    return Response.json({ error: "Locale is required" }, { status: 400 });
  }

  // Prefer Cloudinary copy when available
  try {
    const cloudMessages = await readJson(`messages/${locale}.json`);
    if (cloudMessages) {
      return Response.json({
        messages: cloudMessages,
        source: "cloudinary",
        editable: !!(
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET &&
          process.env.CLOUDINARY_CLOUD_NAME
        ),
      });
    }
  } catch (err) {
    // fallthrough to local file
    console.error("Cloudinary read failed", err);
  }

  const filePath = path.join(process.cwd(), "messages", `${locale}.json`);

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const messages = JSON.parse(fileContent);
    return Response.json({ messages, source: "local", editable: false });
  } catch (error) {
    return Response.json(
      { error: "File not found or invalid" },
      { status: 404 },
    );
  }
}

export async function POST(request) {
  const body = await request.json();
  const { locale, content } = body;

  if (!locale || !content) {
    return Response.json(
      { error: "Locale and content are required" },
      { status: 400 },
    );
  }

  // Only allow editing via Cloudinary. Writing to the deployment filesystem
  // (Vercel serverless) is not supported and will fail.
  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.CLOUDINARY_CLOUD_NAME
  ) {
    return Response.json(
      { error: "Cloudinary not configured - content editing unavailable" },
      { status: 503 },
    );
  }

  try {
    await writeJson(`messages/${locale}.json`, content);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to write messages to Cloudinary", error);
    return Response.json(
      {
        error: "Failed to write to Cloudinary",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
