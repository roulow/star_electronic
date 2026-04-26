/** @format */
import DocumentsBrowser from "@/components/DocumentsBrowser";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const title =
    messages?.documents?.title || messages?.nav?.documents || "Documents";
  return { title: `${title} - Star Electronic` };
}

export default async function DocumentsPage({ params }) {
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
    <div className="container mx-auto px-4 py-10 min-h-screen pb-32">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
          {t("documents.title", "Documents")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t(
            "documents.intro",
            "Search and browse technical PDFs, manuals, and references stored in our document library.",
          )}
        </p>
      </div>
      <DocumentsBrowser messages={messages} />
    </div>
  );
}
