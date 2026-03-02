import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper to read JSON from Cloudinary (public raw file)
export async function readJson(filename) {
  try {
    // Get the latest version via Admin API to ensure consistency
    const resource = await cloudinary.api.resource(`data/${filename}`, {
      resource_type: 'raw',
    });

    // Append timestamp to bypass any edge-cache
    const url = resource.secure_url + `?t=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404) return null;
    return await res.json();
  } catch (e) {
    // If file doesn't exist, Admin API throws 404
    if (e.error && e.error.http_code === 404) return null;
    return null;
  }
}

// Helper to write JSON to Cloudinary
export async function writeJson(filename, content) {
  const buffer = Buffer.from(JSON.stringify(content, null, 2));
  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: `data/${filename}`,
        resource_type: 'raw',
        invalidate: true, // Clear CDN cache
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function listMedia(folder) {
  // 1. Fetch images from Cloudinary folder using Admin API for consistency
  let cloudItems = [];
  try {
    // api.resources with prefix is faster and more consistent than search
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder + '/', // Ensure we only get files in this folder
      max_results: 500,
      resource_type: 'image',
    });

    cloudItems = result.resources.map(r => ({
      id: r.public_id,
      name: r.public_id.split('/').pop(), // filename from public_id
      url: r.secure_url,
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error('Cloudinary list failed', e);
    // Fallback to empty if API fails (e.g. folder doesn't exist yet)
    return [];
  }

  // 2. Fetch metadata (order, descriptions)
  const meta = (await readJson(`${folder}.meta.json`)) || {
    order: [],
    descriptions: {},
  };

  // 3. Merge and Order
  const map = new Map(cloudItems.map(i => [i.id, i]));
  const ordered = [];

  // Add items in specific order
  for (const id of meta.order) {
    const it = map.get(id);
    if (it) {
      ordered.push(it);
      map.delete(id);
    }
  }
  // Add remaining items (newest first)
  // Sort remaining by created_at desc
  const remaining = [...map.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  ordered.push(...remaining);

  // Attach descriptions
  for (const it of ordered) {
    it.description = meta.descriptions?.[it.id] || '';
  }

  return ordered;
}

export async function uploadFiles(folder, blobs) {
  // Upload in parallel
  await Promise.all(
    blobs.map(async blob => {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true, // Ensure unique filenames to prevent overwriting
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    })
  );
}

export async function reorderMedia(folder, order) {
  const meta = (await readJson(`${folder}.meta.json`)) || {
    order: [],
    descriptions: {},
  };
  meta.order = order; // Array of IDs
  await writeJson(`${folder}.meta.json`, meta);
}

export async function updateDescriptions(folder, descriptions) {
  const meta = (await readJson(`${folder}.meta.json`)) || {
    order: [],
    descriptions: {},
  };
  meta.descriptions = descriptions;
  await writeJson(`${folder}.meta.json`, meta);
}

export async function deleteMedia(folder, id) {
  try {
    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(id, { resource_type: 'image' });

    // 2. Update meta
    const meta = (await readJson(`${folder}.meta.json`)) || {
      order: [],
      descriptions: {},
    };

    if (meta.order) {
      meta.order = meta.order.filter(x => x !== id);
    }
    if (meta.descriptions && meta.descriptions[id]) {
      delete meta.descriptions[id];
    }

    await writeJson(`${folder}.meta.json`, meta);
  } catch (e) {
    console.error('Error deleting media:', e);
    throw e;
  }
}
