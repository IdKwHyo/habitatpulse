import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(projectRoot, "public");
const publicEntries = ["styles.css", "app.js", "assets"];

rmSync(publicRoot, { recursive: true, force: true });
mkdirSync(publicRoot, { recursive: true });

for (const entry of publicEntries) {
  const source = join(projectRoot, entry);
  if (!existsSync(source)) throw new Error(`Missing public input: ${entry}`);
  cpSync(source, join(publicRoot, entry), { recursive: true });
}

console.log(`Staged Habitat Pulse public assets in ${publicRoot}`);
