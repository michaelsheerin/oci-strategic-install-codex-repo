# Codex C4PO MCP Server Setup

## Use case and purpose

NOT A PROMPT
Follow Confluence page instructions to access C4PO MCP Server to enable Codex to query direct APIs

## Required inputs

- See Confluence for prerequisites
- Note: Windows does not require brew installation
- When authenticating - authenticate with ocna-saml (yubikey)

## Expected output and next steps

Codex able to query Compute Admin MCP server

## Additional instructions and notes

Frequent 'timeout' issues, where sessions terminate after an hour and authentication refresh required. Often you will need to close Codex and/or open a new task and wait 2 minutes before querying the MCP server. Follow these instructions for continued use:

	A) If your current Compute Admin task already worked -- Stay in that same task and send the next request. No wait. No new task.
	
	B) If you need a new task in any project
		a. Click the pencil for a new project task.
		b. You will see a blank page like: What should we work?
		c. Start a two-minute timer now.
		d. Do not type, send a message, navigate away, or close Codex during those two minutes.
		e. After two minutes, send the Compute Admin request as the first message.
		
	C) If you closed Codex, or it is tomorrow
		a. Open PowerShell.
		b. Run:
		oci session refresh --profile "bmc_operator_access" --auth security_token
oci session validate --profile "bmc_operator_access" --auth security_token
		c. If validation succeeds, open Codex.
		d. Open your project.
		e. Click the pencil to open a new task.
		f. On the blank page, wait two minutes.
		g. Send the request.
	
	D) If validation fails
		a. Run:
		oci session authenticate --tenancy-name "bmc_operator_access" --profile-name "bmc_operator_access" --auth security_token --region us-phoenix-1
		b. Complete ocna-saml browser sign-in.
		c. Wait for PowerShell to return to its prompt.
		d. Fully close Codex.
		e. Reopen Codex.
		f. Open the project, click the pencil, wait two minutes, then send the request.

## Demo

- Recommended: No
- Recording: N/A

## Prompt text

```text
https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20005791874
```

## Contact

- Name: Michael Sheerin
- Email: michael.sheerin@oracle.com

## Source

Submitted directly from the Prompt Library.

## Record details

| Field | Value |
| --- | --- |
| Category | data-reporting |
| Demo recommended | No |
| Demo recording | N/A |
| Submitted | 2026-09-03 |

<!-- prompt-metadata
title: "Codex C4PO MCP Server Setup"
description: "NOT A PROMPT Follow Confluence page instructions to access C4PO MCP Server to enable Codex to query direct APIs"
category: "data-reporting"
tags: []
required_inputs: ["See Confluence for prerequisites","Note: Windows does not require brew installation","When authenticating - authenticate with ocna-saml (yubikey)"]
expected_output: "Codex able to query Compute Admin MCP server"
next_steps: ""
additional_instructions_notes: "Frequent 'timeout' issues, where sessions terminate after an hour and authentication refresh required. Often you will need to close Codex and/or open a new task and wait 2 minutes before querying the MCP server. Follow these instructions for continued use:\n\n\tA) If your current Compute Admin task already worked -- Stay in that same task and send the next request. No wait. No new task.\n\t\n\tB) If you need a new task in any project\n\t\ta. Click the pencil for a new project task.\n\t\tb. You will see a blank page like: What should we work?\n\t\tc. Start a two-minute timer now.\n\t\td. Do not type, send a message, navigate away, or close Codex during those two minutes.\n\t\te. After two minutes, send the Compute Admin request as the first message.\n\t\t\n\tC) If you closed Codex, or it is tomorrow\n\t\ta. Open PowerShell.\n\t\tb. Run:\n\t\toci session refresh --profile \"bmc_operator_access\" --auth security_token\noci session validate --profile \"bmc_operator_access\" --auth security_token\n\t\tc. If validation succeeds, open Codex.\n\t\td. Open your project.\n\t\te. Click the pencil to open a new task.\n\t\tf. On the blank page, wait two minutes.\n\t\tg. Send the request.\n\t\n\tD) If validation fails\n\t\ta. Run:\n\t\toci session authenticate --tenancy-name \"bmc_operator_access\" --profile-name \"bmc_operator_access\" --auth security_token --region us-phoenix-1\n\t\tb. Complete ocna-saml browser sign-in.\n\t\tc. Wait for PowerShell to return to its prompt.\n\t\td. Fully close Codex.\n\t\te. Reopen Codex.\n\t\tf. Open the project, click the pencil, wait two minutes, then send the request."
demo_recommended: false
demo_recording: "N/A"
contact_name: "Michael Sheerin"
contact_email: "michael.sheerin@oracle.com"
source_issue: ""
last_reviewed: "2026-09-03"
-->
