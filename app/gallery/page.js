/** @format */

import StarBackground from "@/components/StarBackground";
import GalleryGrid from "../../components/GalleryGrid";

export const metadata = { title: "Gallery - Star Electronic" };

export default function GalleryPage() {
  return (
    <>
      <StarBackground />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Gallery</h1>
        <p className="text-muted-foreground mb-8">
          A selection of recent products and projects. Images are loaded from
          the configured storage.
        </p>
        <GalleryGrid folder="star_electronic_gallery" />
      </div>
    </>
  );
}
