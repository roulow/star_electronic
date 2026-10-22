/** @format */
import net from "node:net";
import tls from "node:tls";
import nodemailer from "nodemailer";
import { getCloudinaryConfig } from "../../lib/cloudinary.mjs";
import {
  formatConfirmationEmail,
  formatContactEmail,
} from "../../lib/contactEmailFormatter.js";
import { json, readJson } from "../http.js";
import { loadEmailSettings } from "./settings.js";

const MAX_LENGTHS = {
  name: 200,
  email: 254,
  phone: 50,
  company: 200,
  subject: 300,
  message: 10000,
};
// A person needs more than a few seconds to fill the form.
const MIN_FILL_MS = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(body, key) {
  const value = body?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function fillSubject(template, values) {
  return template
    .replace(/\{\{(name|subject)\}\}/g, (_, key) => values[key] || "")
    .replace(/[\r\n]+/g, " ");
}

// nodemailer normally resolves the SMTP host itself and connects to one of the
// returned addresses. On Cloudflare Workers those DNS answers include CNAME
// names, which can't be connected to, so the socket is opened by hostname and
// handed to nodemailer ready to use. Works the same on Node.
function connectByHostname(options, callback) {
  const secure = Boolean(options.secure);
  const socket = secure
    ? tls.connect({
        host: options.host,
        port: options.port,
        servername: options.host,
      })
    : net.connect({ host: options.host, port: options.port });
  let settled = false;
  const finish = (error, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    callback(error, value);
  };
  const timer = setTimeout(() => {
    socket.destroy();
    finish(new Error("SMTP connection timed out"));
  }, 15000);
  socket.once(secure ? "secureConnect" : "connect", () =>
    finish(null, { connection: socket, secured: secure }),
  );
  socket.once("error", (error) => finish(error));
}

export async function contact({ request, env }) {
  const body = await readJson(request, 64_000);

  // Bot submissions are dropped silently so they look successful.
  const elapsed = Number(body?.elapsedMs);
  if (
    text(body, "_gotcha") ||
    !Number.isFinite(elapsed) ||
    elapsed < MIN_FILL_MS
  ) {
    return json({ ok: true });
  }

  const values = Object.fromEntries(
    Object.keys(MAX_LENGTHS).map((key) => [key, text(body, key)]),
  );
  const { name, email, subject, message } = values;
  if (!name || !email || !subject || !message) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }
  if (
    !EMAIL_PATTERN.test(email) ||
    Object.entries(MAX_LENGTHS).some(([key, max]) => values[key].length > max)
  ) {
    return json({ error: "Invalid input" }, { status: 400 });
  }

  const to = env.CONTACT_TO || "info@star-electronic.example";
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.info("Contact form (dev mode):", { ...values, to });
    return json({ ok: true });
  }

  const cfg = getCloudinaryConfig(env);
  const emails = (cfg ? await loadEmailSettings(cfg) : {}).emails || {};
  const port = Number(env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    getSocket: connectByHostname,
  });

  // Send email to business
  if (emails.ownerEnabled !== false) {
    await transporter.sendMail({
      from: `Star Electronic Website <${env.SMTP_USER}>`,
      to,
      replyTo: email,
      subject: fillSubject(
        emails.ownerSubject || "[Contact] {{subject}}",
        values,
      ),
      html: formatContactEmail({
        ...values,
        template: emails.ownerTemplateHtml || emails.ownerTemplate,
      }),
    });
  }

  // Send confirmation email to user
  if (emails.userEnabled !== false) {
    await transporter.sendMail({
      from: `Star Electronic <${env.SMTP_USER}>`,
      to: email,
      subject: fillSubject(
        emails.userSubject || "We received your request at Star Electronic",
        values,
      ),
      html: formatConfirmationEmail({
        name,
        subject,
        template: emails.userTemplateHtml || emails.userTemplate,
      }),
    });
  }

  return json({ ok: true });
}
