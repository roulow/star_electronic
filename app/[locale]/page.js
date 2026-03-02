/** @format */
import Carousel from '../../components/Carousel';
import Link from 'next/link';
import { getMessages } from '../../lib/i18n';
import StarBackground from '@/components/StarBackground';

function spanify(text) {
  return text.split(' ').map((word, index) => <span key={index}>{word} </span>);
}

export default async function HomePage({ params }) {
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
      {/* --- MOBILE HERO (Premium App Design) --- */}
      <div className="lg:hidden relative w-full overflow-hidden bg-background">
        {/* Featured Carousel Card */}
        <div className="relative z-10 px-4 mt-4">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
            <Carousel folder="star_electronic_carousel" />
            {/* Subtle gradient overlay at bottom for polish */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              <i className="fas fa-bolt mr-1.5"></i>
              {t('hero.featured', 'Featured')}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-20 px-6 mt-6 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
            {t('hero.title', 'Professional Solutions')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-6 line-clamp-3">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Link
              href={`/${locale}/contact`}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 px-2 rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
            >
              <i className=" fas fa-file-contract text-[2.5rem] text-white opacity-20 absolute"></i>
              <span className="z-10 text-center">{t('hero.ctaQuote')}</span>
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="flex-1 flex items-center justify-center gap-2 bg-muted/20 border border-border text-foreground font-semibold py-3.5 px-2 rounded-2xl active:scale-[0.98] transition-transform"
            >
              <i className="-z-10 fas fa-images text-[2.5rem] text-foreground absolute opacity-10"></i>
              <span className="text-center">{t('hero.ctaGallery')}</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pb-4">
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-3 text-center">
              <div className="text-xl font-bold text-primary">
                {t('hero.statYears', '15+')}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {t('hero.years', 'Years')}
              </div>
            </div>
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-3 text-center">
              <div className="text-xl font-bold text-primary">
                {t('hero.statProjects', '500+')}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {t('hero.projects', 'Projects')}
              </div>
            </div>
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-3 text-center">
              <div className="text-xl font-bold text-primary">
                {t('hero.statSupport', '24/7')}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {t('hero.support', 'Support')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DESKTOP HERO (Original) --- */}
      <div className="hidden lg:block fixed top-0 left-0 w-full h-screen z-0 overflow-hidden">
        <div className="container mx-auto px-4 py-10 absolute inset-0 z-0">
          <StarBackground className="-z-10" />
        </div>

        {/* Hero Section */}
        <div className="relative h-full flex flex-col justify-start pt-42 pl-18">
          <div className="container mx-auto relative z-10 grid grid-cols-[auto_1fr] items-center">
            {/* Carousel */}
            <div className="order-2 relative w-[600px] translate-x-14">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-border shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <Carousel folder="star_electronic_carousel" />
              </div>
            </div>

            <div className="order-1 text-left min-w-[550px] ml-8">
              <h1 className="text-6xl font-extrabold tracking-tight mb-6">
                <span className="block pl-16 skew-hero overflow-wrap">
                  {spanify(t('hero.title'))}
                </span>
                <span className="block text-primary mt-2 pl-2 whitespace-pre-wrap skew-description">
                  {spanify(t('hero.title2'))}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-20 max-w-2xl leading-relaxed skew-description pl-12 whitespace-pre-wrap">
                {spanify(t('hero.subtitle'))}
              </p>
              <div className="flex gap-4 justify-start pl-32">
                <Link
                  href={`/${locale}/contact`}
                  className="btn btn-primary text-lg px-8 py-4 text-center"
                >
                  {t('hero.ctaQuote')}
                </Link>
                <Link
                  href={`/${locale}/gallery`}
                  className="btn btn-outline text-lg px-8 py-4 bg-background text-center"
                >
                  {t('hero.ctaGallery')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to preserve layout flow since Hero is fixed */}
      <div
        className="relative hidden lg:block h-[70vh] w-full invisible pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Features Section - Mobile: Horizontal Scroll Snap, Desktop: Grid */}
      <section className="relative z-10 bg-background py-12 lg:py-[85px] top-shadow-middle">
        <div className="container mx-auto px-4">
          <div className="text-left lg:text-center mb-8 lg:mb-16">
            <h2 className="text-4xl lg:text-4xl font-black mb-2 lg:mb-4 uppercase tracking-tighter">
              {t('features.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t('features.subtitle')}
            </p>
          </div>

          {/* Mobile Scroll Container */}
          <div className="lg:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 scrollbar-hide">
            {[
              {
                icon: 'fa-shield-alt',
                title: 'features.security.title',
                desc: 'features.security.desc',
              },
              {
                icon: 'fa-bolt',
                title: 'features.performance.title',
                desc: 'features.performance.desc',
              },
              {
                icon: 'fa-headset',
                title: 'features.support.title',
                desc: 'features.support.desc',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="snap-center shrink-0 w-[85vw] bg-card border border-border rounded-3xl p-8 shadow-lg flex flex-col justify-between min-h-[250px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl mb-6">
                  <i className={`fas ${feature.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {t(feature.title)}
                  </h3>
                  <p className="text-muted-foreground">{t(feature.desc)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            <div className="card p-8 flex flex-col items-start gap-0 hover:-translate-y-2 card-shadow-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl shrink-0 mb-6">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">
                  {t('features.security.title')}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t('features.security.desc')}
                </p>
              </div>
            </div>

            <div className="card p-8 flex flex-col items-start gap-0 hover:-translate-y-2 card-shadow-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl shrink-0 mb-6">
                <i className="fas fa-bolt"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">
                  {t('features.performance.title')}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t('features.performance.desc')}
                </p>
              </div>
            </div>

            <div className="card p-8 flex flex-col items-start gap-0 hover:-translate-y-2 card-shadow-hover transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl shrink-0 mb-6">
                <i className="fas fa-headset"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">
                  {t('features.support.title')}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t('features.support.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
