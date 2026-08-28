const promptList = document.querySelector("#prompt-list");
const resultCount = document.querySelector("#result-count");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const demoSelect = document.querySelector("#demo");
const sortSelect = document.querySelector("#sort");
const clearFiltersButton = document.querySelector("#clear-filters");
const categoryFacets = document.querySelector("#category-facets");
const repositoryUrl = "https://github.com/michaelsheerin/oci-strategic-install-codex-repo";

let prompts = [];

function displayName(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function textFor(prompt) {
  return [
    prompt.title,
    prompt.description,
    prompt.category,
    ...(prompt.tags || []),
    prompt.useCase,
    prompt.promptText,
    ...(prompt.requiredInputs || []),
    prompt.expectedOutput,
    prompt.nextSteps,
    prompt.additionalInstructionsNotes,
    prompt.demoRecording,
    prompt.contactName,
    prompt.contactEmail,
  ].join(" ").toLowerCase();
}

function filterPrompts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const demo = demoSelect.value;
  const filtered = prompts.filter((prompt) => (!category || prompt.category === category)
    && (!demo || (demo === "recommended" ? prompt.demoRecommended : !prompt.demoRecommended))
    && (!search || textFor(prompt).includes(search)));

  return filtered.sort((left, right) => {
    if (sortSelect.value === "title-desc") return String(right.title).localeCompare(String(left.title));
    if (sortSelect.value === "newest") return String(right.lastReviewed || "").localeCompare(String(left.lastReviewed || ""));
    if (sortSelect.value === "oldest") return String(left.lastReviewed || "").localeCompare(String(right.lastReviewed || ""));
    return String(left.title).localeCompare(String(right.title));
  });
}

function renderCategoryFacets() {
  const categories = [...new Set(prompts.map((prompt) => prompt.category || "other"))].sort();
  categoryFacets.innerHTML = categories.map((category) => {
    const count = prompts.filter((prompt) => prompt.category === category).length;
    const active = categorySelect.value === category ? " is-active" : "";
    return `<button class="facet${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(displayName(category))} <span>${count}</span></button>`;
  }).join("");
}

function render() {
  const visible = filterPrompts();
  resultCount.textContent = prompts.length ? `${visible.length} of ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}` : "";
  renderCategoryFacets();

  if (!visible.length) {
    const hasFilters = searchInput.value || categorySelect.value || demoSelect.value;
    promptList.innerHTML = `<tr><td colspan="6"><div class="empty-state">${hasFilters ? "No prompts match the selected filters." : `The catalog is ready for its first prompt. <a href="${repositoryUrl}/issues/new?template=prompt-submission.yml">Submit a prompt</a> to get started.`}</div></td></tr>`;
    return;
  }

  promptList.innerHTML = visible.map((prompt) => {
    const promptUrl = `${repositoryUrl}/blob/main/${encodeURI(prompt.path)}`;
    const demo = prompt.demoRecommended ? "Recommended" : "Not recommended";
    const updated = prompt.lastReviewed || "Not provided";
    return `<tr><td data-label="Prompt"><a class="prompt-title" href="${promptUrl}">${escapeHtml(prompt.title)}</a></td><td data-label="Use case">${escapeHtml(prompt.description || "Not provided.")}</td><td data-label="Category"><span class="tag">${escapeHtml(displayName(prompt.category || "other"))}</span></td><td data-label="Demo">${demo}</td><td data-label="Updated">${escapeHtml(updated)}</td><td data-label="Open"><a class="table-link" href="${promptUrl}">Open</a></td></tr>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

fetch("catalog.json")
  .then((response) => {
    if (!response.ok) throw new Error("Catalog unavailable");
    return response.json();
  })
  .then((records) => {
    prompts = records;
    [...new Set(prompts.map((prompt) => prompt.category))].sort().forEach((category) => {
      categorySelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(displayName(category))}</option>`);
    });
    render();
  })
  .catch(() => {
    promptList.innerHTML = `<tr><td colspan="6"><div class="empty-state">The catalog could not load. Browse the <a href="${repositoryUrl}/tree/main/prompts">prompt records</a> directly.</div></td></tr>`;
  });

searchInput.addEventListener("input", render);
categorySelect.addEventListener("change", render);
demoSelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);
clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "";
  demoSelect.value = "";
  sortSelect.value = "title-asc";
  render();
});
categoryFacets.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  const category = button.dataset.category;
  categorySelect.value = categorySelect.value === category ? "" : category;
  render();
});
