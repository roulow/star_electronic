/** @format */
import '../globals.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { locales, defaultLocale } from '../../i18n.config';
import { getMessages } from '../../lib/i18n';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const loc = locale || defaultLocale;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const title = 'Star Electronic | Smart Home & IoT Solutions in Slovakia';
  const description =
    'Star Electronic (Star Electric) provides top-tier IoT and Internet of Things solutions for smart homes in Slovakia. Explore our electronics and components gallery today.';

  // hreflang alternates
  const languages = Object.fromEntries(
    locales.map(l => [l, `${siteUrl}/${l}`])
  );
  return {
    title: {
      default: title,
      template: `%s | Star Electronic`,
    },
    description,
    keywords: [
      'Star Electronic',
      'Star Electric',
      'Star Electricity',
      'Star Electronics',
      'Slovakia IoT',
      'Internet of Things',
      'Smart Home',
      'Electronics',
      'Components',
      'Slovakia',
    ],
    authors: [{ name: 'Star Electronic Team' }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${siteUrl}/${loc}`,
      languages,
    },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/${loc}`,
      siteName: 'Star Electronic',
      title,
      description,
      images: [
        {
          url: `${siteUrl}/onebyone.png`,
          width: 512,
          height: 512,
          alt: 'Star Electronic Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/onebyone.png`],
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <>
      <Navbar messages={messages} locale={locale} />
      <main className="min-h-[70vh]">{children}</main>
      <Footer messages={messages} locale={locale} />
    </>
  );
}
