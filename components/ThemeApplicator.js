'use client';

import { useEffect } from 'react';

export default function ThemeApplicator() {
  useEffect(() => {
    fetch('/api/colors')
      .then(res => res.json())
      .then(data => {
        if (data.variables) {
          const { light, dark } = data.variables;
          const style = document.createElement('style');
          style.id = 'dynamic-theme';

          let css = ':root {';
          for (const [key, val] of Object.entries(light || {})) {
            css += `--${key}: ${val};`;
          }
          css += '}';

          css += '.dark :root, .dark {';
          for (const [key, val] of Object.entries(dark || {})) {
            css += `--${key}: ${val};`;
          }
          css += '}';

          style.textContent = css;
          document.head.appendChild(style);
        }
      })
      .catch(err => console.error('Failed to load theme', err));
  }, []);

  return null;
}
