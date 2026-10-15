/** @format */
// npm run dev      content snapshot + API Worker (wrangler dev, :8787) + next dev (:3000)
// npm run preview  production build served exactly like on Cloudflare (:8787)
import { spawn } from "node:child_process";
import fs from "node:fs";

const preview = process.argv.includes("--preview");
const envFiles = [".env", ".env.local"]
  .filter((file) => fs.existsSync(file))
  .flatMap((file) => ["--env-file", file]);

function start(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    start(command, args).on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

if (preview) {
  await run("npm", ["run", "build"]);
  start("npx", ["wrangler", "dev", ...envFiles]);
} else {
  await run("node", ["scripts/fetch-content.mjs"]);
  // wrangler expects the static assets folder to exist.
  fs.mkdirSync("out", { recursive: true });
  const children = [
    start("npx", [
      "wrangler",
      "dev",
      "--port",
      "8787",
      "--show-interactive-dev-session=false",
      ...envFiles,
    ]),
    start("npx", ["next", "dev"]),
  ];
  const stop = () => children.forEach((child) => child.kill());
  children.forEach((child) => child.on("exit", stop));
  process.on("SIGINT", stop);
}
