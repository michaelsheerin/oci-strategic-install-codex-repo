import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePrompt, promptFiles } from "./prompt-metadata.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const promptsRoot = path.join(repositoryRoot, "prompts");
const outputPath = path.join(repositoryRoot, "docs", "catalog.json");

function section(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |$)`, "m"));
  return match ? match[1].trim() : "";
}

function cleanPromptText(value) {
  return value.replace(/^`{3,}text\s*\n?/i, "").replace(/\n?`{3,}\s*$/, "").trim();
}

const records = promptFiles(promptsRoot)
  .map(parsePrompt)
  .filter((record) => record.errors.length === 0)
  .map(({ filePath, metadata, body }) => ({
    title: metadata.title,
    description: metadata.description,
    category: metadata.category,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    requiredInputs: Array.isArray(metadata.required_inputs) ? metadata.required_inputs : [],
    expectedOutput: metadata.expected_output,
    nextSteps: metadata.next_steps,
    additionalInstructionsNotes: metadata.additional_instructions_notes || section(body, "Additional instructions and notes"),
    demoRecommended: metadata.demo_recommended === "true",
    demoRecording: metadata.demo_recording || "",
    contactName: metadata.contact_name,
    contactEmail: metadata.contact_email,
    sourceIssue: metadata.source_issue || "",
    lastReviewed: metadata.last_reviewed,
    useCase: section(body, "Use case and purpose"),
    promptText: cleanPromptText(section(body, "Prompt text")),
    path: path.relative(repositoryRoot, filePath).replaceAll(path.sep, "/"),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

fs.writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Built catalog with ${records.length} prompt record(s).`);
