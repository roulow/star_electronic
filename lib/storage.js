/** @format */
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function metaPath(folder) {
  return path.join(DATA_DIR, `${folder}.json`);
}

async function readMeta(folder) {
  await ensureDirs();
  try {
    const raw = await fs.readFile(metaPath(folder), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { order: [], descriptions: {} };
  }
}

async function writeMeta(folder, meta) {
  await ensureDirs();
  await fs.writeFile(metaPath(folder), JSON.stringify(meta, null, 2), 'utf8');
}

export async function listMedia(folder) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    return mod.listMedia(folder);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.listMedia(folder);
  }
  await ensureDirs();
  const meta = await readMeta(folder);
  // List files under /public/uploads/<folder>
  const dir = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  let files = await fs.readdir(dir).catch(() => []);

  const allowed = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
  let items = files
    .filter(f => allowed.test(f))
    .map(f => ({
      id: f,
      name: f,
      url: `/uploads/${folder}/${encodeURIComponent(f)}`,
    }));

  // Fallback: allow placing files under /public/<folder>
  if (!items.length) {
    const fallbackDir = path.join(PUBLIC_DIR, folder);
    files = await fs.readdir(fallbackDir).catch(() => []);
    items = files
      .filter(f => allowed.test(f))
      .map(f => ({
        id: f,
        name: f,
        url: `/${folder}/${encodeURIComponent(f)}`,
      }));
  }

  // Apply order: items in meta.order first, then the rest
  const map = new Map(items.map(i => [i.id, i]));
  const ordered = [];
  for (const id of meta.order) {
    const it = map.get(id);
    if (it) {
      ordered.push(it);
      map.delete(id);
    }
  }
  for (const it of map.values()) ordered.push(it);

  // attach descriptions
  for (const it of ordered) {
    it.description = meta.descriptions?.[it.id] || '';
  }
  return ordered;
}

export async function reorderMedia(folder, order) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    return mod.reorderMedia(folder, order);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.reorderMedia(folder, order);
  }
  const meta = await readMeta(folder);
  meta.order = order;
  await writeMeta(folder, meta);
}

export async function updateDescriptions(folder, descriptions) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    return mod.updateDescriptions(folder, descriptions);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.updateDescriptions(folder, descriptions);
  }
  const meta = await readMeta(folder);
  meta.descriptions = { ...(meta.descriptions || {}), ...descriptions };
  await writeMeta(folder, meta);
}

export async function uploadFiles(folder, blobs) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    return mod.uploadFiles(folder, blobs);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.uploadFiles(folder, blobs);
  }
  await ensureDirs();
  const dir = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const name = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}_${blob.name.replace(/[^a-z0-9_.-]+/gi, '_')}`;
    await fs.writeFile(path.join(dir, name), buf);
  }
}

export async function deleteMedia(folder, id) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    // Cloudinary deletion not implemented in this snippet, but can be added
    // For now, we just remove from meta
    const mod = await import('./storage.cloudinary.js');
    // If mod.deleteMedia exists call it, else just update meta
    if (mod.deleteMedia) return mod.deleteMedia(folder, id);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.deleteMedia(folder, id);
  }
  await ensureDirs();

  // Try to delete from uploads dir
  const filePath = path.join(UPLOADS_DIR, folder, id);
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // If not found in uploads, try public folder (fallback)
    try {
      const publicPath = path.join(PUBLIC_DIR, folder, id);
      await fs.unlink(publicPath);
    } catch (ignore) {
      console.error('Failed to delete file:', id, ignore.message);
    }
  }

  // Update metadata
  const meta = await readMeta(folder);
  if (meta.order) {
    meta.order = meta.order.filter(item => item !== id);
  }
  if (meta.descriptions) {
    delete meta.descriptions[id];
  }
  await writeMeta(folder, meta);
}

// Placeholder for future Google Drive integration
// To use Drive, replace listMedia/uploadFiles/reorderMedia/updateDescriptions with
// functions that call the Drive API using service account credentials and map files
// from the two folders: star_electronic_carousel and star_electronic_gallery.

export async function readSettings() {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    const data = await mod.readJson('settings.json');
    if (data) return data;
    return {
      emails: {
        ownerEnabled: true,
        userEnabled: true,
        ownerTemplate: '',
        userTemplate: '',
      },
    };
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    const data = await mod.readJson('settings.json');
    if (data) return data;
    // Fallback to default structure if file not found in Drive
    return {
      emails: {
        ownerEnabled: true,
        userEnabled: true,
        ownerTemplate: '',
        userTemplate: '',
      },
    };
  }
  await ensureDirs();
  try {
    const raw = await fs.readFile(metaPath('settings'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      emails: {
        ownerEnabled: true,
        userEnabled: true,
        ownerTemplate: '',
        userTemplate: '',
      },
    };
  }
}

export async function writeSettings(settings) {
  if (process.env.STORAGE?.toLowerCase() === 'cloudinary') {
    const mod = await import('./storage.cloudinary.js');
    return mod.writeJson('settings.json', settings);
  }
  if (process.env.STORAGE?.toLowerCase() === 'drive') {
    const mod = await import('./storage.drive.js');
    return mod.writeJson('settings.json', settings);
  }
  await ensureDirs();
  await fs.writeFile(
    metaPath('settings'),
    JSON.stringify(settings, null, 2),
    'utf8'
  );
}
