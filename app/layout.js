/** @format */

import './globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ThemeApplicator from '@/components/ThemeApplicator';

export const metadata = {
  title: 'Star Electronic',
  description: 'Star Electronic Official Website',
};

export default function RootLayout({ children }) {
  // Locale layout under app/[locale]/layout.js renders Navbar/Footer and theme script.
  return (
    <html lang="en">
      <head>
        <ThemeApplicator />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                function readCookie(name){
                  const m = document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1')+'=([^;]*)'));
                  return m ? decodeURIComponent(m[1]) : null;
                }
                const cookieTheme = readCookie('theme');
                const pref = cookieTheme || localStorage.getItem('theme-preference') || 'system';
                const mql = window.matchMedia('(prefers-color-scheme: dark)');
                const systemDark = mql.matches;
                const theme = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
                document.documentElement.classList.toggle('dark', theme === 'dark');
                if (!cookieTheme || cookieTheme !== pref) {
                  document.cookie = 'theme='+pref+'; path=/; max-age='+(60*60*24*365);
                }
              } catch (e) {}
            })();
          `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Star Electronic',
              alternateName: [
                'Star Electric',
                'Star Electricity',
                'Star Electronics',
              ],
              url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              logo: '/onebyone.png',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'Slovakia',
              },
              description:
                'Leading provider of IoT and Smart Home solutions in Slovakia.',
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
