import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const promptsRoot = path.join(repositoryRoot, "prompts");
const categoryMap = new Map([
  ["analysis", "analysis"],
  ["customer preparation", "customer-preparation"],
  ["data and reporting", "data-reporting"],
  ["project management", "project-management"],
  ["research", "research"],
  ["technical work", "technical-work"],
  ["writing and communication", "writing-communication"],
  ["other", "other"],
]);

function section(body, heading) {
  const marker = `### ${heading}`;
  const start = body.indexOf(marker);
  if (start < 0) return "";

  const content = body.slice(start + marker.length).replace(/^\r?\n+/, "");
  const nextHeading = content.search(/\r?\n###\s/);
  return (nextHeading < 0 ? content : content.slice(0, nextHeading)).trim();
}

function markdownList(value) {
  return value
    .split("\n")
    .map((item) => item.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .filter((item) => item.toLowerCase() !== "none");
}

function oneLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function yaml(value) {
  return JSON.stringify(String(value ?? ""));
}

function categoryFor(value) {
  return categoryMap.get(oneLine(value).toLowerCase()) || "other";
}

function displayCategory(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function promptTitle(issue) {
  const title = String(issue.title || "").replace(/^prompt:\s*/i, "").trim();
  return title || `Prompt submission ${issue.number}`;
}

function sourceIssueUrl(issue) {
  return String(issue.html_url || issue.url || "");
}

function issueIsPromptSubmission(issue) {
  return String(issue.body || "").includes("### Use case and purpose");
}

export function buildPromptRecord(issue) {
  const body = String(issue.body || "");
  const title = promptTitle(issue);
  const useCase = section(body, "Use case and purpose");
  const category = categoryFor(section(body, "Category"));
  const promptText = section(body, "Prompt text") || "No prompt text provided.";
  const requiredInputs = markdownList(section(body, "Required inputs"));
  const expectedOutput = section(body, "Expected output and next steps");
  const additionalNotes = section(body, "Additional instructions and notes");
  const demoRecommended = /^yes$/i.test(oneLine(section(body, "Is a demo recommended?")));
  const demoRecording = section(body, "Demo recording");
  const contactName = section(body, "Your name");
  const contactEmail = section(body, "Your work email");
  const submittedAt = String(issue.created_at || new Date().toISOString()).slice(0, 10);
  const sourceIssue = sourceIssueUrl(issue);
  const description = oneLine(useCase).slice(0, 220) || "No use case provided.";
  const issueNumber = Number(issue.number);
  const relativePath = path.posix.join("prompts", category, `prompt-${issueNumber}.md`);
  const filePath = path.join(repositoryRoot, relativePath);
  const inputSection = requiredInputs.length ? requiredInputs.map((input) => `- ${input}`).join("\n") : "Not provided.";

  const content = `---
title: ${yaml(title)}
description: ${yaml(description)}
category: ${yaml(category)}
tags: []
required_inputs: ${JSON.stringify(requiredInputs)}
expected_output: ${yaml(expectedOutput)}
next_steps: ""
additional_instructions_notes: ${yaml(additionalNotes)}
demo_recommended: ${demoRecommended}
demo_recording: ${yaml(demoRecording)}
contact_name: ${yaml(contactName)}
contact_email: ${yaml(contactEmail)}
source_issue: ${yaml(sourceIssue)}
last_reviewed: ${yaml(submittedAt)}
---

# ${title}

## Use case and purpose

${useCase || "Not provided."}

## Prompt text

\`\`\`\`text
${promptText}
\`\`\`\`

## Required inputs

${inputSection}

## Expected output and next steps

${expectedOutput || "Not provided."}

## Additional instructions and notes

${additionalNotes || "Not provided."}

## Demo

- Recommended: ${demoRecommended ? "Yes" : "No"}
- Recording: ${demoRecording || "Not provided."}

## Contact

- Name: ${contactName || "Not provided."}
- Email: ${contactEmail || "Not provided."}

## Source

${sourceIssue ? `[Original form submission](${sourceIssue})` : "Source issue not available."}
`;

  return { category, content, filePath, relativePath, title };
}

export function publishPromptRecords(issues) {
  const published = [];
  for (const issue of issues) {
    if (!issue || issue.pull_request || !issueIsPromptSubmission(issue)) continue;
    const record = buildPromptRecord(issue);
    fs.mkdirSync(path.dirname(record.filePath), { recursive: true });
    fs.writeFileSync(record.filePath, record.content);
    published.push(record);
  }
  return published;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const payloadPath = process.argv[2];
  if (!payloadPath) throw new Error("Pass a GitHub event payload or issue-list JSON file path.");
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
  const issues = Array.isArray(payload) ? payload : payload.issue ? [payload.issue] : [];
  const published = publishPromptRecords(issues);
  for (const record of published) console.log(`Published ${record.relativePath}`);
  console.log(`Published ${published.length} prompt record(s).`);
}
