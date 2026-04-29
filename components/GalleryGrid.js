/** @format */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

export default function GalleryGrid({ folder, viewFullText }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cacheVersion, setCacheVersion] = useState(null);

  useEffect(() => {
    setLoading(true);
    setCacheVersion(null);
    fetch(`/api/media/version?folder=${encodeURIComponent(folder)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        const nextVersion = Number(d?.version);
        setCacheVersion(Number.isFinite(nextVersion) ? nextVersion : 0);
      })
      .catch(() => setCacheVersion(0));
  }, [folder]);

  useEffect(() => {
    if (cacheVersion === null) return;
    setLoading(true);
    fetch(`/api/media?folder=${encodeURIComponent(folder)}&v=${cacheVersion}`, {
      cache: "force-cache",
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, [folder, cacheVersion]);

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="skeleton h-64 w-full rounded-xl break-inside-avoid"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 lg:block lg:columns-3 lg:gap-4 lg:space-y-4 pb-24 lg:pb-0">
        {items.map((it) => (
          <div
            key={it.id}
            className="group relative break-inside-avoid rounded-3xl lg:rounded-xl overflow-hidden shadow-2xl lg:shadow-lg lg:hover:shadow-2xl transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedImage(it)}
          >
            <img
              src={it.url}
              alt={it.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="w-full h-auto object-cover transform lg:group-hover:scale-105 transition-transform duration-500"
            />

            {/* Mobile: Bold Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent lg:hidden flex flex-col justify-end p-6">
              <div className="transform translate-y-0 transition-transform">
                {it.description ? (
                  <>
                    <p className="text-white font-bold text-xl tracking-tight mb-1 drop-shadow-md">
                      {it.description}
                    </p>
                    <div className="h-1 w-12 bg-primary rounded-full mb-2"></div>
                  </>
                ) : null}
                <p className="text-white/70 text-xs uppercase tracking-widest font-medium">
                  <i className="lg:hidden fas fa-up-right-and-down-left-from-center mr-2"></i>
                  {viewFullText || "View Fullscreen"}
                </p>
              </div>
            </div>

            {/* Hover Overlay with Search Icon - Desktop Only */}
            <div className="absolute inset-0 bg-black/40 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center hidden lg:flex">
              <div className="bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                <i className="fas fa-search-plus text-xl"></i>
              </div>
            </div>

            {/* Description at bottom on hover (desktop) */}
            {it.description && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hidden lg:block">
                <p className="text-white text-sm font-medium line-clamp-2">
                  {it.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors text-4xl focus:outline-none z-[101]"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
          <div
            className="relative max-w-7xl w-full h-full max-h-[90vh] flex flex-col items-center justify-center pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.description || "Expanded view"}
                loading="eager"
                decoding="async"
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl pointer-events-auto"
              />
            </div>
            {selectedImage.description && (
              <div className="mt-6 bg-black/50 backdrop-blur-md rounded-xl px-8 py-4 text-white text-center max-w-3xl shadow-lg border border-white/10 shrink-0">
                <p className="text-lg font-medium tracking-wide">
                  {selectedImage.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
