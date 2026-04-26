/** @format */
"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import StarBackground from "./StarBackground";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function Navbar({ messages, locale }) {
  const [open, setOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const t = (key, fallback) =>
    key
      .split(".")
      .reduce(
        (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
        messages,
      ) ??
    fallback ??
    key;
  const pathname = usePathname();
  const base = `/${locale || "en"}`;
  const links = [
    {
      href: `${base}`,
      label: t("nav.home", "Home"),
      desc: t("nav.homeDesc", "Main page"),
      icon: "fa-home",
    },
    {
      href: `${base}/gallery`,
      label: t("nav.gallery", "Gallery"),
      desc: t("nav.galleryDesc", "Browse our gallery"),
      icon: "fa-image",
    },
    {
      href: `${base}/documents`,
      label: t("nav.documents", "Documents"),
      desc: t("nav.documentsDesc", "Browse PDF documents"),
      icon: "fa-file-lines",
    },
    {
      href: `${base}/contact`,
      label: t("nav.contact", "Contact"),
      desc: t("nav.contactDesc", "Get in touch"),
      icon: "fa-envelope",
    },
  ];
  return (
    <>
      {/* Mobile navbar */}
      <header className="lg:hidden z-[110] sticky top-0">
        <div
          className="flex items-center justify-between p-3 border-b-2 bg-background"
          style={{ borderColor: "var(--primary-color)" }}
        >
          <Link
            href={base}
            className="flex items-center gap-2 font-extrabold tracking-wide text-lg"
          >
            <Image
              src="/onebyone.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span>Star Electronic</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="p-2 rounded-md focus:outline-none focus:ring"
              onClick={() => setOpen((o) => !o)}
            >
              {/* simple hamburger / close icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {open ? (
                  <path
                    d="M6 6L18 18M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path
                      d="M3 6h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 12h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 18h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {open && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-background z-50 transform transition-transform duration-300 ease-out shadow-2xl border-l border-border ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          aria-hidden={!open}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Image
                  src="/onebyone.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-extrabold text-xl tracking-tight">
                  Star Electronic
                </span>
              </div>
              <button
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-full hover:bg-muted/10 transition-colors focus:outline-none active:scale-95 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 6L18 18M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-6 py-8 overflow-y-auto">
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        pathname === l.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/5"
                      }`}
                    >
                      <span className="w-6 text-center pt-1">
                        <i
                          className={`fas ${l.icon} text-lg`}
                          aria-hidden="true"
                        ></i>
                      </span>
                      <div className="text-left">
                        <div className="text-lg font-medium">{l.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {l.desc}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-6 border-t border-border bg-muted/5">
              <div className="grid grid-cols-[2fr_1fr] gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("nav.language", "Language")}
                  </span>
                  <div className="bg-background rounded-lg border border-border shadow-sm">
                    <LangSwitcher
                      currentLocale={locale || "en"}
                      pathname={pathname || base}
                      mobile={true}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("nav.theme", "Theme")}
                  </span>
                  <div className="bg-background rounded-lg border border-border shadow-sm h-[42px] flex items-center justify-center">
                    <ThemeToggle mobile={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </header>

      {/* PC navbar */}
      <header
        className={`sticky hidden lg:block top-0 z-[500] bg-background ${
          pathname !== base ? "border-b-2" : ""
        }`}
        style={pathname !== base ? { borderColor: "var(--primary-color)" } : {}}
      >
        {/* Star Layer - Only on Home Page */}
        {pathname === base && (
          <>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="container mx-auto px-4 py-10 relative h-full">
                <StarBackground />
              </div>
            </div>
            {/* Right side border extending to screen edge */}
            <div className="absolute bottom-0 right-0 h-[2px] bg-primary z-20 w-[calc(50%+350px)]"></div>
          </>
        )}
        <nav className="container mx-auto flex items-center justify-between px-4 py-3 relative z-10">
          <Link
            href={base}
            className="font-extrabold tracking-wide text-xl flex items-center"
          >
            {(pathname?.endsWith("/gallery") ||
              pathname?.endsWith("/documents") ||
              pathname?.endsWith("/contact") ||
              pathname?.endsWith("/dashboard")) && (
              <Image
                src="/onebyone.png"
                alt="Logo"
                width={40}
                height={40}
                className="-ml-[40px]"
              />
            )}
            <h2>Star Electronic</h2>
          </Link>
          <div className="flex items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`btn btn-link ${
                  pathname === l.href ? "text-primary" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
            <LangSwitcher
              currentLocale={locale || "en"}
              pathname={pathname || base}
            />
            <ThemeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}

function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}

function LangSwitcher({ currentLocale, pathname, mobile }) {
  const locales = ["en", "sk", "cs", "pl", "de", "fr", "hu", "uk"];
  const labels = {
    en: "English",
    sk: "Slovenský",
    cs: "Čeština",
    pl: "Polski",
    de: "Deutsch",
    fr: "Français",
    hu: "Magyar",
    uk: "Українська",
  };
  // SVG flag icons for each language
  const flagSVG = {
    en: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="UK flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <rect width="60" height="45" fill="#012169" />
          <path d="M0,0 L60,45 M60,0 L0,45" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,45 M60,0 L0,45" stroke="#C8102E" strokeWidth="4" />
          <rect x="25" width="10" height="45" fill="#fff" />
          <rect y="17.5" width="60" height="10" fill="#fff" />
          <rect x="27" width="6" height="45" fill="#C8102E" />
          <rect y="19.5" width="60" height="6" fill="#C8102E" />
        </g>
      </svg>
    ),
    sk: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Slovakia flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="45" fill="#fff" />
        <rect y="15" width="60" height="15" fill="#0b4ea2" />
        <rect y="30" width="60" height="15" fill="#ee1c25" />
        {/* Coat of arms: shield with double cross on three hills */}
        <g transform="translate(6,6) scale(0.85)">
          <path
            d="M18 0 C11 0 6 4 6 10 C6 18 18 28 18 28 C18 28 30 18 30 10 C30 4 25 0 18 0 Z"
            fill="#ee1c25"
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* white double cross */}
          <g transform="translate(0,1)">
            <path
              d="M18 4 L18 20"
              stroke="#fff"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M14 8 H22"
              stroke="#fff"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M12 12 H24"
              stroke="#fff"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>
          {/* blue triple-hill base */}
          <g transform="translate(0,12)">
            <path
              d="M6 12 C9 8 12 8 15 12 C18 16 27 16 30 12 C33 8 36 8 39 12 L6 12 Z"
              fill="#0b4ea2"
            />
          </g>
          {/* small white border separator on shield top-left to mimic real emblem */}
          <path
            d="M12 2 C14 2 16 3 18 3"
            stroke="#fff"
            strokeWidth="0.8"
            fill="none"
          />
        </g>
      </svg>
    ),
    cs: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Czech flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="45" fill="#fff" />
        <rect y="22.5" width="60" height="22.5" fill="#d7141a" />
        <polygon points="0,0 30,22.5 0,45" fill="#11457e" />
      </svg>
    ),
    pl: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Poland flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="45" fill="#fff" />
        <rect y="22.5" width="60" height="22.5" fill="#dc143c" />
      </svg>
    ),
    de: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Germany flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="15" fill="#000" />
        <rect y="15" width="60" height="15" fill="#dd0000" />
        <rect y="30" width="60" height="15" fill="#ffce00" />
      </svg>
    ),
    fr: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="France flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="20" height="45" fill="#0055a4" />
        <rect x="20" width="20" height="45" fill="#fff" />
        <rect x="40" width="20" height="45" fill="#ef4135" />
      </svg>
    ),
    hu: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Hungary flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="15" fill="#ce2939" />
        <rect y="15" width="60" height="15" fill="#fff" />
        <rect y="30" width="60" height="15" fill="#477050" />
      </svg>
    ),
    uk: (
      <svg
        width="20"
        height="15"
        viewBox="0 0 60 45"
        aria-label="Ukraine flag"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="60" height="22.5" fill="#0057b7" />
        <rect y="22.5" width="60" height="22.5" fill="#ffd700" />
      </svg>
    ),
  };
  // Emoji fallback for SSR
  const flagEmoji = {
    en: "🇬🇧",
    sk: "🇸🇰",
    cs: "🇨🇿",
    pl: "🇵🇱",
    de: "🇩🇪",
    fr: "🇫🇷",
    hu: "🇭🇺",
    uk: "🇺🇦",
  };
  function replaceLocale(path, to) {
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return `/${to}`;
    parts[0] = to;
    return `/${parts.join("/")}`;
  }
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const [desktopMenuStyle, setDesktopMenuStyle] = useState({
    left: 0,
    width: 0,
  });

  const updateDesktopMenuPosition = useCallback(() => {
    if (mobile || !buttonRef.current || !ref.current) return;
    const nav = ref.current.closest("nav");
    if (!nav) return;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = buttonRef.current.getBoundingClientRect();
    setDesktopMenuStyle({
      left: buttonRect.left - navRect.left,
      width: buttonRect.width,
    });
  }, [mobile]);

  useEffect(() => {
    if (!open || mobile) return;
    updateDesktopMenuPosition();

    const onResize = () => updateDesktopMenuPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, mobile, currentLocale, pathname, updateDesktopMenuPosition]);

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const current = currentLocale in labels ? currentLocale : "en";

  const hasMounted = useHasMounted();
  // Always render British flag emoji and 'English' label on server, swap to correct SVG/label after hydration
  return (
    <div className={mobile ? "relative" : "static"} ref={ref}>
      <button
        type="button"
        ref={buttonRef}
        className={`btn btn-ghost h-10 px-3 flex items-center gap-2 ${
          mobile ? "w-full justify-center" : ""
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Language"
        onClick={() => setOpen((o) => !o)}
        style={{ minWidth: 0 }}
      >
        <span className="inline-flex items-center justify-center w-5 h-5 text-lg leading-none">
          {hasMounted ? flagSVG[current] : flagSVG["en"]}
        </span>
        <span
          className="text-sm text-left translate-y-0.5"
          style={{ minWidth: 0 }}
        >
          {hasMounted ? labels[current] : "English"}
        </span>
        {!mobile && (
          <i
            className={`fa-solid fa-caret-down ml-2 opacity-70 duration-300 ease-in-out ${
              open ? "-rotate-180" : ""
            }`}
          ></i>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 bg-background shadow-lg ${
            mobile
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2 w-[180px] rounded-2xl border border-border p-1"
              : "top-full rounded-bl-lg rounded-br-lg border-[0_2px_2px_2px] border-border inset-shadow-sm inset-shadow-top"
          }`}
          style={
            mobile
              ? undefined
              : {
                  left: `${desktopMenuStyle.left}px`,
                  width: `${desktopMenuStyle.width}px`,
                }
          }
        >
          {locales.map((l) => (
            <button
              key={l}
              role="menuitem"
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] ${
                l === (hasMounted ? current : "en") ? "text-primary" : ""
              } ${mobile ? "rounded-xl justify-center" : ""}`}
              style={{ minWidth: 0 }}
              onClick={() => {
                setOpen(false);
                window.location.assign(replaceLocale(pathname || "/en", l));
              }}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 text-lg leading-none">
                {hasMounted ? flagSVG[l] : flagEmoji[l]}
              </span>
              <span
                className="text-sm text-left translate-y-0.5"
                style={{ minWidth: 0 }}
              >
                {labels[l]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
