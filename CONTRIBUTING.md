# Contributing a Codex prompt

## Preferred submission method

Use the [prompt submission form](https://github.com/michaelsheerin/oci-strategic-install-codex-repo/issues/new?template=prompt-submission.yml). It makes each field available without requiring contributors to create files or open pull requests.

GitHub uses an Issue only as the form transport. Every submission automatically creates a prompt record in [prompts/](prompts/README.md), with no review or manual publishing step. Browse the prompt library instead of the issue list.

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
| Demo recommendation | Select `Yes` when a recording would materially improve adoption |
| Demo recording | A durable internal link, if one exists |
| Contact | Your name and work email for questions or improvement requests |

## Content standards

- Use placeholders such as `[customer name]`, `[file path]`, and `[reporting period]`.
- State assumptions, constraints, and required validation steps.
- Write prompts that another RA can run without a separate briefing.
- Link to relevant internal documentation when context is necessary.
- Test the prompt before submission.

## Do not submit

- Customer data, credentials, tokens, passwords, or private URLs.
- Personal data beyond the contributor contact information requested by the form.
- Proprietary content or source material.
- Prompts whose use depends on unstated access, background knowledge, or manual cleanup.

## Automatic sharing process

1. A contributor submits the form or a pull request.
2. The automation creates or updates a Markdown record in `prompts/<category>/`.
3. The Browse prompts page regenerates with a linked category index.
4. Contributors with repository write access can add or improve Markdown records through pull requests.

## Updating an existing prompt

Open an issue or pull request that links the existing record. Explain what changed, why it changed, and how you tested the revised prompt. Keep the original file when practical so its history stays intact.
