/** @format */
// Google Drive storage (service account) – scaffolding implementation.
// Requires env:
// STORAGE=drive
// DRIVE_SERVICE_ACCOUNT_JSON=... (base64 of service account JSON)
// DRIVE_FOLDER_CAROUSEL=<folderId>
// DRIVE_FOLDER_GALLERY=<folderId>

import { google } from 'googleapis';
import { Readable } from 'stream';

function getAuth() {
  const b64 = process.env.DRIVE_SERVICE_ACCOUNT_JSON;
  if (!b64) throw new Error('Missing DRIVE_SERVICE_ACCOUNT_JSON');
  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const scopes = ['https://www.googleapis.com/auth/drive']; // read/write
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes });
  return auth;
}

function folderIdFor(folder) {
  let id = null;
  if (folder === 'star_electronic_carousel')
    id = process.env.DRIVE_FOLDER_CAROUSEL;
  else if (folder === 'star_electronic_gallery')
    id = process.env.DRIVE_FOLDER_GALLERY;
  else if (folder === 'data')
    id = process.env.DRIVE_FOLDER_DATA || process.env.DRIVE_FOLDER_GALLERY;

  // Sanitize ID: remove any URL query parameters (e.g. ?dmr=1...)
  return id ? id.split('?')[0].trim() : null;
}

export async function listMedia(folder) {
  const fid = folderIdFor(folder);
  if (!fid) throw new Error('Missing Drive folder id for ' + folder);
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // List image files
  const { data } = await drive.files.list({
    q: `'${fid}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  const files = data.files || [];

  // Public URL via webContentLink requires permission; here we use a view URL via thumbnail or export.
  return files.map(f => ({
    id: f.id,
    name: f.name,
    url: `https://drive.google.com/uc?export=view&id=${f.id}`,
  }));
}

export async function reorderMedia(folder, order) {
  // For Drive, ordering can be stored in a sidecar file. Simplified: no-op.
  return { ok: true };
}

export async function updateDescriptions(folder, descriptions) {
  // Could store as file description or in a sidecar metadata file. Simplified: no-op.
  return { ok: true };
}

export async function uploadFiles(folder, blobs) {
  const fid = folderIdFor(folder);
  if (!fid) throw new Error('Missing Drive folder id for ' + folder);
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);
    const media = { mimeType: blob.type, body: stream };
    await drive.files.create({
      requestBody: { name: blob.name, parents: [fid] },
      media,
      fields: 'id',
    });
  }
}

// --- JSON Storage (Settings) ---

async function findFile(drive, folderId, filename) {
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and name = '${filename}' and trashed = false`,
    fields: 'files(id, name)',
  });
  return data.files?.[0] || null;
}

export async function readJson(filename) {
  const fid = folderIdFor('data');
  if (!fid) return null; // Cannot read if no folder
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const file = await findFile(drive, fid, filename);
  if (!file) return null;

  const { data } = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'json' }
  );
  return data;
}

export async function writeJson(filename, content) {
  const fid = folderIdFor('data');
  if (!fid) throw new Error('Missing DRIVE_FOLDER_DATA (or GALLERY fallback)');
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const file = await findFile(drive, fid, filename);

  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(content, null, 2),
  };

  if (file) {
    // Update
    await drive.files.update({
      fileId: file.id,
      media: media,
    });
  } else {
    // Create
    await drive.files.create({
      requestBody: {
        name: filename,
        parents: [fid],
      },
      media: media,
    });
  }
}
