/** @format */
'use client';

import Link from 'next/link';

export default function Footer({ messages, locale }) {
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
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 mt-auto relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Star Electronic</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale || 'en'}`}
                  className="hover:text-primary transition-colors"
                >
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || 'en'}/gallery`}
                  className="hover:text-primary transition-colors"
                >
                  {t('nav.gallery')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || 'en'}/contact`}
                  className="hover:text-primary transition-colors"
                >
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              {t('footer.contactUs')}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt mt-1 text-primary"></i>
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-primary"></i>
                <a
                  href={`mailto:${t('footer.email')}`}
                  className="hover:text-primary transition-colors"
                >
                  {t('footer.email')}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-phone text-primary"></i>
                <span>{t('footer.phone')}</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              {t('footer.followUs')}
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          <p>
            {t('footer.copyright').replace('{year}', new Date().getFullYear())}
          </p>
        </div>
      </div>
    </footer>
  );
}
