# Contributing a Codex prompt

## Preferred submission method

Use the [prompt submission form](../../issues/new?template=prompt-submission.yml). It collects every required field without requiring contributors to create files or open pull requests.

A maintainer will review the submission, confirm it is safe to share, and convert approved content into a versioned prompt record in `prompts/`.

## Direct pull request option

Experienced contributors can copy [prompts/_template.md](prompts/_template.md), save it as `prompts/<category>/<short-descriptive-name>.md`, and open a pull request. Do not edit the catalog manually. The publishing workflow builds it from prompt metadata.

## Submission requirements

Provide clear, complete content for each field below.

| Field | What to include |
| --- | --- |
| Title | A short, action-oriented name |
| Use case and purpose | When to use the prompt, the problem it solves, and any limits |
| Prompt text | The complete, reusable prompt, with placeholders for variable values |
| Required inputs | Each input a user needs before running the prompt. Write `None` when no input is required. |
| Expected output and next steps | What Codex should produce, how to check it, and what follows |
| Demo recommendation | Select `Yes` when a recording would materially improve adoption |
| Demo recording | A durable internal link, if one exists |
| Contact | Your name and work email for questions or improvement requests |

## Content standards

- Use placeholders such as `[customer name]`, `[file path]`, and `[reporting period]`.
- State assumptions, constraints, and required review steps.
- Write prompts that another RA can run without a separate briefing.
- Link to approved internal documentation when context is necessary.
- Test the prompt before submission.

## Do not submit

- Customer data, credentials, tokens, passwords, or private URLs.
- Personal data beyond the contributor contact information requested by the form.
- Unapproved proprietary content or source material.
- Prompts whose use depends on unstated access, background knowledge, or manual cleanup.

## Review process

1. A contributor submits the form or a pull request.
2. A maintainer checks completeness, safety, clarity, and repeatability.
3. Approved prompts receive a category, tags, and a published record.
4. The catalog updates automatically after the record merges into `main`.

## Updating an existing prompt

Open an issue or pull request that links the existing record. Explain what changed, why it changed, and how you tested the revised prompt. Keep the original file when practical so its history stays intact.
