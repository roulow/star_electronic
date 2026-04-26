/** @format */
"use client";

import Link from "next/link";
import { useState } from "react";
import ActionPopover from "./ActionPopover";

export default function Footer({ messages, locale }) {
  const [popover, setPopover] = useState(null);

  const t = (key, fallback) =>
    key
      .split(".")
      .reduce(
        (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
        messages,
      ) ??
    fallback ??
    key;

  function handleCopy(e, type) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const text = t(`footer.${type}`);
    navigator.clipboard.writeText(text).then(() => {
      setPopover({
        id: Date.now(),
        message: t(`footer.${type}Copied`, "Copied!"),
        description: text,
        x: rect.x + rect.width / 2,
        y: rect.y - 8,
        isError: false,
      });
    });
  }

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 mt-auto relative z-10">
      {popover && (
        <ActionPopover
          key={popover.id}
          message={popover.message}
          description={popover.description}
          x={popover.x}
          y={popover.y}
          isError={popover.isError}
          onClose={() => setPopover(null)}
        />
      )}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Star Electronic</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale || "en"}`}
                  className="hover:text-[rgb(var(--primary))] transition-colors"
                >
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || "en"}/gallery`}
                  className="hover:text-[rgb(var(--primary))] transition-colors"
                >
                  {t("nav.gallery")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || "en"}/documents`}
                  className="hover:text-[rgb(var(--primary))] transition-colors"
                >
                  {t("nav.documents", "Documents")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || "en"}/contact`}
                  className="hover:text-[rgb(var(--primary))] transition-colors"
                >
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale || "en"}/dashboard`}
                  className="hover:text-[rgb(var(--primary))] transition-colors"
                >
                  Dash
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              {t("footer.contactUs")}
            </h4>
            <ul className="space-y-4">
              {t("footer.address") && (
                <li
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={(e) => handleCopy(e, "address")}
                >
                  <i className="fas fa-map-marker-alt mt-1 text-primary"></i>
                  <span className="hover:text-[rgb(var(--primary))] transition-all duration-100">
                    {t("footer.address")}
                  </span>
                </li>
              )}
              <li
                className="flex items-start gap-3 cursor-pointer"
                onClick={(e) => handleCopy(e, "email")}
              >
                <i className="fas fa-envelope text-primary mt-1"></i>
                <a className="hover:text-[rgb(var(--primary))] transition-all duration-100">
                  {t("footer.email")}
                </a>
              </li>
              <li
                className="flex items-center gap-3 cursor-pointer"
                onClick={(e) => handleCopy(e, "phone")}
              >
                <i className="fas fa-phone text-primary"></i>
                <span className="hover:text-[rgb(var(--primary))] transition-all duration-100">
                  {t("footer.phone")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          <p>
            {t("footer.copyright").replace("{year}", new Date().getFullYear())}
          </p>
        </div>
      </div>
    </footer>
  );
}
