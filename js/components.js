// Template components. Each returns an HTML string.

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const money = (n) => `₱${Number(n).toLocaleString("en-PH")}`;
const firstName = (name) => name.split(" ")[0];

function icon(name, cls = "") {
  return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function avatar(person, size = 44, { verified = false } = {}) {
  const badge = verified ? `<span class="avatar-badge" title="ID verified">${icon("seal-check")}</span>` : "";
  return `<span class="avatar" style="--size:${size}px"><img src="${person.photo || workerPhoto(person)}" alt="" width="${size}" height="${size}" loading="lazy" />${badge}</span>`;
}

function verifiedBadge(worker) {
  return worker.idVerified
    ? `<span class="badge badge-verified">${icon("seal-check")}ID verified</span>`
    : `<span class="badge badge-pending">${icon("identification-card")}ID check pending</span>`;
}

// Verified ID, rating, jobs done. Same order and form everywhere a worker appears.
function trustLine(worker, { jobs = true } = {}) {
  const id = worker.idVerified
    ? `<span class="trust-item trust-verified">${icon("seal-check")}ID verified</span>`
    : `<span class="trust-item trust-pending">${icon("identification-card")}ID pending</span>`;
  const rating = `<span class="trust-item trust-rating">${icon("star-fill")}<b>${worker.rating.toFixed(1)}</b><span>(${worker.reviews})</span></span>`;
  const done = jobs ? `<span class="trust-item trust-jobs">${icon("check-circle")}${worker.jobs}<span>jobs</span></span>` : "";
  return `<div class="trust">${id}${rating}${done}</div>`;
}

function statRow(worker) {
  return `<div class="stat-row">
    <div class="stat"><b>${icon("star-fill")}${worker.rating.toFixed(1)}</b><span>${worker.reviews} reviews</span></div>
    <div class="stat"><b>${worker.jobs}</b><span>jobs done</span></div>
    <div class="stat ${worker.idVerified ? "stat-verified" : ""}"><b>${icon(worker.idVerified ? "seal-check" : "identification-card")}${worker.idVerified ? "Yes" : "Pending"}</b><span>ID verified</span></div>
  </div>`;
}

function price(worker) {
  return `<span class="price">${worker.from ? "From " : ""}${money(worker.rate)}<small> / ${esc(worker.unit)}</small></span>`;
}

function availability(worker) {
  return worker.available
    ? `<span class="availability is-today">Available today</span>`
    : `<span class="availability">Available tomorrow</span>`;
}

function saveButton(worker, saved, cls = "") {
  const label = saved ? `Remove ${worker.name} from saved` : `Save ${worker.name}`;
  return `<button class="icon-btn save ${cls} ${saved ? "is-on" : ""}" type="button" data-action="save" data-id="${worker.id}" aria-pressed="${saved}" aria-label="${esc(label)}">${icon(saved ? "heart-fill" : "heart")}</button>`;
}

function workerCard(worker, { saved = false, from } = {}) {
  const cat = categoryById(worker.category);
  const km = distanceKm(from, worker.area);
  const photos = worker.work.map((title, i) => `<img src="${workPhoto(worker, i)}" alt="${esc(title)}" loading="lazy" />`).join("");
  return `<article class="worker-card">
    <button class="worker-card-link" type="button" data-action="open-worker" data-id="${worker.id}"><span class="visually-hidden">View ${esc(worker.name)}</span></button>
    <div class="worker-card-head">
      ${avatar(worker, 48, { verified: worker.idVerified })}
      <div>
        <h3 class="worker-card-name">${esc(worker.name)}</h3>
        <p class="worker-card-sub">${esc(cat.trade)} in ${esc(worker.area)}, ${km} km</p>
      </div>
    </div>
    ${trustLine(worker)}
    <div class="worker-card-work">${photos}</div>
    <div class="worker-card-foot">${price(worker)}${availability(worker)}</div>
    ${saveButton(worker, saved)}
  </article>`;
}

function pageHeader(title, { sub = "", end = "" } = {}) {
  return `<header class="page-header"><div class="page-header-row"><h1>${esc(title)}</h1>${end}</div>${sub ? `<p>${esc(sub)}</p>` : ""}</header>`;
}

function navHeader({ title = "", back = "back", end = "" } = {}) {
  return `<header class="nav-header">
    <button class="icon-btn" type="button" data-action="${back}" aria-label="Back">${icon("arrow-left", "icon-lg")}</button>
    <div class="nav-header-title">${title}</div>
    ${end}
  </header>`;
}

function emptyState({ icon: name, title, text, action = "" }) {
  return `<div class="empty"><span class="empty-icon">${icon(name)}</span><h2>${esc(title)}</h2><p>${esc(text)}</p>${action}</div>`;
}

function row({ lead, title, meta = "", end = "", action, id = "", top = "" }) {
  const attrs = action ? `type="button" data-action="${action}" ${id ? `data-id="${id}"` : ""}` : "";
  const tag = action ? "button" : "div";
  return `<${tag} class="row" ${attrs}>${lead}<span class="row-body">${top || `<span class="row-title">${title}</span>`}${meta ? `<span class="row-meta">${meta}</span>` : ""}</span>${end}</${tag}>`;
}

function rowIcon(name) {
  return `<span class="row-icon">${icon(name)}</span>`;
}

function chevron() {
  return `<span class="row-end">${icon("caret-right")}</span>`;
}

function sheet(title, body) {
  return `<div class="sheet-backdrop" data-action="close-sheet">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="sheet-handle" aria-hidden="true"></div>
      <div class="sheet-head"><h2 id="sheet-title">${esc(title)}</h2><button class="icon-btn" type="button" data-action="close-sheet" aria-label="Close">${icon("x")}</button></div>
      ${body}
    </section>
  </div>`;
}
