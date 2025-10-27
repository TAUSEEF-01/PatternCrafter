import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { cp } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..");
const portal = resolve(__dirname, "..");
const apps = [
  {
    name: "conversational_ai",
    path: resolve(root, "conversational_ai"),
    out: resolve(portal, "public", "apps", "ca"),
    basePath: "/apps/ca",
  },
  {
    name: "ranking_and_scoring",
    path: resolve(root, "ranking_and_scoring"),
    out: resolve(portal, "public", "apps", "rs"),
    basePath: "/apps/rs",
  },
  {
    name: "intent_slot_tester",
    path: resolve(root, "intent_slot_tester"),
    out: resolve(portal, "public", "apps", "ist"),
    basePath: "/apps/ist",
  },
];

function run(cmd, cwd) {
  execSync(cmd, { stdio: "inherit", cwd });
}

for (const app of apps) {
  console.log(`\n[portal] Building ${app.name}...`);
  run("npm install", app.path);
  // build with VITE_BASE_PATH so BrowserRouter basename works under the portal
  execSync(
    process.platform === "win32"
      ? `set VITE_BASE_PATH=${app.basePath}&& npm run build`
      : `VITE_BASE_PATH=${app.basePath} npm run build`,
    { stdio: "inherit", cwd: app.path, shell: true }
  );
  // Clean target and copy fresh build
  rmSync(app.out, { recursive: true, force: true });
  mkdirSync(app.out, { recursive: true });
  await cp(resolve(app.path, "dist"), app.out, { recursive: true });
  console.log(`[portal] Copied ${app.name} -> ${app.out}`);
}

console.log("\n[portal] Prepare complete.");
