let app;
const repositoryUrl = "https://github.com/michaelsheerin/oci-strategic-install-codex-repo";
const rawRepositoryUrl = "https://raw.githubusercontent.com/michaelsheerin/oci-strategic-install-codex-repo/main";
const publishingServiceUrl = "https://oci-strategic-install-prompt-library.msheerin01.workers.dev";
const categories = ["analysis", "customer-preparation", "data-reporting", "project-management", "research", "technical-work", "writing-communication", "other"];
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

function library() {
  const activeCategories = [...new Set(prompts.map((record) => record.category || "other"))].sort();
  const options = activeCategories.map((value) => '<option value="' + value + '">' + name(value) + '</option>').join("");
  app.innerHTML = page("Prompt catalog", "Browse the library", "Search every prompt record from one place, then open or edit the record that fits your work.", '<section class="library-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Search and filter</p><h2>Prompt records</h2></div><p id="result-count" class="result-count"></p></div><p class="filter-description">Search includes titles, categories, use cases, prompt text, required inputs, expected output, notes, tags, and contact details.</p><div class="filters"><label><span>Search</span><input id="search" type="search" placeholder="Search the full prompt library"></label><label><span>Category</span><select id="category"><option value="">All categories</option>' + options + '</select></label><label><span>Demo</span><select id="demo"><option value="">Any demo status</option><option value="recommended">Demo recommended</option><option value="not-recommended">No demo recommended</option></select></label><label><span>Sort</span><select id="sort"><option value="title">Title, A to Z</option><option value="newest">Newest first</option></select></label><button id="clear-filters" class="button button-secondary clear-filters">Clear filters</button></div><div id="category-facets" class="category-facets"></div><div class="table-wrap"><table class="prompt-table"><thead><tr><th>Prompt</th><th>Use case</th><th>Category</th><th>Demo</th><th>Updated</th><th><span class="sr-only">Open</span></th></tr></thead><tbody id="prompt-list"></tbody></table></div></div></section>');

  const search = document.querySelector("#search");
  const category = document.querySelector("#category");
  const demo = document.querySelector("#demo");
  const sort = document.querySelector("#sort");
  const count = document.querySelector("#result-count");
  const list = document.querySelector("#prompt-list");
  const facets = document.querySelector("#category-facets");
  const update = () => {
    const visible = prompts.filter((record) => (!category.value || record.category === category.value) && (!demo.value || (demo.value === "recommended" ? record.demoRecommended : !record.demoRecommended)) && (!search.value || fullText(record).includes(search.value.toLowerCase()))).sort((left, right) => sort.value === "newest" ? String(right.lastReviewed || "").localeCompare(String(left.lastReviewed || "")) : String(left.title).localeCompare(String(right.title)));
    count.textContent = visible.length + " of " + prompts.length + " prompts";
    facets.innerHTML = activeCategories.map((value) => '<button class="facet' + (category.value === value ? " is-active" : "") + '" data-category="' + value + '">' + name(value) + " <span>" + prompts.filter((record) => record.category === value).length + "</span></button>").join("");
    list.innerHTML = visible.length ? visible.map((record) => '<tr><td><a class="prompt-title" href="' + href("prompt", { prompt: record.path }) + '">' + escapeHtml(record.title) + '</a></td><td>' + escapeHtml(record.description || "Not provided.") + '</td><td><span class="tag">' + name(record.category) + '</span></td><td>' + (record.demoRecommended ? "Recommended" : "Not recommended") + '</td><td>' + escapeHtml(record.lastReviewed || "Not provided") + '</td><td><a class="table-link" href="' + href("prompt", { prompt: record.path }) + '">Open</a></td></tr>').join("") : '<tr><td colspan="6"><div class="empty-state">No prompts match the selected filters.</div></td></tr>';
  };
  [search, category, demo, sort].forEach((element) => element.addEventListener(element === search ? "input" : "change", update));
  document.querySelector("#clear-filters").addEventListener("click", () => { search.value = ""; category.value = ""; demo.value = ""; sort.value = "title"; update(); });
  facets.addEventListener("click", (event) => { const button = event.target.closest("button[data-category]"); if (button) { category.value = category.value === button.dataset.category ? "" : button.dataset.category; update(); } });
  update();
}

function prompt(record) {
  const requiredInputValues = record.requiredInputs || [];
  const inputs = requiredInputValues.length && requiredInputValues.every((value) => !cleanText(value).includes("|") && !cleanText(value).includes("\n")) ? "<ul>" + requiredInputValues.map((value) => "<li>" + escapeHtml(cleanText(value)) + "</li>").join("") + "</ul>" : formattedContent(requiredInputValues.join("\n"));
  const source = record.sourceIssue ? '<a href="' + escapeHtml(record.sourceIssue) + '" target="_blank" rel="noreferrer">Original form submission</a>' : "Not provided.";
  const recording = record.demoRecording ? '<a href="' + escapeHtml(record.demoRecording) + '" target="_blank" rel="noreferrer">Open recording</a>' : "Not provided.";
  const section = (heading, content) => "<section><h2>" + heading + "</h2>" + content + "</section>";
  const paragraph = (value) => formattedContent(value);
  const details = '<div class="detail-table"><table><tbody><tr><th>Category</th><td>' + name(record.category) + '</td></tr><tr><th>Last updated</th><td>' + escapeHtml(record.lastReviewed || "Not provided") + '</td></tr><tr><th>Record path</th><td><code>' + escapeHtml(record.path) + "</code></td></tr></tbody></table></div>";
  app.innerHTML = page("Prompt record", escapeHtml(record.title), escapeHtml(record.description || "Reusable prompt record."), '<section class="container record-layout"><div class="record-actions"><a class="button button-secondary" href="' + href("library") + '">Back to library</a><a class="button" href="' + publisherHref("edit", { prompt: record.path }) + '">Edit this prompt</a></div><article class="record-content">' + section("Use case and purpose", paragraph(record.useCase || record.description)) + section("Required inputs", inputs) + section("Expected output and next steps", paragraph([record.expectedOutput, record.nextSteps].filter(Boolean).join("\n\n"))) + section("Additional instructions and notes", paragraph(record.additionalInstructionsNotes)) + section("Demo", '<dl class="definition-list"><div><dt>Recommended</dt><dd>' + (record.demoRecommended ? "Yes" : "No") + "</dd></div><div><dt>Recording</dt><dd>" + recording + "</dd></div></dl>") + section("Prompt text", "<pre><code>" + escapeHtml(record.promptText || "No prompt text provided.") + "</code></pre>") + section("Contact", '<dl class="definition-list"><div><dt>Name</dt><dd>' + escapeHtml(record.contactName || "Not provided.") + "</dd></div><div><dt>Email</dt><dd>" + escapeHtml(record.contactEmail || "Not provided.") + "</dd></div></dl>") + section("Source", "<p>" + source + "</p>") + section("Record details", details) + "</article></section>");
}

function input(label, key, value, rows, hint) {
  const control = rows ? '<textarea id="' + key + '" name="' + key + '" rows="' + rows + '">' + escapeHtml(value || "") + "</textarea>" : '<input id="' + key + '" name="' + key + '" value="' + escapeHtml(value || "") + '">';
  return '<label class="form-field" for="' + key + '"><span>' + label + "</span>" + control + (hint ? "<small>" + hint + "</small>" : "") + "</label>";
}

function form(record) {
  const editing = Boolean(record);
  const categoryOptions = categories.map((value) => '<option value="' + value + '"' + (record?.category === value ? " selected" : "") + ">" + name(value) + "</option>").join("");
  app.innerHTML = page(editing ? "Prompt editor" : "Contribute", editing ? "Edit a prompt record" : "Submit a prompt", editing ? "Update this record directly. The library publishes the new version automatically." : "Every field is optional. Sign in with GitHub once, then publish directly to the library.", '<section class="container form-layout"><article class="form-intro"><h2>' + (editing ? "Update process" : "Sharing standard") + '</h2><p>Remove customer data, credentials, personal data, internal identifiers, and non-public source material. Use placeholders for variable information.</p><a class="text-link-dark" href="' + href("contribute") + '">Read the contribution guide</a></article><form id="prompt-form" class="prompt-form" data-path="' + escapeHtml(record?.path || "") + '">' + input("Title", "title", record?.title, 0, "Use a short, action-oriented name.") + '<label class="form-field"><span>Category</span><select name="category"><option value="">Select a category</option>' + categoryOptions + "</select></label>" + input("Use case and purpose", "useCase", record?.useCase, 5) + input("Required inputs", "requiredInputs", (record?.requiredInputs || []).map((value) => "- " + value).join("\n"), 5, "List one input per line.") + input("Expected output and next steps", "expectedOutput", [record?.expectedOutput, record?.nextSteps].filter(Boolean).join("\n\n"), 5) + input("Additional instructions and notes", "additionalNotes", record?.additionalInstructionsNotes, 5) + '<label class="form-field"><span>Is a demo recommended?</span><select name="demoRecommended"><option value="">Select an option</option><option value="No"' + (record && !record.demoRecommended ? " selected" : "") + '>No</option><option value="Yes"' + (record?.demoRecommended ? " selected" : "") + ">Yes</option></select></label>" + input("Demo recording", "demoRecording", record?.demoRecording, 0) + input("Prompt text", "promptText", record?.promptText, 14) + input("Your name", "contactName", record?.contactName, 0) + input("Your work email", "contactEmail", record?.contactEmail, 0) + '<div class="form-actions"><button class="button" type="submit">' + (editing ? "Save prompt update" : "Publish prompt") + '</button><a class="button button-secondary" href="' + (editing ? href("prompt", { prompt: record.path }) : href("library")) + '">Cancel</a></div><p id="submission-status" class="submission-status"></p></form></section>');
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
      if (response.status === 401 && result.signInUrl) {
        window.location.assign(result.signInUrl);
        return;
      }
      if (!response.ok) throw new Error(result.error || "The prompt was not published.");
      const source = repositoryUrl + "/blob/main/" + result.path;
      status.innerHTML = 'Published. The catalog refresh will add it to Browse Prompts shortly. <a href="' + source + '" target="_blank" rel="noreferrer">View the prompt record</a>.';
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
  else if (view === "readme") documentPage("README.md", "Repository overview", "About the library", "Purpose, structure, and operating model for the Strategic Install Codex Prompt Library.");
  else if (view === "contribute") documentPage("CONTRIBUTING.md", "Contribution guide", "Share a useful workflow", "Guidance for adding safe, reusable, and well-documented prompt records.");
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
  fetch("catalog.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog unavailable"))).then((records) => { prompts = records; render(); }).catch(() => { app.innerHTML = page("Prompt library", "Catalog unavailable", "The prompt records did not load.", '<section class="container fallback"><a class="button" href="' + repositoryUrl + '/tree/main/prompts">Browse prompt records in GitHub</a></section>'); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
window.addEventListener("popstate", () => { if (app) render(); });
