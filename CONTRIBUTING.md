# Contributing a Codex prompt

## Preferred submission method

Use the [Prompt Library submission page](https://oci-strategic-install-prompt-library.msheerin01.workers.dev/?view=submit). Sign in with GitHub, complete the optional fields, and publish the prompt record directly.

Every submission automatically creates a prompt record in [Browse prompts](https://michaelsheerin.github.io/oci-strategic-install-codex-repo/), with no review, Issue, or manual publishing step.

## Direct pull request option

Experienced contributors can copy [prompts/_template.md](prompts/_template.md), save it as `prompts/<category>/<short-descriptive-name>.md`, and open a pull request. Do not edit the catalog manually. The catalog build script reads prompt metadata.

## Submission requirements

Provide the details that help another RA understand and reuse the prompt. Every field is optional.

| Field | What to include |
| --- | --- |
| Title | A short, action-oriented name |
| Use case and purpose | When to use the prompt, the problem it solves, and any limits |
| Prompt text | The complete, reusable prompt, with placeholders for variable values |
| Required inputs | Each input a user needs before running the prompt. Write `None` when no input is required. |
| Expected output and next steps | What Codex should produce, how to check it, and what follows |
| Additional instructions and notes | Extra constraints, references, edge cases, or setup details |
| Contact | Your name and work email for questions or improvement requests |

## Content standards

- Use placeholders such as `[customer name]`, `[file path]`, and `[reporting period]`.
- State assumptions, constraints, and required validation steps.
- Write prompts that another RA can run without a separate briefing.
- Link to relevant internal documentation when context is necessary.
- Test the prompt before submission.
- Long-form fields preserve plain text and support Markdown headings, bullets, bold text, and links. Pasted web links render as clickable links.

## Do not submit

- Customer data, credentials, tokens, passwords, or private URLs.
- Personal data beyond the contributor contact information requested by the form.
- Proprietary content or source material.
- Prompts whose use depends on unstated access, background knowledge, or manual cleanup.

## Automatic sharing process

1. A contributor signs in with GitHub and submits the form.
2. The service creates or updates a Markdown record in `prompts/<category>/`.
3. The Browse prompts page regenerates automatically.
4. Contributors with repository write access can also add or improve Markdown records through pull requests.

## Updating an existing prompt

Open the record in Browse prompts and select **Edit this prompt**. Explain what changed, why it changed, and how you tested the revised prompt. Keep the original file when practical so its history stays intact.
