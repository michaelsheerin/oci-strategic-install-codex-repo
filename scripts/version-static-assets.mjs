import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(repositoryRoot, "docs", "index.html");
const version = process.env.GITHUB_SHA;

if (!version) {
  console.log("Static asset version unchanged outside GitHub Actions.");
  process.exit(0);
}

const source = fs.readFileSync(indexPath, "utf8");
const updated = source
  .replace(/(assets\/styles\.css)\?v=[^"']+/g, `$1?v=${version}`)
  .replace(/(assets\/app\.js)\?v=[^"']+/g, `$1?v=${version}`);

if (updated === source) throw new Error("Static asset references were not found.");

fs.writeFileSync(indexPath, updated);
console.log(`Versioned static assets with ${version}.`);
