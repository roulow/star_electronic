/** @format */

// Public pages are static files, so content changes are published by
// rebuilding the site through a Workers Builds deploy hook. Cloudflare
// dedupes hook calls while a build is still queued.
export function publish(env, ctx) {
  if (!env.DEPLOY_HOOK_URL) return false;
  ctx.waitUntil(
    fetch(env.DEPLOY_HOOK_URL, { method: "POST" })
      .then((res) => {
        if (!res.ok) console.error(`Deploy hook failed (${res.status})`);
      })
      .catch((error) => console.error("Deploy hook failed", error)),
  );
  return true;
}
