/** @format */
import GalleryGrid from "../../../components/GalleryGrid";
import { getMessages } from "../../../lib/i18n";
import { getMedia } from "../../../lib/content";
import { GALLERY_FOLDER } from "../../../lib/cloudinary.mjs";

export default async function GalleryPage({ params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = (key, fallback) =>
    key
      .split(".")
      .reduce(
        (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
        messages,
      ) ??
    fallback ??
    key;
  return (
    <>
      <div className="container mx-auto px-4 py-10 pb-40 min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            {t("gallery.title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("gallery.intro")}
          </p>
        </div>
        <GalleryGrid
          items={getMedia(GALLERY_FOLDER)}
          viewFullText={t("gallery.viewFull")}
        />
      </div>
    </>
  );
}
