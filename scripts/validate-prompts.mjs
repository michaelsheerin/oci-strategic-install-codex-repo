import { fileURLToPath } from "node:url";
import path from "node:path";
import { parsePrompt, promptFiles } from "./prompt-metadata.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = promptFiles(path.join(repositoryRoot, "prompts")).map(parsePrompt);
const requiredFields = [
  "title",
  "description",
  "category",
  "tags",
  "required_inputs",
  "expected_output",
  "next_steps",
  "demo_recommended",
  "demo_recording",
  "contact_name",
  "contact_email",
  "last_reviewed",
];

const errors = [];
for (const record of records) {
  const relativePath = path.relative(repositoryRoot, record.filePath);
  errors.push(...record.errors.map((error) => `${relativePath}: ${error}`));
  for (const field of requiredFields) {
    if (!(field in record.metadata)) errors.push(`${relativePath}: Missing required metadata field '${field}'.`);
  }
  if (record.metadata.demo_recommended && !["true", "false"].includes(record.metadata.demo_recommended)) {
    errors.push(`${relativePath}: demo_recommended must be true or false.`);
  }
  if (record.metadata.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.metadata.contact_email)) {
    errors.push(`${relativePath}: contact_email is not a valid email address.`);
  }
  if (!/^# .+/m.test(record.body)) errors.push(`${relativePath}: Add a level-one prompt title heading.`);
if (!/## Prompt text\n[\s\S]*?`{3,}text\n[\s\S]+?\n`{3,}/.test(record.body)) {
    errors.push(`${relativePath}: Add complete prompt text in a text code block.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${records.length} prompt record(s).`);
