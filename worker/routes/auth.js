/** @format */
import {
  clearedSessionCookie,
  isAuthenticated,
  isValidKey,
  sessionCookie,
} from "../auth.js";
import { json, readJson } from "../http.js";

export async function login({ request, env, url }) {
  if (!env.DASHBOARD_KEY) {
    return json({ error: "Dashboard key is not configured" }, { status: 503 });
  }
  const { key } = await readJson(request, 10_000);
  if (!(await isValidKey(env, key))) {
    return json({ error: "Invalid key" }, { status: 401 });
  }
  return json(
    { ok: true },
    { headers: { "set-cookie": await sessionCookie(env, url) } },
  );
}

// Lets the dashboard restore a session; an active session is extended.
export async function status({ request, env, url }) {
  if (!(await isAuthenticated(request, env))) return json({ authed: false });
  return json(
    { authed: true },
    { headers: { "set-cookie": await sessionCookie(env, url) } },
  );
}

export function logout({ url }) {
  return json(
    { ok: true },
    { headers: { "set-cookie": clearedSessionCookie(url) } },
  );
}
