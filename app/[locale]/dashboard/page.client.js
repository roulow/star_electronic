/** @format */
/* eslint-disable @next/next/no-img-element */
'use client';

import StarBackground from '@/components/StarBackground';
import { useEffect, useMemo, useState, useRef } from 'react';
import { locales } from '../../../i18n.config';
import EmailEditor from 'react-email-editor';

const FOLDERS = [
  { key: 'star_electronic_carousel', label: 'Carousel' },
  { key: 'star_electronic_gallery', label: 'Gallery' },
];

export default function DashboardClient({ locale, messages }) {
  const [activeTab, setActiveTab] = useState('carousel'); // 'carousel' | 'gallery' | 'content' | 'colors'
  const [authed, setAuthed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Translation Helper
  const t = useMemo(() => {
    return (key, fallback) =>
      key
        .split('.')
        .reduce(
          (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
          messages
        ) ??
      fallback ??
      key;
  }, [messages]);

  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);

  // Auth Effect
  useEffect(() => {
    const key = window.localStorage.getItem('dashboard_key');
    if (key) {
      checkKey(key).then(valid => {
        if (valid) setAuthed(true);
      });
    }
  }, []);

  // Prevent scrolling when locked
  useEffect(() => {
    if (!authed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [authed]);

  async function checkKey(k) {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: k }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  function handleUnlock(e) {
    e?.preventDefault();
    if (!passwordInput) return;

    checkKey(passwordInput).then(valid => {
      if (valid) {
        setAuthed(true);
        window.localStorage.setItem('dashboard_key', passwordInput);
        setError(false);
      } else {
        setError(true);
        // Shake animation or error message
      }
    });
  }

  const NavItem = ({ tab, icon, label }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <i className={`fas ${icon} w-5 text-center`}></i>
      {label}
    </button>
  );

  const bottomNavItems = [
    { id: 'carousel', icon: 'fa-images', label: 'Carousel' },
    { id: 'gallery', icon: 'fa-photo-video', label: 'Gallery' },
    { id: 'content', icon: 'fa-language', label: 'Content' },
    { id: 'colors', icon: 'fa-palette', label: 'Theme' },
    { id: 'user-emails', icon: 'fa-envelope-open-text', label: 'User Emails' },
    { id: 'owner-emails', icon: 'fa-inbox', label: 'Owner Emails' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <StarBackground className="-z-10 opacity-50" />

      {/* Locked State Overlay & Modal */}
      {!authed && (
        <>
          {/* Backdrop - Desaturates and blocks interaction */}
          <div className="fixed inset-0 z-[60] bg-background/50 backdrop-grayscale backdrop-blur-[1px]" />

          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 flex flex-col items-center text-center bg-background">
                <div className="size-4 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <i className="fas fa-lock text-2xl"></i>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Dashboard Locked
                </h2>
                <p className="text-muted-foreground mb-8">
                  Please enter your access key to manage the website content.
                </p>

                <form onSubmit={handleUnlock} className="w-full space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={e => {
                        setPasswordInput(e.target.value);
                        setError(false);
                      }}
                      placeholder="Enter access key..."
                      className={`w-full px-4 py-3 rounded-xl bg-muted/50 border ${
                        error
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                      } focus:outline-none focus:ring-2 transition-all`}
                      autoFocus
                    />
                    {error && (
                      <div className="absolute right-3 top-3 text-red-500 animate-in fade-in">
                        <i className="fas fa-exclamation-circle"></i>
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 text-left pl-1">
                      Invalid access key. Please try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                  >
                    Unlock Dashboard
                  </button>
                </form>
              </div>
              <div className="bg-background p-4 text-center border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Protected Area &bull; Authorized Personnel Only
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            S
          </div>
          <h1 className="text-lg font-bold tracking-tight">Star Admin</h1>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed -bottom-1 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-40 flex justify-around items-center h-16 px-1 pb-safe">
        {bottomNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === item.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-medium text-center leading-tight px-0.5">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col w-64 bg-background/60 backdrop-blur-xl border-r border-border z-50">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              S
            </div>
            <h1 className="text-lg font-bold tracking-tight">Star Admin</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Media Library
            </h3>
            <div className="space-y-1">
              <NavItem tab="carousel" icon="fa-images" label="Carousel" />
              <NavItem tab="gallery" icon="fa-photo-video" label="Gallery" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Text Editing
            </h3>
            <div className="space-y-1">
              <NavItem
                tab="content"
                icon="fa-language"
                label="Content Editor"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Design
            </h3>
            <div className="space-y-1">
              <NavItem tab="colors" icon="fa-palette" label="Theme Editor" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Automated Emails
            </h3>
            <div className="space-y-1">
              <NavItem
                tab="user-emails"
                icon="fa-envelope-open-text"
                label="User Emails"
              />
              <NavItem
                tab="owner-emails"
                icon="fa-inbox"
                label="Owner Emails"
              />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border bg-background/40">
          <button
            onClick={() => {
              setAuthed(false);
              window.localStorage.removeItem('dashboard_key');
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 p-4 pt-8 pb-24 lg:p-8 relative z-10 ${
          !authed ? 'overflow-hidden' : 'overflow-auto'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {activeTab === 'carousel' && (
            <MediaManager
              folderKey="star_electronic_carousel"
              title="Carousel Manager"
              showDescriptions={false}
            />
          )}
          {activeTab === 'gallery' && (
            <MediaManager
              folderKey="star_electronic_gallery"
              title="Gallery Manager"
              showDescriptions={true}
            />
          )}
          {activeTab === 'content' && <ContentEditor currentLocale={locale} />}
          {activeTab === 'colors' && <ColorEditor />}
          {activeTab === 'user-emails' && <EmailSettings type="user" />}
          {activeTab === 'owner-emails' && <EmailSettings type="owner" />}
        </div>
      </main>
    </div>
  );
}

// --- Sub Components ---

function MediaManager({ folderKey, title, showDescriptions = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [descMap, setDescMap] = useState({});
  const [deletingItem, setDeletingItem] = useState(null);

  // Use folderKey immediately
  const folder = folderKey;

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/media?folder=${encodeURIComponent(folder)}`
      );
      const data = await res.json();
      setItems(data.items || []);
      setDescMap(
        Object.fromEntries(
          (data.items || []).map(i => [i.id, i.description || ''])
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    const form = new FormData();
    [...files].forEach(f => form.append('files', f));
    form.append('folder', folder);
    await fetch('/api/media/upload', { method: 'POST', body: form });
    e.target.value = '';
    refresh();
  }

  async function onSaveDescriptions() {
    await fetch('/api/media/descriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, descriptions: descMap }),
    });
    refresh();
  }

  async function onReorder(newOrder) {
    await fetch('/api/media/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, order: newOrder.map(i => i.id) }),
    });
    refresh();
  }

  async function onConfirmDelete() {
    if (!deletingItem) return;
    try {
      await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, id: deletingItem.id }),
      });
      setDeletingItem(null);
      refresh();
    } catch (e) {
      alert('Failed to delete item: ' + e.message);
    }
  }

  return (
    <>
      <div className="space-y-6 fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage files for {title.toLowerCase()}.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <label className="btn btn-outline cursor-pointer w-full sm:w-auto justify-center">
              <i className="fas fa-cloud-upload-alt mr-2"></i> Upload New
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onUpload}
              />
            </label>
            {showDescriptions && (
              <button
                className="btn btn-primary w-full sm:w-auto justify-center"
                onClick={onSaveDescriptions}
              >
                <i className="fas fa-save mr-2"></i> Save Descriptions
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <i className="fas fa-circle-notch fa-spin text-4xl text-primary opacity-50"></i>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button
                  className="absolute top-2 right-2 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md"
                  onClick={() => setDeletingItem(item)}
                  title="Remove image"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="aspect-video bg-muted relative">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={idx === 0}
                      onClick={() =>
                        onReorder([
                          ...items.slice(0, idx - 1),
                          items[idx],
                          items[idx - 1],
                          ...items.slice(idx + 1),
                        ])
                      }
                      title="Move Left"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                      className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={idx === items.length - 1}
                      onClick={() =>
                        onReorder([
                          ...items.slice(0, idx),
                          items[idx + 1],
                          items[idx],
                          ...items.slice(idx + 2),
                        ])
                      }
                      title="Move Right"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
                {showDescriptions && (
                  <div className="p-3">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">
                      Description
                    </div>
                    <textarea
                      className="textarea w-full text-sm resize-none bg-muted/30 focus:bg-background transition-colors min-h-[60px]"
                      placeholder="Enter caption..."
                      value={descMap[item.id] || ''}
                      onChange={e =>
                        setDescMap(m => ({ ...m, [item.id]: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <i className="fas fa-folder-open text-4xl mb-4 opacity-30"></i>
                <p>Folder is empty. Upload some images to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm bg-base-100 p-6 shadow-xl border border-border">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to remove this image? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={onConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ContentEditor({ currentLocale }) {
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jsonString, setJsonString] = useState('');

  useEffect(() => {
    loadContent(selectedLocale);
  }, [selectedLocale]);

  async function loadContent(loc) {
    setLoading(true);
    try {
      const res = await fetch(`/api/content?locale=${loc}`);
      const json = await res.json();
      setData(json.messages);
      setJsonString(JSON.stringify(json.messages, null, 2));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const content = JSON.parse(jsonString);
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: selectedLocale, content }),
      });
      if (res.ok) {
        alert('Saved content successfully!');
        loadContent(selectedLocale);
      } else {
        alert('Failed to save content.');
      }
    } catch (e) {
      alert('Invalid JSON. Please fix syntax errors.');
    }
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Content Editor</h2>
          <p className="text-muted-foreground">
            Modify site text and translations for all supported languages.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          <i className="fas fa-save mr-2"></i> Save Changes
        </button>
      </div>

      <div className="card p-0 bg-background/50 backdrop-blur-sm overflow-hidden border-none shadow-lg">
        <div className="bg-muted/30 p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fas fa-globe text-primary"></i>
            <select
              className="bg-transparent font-medium outline-none cursor-pointer hover:text-primary transition-colors"
              value={selectedLocale}
              onChange={e => setSelectedLocale(e.target.value)}
            >
              {locales.map(l => (
                <option className="bg-background" key={l} value={l}>
                  {l.toUpperCase()} - {l}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            messages/{selectedLocale}.json
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <i className="fas fa-circle-notch fa-spin text-4xl text-primary opacity-50"></i>
          </div>
        ) : (
          <div className="relative">
            <textarea
              className="w-full h-[65vh] font-mono text-sm p-6 bg-card focus:outline-none resize-none leading-relaxed"
              value={jsonString}
              onChange={e => setJsonString(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ColorEditor() {
  const [allVariables, setAllVariables] = useState({ light: {}, dark: {} });
  const [mode, setMode] = useState('light'); // 'light' | 'dark'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/colors')
      .then(r => r.json())
      .then(data => {
        if (data.variables) {
          setAllVariables(data.variables);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const res = await fetch('/api/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allVariables),
    });

    if (res.ok) alert('Theme saved! Refresh to see changes.');
    else alert('Failed to save theme.');
  }

  // Helper: Convert "background-color" -> "Background Color"
  const formatName = key => {
    return key
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1') // if camelCase
      .replace(/^./, str => str.toUpperCase());
  };

  // Detect if valid color format we can preview
  // Supports: "255 255 255", "255, 255, 255, 0.5", "rgb(...)", "rgba(...)", "#..."
  const isColorValue = val => {
    if (!val) return false;
    const v = val.trim();
    // Space separated rgb (Tailwind style sometimes)
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) return true;
    // Comma separated rgb/rgba (Raw CSS vars)
    // e.g. "200, 200, 200" or "200, 200, 200, 0.5"
    if (/^(\d{1,3},\s*){2,3}\d{1,3}(\.?\d+)?$/.test(v)) return true;

    // Standard css colors
    if (v.startsWith('#')) return true;
    if (v.startsWith('rgb')) return true;
    return false;
  };

  // Robust converter for the <input type="color"> value
  const toHexForPicker = val => {
    const v = val.trim();

    // Helper to match numbers
    const getNumbers = str => str.match(/[\d\.]+/g)?.map(Number) || [0, 0, 0];

    // 1. Handle space separated "255 255 255"
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) {
      const [r, g, b] = getNumbers(v);
      const hex = x => {
        const h = Math.round(x || 0).toString(16);
        return h.length === 1 ? '0' + h : h;
      };
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    }

    // 2. Handle comma separated "255, 255, 255" or "255, 255, 255, 0.5"
    if (v.includes(',')) {
      const nums = getNumbers(v);
      if (nums.length >= 3) {
        const [r, g, b] = nums;
        const hex = x => {
          const h = Math.round(x || 0).toString(16);
          return h.length === 1 ? '0' + h : h;
        };
        return `#${hex(r)}${hex(g)}${hex(b)}`;
      }
    }

    // 3. Handle hex
    if (v.startsWith('#')) {
      // expand #ccc -> #cccccc
      if (v.length === 4) {
        return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
      }
      return v.substring(0, 7); // ignores alpha hex for the picker part
    }

    // 4. Handle rgb/rgba
    if (v.startsWith('rgb')) {
      const nums = getNumbers(v);
      if (nums.length >= 3) {
        const [r, g, b] = nums;
        const hex = x => {
          const h = Math.round(x || 0).toString(16);
          return h.length === 1 ? '0' + h : h;
        };
        return `#${hex(r)}${hex(g)}${hex(b)}`;
      }
    }

    return '#000000';
  };

  const handlePickerChange = (key, hexValue, originalValue) => {
    const v = originalValue.trim();

    // hex -> rgb numbers
    const r = parseInt(hexValue.slice(1, 3), 16);
    const g = parseInt(hexValue.slice(3, 5), 16);
    const b = parseInt(hexValue.slice(5, 7), 16);

    let newValue = hexValue;

    // Case 1: Space separated "255 255 255"
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) {
      newValue = `${r} ${g} ${b}`;
    }
    // Case 2: Comma separated "255, 255, 255" or "255, 255, 255, 0.5"
    else if (/^(\d{1,3},\s*){2,3}\d{1,3}(\.?\d+)?$/.test(v)) {
      // extract old alpha if present
      const nums = v.match(/[\d\.]+/g);
      const alpha = nums && nums.length > 3 ? nums[3] : null;

      if (alpha) {
        newValue = `${r}, ${g}, ${b}, ${alpha}`;
      } else {
        newValue = `${r}, ${g}, ${b}`;
      }
    }
    // Case 3: rgba(...) - Try to preserve alpha
    else if (v.startsWith('rgb')) {
      const nums = v.match(/[\d\.]+/g);
      const alpha = nums && nums.length > 3 ? nums[3] : null;

      if (v.startsWith('rgba') || alpha) {
        newValue = `rgba(${r}, ${g}, ${b}, ${alpha || 1})`;
      } else {
        newValue = `rgb(${r}, ${g}, ${b})`;
      }
    }

    updateVar(key, newValue);
  };

  // Normalize background style string
  const getBackgroundStyle = val => {
    if (!val) return 'transparent';
    const v = val.trim();
    // If it's just numbers, wrap it
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) {
      return `rgb(${v.split(' ').join(',')})`;
    }
    if (/^(\d{1,3},\s*){2,3}\d{1,3}(\.?\d+)?$/.test(v)) {
      return `rgba(${v})`;
    }
    return v;
  };

  const updateVar = (key, val) => {
    setAllVariables(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: val,
      },
    }));
  };

  // Calculate effective variables for display
  // Light Mode: just light vars
  // Dark Mode: Unique union of keys from Light and Dark.
  //            Value is Dark if present, else Light (inherited).
  const lightVars = allVariables.light || {};
  const darkVars = allVariables.dark || {};

  let displayKeys = [];
  if (mode === 'light') {
    displayKeys = Object.keys(lightVars);
  } else {
    const allKeys = new Set([
      ...Object.keys(lightVars),
      ...Object.keys(darkVars),
    ]);
    displayKeys = Array.from(allKeys);
  }

  // FILTER: Remove references (containing 'var(')
  displayKeys = displayKeys.filter(k => {
    // check value in current mode
    let val = '';
    if (mode === 'light') val = lightVars[k];
    else val = darkVars[k] !== undefined ? darkVars[k] : lightVars[k];

    // If not found (shouldn't happen), skip
    if (!val) return false;

    return !val.includes('var(');
  });

  const handleAlphaChange = (key, newAlpha, originalValue) => {
    const v = originalValue.trim();
    let r, g, b;

    // Extract RGB
    // Space sep
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) {
      [r, g, b] = v.split(/\s+/);
    }
    // Comma sep
    else if (v.includes(',')) {
      const nums = v.match(/[\d\.]+/g) || [];
      r = nums[0];
      g = nums[1];
      b = nums[2];
    } else {
      // Fallback default
      r = 0;
      g = 0;
      b = 0;
    }

    // If alpha is "1", we can optionally revert to simplistic RGB if we want,
    // but explicit RGBA "255, 255, 255, 1" is fine too.
    // Let's stick to our "Comma Separated" standard for alpha values
    updateVar(key, `${r}, ${g}, ${b}, ${newAlpha}`);
  };

  // Helper to extract current alpha
  const getAlpha = val => {
    if (!val) return 1;
    const v = val.trim();
    const nums = v.match(/[\d\.]+/g);
    // If 4th number exists, that's alpha. Else 1.
    if (nums && nums.length >= 4) return parseFloat(nums[3]);
    return 1;
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Theme Editor</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Customize global styles for Light and Dark modes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-muted p-1 rounded-lg flex text-sm font-medium">
            <button
              className={`px-3 py-1.5 rounded-md transition-all ${
                mode === 'light'
                  ? 'bg-white text-black shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMode('light')}
            >
              <i className="fas fa-sun mr-2"></i> Light
            </button>
            <button
              className={`px-3 py-1.5 rounded-md transition-all ${
                mode === 'dark'
                  ? 'bg-black text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMode('dark')}
            >
              <i className="fas fa-moon mr-2"></i> Dark
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-save mr-2"></i> Save Theme
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">Loading variables...</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {displayKeys.map(key => {
            // Determine current value
            let val = '';
            let isInherited = false;

            if (mode === 'light') {
              val = lightVars[key] || '';
            } else {
              // Dark mode logic
              if (darkVars[key] !== undefined) {
                val = darkVars[key];
              } else {
                val = lightVars[key] || '';
                isInherited = true;
              }
            }

            const isColor = isColorValue(val);
            const currentAlpha = getAlpha(val);

            return (
              <div
                key={key}
                className={`card p-0 overflow-hidden group border transition-all ${
                  isInherited ? 'opacity-80' : ''
                } hover:border-primary hover:opacity-100`}
              >
                {isColor ? (
                  // Color Card
                  <div className="flex flex-col h-full">
                    {/* Checkered Background Wrapper */}
                    <div className="h-28 w-full relative cursor-pointer shadow-inner shadow-xl bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0TDQgNEw0IDBaTTQgNEw0IDhMOCA4TDggNFoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+')]">
                      <div
                        className="absolute inset-0 transition-colors"
                        style={{ backgroundColor: getBackgroundStyle(val) }}
                      />
                      <input
                        type="color"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={toHexForPicker(val)}
                        onChange={e =>
                          handlePickerChange(key, e.target.value, val)
                        }
                      />
                      {isInherited && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                          Inherited
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {/* Header */}
                      <div>
                        <div className="font-semibold capitalize text-sm mb-0.5">
                          {formatName(key)}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground break-all">
                          --{key}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="space-y-3 mt-auto">
                        {/* Opacity Slider */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground w-12">
                            Opacity
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentAlpha}
                            onChange={e =>
                              handleAlphaChange(key, e.target.value, val)
                            }
                            className="range range-xs range-primary flex-1"
                          />
                          <span className="text-[10px] font-mono w-8 text-right">
                            {(currentAlpha * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Raw Value */}
                        <input
                          className="input w-full px-2 py-1 text-[11px] font-mono bg-muted/30 h-8"
                          value={val}
                          onChange={e => updateVar(key, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Text Card
                  <div className="p-5 flex flex-col h-full gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="font-semibold capitalize text-sm">
                          {formatName(key)}
                        </div>
                        {isInherited && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            Inherited
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground mt-0.5">
                        --{key}
                      </div>
                    </div>
                    <div className="mt-auto">
                      <input
                        className="input w-full text-sm font-mono"
                        value={val}
                        onChange={e => updateVar(key, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {displayKeys.length === 0 && !loading && (
        <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
          No variables found.
        </div>
      )}

      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-600 dark:text-blue-400">
        <i className="fas fa-info-circle mt-0.5"></i>
        <div className="space-y-1">
          <p>
            <strong>Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            <li>
              In <strong>Dark Mode</strong>, variables labeled
              &quot;Inherited&quot; use the value from Light Mode.
            </li>
            <li>
              Editing an inherited variable in Dark Mode will create a specific
              override for Dark Mode.
            </li>
            <li>Click the color preview to open the system color picker.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmailSettings({ type }) {
  const emailEditorRef = useRef(null);
  const [settings, setSettings] = useState({
    emails: {
      ownerEnabled: true,
      userEnabled: true,
      ownerTemplate: '',
      userTemplate: '',
      ownerTemplateJson: null,
      userTemplateJson: null,
      ownerTemplateHtml: '',
      userTemplateHtml: '',
      ownerSubject: '',
      userSubject: '',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwner = type === 'owner';
  const enabledKey = isOwner ? 'ownerEnabled' : 'userEnabled';
  const templateKey = isOwner ? 'ownerTemplate' : 'userTemplate';
  const jsonKey = isOwner ? 'ownerTemplateJson' : 'userTemplateJson';
  const htmlKey = isOwner ? 'ownerTemplateHtml' : 'userTemplateHtml';
  const subjectKey = isOwner ? 'ownerSubject' : 'userSubject';

  const title = isOwner ? 'Store Inquiry Emails' : 'Confirmation User Emails';
  const description = isOwner
    ? 'These emails are sent to YOU when someone fills out the contact form.'
    : 'These emails are sent to the CUSTOMER to confirm their request was received.';

  const defaultSubject = isOwner
    ? '[Contact] {{subject}}'
    : 'We received your request at Star Electronic';

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        // Ensure structure exists
        if (!data.emails) data.emails = {};
        if (data.emails.ownerEnabled === undefined)
          data.emails.ownerEnabled = true;
        if (data.emails.userEnabled === undefined)
          data.emails.userEnabled = true;
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const onLoad = () => {
    // Load the design if it exists
    const design = settings.emails?.[jsonKey];
    if (design && emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign(design);
    }
  };

  async function save() {
    setSaving(true);

    // Export HTML and JSON from the editor
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.exportHtml(async data => {
        const { design, html } = data;

        const newSettings = {
          ...settings,
          emails: {
            ...settings.emails,
            [jsonKey]: design,
            [htmlKey]: html,
            // We can keep the old template key as a fallback or just ignore it
            [templateKey]: html,
          },
        };

        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        setSettings(newSettings);
        setSaving(false);
        alert('Settings saved!');
      });
    } else {
      // Fallback if editor not loaded (shouldn't happen)
      setSaving(false);
    }
  }

  const isEnabled = settings.emails?.[enabledKey] !== false;

  if (loading)
    return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary px-6 py-2 w-full md:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Status Card - Subtle Design */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
              isEnabled
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            <i className={`fas ${isEnabled ? 'fa-check' : 'fa-ban'}`}></i>
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {isEnabled ? 'Active' : 'Disabled'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? `Sending ${
                    isOwner ? 'inquiry' : 'confirmation'
                  } emails is currently enabled.`
                : `Sending ${
                    isOwner ? 'inquiry' : 'confirmation'
                  } emails is currently disabled.`}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isEnabled}
            onChange={() =>
              setSettings({
                ...settings,
                emails: { ...settings.emails, [enabledKey]: !isEnabled },
              })
            }
          />
          <div className="w-11 h-6 bg-[rgb(var(--border))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[rgb(var(--background))] after:border-[rgb(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ring-2 ring-[rgb(var(--border))]"></div>
        </label>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email Subject
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {isOwner
              ? 'Available variables: {{name}}, {{subject}}'
              : 'Available variables: {{name}}, {{subject}}'}
          </p>
          <input
            type="text"
            className="w-full p-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={
              settings.emails?.[subjectKey] !== undefined
                ? settings.emails[subjectKey]
                : defaultSubject
            }
            onChange={e =>
              setSettings({
                ...settings,
                emails: { ...settings.emails, [subjectKey]: e.target.value },
              })
            }
            placeholder={defaultSubject}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email Template Builder
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {isOwner
              ? 'Available variables: {{name}}, {{email}}, {{phone}}, {{company}}, {{subject}}, {{message}}, {{date}}'
              : 'Available variables: {{name}}, {{subject}}, {{date}}'}
          </p>

          <div className="border border-border rounded-lg overflow-hidden h-[800px]">
            <EmailEditor
              ref={emailEditorRef}
              onLoad={onLoad}
              minHeight="800px"
              options={{
                appearance: {
                  theme: 'modern_light',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
