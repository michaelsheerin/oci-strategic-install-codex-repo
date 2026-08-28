const promptList = document.querySelector("#prompt-list");
const resultCount = document.querySelector("#result-count");
const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const repositoryUrl = "https://github.com/michaelsheerin/oci-strategic-install-codex-repo";

let prompts = [];

function displayName(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function filterPrompts() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  return prompts.filter((prompt) => {
    const searchable = [prompt.title, prompt.description, prompt.category, ...(prompt.tags || [])].join(" ").toLowerCase();
    return (!category || prompt.category === category) && (!search || searchable.includes(search));
  });
}

function render() {
  const visible = filterPrompts();
  resultCount.textContent = prompts.length ? `${visible.length} of ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}` : "";

  if (!visible.length) {
    const hasFilters = searchInput.value || categorySelect.value;
    promptList.innerHTML = `<div class="empty-state">${hasFilters ? "No prompts match the selected filters." : `The catalog is ready for its first prompt. <a href="${repositoryUrl}/issues/new?template=prompt-submission.yml">Submit a prompt</a> to get started.`}</div>`;
    return;
  }

  promptList.innerHTML = visible.map((prompt) => {
    const tags = [displayName(prompt.category), ...(prompt.tags || [])].map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const promptUrl = `${repositoryUrl}/blob/main/${encodeURI(prompt.path)}`;
    return `<article class="prompt-card"><div><h3><a href="${promptUrl}">${escapeHtml(prompt.title)}</a></h3><p class="prompt-description">${escapeHtml(prompt.description)}</p><div class="prompt-meta">${tags}</div></div><a class="button" href="${promptUrl}">Open prompt</a></article>`;
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
    promptList.innerHTML = `<div class="empty-state">The catalog could not load. Browse the <a href="${repositoryUrl}/tree/main/prompts">prompt records</a> directly.</div>`;
  });

searchInput.addEventListener("input", render);
categorySelect.addEventListener("change", render);
