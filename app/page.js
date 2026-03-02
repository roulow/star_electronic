/** @format */

import Carousel from '../components/Carousel';
import Link from 'next/link';
import { getMessages } from '../lib/i18n';
import StarBackground from '@/components/StarBackground';

function spanify(text) {
  return text.split(' ').map((word, index) => <span key={index}>{word} </span>);
}

export default async function HomePage() {
  const locale = 'en';
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
      <StarBackground />
      <div className="container mx-auto px-4 py-10">
        <section className="mb-12">
          <div className="pt-40 pl-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight pl-10">
              {t('hero.title')}
            </h2>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {t('hero.title2')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground pl-6 w-100 skew-description whitespace-pre-wrap">
              {spanify(t('hero.subtitle'))}
            </p>
            <div className="mt-20 flex flex-wrap gap-3 pl-32 text-xl font-bold">
              <Link href={`/${locale}/contact`} className="btn btn-primary">
                {t('hero.ctaQuote')}
              </Link>
              <Link href={`/${locale}/gallery`} className="btn btn-outline">
                {t('hero.ctaGallery')}
              </Link>
            </div>
          </div>
          <div className="absolute right-12 top-30 w-[600px]">
            <Carousel folder="star_electronic_carousel" />
          </div>
        </section>
      </div>
    </>
  );
}
