let app;
const repositoryUrl = "https://github.com/michaelsheerin/oci-strategic-install-codex-repo";
const rawRepositoryUrl = "https://raw.githubusercontent.com/michaelsheerin/oci-strategic-install-codex-repo/main";
const publicLibraryUrl = "https://michaelsheerin.github.io/oci-strategic-install-codex-repo/?view=library";
const publishingServiceUrl = "https://oci-strategic-install-prompt-library.msheerin01.workers.dev";
const categories = ["analysis", "customer-preparation", "data-reporting", "project-management", "research", "technical-work", "writing-communication", "other"];
const submissionDraftKey = "strategic-install-prompt-library-submission-draft";
let prompts = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function cleanText(value) {
  const source = String(value ?? "");
  if (!/<\s*\/?(?:html|head|body|div|meta|table|tr|td|th|p|br)\b/i.test(source)) return source;
  const placeholders = [];
  const protectedSource = source.replace(/<([A-Z][A-Z0-9_-]*)>/g, (_, token) => "__PROMPT_PLACEHOLDER_" + (placeholders.push(token) - 1) + "__");
  const documentFragment = new DOMParser().parseFromString(protectedSource, "text/html");
  return documentFragment.body.textContent.replace(/__PROMPT_PLACEHOLDER_(\d+)__/g, (_, index) => "<" + placeholders[Number(index)] + ">").replace(/\u00a0/g, " ").trim();
}

function demoRecordingUrl(value) {
  const recording = cleanText(value).trim();
  const placeholder = new Set(["", "_no response_", "no response", "n/a", "na", "none", "not provided"]);
  if (placeholder.has(recording.toLowerCase())) return "";
  try {
    const url = new URL(recording);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function demoRecordingLink(value) {
  const recording = demoRecordingUrl(value);
  return recording ? '<a href="' + escapeHtml(recording) + '" target="_blank" rel="noreferrer">Open recording</a>' : "No recording.";
}

function formattedContent(value) {
  const lines = cleanText(value || "Not provided.").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  const addParagraph = (paragraphLines) => {
    if (paragraphLines.length) blocks.push("<p>" + escapeHtml(paragraphLines.join("\n")).replaceAll("\n", "<br>") + "</p>");
  };
  let paragraphLines = [];
  for (let index = 0; index < lines.length; index += 1) {
    const isTable = lines[index].includes("|") && index + 1 < lines.length && /^[\s|:-]+$/.test(lines[index + 1]);
    if (!isTable) {
      paragraphLines.push(lines[index]);
      continue;
    }
    addParagraph(paragraphLines);
    paragraphLines = [];
    const cells = (line) => line.split("|").map((cell) => cell.trim()).filter(Boolean);
    const headers = cells(lines[index]);
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].includes("|")) {
      rows.push(cells(lines[index]));
      index += 1;
    }
    index -= 1;
    blocks.push('<div class="rich-table"><table><thead><tr>' + headers.map((cell) => "<th>" + escapeHtml(cell) + "</th>").join("") + "</tr></thead><tbody>" + rows.map((row) => "<tr>" + headers.map((_, cellIndex) => "<td>" + escapeHtml(row[cellIndex] || "") + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>");
  }
  addParagraph(paragraphLines);
  return blocks.join("");
}

function name(value) {
  return String(value || "other").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function href(view, values = {}) {
  return "?" + new URLSearchParams({ view, ...values }).toString();
}

function publisherHref(view, values = {}) {
  return window.location.origin === publishingServiceUrl ? href(view, values) : publishingServiceUrl + href(view, values);
}

function readSubmissionDraft() {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(submissionDraftKey) || "null");
    return draft && typeof draft === "object" ? draft : null;
  } catch {
    return null;
  }
}

function saveSubmissionDraft(draft) {
  try {
    window.sessionStorage.setItem(submissionDraftKey, JSON.stringify(draft));
  } catch {}
}

function clearSubmissionDraft() {
  try {
    window.sessionStorage.removeItem(submissionDraftKey);
  } catch {}
}

function publishedRecordPath(value) {
  const path = String(value || "");
  return /^prompts\/[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(path) ? path : "";
}

function submissionNotice() {
  const query = new URLSearchParams(window.location.search);
  const status = query.get("submission");
  if (status !== "created" && status !== "updated") return "";
  const path = publishedRecordPath(query.get("record"));
  const recordLink = path ? '<a href="' + escapeHtml(repositoryUrl + "/blob/main/" + path.split("/").map(encodeURIComponent).join("/")) + '" target="_blank" rel="noreferrer">Open the Markdown record</a>' : "";
  const action = status === "created" ? "saved" : "updated";
  return '<section class="container submission-notice" role="status"><div><strong>Prompt record ' + action + '.</strong><span>The catalog refresh is in progress. The record will appear in this library after deployment.</span></div>' + recordLink + "</section>";
}

function libraryRedirect(result) {
  const redirect = new URL(publicLibraryUrl);
  redirect.searchParams.set("submission", result.updated ? "updated" : "created");
  const path = publishedRecordPath(result.path);
  if (path) redirect.searchParams.set("record", path);
  return redirect.toString();
}

function creatorKey(record) {
  return [cleanText(record.contactName).trim(), cleanText(record.contactEmail).trim()].filter(Boolean).join(" | ");
}

function displayDate(value) {
  const dateValue = cleanText(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue || "Not provided";
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.opacity = "0";
  document.body.append(fallback);
  fallback.select();
  const copied = document.execCommand("copy");
  fallback.remove();
  if (!copied) throw new Error("Clipboard access was unavailable.");
}

function fullText(record) {
  return [record.title, record.description, record.category, ...(record.tags || []), record.useCase, record.promptText, ...(record.requiredInputs || []), record.expectedOutput, record.nextSteps, record.additionalInstructionsNotes, record.contactName, record.contactEmail].join(" ").toLowerCase();
}

function page(kicker, title, lead, content) {
  return '<section class="page-hero"><div class="container page-hero-inner"><p class="eyebrow">' + kicker + '</p><h1>' + title + '</h1><p class="lead">' + lead + '</p></div></section>' + content;
}

function home() {
  const count = prompts.length;
  app.innerHTML = '<section class="hero"><div class="container hero-content"><p class="eyebrow">Knowledge that compounds</p><h1>Reusable Codex prompts for RA work.</h1><p class="lead">A shared workspace for finding proven workflows, understanding their context, and contributing prompts that improve Strategic Install delivery.</p><div class="hero-actions"><a class="button" href="' + href("library") + '">Browse ' + count + ' prompts</a><a class="text-link" href="' + publisherHref("submit") + '">Submit a prompt</a></div></div></section><section class="container purpose-grid"><article><p class="number">01</p><h2>Find</h2><p>Search every record by category, use case, prompt text, inputs, output, notes, or contact details.</p></article><article><p class="number">02</p><h2>Run</h2><p>Open the record, confirm context and inputs, then use sanitized information.</p></article><article><p class="number">03</p><h2>Improve</h2><p>Submit a workflow or edit an existing record so team knowledge stays current.</p></article></section><section class="container action-grid"><a class="action-card" href="' + href("library") + '"><span>Prompt library</span><strong>Browse and filter records</strong><small>' + count + ' published prompts</small></a><a class="action-card" href="' + href("readme") + '"><span>Repository overview</span><strong>Read the purpose and operating model</strong><small>Everything needed to get started</small></a><a class="action-card" href="' + href("contribute") + '"><span>Contribution guide</span><strong>Understand the sharing standard</strong><small>Clear, reusable, safe records</small></a></section>';
}

function about() {
  const count = prompts.length;
  const browseLink = href("library");
  const submitLink = publisherHref("submit");
  const contributeLink = href("contribute");
  const repositoryLink = repositoryUrl;
  app.innerHTML = page("About", "Strategic Install Codex Prompt Library", "A shared place for RAs to find, reuse, and improve Codex workflows for Strategic Install work.", '<section class="container about-layout"><section class="about-introduction"><div><h2>Purpose</h2><p>Useful prompt workflows often stay with one person. This library turns those workflows into shared records with the context, inputs, expected output, and contact details needed for reuse.</p><p>Each record has a Markdown source file in GitHub and a searchable entry in the prompt library.</p></div><aside class="about-summary"><span>Current library</span><strong>' + count + '</strong><small>published prompt' + (count === 1 ? "" : "s") + '</small></aside></section><section class="about-section"><div class="section-heading"><div><p class="eyebrow">Start here</p><h2>Library links</h2></div></div><div class="about-action-grid"><a class="about-action-card" href="' + browseLink + '"><span>Browse prompts</span><strong>Search the library</strong><small>Filter by category, creator, and prompt content.</small></a><a class="about-action-card" href="' + submitLink + '"><span>Submit a prompt</span><strong>Share a workflow</strong><small>Add a prompt record directly from the web form.</small></a><a class="about-action-card" href="' + contributeLink + '"><span>Contribution guide</span><strong>Follow the sharing standard</strong><small>Review the record format and content rules.</small></a><a class="about-action-card" href="' + repositoryLink + '" target="_blank" rel="noreferrer"><span>GitHub repository</span><strong>Open the Markdown records</strong><small>View source files, revision history, and repository documentation.</small></a></div></section><section class="about-info-grid"><article class="about-section about-workflow"><p class="eyebrow">How the library works</p><h2>From workflow to shared record</h2><ol><li><span>1</span><div><strong>Find</strong><p>Search records by title, category, use case, inputs, output, notes, or creator.</p></div></li><li><span>2</span><div><strong>Run</strong><p>Review context and required inputs. Replace placeholders with sanitized information.</p></div></li><li><span>3</span><div><strong>Improve</strong><p>Submit a new workflow or edit an existing record when a better approach emerges.</p></div></li></ol></article><article class="about-section about-safety"><p class="eyebrow">Sharing standard</p><h2>Keep records safe and reusable</h2><p>Use placeholders for variable information. Remove customer data, credentials, personal data, internal identifiers, and non-public source material.</p><a class="text-link-dark" href="' + contributeLink + '">Read the contribution guide</a></article></section><section class="about-section"><p class="eyebrow">Repository structure</p><h2>Where information lives</h2><div class="about-table"><table><thead><tr><th>Location</th><th>Purpose</th><th>Use this for</th></tr></thead><tbody><tr><td><a href="' + browseLink + '">Browse Prompts</a></td><td>Searchable web library</td><td>Finding records and opening prompt details.</td></tr><tr><td><a href="' + submitLink + '">Submit a Prompt</a></td><td>Direct record publishing</td><td>Adding a new prompt record without editing repository files.</td></tr><tr><td><a href="' + contributeLink + '">Contribution Guide</a></td><td>Record standards</td><td>Preparing a clear, safe, reusable submission.</td></tr><tr><td><a href="' + repositoryLink + '" target="_blank" rel="noreferrer">GitHub Markdown repository</a></td><td>Source of record history</td><td>Viewing Markdown files, source templates, and revision history.</td></tr></tbody></table></div></section></section>');
}

function contributionGuide() {
  const submitLink = publisherHref("submit");
  const templateLink = repositoryUrl + "/blob/main/prompts/_template.md";
  const repositoryPromptsLink = repositoryUrl + "/tree/main/prompts";
  app.innerHTML = page("Contribution guide", "Share a useful Codex workflow", "Use this guide to prepare a clear, safe prompt record that another RA can understand and reuse.", '<section class="container guide-layout"><section class="guide-introduction"><div><p class="eyebrow">Preferred path</p><h2>Publish through the web form</h2><p>Complete the optional fields, sign in with GitHub, and publish the prompt record. The library updates after the deployment finishes. No Issue or manual approval step follows.</p><div class="guide-actions"><a class="button" href="' + submitLink + '">Submit a prompt</a><a class="button button-secondary" href="' + href("library") + '">Browse prompts</a></div></div><aside class="guide-note"><h3>Before you submit</h3><p>Remove customer data, credentials, personal data, internal identifiers, and non-public source material. Use placeholders for variable information.</p></aside></section><section class="guide-section"><p class="eyebrow">Record requirements</p><h2>What to include</h2><p class="guide-lead">Every form field is optional. Complete the fields that give another RA enough context to run and assess the workflow.</p><div class="guide-table"><table><thead><tr><th>Field</th><th>What to provide</th></tr></thead><tbody><tr><td>Title</td><td>A short, action-oriented name.</td></tr><tr><td>Use case and purpose</td><td>When to use the prompt, the problem addressed, and known limits.</td></tr><tr><td>Prompt text</td><td>The complete reusable prompt with placeholders for variable values.</td></tr><tr><td>Required inputs</td><td>Information, files, or links needed before running the prompt. State <code>None</code> when no input is required.</td></tr><tr><td>Expected output and next steps</td><td>What Codex should produce, how to check the result, and the work that follows.</td></tr><tr><td>Additional instructions and notes</td><td>Constraints, references, edge cases, setup details, or validation notes.</td></tr><tr><td>Demo recommendation and recording</td><td>Select Yes when a recording improves adoption. Add a durable recording link when available.</td></tr><tr><td>Contact</td><td>Your name and work email for questions and improvement requests.</td></tr></tbody></table></div></section><section class="guide-info-grid"><article class="guide-section"><p class="eyebrow">Content standard</p><h2>Write for reuse</h2><ul class="guide-checklist"><li>Use placeholders such as <code>[customer name]</code>, <code>[file path]</code>, and <code>[reporting period]</code>.</li><li>State assumptions, constraints, and required validation steps.</li><li>Write enough context for another RA to run the prompt without a separate briefing.</li><li>Link relevant internal documentation when outside context is required.</li><li>Test the prompt before submission.</li></ul></article><article class="guide-section guide-restricted"><p class="eyebrow">Do not submit</p><h2>Keep sensitive content out</h2><ul class="guide-checklist"><li>Customer data, credentials, tokens, passwords, or private URLs.</li><li>Personal data beyond the contributor contact information requested by the form.</li><li>Proprietary content or source material.</li><li>Prompts that depend on unstated access, background knowledge, or manual cleanup.</li></ul></article></section><section class="guide-section"><p class="eyebrow">Publishing flow</p><h2>What happens after submission</h2><ol class="guide-flow"><li><span>1</span><div><strong>Sign in and publish</strong><p>The contributor submits the prompt form through GitHub sign-in.</p></div></li><li><span>2</span><div><strong>Record creation</strong><p>The service creates or updates a Markdown file under the selected prompt category.</p></div></li><li><span>3</span><div><strong>Library update</strong><p>The prompt catalog rebuilds and the record appears in Browse Prompts after deployment.</p></div></li></ol></section><section class="guide-direct"><div><p class="eyebrow">Repository option</p><h2>Work directly in GitHub</h2><p>Experienced contributors can copy the standard Markdown template, save a file under <code>prompts/&lt;category&gt;/</code>, and open a pull request. The catalog build reads record metadata. Do not edit the catalog file by hand.</p></div><div class="guide-actions"><a class="button button-secondary" href="' + templateLink + '" target="_blank" rel="noreferrer">Open record template</a><a class="text-link-dark" href="' + repositoryPromptsLink + '" target="_blank" rel="noreferrer">Browse Markdown records</a></div></section><section class="guide-update"><h2>Update an existing prompt</h2><p>Open the record in Browse Prompts and select Edit this prompt. Explain the change, the reason, and the test performed. Keep the original file when practical so history stays intact.</p></section></section>');
}

function library() {
  const activeCategories = [...new Set(prompts.map((record) => record.category || "other"))].sort();
  const categoriesOptions = activeCategories.map((value) => '<option value="' + value + '">' + name(value) + '</option>').join("");
  const creators = [...new Set(prompts.map(creatorKey).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  const creatorOptions = creators.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join("");
  app.innerHTML = page("Prompt catalog", "Browse the library", "Search every prompt record from one place, then open the record that fits your work.", submissionNotice() + '<section class="library-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Search and filter</p><h2>Prompt records</h2></div><p id="result-count" class="result-count"></p></div><p class="filter-description">Search includes titles, categories, use cases, prompt text, required inputs, output, notes, and creator details.</p><div class="filters"><label><span>Search</span><input id="search" type="search" placeholder="Search the full prompt library"></label><label><span>Category</span><select id="category"><option value="">All categories</option>' + categoriesOptions + '</select></label><label><span>Creator</span><select id="creator"><option value="">All creators</option>' + creatorOptions + '</select></label><label><span>Sort</span><select id="sort"><option value="title">Title, A to Z</option><option value="newest" selected>Newest first</option></select></label><button id="clear-filters" class="button button-secondary clear-filters">Clear filters</button></div><div class="table-wrap"><table class="prompt-table prompt-overview"><thead><tr><th>Prompt</th><th>Category</th><th>Creator</th><th>Demo video</th><th>Updated</th><th><span class="sr-only">View details</span></th></tr></thead><tbody id="prompt-list"></tbody></table></div></div></section>');

  const search = document.querySelector("#search");
  const category = document.querySelector("#category");
  const creator = document.querySelector("#creator");
  const sort = document.querySelector("#sort");
  const count = document.querySelector("#result-count");
  const list = document.querySelector("#prompt-list");
  const update = () => {
    const visible = prompts.filter((record) => (!category.value || record.category === category.value) && (!creator.value || creatorKey(record) === creator.value) && (!search.value || fullText(record).includes(search.value.toLowerCase()))).sort((left, right) => sort.value === "newest" ? String(right.lastReviewed || "").localeCompare(String(left.lastReviewed || "")) : String(left.title).localeCompare(String(right.title)));
    count.textContent = visible.length + " of " + prompts.length + " prompts";
    list.innerHTML = visible.length ? visible.map((record) => {
      const recording = demoRecordingUrl(record.demoRecording);
      const contactName = cleanText(record.contactName).trim() || "Not provided";
      const contactEmail = cleanText(record.contactEmail).trim();
      const creatorCell = '<span class="creator-name">' + escapeHtml(contactName) + '</span>' + (contactEmail ? '<a class="creator-email" href="mailto:' + escapeHtml(contactEmail) + '">' + escapeHtml(contactEmail) + "</a>" : '<span class="creator-email">Not provided</span>');
      const demoCell = recording ? '<a class="demo-link" href="' + escapeHtml(recording) + '" target="_blank" rel="noreferrer">Watch demo</a>' : '<span class="no-recording">No recording</span>';
      return '<tr><td><a class="prompt-title" href="' + href("prompt", { prompt: record.path }) + '">' + escapeHtml(record.title) + '</a></td><td class="category-cell">' + escapeHtml(name(record.category)) + '</td><td class="creator-cell">' + creatorCell + '</td><td>' + demoCell + '</td><td class="updated-date">' + escapeHtml(displayDate(record.lastReviewed)) + '</td><td><a class="details-button" href="' + href("prompt", { prompt: record.path }) + '">View details</a></td></tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty-state">No prompts match the selected filters.</div></td></tr>';
  };
  [search, category, creator, sort].forEach((element) => element.addEventListener(element === search ? "input" : "change", update));
  document.querySelector("#clear-filters").addEventListener("click", () => { search.value = ""; category.value = ""; creator.value = ""; sort.value = "newest"; update(); });
  update();
}

function prompt(record) {
  const requiredInputValues = record.requiredInputs || [];
  const inputs = requiredInputValues.length && requiredInputValues.every((value) => !cleanText(value).includes("|") && !cleanText(value).includes("\n")) ? "<ul>" + requiredInputValues.map((value) => "<li>" + escapeHtml(cleanText(value)) + "</li>").join("") + "</ul>" : formattedContent(requiredInputValues.join("\n"));
  const source = record.sourceIssue ? '<a href="' + escapeHtml(record.sourceIssue) + '" target="_blank" rel="noreferrer">Original form submission</a>' : "Not provided.";
  const recording = demoRecordingLink(record.demoRecording);
  const markdownRecordUrl = repositoryUrl + "/blob/main/" + record.path.split("/").map(encodeURIComponent).join("/");
  const section = (heading, content) => "<section><h2>" + heading + "</h2>" + content + "</section>";
  const paragraph = (value) => formattedContent(value);
  const promptText = record.promptText || "";
  const promptSection = '<section><div class="prompt-heading"><h2>Prompt text</h2><button id="copy-prompt" class="button button-secondary button-small" type="button"' + (promptText ? "" : " disabled") + '>Copy prompt</button></div><p id="copy-prompt-status" class="copy-prompt-status" aria-live="polite"></p><pre><code>' + escapeHtml(promptText || "No prompt text provided.") + "</code></pre></section>";
  const details = '<div class="detail-table"><table><tbody><tr><th>Category</th><td>' + name(record.category) + '</td></tr><tr><th>Last updated</th><td>' + escapeHtml(record.lastReviewed || "Not provided") + '</td></tr><tr><th>Markdown record</th><td><a href="' + escapeHtml(markdownRecordUrl) + '" target="_blank" rel="noreferrer"><code>' + escapeHtml(record.path) + "</code></a></td></tr></tbody></table></div>";
  app.innerHTML = page("Prompt record", escapeHtml(record.title), escapeHtml(record.description || "Reusable prompt record."), '<section class="container record-layout"><div class="record-actions"><a class="button button-secondary" href="' + href("library") + '">Back to library</a><a class="button" href="' + publisherHref("edit", { prompt: record.path }) + '">Edit this prompt</a></div><article class="record-content">' + section("Use case and purpose", paragraph(record.useCase || record.description)) + section("Required inputs", inputs) + section("Expected output and next steps", paragraph([record.expectedOutput, record.nextSteps].filter(Boolean).join("\n\n"))) + section("Additional instructions and notes", paragraph(record.additionalInstructionsNotes)) + section("Demo", '<dl class="definition-list"><div><dt>Recommended</dt><dd>' + (record.demoRecommended ? "Yes" : "No") + "</dd></div><div><dt>Recording</dt><dd>" + recording + "</dd></div></dl>") + promptSection + section("Contact", '<dl class="definition-list"><div><dt>Name</dt><dd>' + escapeHtml(record.contactName || "Not provided.") + "</dd></div><div><dt>Email</dt><dd>" + escapeHtml(record.contactEmail || "Not provided.") + "</dd></div></dl>") + section("Source", "<p>" + source + "</p>") + section("Record details", details) + "</article></section>");
  const copyButton = document.querySelector("#copy-prompt");
  const copyStatus = document.querySelector("#copy-prompt-status");
  if (copyButton && promptText) {
    copyButton.addEventListener("click", async () => {
      try {
        await copyText(promptText);
        copyButton.textContent = "Copied";
        copyStatus.textContent = "Prompt copied to the clipboard.";
        window.setTimeout(() => { copyButton.textContent = "Copy prompt"; }, 1800);
      } catch {
        copyStatus.textContent = "Copy failed. Select the prompt text and copy it manually.";
      }
    });
  }
}

function input(label, key, value, rows, hint) {
  const control = rows ? '<textarea id="' + key + '" name="' + key + '" rows="' + rows + '">' + escapeHtml(value || "") + "</textarea>" : '<input id="' + key + '" name="' + key + '" value="' + escapeHtml(value || "") + '">';
  return '<label class="form-field" for="' + key + '"><span>' + label + "</span>" + control + (hint ? "<small>" + hint + "</small>" : "") + "</label>";
}

function form(record) {
  const editing = Boolean(record);
  const draft = editing ? null : readSubmissionDraft();
  const value = (key, fallback = "") => draft && Object.hasOwn(draft, key) ? draft[key] : fallback;
  const selectedCategory = value("category", record?.category || "");
  const demoRecommended = value("demoRecommended", record?.demoRecommended ? "Yes" : record ? "No" : "");
  const categoryOptions = categories.map((category) => '<option value="' + category + '"' + (selectedCategory === category ? " selected" : "") + ">" + name(category) + "</option>").join("");
  const draftMessage = draft ? "Your previous entry was restored after sign-in. Review the fields, then select Publish prompt." : "";
  app.innerHTML = page(editing ? "Prompt editor" : "Contribute", editing ? "Edit a prompt record" : "Submit a prompt", editing ? "Update this record directly. The library publishes the new version automatically." : "Every field is optional. Sign in with GitHub once, then publish directly to the library.", '<section class="container form-layout"><article class="form-intro"><h2>' + (editing ? "Update process" : "Sharing standard") + '</h2><p>Remove customer data, credentials, personal data, internal identifiers, and non-public source material. Use placeholders for variable information.</p><a class="text-link-dark" href="' + href("contribute") + '">Read the contribution guide</a></article><form id="prompt-form" class="prompt-form" data-path="' + escapeHtml(record?.path || "") + '">' + input("Title", "title", value("title", record?.title), 0, "Use a short, action-oriented name.") + '<label class="form-field"><span>Category</span><select name="category"><option value="">Select a category</option>' + categoryOptions + "</select></label>" + input("Use case and purpose", "useCase", value("useCase", record?.useCase), 5) + input("Required inputs", "requiredInputs", value("requiredInputs", (record?.requiredInputs || []).map((inputValue) => "- " + inputValue).join("\n")), 5, "List one input per line.") + input("Expected output and next steps", "expectedOutput", value("expectedOutput", [record?.expectedOutput, record?.nextSteps].filter(Boolean).join("\n\n")), 5) + input("Additional instructions and notes", "additionalNotes", value("additionalNotes", record?.additionalInstructionsNotes), 5) + '<label class="form-field"><span>Is a demo recommended?</span><select name="demoRecommended"><option value="">Select an option</option><option value="No"' + (demoRecommended === "No" ? " selected" : "") + '>No</option><option value="Yes"' + (demoRecommended === "Yes" ? " selected" : "") + ">Yes</option></select></label>" + input("Demo recording", "demoRecording", value("demoRecording", record?.demoRecording), 0) + input("Prompt text", "promptText", value("promptText", record?.promptText), 14) + input("Your name", "contactName", value("contactName", record?.contactName), 0) + input("Your work email", "contactEmail", value("contactEmail", record?.contactEmail), 0) + '<div class="form-actions"><button class="button" type="submit">' + (editing ? "Save prompt update" : "Publish prompt") + '</button><a id="cancel-prompt-form" class="button button-secondary" href="' + (editing ? href("prompt", { prompt: record.path }) : href("library")) + '">Cancel</a></div><p id="submission-status" class="submission-status" aria-live="polite">' + escapeHtml(draftMessage) + "</p></form></section>");
  if (draft) document.querySelector("#cancel-prompt-form").addEventListener("click", clearSubmissionDraft);
  document.querySelector("#prompt-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    data.existingPath = event.currentTarget.dataset.path;
    const status = document.querySelector("#submission-status");
    const button = event.currentTarget.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Publishing your prompt...";
    try {
      const response = await fetch("/api/prompt-submissions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        if (!editing) saveSubmissionDraft(data);
        status.textContent = "Sign-in is required. Your entry was saved in this browser and will be restored after sign-in.";
        const returnTo = window.location.pathname + window.location.search;
        window.location.assign("/auth/login?return_to=" + encodeURIComponent(returnTo));
        return;
      }
      if (!response.ok) throw new Error(result.error || "The prompt was not published.");
      if (!editing) clearSubmissionDraft();
      window.location.assign(libraryRedirect(result));
    } catch (error) {
      status.textContent = error.message || "The prompt was not published. Try again.";
      button.disabled = false;
    }
  });
}

function simpleMarkdown(text) {
  return escapeHtml(text).replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/^-\s+(.+)$/gm, "<li>$1</li>").replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
}

async function documentPage(filePath, kicker, title, lead) {
  app.innerHTML = page(kicker, title, lead, '<section class="container document-section"><article id="document-content" class="document-content"><p>Loading document...</p></article></section>');
  const target = document.querySelector("#document-content");
  try {
    const response = await fetch(rawRepositoryUrl + "/" + filePath);
    if (!response.ok) throw new Error("Document unavailable");
    target.innerHTML = "<p>" + simpleMarkdown(await response.text()) + "</p>";
  } catch {
    target.innerHTML = '<p>Open the <a href="' + repositoryUrl + "/blob/main/" + filePath + '">GitHub version</a>.</p>';
  }
}

function render() {
  const query = new URLSearchParams(window.location.search);
  const view = query.get("view") || "home";
  const record = prompts.find((item) => item.path === query.get("prompt"));
  if (view === "library") library();
  else if (view === "readme") about();
  else if (view === "contribute") contributionGuide();
  else if (view === "submit") form();
  else if (view === "prompt" && record) prompt(record);
  else if (view === "edit" && record) form(record);
  else if (view === "prompt" || view === "edit") app.innerHTML = page("Prompt library", "Record not found", "This record is unavailable or the link is out of date.", '<section class="container fallback"><a class="button" href="' + href("library") + '">Back to library</a></section>');
  else home();
}

function initialize() {
  app = document.querySelector("#app");
  if (!app) return;
  const query = new URLSearchParams(window.location.search);
  if ((query.get("view") === "submit" || query.get("view") === "edit") && window.location.origin !== publishingServiceUrl) {
    window.location.replace(publishingServiceUrl + window.location.search);
    return;
  }
  fetch("catalog.json", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog unavailable"))).then((records) => { prompts = records; render(); }).catch(() => { app.innerHTML = page("Prompt library", "Catalog unavailable", "The prompt records did not load.", '<section class="container fallback"><a class="button" href="' + repositoryUrl + '/tree/main/prompts">Browse prompt records in GitHub</a></section>'); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
window.addEventListener("popstate", () => { if (app) render(); });
