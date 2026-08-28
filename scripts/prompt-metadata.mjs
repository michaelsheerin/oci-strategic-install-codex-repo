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
  const frontMatter = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const metadataComment = content.match(/\n<!-- prompt-metadata\n([\s\S]*?)\n-->\s*$/);
  if (!frontMatter && !metadataComment) return { filePath, metadata: {}, body: content, errors: ["Missing prompt metadata."] };
  const metadataText = frontMatter ? frontMatter[1] : metadataComment[1];
  const body = frontMatter ? frontMatter[2] : content.slice(0, metadataComment.index).trimEnd();

  const metadata = {};
  const errors = [];
  let activeList = null;

  for (const line of metadataText.split("\n")) {
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

  return { filePath, metadata, body, errors };
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
