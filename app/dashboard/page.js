/** @format */
/* eslint-disable @next/next/no-img-element */
'use client';

import StarBackground from '@/components/StarBackground';
import { useEffect, useState } from 'react';

const FOLDERS = [
  { key: 'star_electronic_carousel', label: 'Carousel' },
  { key: 'star_electronic_gallery', label: 'Gallery' },
];

export default function DashboardPage() {
  const [authed, setAuthed] = useState(true);

  const [deletingItem, setDeletingItem] = useState(null);
  const [folder, setFolder] = useState(FOLDERS[0].key);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [descMap, setDescMap] = useState({});

  useEffect(() => {
    if (!authed) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, folder]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/media?folder=${encodeURIComponent(folder)}`
      );
      const data = await res.json();
      setItems(data.items || []);
      setDescMap(
        Object.fromEntries(
          (data.items || []).map(i => [i.id, i.description || ''])
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function promptKey() {
    const k = window.prompt('Enter access key');
    if (!k) return;
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: k }),
    })
      .then(r => (r.ok ? setAuthed(true) : alert('Invalid key')))
      .catch(() => alert('Error'));
  }

  async function onReorder(newOrder) {
    await fetch('/api/media/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, order: newOrder.map(i => i.id) }),
    });
    refresh();
  }

  async function onUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    setLoading(true); // Show loading state immediately
    try {
      const form = new FormData();
      [...files].forEach(f => form.append('files', f));
      form.append('folder', folder);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');

      e.target.value = '';
      // Wait a short moment for Cloudinary to index/process if needed, though Admin API is fast
      await new Promise(r => setTimeout(r, 1000));
      await refresh();
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setLoading(false);
    }
  }

  async function onSaveDescriptions() {
    await fetch('/api/media/descriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, descriptions: descMap }),
    });
    refresh();
  }

  async function onConfirmDelete() {
    if (!deletingItem) return;
    try {
      await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, id: deletingItem.id }),
      });
      setDeletingItem(null);
      refresh();
    } catch (e) {
      alert('Failed to delete item: ' + e.message);
    }
  }

  if (!authed) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Enter your access key to manage carousel and gallery.
        </p>
        <button className="btn btn-primary" onClick={promptKey}>
          Enter key
        </button>
      </div>
    );
  }

  return (
    <>
      <StarBackground />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <select
            className="input w-auto"
            value={folder}
            onChange={e => setFolder(e.target.value)}
          >
            {FOLDERS.map(f => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <label className="btn btn-outline cursor-pointer">
            Upload
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
            />
          </label>
          <button className="btn" onClick={refresh}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={onSaveDescriptions}>
            Save descriptions
          </button>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="card p-0 overflow-hidden relative group"
              >
                <button
                  className="absolute top-2 right-2 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => setDeletingItem(item)}
                  title="Remove image"
                >
                  ✕
                </button>
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3 space-y-2">
                  <div
                    className="text-sm text-muted-foreground truncate"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <textarea
                    className="textarea w-full"
                    rows={2}
                    placeholder="Description"
                    value={descMap[item.id] || ''}
                    onChange={e =>
                      setDescMap(m => ({ ...m, [item.id]: e.target.value }))
                    }
                  />
                  <div className="flex items-center justify-between text-xs">
                    <button
                      className="btn btn-xs"
                      disabled={idx === 0}
                      onClick={() =>
                        onReorder([
                          ...items.slice(0, idx - 1),
                          items[idx],
                          items[idx - 1],
                          ...items.slice(idx + 1),
                        ])
                      }
                    >
                      Move up
                    </button>
                    <button
                      className="btn btn-xs"
                      disabled={idx === items.length - 1}
                      onClick={() =>
                        onReorder([
                          ...items.slice(0, idx),
                          items[idx + 1],
                          items[idx],
                          ...items.slice(idx + 2),
                        ])
                      }
                    >
                      Move down
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm bg-base-100 p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to remove this image? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={onConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
