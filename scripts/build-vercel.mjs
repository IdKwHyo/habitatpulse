import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("vercel-dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all([
  copyFile("index.html", `${output}/index.html`),
  copyFile("app.js", `${output}/app.js`),
  copyFile("styles.css", `${output}/styles.css`),
  cp("assets", `${output}/assets`, { recursive: true })
]);

console.log("Created Vercel static build.");
