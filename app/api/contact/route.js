/** @format */
import { readSettings } from '@/lib/storage';

export async function POST(req) {
  const body = await req.json();
  const { name, email, phone, company, subject, message } = body || {};
  if (!name || !email || !subject || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
    });
  }

  const settings = await readSettings();

  const to = process.env.CONTACT_TO || 'info@star-electronic.example';

  try {
    // Lazy import to avoid bundling when unused
    let sent = false;
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const formatter = await import('@/lib/contactEmailFormatter.js');

      // Send email to business
      if (settings.emails?.ownerEnabled !== false) {
        const subjectTemplate =
          settings.emails?.ownerSubject || `[Contact] {{subject}}`;
        const finalSubject = subjectTemplate
          .replace(/{{name}}/g, name || '')
          .replace(/{{subject}}/g, subject || '');

        await transporter.sendMail({
          from: `Star Electronic Website <${process.env.SMTP_USER}>`,
          to,
          replyTo: email,
          subject: finalSubject,
          html: formatter.formatContactEmail({
            name,
            email,
            phone,
            company,
            subject,
            message,
            template:
              settings.emails?.ownerTemplateHtml ||
              settings.emails?.ownerTemplate,
          }),
        });
      }

      // Send confirmation email to user
      if (settings.emails?.userEnabled !== false) {
        const subjectTemplate =
          settings.emails?.userSubject ||
          `We received your request at Star Electronic`;
        const finalSubject = subjectTemplate
          .replace(/{{name}}/g, name || '')
          .replace(/{{subject}}/g, subject || '');

        await transporter.sendMail({
          from: `Star Electronic <${process.env.SMTP_USER}>`,
          to: email,
          subject: finalSubject,
          html: formatter.formatConfirmationEmail({
            name,
            subject,
            template:
              settings.emails?.userTemplateHtml ||
              settings.emails?.userTemplate,
          }),
        });
      }
      sent = true;
    }
    if (!sent) {
      console.info('Contact form (dev mode):', {
        name,
        email,
        phone,
        company,
        subject,
        message,
        to,
      });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
