/** @format */
/* eslint-disable @next/next/no-img-element */
"use client";

import StarBackground from "@/components/StarBackground";
import { useEffect, useRef, useState } from "react";

const FOLDERS = [
  { key: "star_electronic_carousel", label: "Carousel" },
  { key: "star_electronic_gallery", label: "Gallery" },
];

export default function DashboardPage() {
  const [authed, setAuthed] = useState(true);

  const [deletingItem, setDeletingItem] = useState(null);
  const [folder, setFolder] = useState(FOLDERS[0].key);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [descMap, setDescMap] = useState({});
  const [cacheVersion, setCacheVersion] = useState(null);
  const skipRefreshRef = useRef(false);

  useEffect(() => {
    if (!authed) return;
    let active = true;
    setCacheVersion(null);
    fetch(`/api/media/version?folder=${encodeURIComponent(folder)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const nextVersion = Number(data?.version);
        setCacheVersion(Number.isFinite(nextVersion) ? nextVersion : 0);
      })
      .catch(() => {
        if (active) setCacheVersion(0);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, folder]);

  useEffect(() => {
    if (!authed) return;
    if (cacheVersion === null) return;
    if (skipRefreshRef.current) {
      skipRefreshRef.current = false;
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, folder, cacheVersion]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/media?folder=${encodeURIComponent(
          folder,
        )}&v=${cacheVersion ?? 0}`,
        {
          cache: "force-cache",
        },
      );
      const data = await res.json();
      setItems(data.items || []);
      setDescMap(
        Object.fromEntries(
          (data.items || []).map((i) => [i.id, i.description || ""]),
        ),
      );
      const nextVersion = Number(data?.version);
      if (Number.isFinite(nextVersion) && nextVersion !== cacheVersion) {
        skipRefreshRef.current = true;
        setCacheVersion(nextVersion);
      }
    } finally {
      setLoading(false);
    }
  }

  function promptKey() {
    const k = window.prompt("Enter access key");
    if (!k) return;
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k }),
    })
      .then((r) => (r.ok ? setAuthed(true) : alert("Invalid key")))
      .catch(() => alert("Error"));
  }

  async function onReorder(newOrder) {
    const res = await fetch("/api/media/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, order: newOrder.map((i) => i.id) }),
    });
    const data = await res.json();
    const nextVersion = Number(data?.version);
    if (Number.isFinite(nextVersion) && nextVersion !== cacheVersion) {
      skipRefreshRef.current = true;
      setCacheVersion(nextVersion);
    }
    setItems(newOrder);
  }

  async function onUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const form = new FormData();
      [...files].forEach((f) => form.append("files", f));
      form.append("folder", folder);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      const uploadedItems = Array.isArray(data?.items) ? data.items : [];
      if (uploadedItems.length) {
        const uploadedIds = new Set(uploadedItems.map((item) => item.id));
        setItems((prev) => [
          ...uploadedItems,
          ...prev.filter((item) => !uploadedIds.has(item.id)),
        ]);
        setDescMap((prev) => {
          const next = { ...prev };
          for (const item of uploadedItems) {
            if (next[item.id] === undefined) {
              next[item.id] = "";
            }
          }
          return next;
        });
      }
      const nextVersion = Number(data?.version);
      if (Number.isFinite(nextVersion) && nextVersion !== cacheVersion) {
        skipRefreshRef.current = true;
        setCacheVersion(nextVersion);
      }
      if (!res.ok) throw new Error("Upload failed");

      e.target.value = "";
    } catch (err) {
      alert("Upload failed: " + err.message);
      setLoading(false);
    }
  }

  async function onSaveDescriptions() {
    const res = await fetch("/api/media/descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, descriptions: descMap }),
    });
    const data = await res.json();
    const nextVersion = Number(data?.version);
    if (Number.isFinite(nextVersion) && nextVersion !== cacheVersion) {
      skipRefreshRef.current = true;
      setCacheVersion(nextVersion);
    }
  }

  async function onConfirmDelete() {
    if (!deletingItem) return;
    try {
      const res = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, id: deletingItem.id }),
      });
      const data = await res.json();
      const nextVersion = Number(data?.version);
      if (Number.isFinite(nextVersion) && nextVersion !== cacheVersion) {
        skipRefreshRef.current = true;
        setCacheVersion(nextVersion);
      }
      const deletingId = deletingItem.id;
      setDeletingItem(null);
      setItems((prev) => prev.filter((item) => item.id !== deletingId));
      setDescMap((prev) => {
        const next = { ...prev };
        delete next[deletingId];
        return next;
      });
    } catch (e) {
      alert("Failed to delete item: " + e.message);
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
            onChange={(e) => setFolder(e.target.value)}
          >
            {FOLDERS.map((f) => (
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
                    value={descMap[item.id] || ""}
                    onChange={(e) =>
                      setDescMap((m) => ({ ...m, [item.id]: e.target.value }))
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
