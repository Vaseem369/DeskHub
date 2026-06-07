/**
 * Production entry for Render (and local `npm start`).
 * Uses PORT from the environment when set (Render), otherwise 3001.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(
  fileURLToPath(import.meta.url)
);

const root = join(__dirname, "..");

const port =
  process.env.PORT || "3001";

const child = spawn(
  process.execPath,
  [
    join(
      root,
      "node_modules",
      "json-server",
      "lib",
      "cli",
      "bin.js"
    ),
    "--watch",
    "db.json",
    "--host",
    "0.0.0.0",
    "--delay",
    "200",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    stdio: "inherit",
  }
);

child.on(
  "exit",
  (code) => {
    process.exit(
      code ?? 0
    );
  }
);
