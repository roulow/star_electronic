/** @format */
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// Where `wrangler dev` serves the API Worker during local development.
const WORKER_DEV_ORIGIN =
  process.env.WORKER_DEV_ORIGIN || "http://127.0.0.1:8787";

/** @type {(phase: string) => import('next').NextConfig} */
export default function nextConfig(phase) {
  const images = {
    loader: "custom",
    loaderFile: "./lib/cloudinaryLoader.js",
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      images,
      // Anything that isn't a Next.js page (the /api/* endpoints and the "/"
      // language redirect) goes to the Worker, like in production.
      async rewrites() {
        return {
          fallback: [
            { source: "/:path*", destination: `${WORKER_DEV_ORIGIN}/:path*` },
          ],
        };
      },
    };
  }

  // Production is a fully static site served by Cloudflare static assets.
  return { output: "export", images };
}
