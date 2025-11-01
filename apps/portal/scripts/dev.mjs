import { spawn, spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const portalDir = resolve(__dirname, "..");
const repoRoot = resolve(portalDir, "..", "..");

function runPrepare() {
  const res = spawnSync(
    "node",
    [resolve(portalDir, "scripts", "prepare-apps.mjs")],
    {
      stdio: "inherit",
      cwd: portalDir,
      shell: false,
    }
  );
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function spawnProc(cmd, args, options) {
  const p = spawn(cmd, args, { stdio: "inherit", ...options });
  p.on("exit", (code) => {
    if (code !== 0) {
      console.log(`[portal] ${cmd} exited with code ${code}`);
    }
  });
  return p;
}

// 1) Build and stage SPAs into portal/public/apps
runPrepare();

// 2) Ensure Flask deps then start backend for intent_slot_tester

// 3) Start Vite dev server for portal
// 2) Start Vite dev server for portal (SPAs served from public/apps)
const vite = spawnProc("npm", ["run", "vite:dev"], {
  cwd: portalDir,
  shell: true,
});

function cleanup() {
  try {
    vite.kill();
  } catch {}
}
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
