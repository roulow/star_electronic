/** @format */
import ContactForm from '../../../components/ContactForm';
import { getMessages } from '../../../lib/i18n';
import RedBorderBottom from '@/components/RedBorderBottom';

export const metadata = { title: 'Contact - Star Electronic' };

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = (key, fallback) =>
    key
      .split('.')
      .reduce(
        (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
        messages
      ) ??
    fallback ??
    key;
  return (
    <>
      <RedBorderBottom />
      <div className="container mx-auto px-4 py-10 min-h-screen">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            {t('contact.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('contact.intro')}
          </p>
        </div>
        <ContactForm messages={messages} />
      </div>
    </>
  );
}
