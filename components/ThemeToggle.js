/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';

const opts = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

export default function ThemeToggle({ mobile }) {
  const [mode, setMode] = useState('system');

  useEffect(() => {
    const pref = localStorage.getItem('theme-preference') || 'system';
    setMode(pref);
  }, []);

  useEffect(() => {
    if (!mode) return;
    try {
      localStorage.setItem('theme-preference', mode);
      document.cookie = `theme=${mode}; path=/; max-age=${60 * 60 * 24 * 365}`;
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => {
        const systemDark = mql.matches;
        const t = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
        document.documentElement.classList.toggle('dark', t === 'dark');
      };
      apply();
      if (mode === 'system') {
        mql.addEventListener?.('change', apply);
        return () => mql.removeEventListener?.('change', apply);
      }
    } catch {}
  }, [mode]);

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDocClick = e => {
      if (!btnRef.current) return;
      if (!btnRef.current.parentElement.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const iconClass =
    mode === 'dark'
      ? 'fa-solid fa-moon'
      : mode === 'light'
      ? 'fa-solid fa-sun'
      : 'fa-solid fa-circle-half-stroke'; // system

  const setTheme = v => {
    setMode(v);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="btn btn-ghost h-10 w-10 p-0"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Theme"
        onClick={() => setOpen(o => !o)}
      >
        <i className={`${iconClass} text-lg`}></i>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 bg-background shadow-lg ${
            mobile
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2 w-[140px] rounded-2xl border border-border p-1'
              : 'right-0 mt-[0.97rem] w-30 rounded-bl-lg rounded-br-lg border-[0_2px_2px_2px] border-border inset-shadow-top'
          }`}
        >
          {opts.map(o => (
            <button
              key={o.key}
              role="menuitem"
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] ${
                mode === o.key ? 'text-primary' : ''
              } ${mobile ? 'rounded-xl justify-center' : ''}`}
              onClick={() => setTheme(o.key)}
            >
              <i
                className={
                  o.key === 'light'
                    ? 'fa-solid fa-sun'
                    : o.key === 'dark'
                    ? 'fa-solid fa-moon'
                    : 'fa-solid fa-circle-half-stroke'
                }
              ></i>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
