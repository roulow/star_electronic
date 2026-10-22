/** @format */
// Dashboard sessions: an HMAC-signed, expiring cookie. Sessions are signed with
// the dashboard key, so changing DASHBOARD_KEY signs everybody out.
import { getCookie } from "./http.js";

const COOKIE_NAME = "dashboard";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

function base64url(buffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer))
    binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(env, data) {
  const secret = env.SESSION_SECRET || `star-electronic:${env.DASHBOARD_KEY}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1)
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cookie(value, maxAge, url) {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export async function isValidKey(env, key) {
  if (!env.DASHBOARD_KEY || typeof key !== "string" || !key) return false;
  // Compare MACs so timing doesn't reveal how much of the key matched.
  const [given, expected] = await Promise.all([
    hmac(env, `key:${key}`),
    hmac(env, `key:${env.DASHBOARD_KEY}`),
  ]);
  return safeEqual(given, expected);
}

export async function sessionCookie(env, url) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `v1.${expires}`;
  return cookie(`${payload}.${await hmac(env, payload)}`, SESSION_SECONDS, url);
}

export function clearedSessionCookie(url) {
  return cookie("", 0, url);
}

export async function isAuthenticated(request, env) {
  if (!env.DASHBOARD_KEY) return false;
  const [version, expires, signature] = (
    getCookie(request, COOKIE_NAME) || ""
  ).split(".");
  if (version !== "v1" || !signature) return false;
  if (!(Number(expires) > Math.floor(Date.now() / 1000))) return false;
  return safeEqual(signature, await hmac(env, `v1.${expires}`));
}
