/**
 * Formats the contact form email body for Star Electronic.
 *
 * @format
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} [params.phone]
 * @param {string} [params.company]
 * @param {string} params.subject
 * @param {string} params.message
 * @returns {string}
 */

export function formatContactEmail({
  name,
  email,
  phone,
  company,
  subject,
  message,
  template,
}) {
  const now = new Date().toLocaleString();

  if (template) {
    let content = template
      .replace(/{{name}}/g, name || '')
      .replace(/{{email}}/g, email || '')
      .replace(/{{phone}}/g, phone || '-')
      .replace(/{{company}}/g, company || '-')
      .replace(/{{subject}}/g, subject || '')
      .replace(/{{message}}/g, message || '')
      .replace(/{{date}}/g, now);

    // Simple check for HTML. If not HTML, wrap in pre-wrap div
    if (!content.trim().startsWith('<') && !content.includes('</div>')) {
      return `<div style="white-space: pre-wrap; font-family: sans-serif;">${content}</div>`;
    }
    return content;
  }

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">📧 New Website Inquiry!</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <tr><td style="padding: 8px 0; color: #666;">Date:</td><td style="font-weight: bold;">${now}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">From:</td><td style="font-weight: bold;">${name}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Phone:</td><td>${
      phone || '-'
    }</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Company:</td><td>${
      company || '-'
    }</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Subject:</td><td>${subject}</td></tr>
  </table>

  <div style="margin-top: 30px; background: #f9f9f9; padding: 20px; border-radius: 5px;">
    <h3 style="margin-top: 0; font-size: 16px; color: #444;">Message:</h3>
    <div style="white-space: pre-wrap; color: #333;">${message}</div>
  </div>
</div>
`;
}

/**
 * Formats the confirmation email sent to the user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.subject
 * @param {string} [params.template]
 * @returns {string}
 */
export function formatConfirmationEmail({ name, subject, template }) {
  const now = new Date().toLocaleString();

  if (template) {
    let content = template
      .replace(/{{name}}/g, name || '')
      .replace(/{{subject}}/g, subject || '')
      .replace(/{{date}}/g, now);

    // Simple check for HTML
    if (!content.trim().startsWith('<') && !content.includes('</div>')) {
      return `<div style="white-space: pre-wrap; font-family: sans-serif;">${content}</div>`;
    }
    return content;
  }

  return `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #eee;">
    <h1 style="color: #333; margin: 0;">Star Electronic</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; color: #333;">Hello ${name ? name : 'there'},</p>
    
    <p style="color: #555; line-height: 1.6;">
      Thank you for contacting Star Electronic! We have received your request${
        subject ? ` regarding "<strong>${subject}</strong>"` : ''
      } and our team is now processing it.
    </p>
    
    <p style="color: #555; line-height: 1.6;">
      You will receive a reply as soon as possible. If you have any further questions, simply reply to this email.
    </p>
  </div>

  <div style="border-top: 1px solid #eee; padding-top: 20px; color: #888; font-size: 12px; text-align: center;">
    <p>Best regards,<br>The Star Electronic Team</p>
    <p>Date received: ${now}</p>
  </div>
</div>
`;
}
