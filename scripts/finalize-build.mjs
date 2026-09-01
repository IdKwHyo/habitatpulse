import { cpSync, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const hostingSource = join(projectRoot, ".openai", "hosting.json");
const hostingTarget = join(outputRoot, ".openai", "hosting.json");
const workerEntry = join(outputRoot, "server", "index.js");
const vinextRuntime = join(outputRoot, "server", "vinext-runtime.js");

if (!existsSync(workerEntry)) {
  throw new Error("vinext did not create dist/server/index.js");
}

renameSync(workerEntry, vinextRuntime);
writeFileSync(workerEntry, `import handleRequest from "./vinext-runtime.js";
export * from "./vinext-runtime.js";

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  }
};
`);

mkdirSync(dirname(hostingTarget), { recursive: true });
cpSync(hostingSource, hostingTarget);
console.log(`Finalized Habitat Pulse build in ${outputRoot}`);
