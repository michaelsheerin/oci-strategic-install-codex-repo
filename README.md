# Strategic Install Codex Prompt Library

A shared library of proven Codex prompts for RAs supporting Strategic Install work.

The library turns effective individual workflows into reusable team assets. Each published prompt explains the business purpose, required inputs, expected result, follow-on actions, and the right person to contact. The goal is faster, more consistent work without losing the context required for sound judgment.

## Start here

- [Browse the prompt library](https://michaelsheerin.github.io/oci-strategic-install-codex-repo/)
- [Submit a prompt](../../issues/new?template=prompt-submission.yml)
- [Read the contribution guide](CONTRIBUTING.md)
- [Use the prompt record template](prompts/_template.md)

## How to use this repository

1. Search the library by use case, category, or tag.
2. Open the prompt record and confirm its required inputs fit your task.
3. Replace bracketed placeholders with approved, sanitized information.
4. Review the result, complete the listed next steps, and improve the record when you find a better approach.

## How the library is organized

Each approved prompt is a standalone Markdown file in `prompts/<category>/`. This keeps the content readable in GitHub, gives every prompt a permanent link, and preserves revision history.

The catalog and GitHub Pages site use the metadata in each prompt file to provide search and category filters. Submitters do not need to edit an index or understand the folder structure. The Pages site becomes available after the first successful workflow run.

| Location | Purpose |
| --- | --- |
| `.github/ISSUE_TEMPLATE/prompt-submission.yml` | Guided submission form for contributors |
| `prompts/` | Approved, versioned prompt records |
| `prompts/_template.md` | Standard record format for direct pull requests |
| `docs/` | Searchable GitHub Pages catalog |
| `scripts/` | Catalog generation and content validation |

## Publishing standard

Share prompts that are reusable, specific, and safe for colleagues to adopt. Before you submit, remove customer data, credentials, internal identifiers, personal information, and non-public content. Describe required inputs without pasting sensitive examples.

Every published record includes:

1. Title
2. Detailed use case and purpose
3. Prompt text
4. Required inputs
5. Expected output and next steps
6. Demo recommendation
7. Demo recording link, when available
8. Contributor name and email

See [CONTRIBUTING.md](CONTRIBUTING.md) for review standards and the submission process.
