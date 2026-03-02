/** @format */
'use client';

import { useMemo, useState, useRef } from 'react';

export default function ContactForm({ messages }) {
  const t = useMemo(() => {
    return (key, fallback) =>
      key
        .split('.')
        .reduce(
          (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
          messages || {}
        ) ??
      fallback ??
      key;
  }, [messages]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = new FormData(formRef.current);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus({
        ok: true,
        msg: t('contact.success', "Message sent. We'll get back shortly."),
      });
      if (formRef.current) formRef.current.reset();
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Contact Info Section - Desktop Only */}
      <div className="space-y-8 hidden lg:block">
        <div>
          <h3 className="text-2xl font-bold mb-4">
            {t('contact.getInTouch', 'Get in Touch')}
          </h3>
          <p className="text-muted-foreground">
            {t(
              'contact.description',
              "We'd love to hear from you. Please fill out this form or shoot us an email."
            )}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <i className="fas fa-map-marker-alt text-lg"></i>
            </div>
            <div>
              <h4 className="font-semibold">
                {t('contact.office', 'Our Office')}
              </h4>
              <p className="text-muted-foreground">
                123 Star Street, Tech City, TC 90210
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <i className="fas fa-envelope text-lg"></i>
            </div>
            <div>
              <h4 className="font-semibold">{t('contact.email', 'Email')}</h4>
              <p className="text-muted-foreground">
                info@star-electronic.example
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <i className="fas fa-phone text-lg"></i>
            </div>
            <div>
              <h4 className="font-semibold">{t('contact.phone', 'Phone')}</h4>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header - Bold */}
      <div className="lg:hidden mb-8">
        {/* Mobile Contact Info - Detailed List */}
        <div className="flex flex-col gap-4 mb-8">
          <a
            href="tel:+15551234567"
            className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl active:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">
              <i className="fas fa-phone"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Call Us
              </span>
              <span className="text-lg font-bold text-foreground">
                +1 (555) 123-4567
              </span>
            </div>
          </a>

          <a
            href="mailto:info@star-electronic.example"
            className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl active:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Us
              </span>
              <span className="text-lg font-bold text-foreground break-all">
                info@star-electronic.example
              </span>
            </div>
          </a>

          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Visit Us
              </span>
              <span className="text-base font-bold text-foreground leading-tight">
                123 Star Street, Tech City, TC 90210
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="card bg-transparent lg:bg-card p-0 lg:p-8 shadow-none lg:shadow-lg">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label hidden lg:block">
                {t('contact.name', 'Name')}
              </label>
              <input
                name="name"
                className="input w-full h-14 lg:h-10 text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 px-6 lg:px-4"
                required
                placeholder={t('contact.placeholders.name', 'Name')}
              />
            </div>
            <div className="space-y-2">
              <label className="label hidden lg:block">
                {t('contact.company', 'Company')}
              </label>
              <input
                name="company"
                className="input w-full h-14 lg:h-10 text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 px-6 lg:px-4"
                placeholder={t(
                  'contact.placeholders.company',
                  'Company (Optional)'
                )}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label hidden lg:block">
                {t('contact.email', 'Email')}
              </label>
              <input
                type="email"
                name="email"
                className="input w-full h-14 lg:h-10 text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 px-6 lg:px-4"
                required
                placeholder={t('contact.placeholders.email', 'Email Address')}
              />
            </div>
            <div className="space-y-2">
              <label className="label hidden lg:block">
                {t('contact.phone', 'Phone')}
              </label>
              <input
                type="tel"
                name="phone"
                className="input w-full h-14 lg:h-10 text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 px-6 lg:px-4"
                placeholder={t('contact.placeholders.phone', 'Phone Number')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label hidden lg:block">
              {t('contact.subject', 'Subject')}
            </label>
            <input
              name="subject"
              className="input w-full h-14 lg:h-10 text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 px-6 lg:px-4"
              required
              placeholder={t('contact.placeholders.subject', 'Subject')}
            />
          </div>

          <div className="space-y-2">
            <label className="label hidden lg:block">
              {t('contact.message', 'Message')}
            </label>
            <textarea
              name="message"
              className="textarea w-full text-lg lg:text-sm bg-muted/30 lg:bg-background border-2 lg:border border-transparent lg:border-border focus:border-primary rounded-2xl lg:rounded-lg transition-all duration-300 focus:ring-0 lg:focus:ring-2 focus:ring-primary/20 min-h-[150px] p-6 lg:p-4"
              required
              placeholder={t(
                'contact.placeholders.message',
                'How can we help you?'
              )}
            />
          </div>

          <button
            className="btn btn-primary w-full py-4 lg:py-3 text-xl lg:text-lg font-bold lg:font-medium shadow-lg lg:shadow-md lg:hover:shadow-lg transform lg:hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] rounded-2xl lg:rounded-lg"
            disabled={loading}
          >
            {loading
              ? t('contact.sending', 'Sending…')
              : t('contact.send', 'Send Message')}
          </button>

          {status && (
            <div
              className={`p-4 rounded-lg ${
                status.ok
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <p className="flex items-center gap-2">
                <i
                  className={`fas ${
                    status.ok ? 'fa-check-circle' : 'fa-exclamation-circle'
                  }`}
                ></i>
                {status.msg}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
