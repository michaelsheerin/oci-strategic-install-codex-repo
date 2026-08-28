import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePrompt, promptFiles } from "./prompt-metadata.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const promptsRoot = path.join(repositoryRoot, "prompts");
const indexPath = path.join(promptsRoot, "README.md");
const submissionUrl = "https://github.com/michaelsheerin/oci-strategic-install-codex-repo/issues/new?template=prompt-submission.yml";

function displayCategory(category) {
  return (category || "other").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeCell(value) {
  return String(value || "Not provided.").replaceAll("|", "\\|").replaceAll("\n", " ");
}

const records = promptFiles(promptsRoot)
  .map(parsePrompt)
  .filter((record) => record.errors.length === 0)
  .map((record) => ({
    ...record.metadata,
    relativePath: path.relative(promptsRoot, record.filePath).replaceAll(path.sep, "/"),
  }))
  .sort((a, b) => String(a.title).localeCompare(String(b.title)));

const grouped = new Map();
for (const record of records) {
  const category = record.category || "other";
  if (!grouped.has(category)) grouped.set(category, []);
  grouped.get(category).push(record);
}

const sections = [...grouped.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([category, categoryRecords]) => {
    const rows = categoryRecords
      .map((record) => `| [${escapeCell(record.title)}](./${encodeURI(record.relativePath)}) | ${escapeCell(record.description)} | ${escapeCell(record.contact_name)} |`)
      .join("\n");
    return `## ${displayCategory(category)}\n\n| Prompt | Use case | Contact |\n| --- | --- | --- |\n${rows}`;
  });

const content = `# Prompt Library

Prompt form submissions appear here automatically. No review or manual publishing step is required.

[Submit a prompt](${submissionUrl}) · Use GitHub repository search with \`path:prompts\` to search prompt text, use cases, categories, or contacts.

${records.length ? `This library contains ${records.length} prompt record${records.length === 1 ? "" : "s"}.` : "No prompt records have been added yet."}

${sections.join("\n\n")}
`;

fs.writeFileSync(indexPath, content);
console.log(`Built prompt index with ${records.length} prompt record(s).`);
