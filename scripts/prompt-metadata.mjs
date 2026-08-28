import fs from "node:fs";
import path from "node:path";

export function promptFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md" && entry.name !== "_template.md") files.push(filePath);
    }
  };
  if (fs.existsSync(root)) visit(root);
  return files;
}

export function parsePrompt(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { filePath, metadata: {}, body: content, errors: ["Missing YAML front matter."] };

  const metadata = {};
  const errors = [];
  let activeList = null;

  for (const line of match[1].split("\n")) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && activeList) {
      metadata[activeList].push(unquote(listItem[1]));
      continue;
    }
    const field = line.match(/^([a-z_]+):(?:\s*(.*))?$/);
    if (!field) continue;
    const [, key, rawValue] = field;
    activeList = null;
    if (rawValue === "") {
      metadata[key] = [];
      activeList = key;
      continue;
    }
    if (rawValue.startsWith("[")) {
      try {
        metadata[key] = JSON.parse(rawValue);
      } catch {
        errors.push(`Invalid list for ${key}.`);
      }
      continue;
    }
    metadata[key] = unquote(rawValue);
  }

  return { filePath, metadata, body: match[2], errors };
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}
