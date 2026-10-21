// One function per screen. Screens only render content; the device wrapper and shell are in index.html.
const SCREENS = {};

function me() {
  return state.role === "worker" ? workerById(WORKER_SELF) : PEOPLE.mika;
}

function searchForm(placeholder = "Try “leaking sink” or “aircon”") {
  return `<form class="search" role="search" data-form="search">
    ${icon("magnifying-glass")}
    <input name="q" type="search" value="${esc(state.query)}" placeholder="${esc(placeholder)}" aria-label="Search pros and services" enterkeyhint="search" />
  </form>`;
}

function rankedWorkers({ category = "", query = "", filters = {} } = {}) {
  const q = query.toLowerCase();
  return WORKERS.filter((w) => {
    const cat = categoryById(w.category);
    if (category && w.category !== category) return false;
    if (filters.verified && !w.idVerified) return false;
    if (filters.today && !w.available) return false;
    if (filters.top && w.rating < 4.8) return false;
    if (q && !`${w.name} ${cat.label} ${cat.trade} ${w.area} ${w.about} ${w.work.join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
}

/* ---------- Home ---------- */
SCREENS.Home = () => {
  const top = rankedWorkers().slice(0, 2);
  return `
    <header class="home-header">
      <img class="home-mark" src="assets/sugobai-mark-96.webp" alt="SugoBai" width="36" height="36" />
      <button class="area-button" type="button" data-action="area" aria-label="Change area, currently ${esc(state.area)}">
        ${icon("map-pin")}<span>${esc(state.area)}, Cebu City</span>${icon("caret-down", "icon-sm")}
      </button>
    </header>
    <h1 class="home-title">What do you need done, ${esc(firstName(me().name))}?</h1>
    ${searchForm()}
    <nav class="category-grid" aria-label="Services">
      ${CATEGORIES.map((c) => `<button class="category" type="button" data-action="category" data-id="${c.id}">${icon(c.icon, "icon-lg")}<span>${c.label}</span></button>`).join("")}
    </nav>
    <section class="section">
      <div class="section-head"><h2>Top-rated near you</h2><button class="btn btn-ghost" type="button" data-action="all-pros">See all</button></div>
      ${top.map((w) => workerCard(w, { saved: state.saved.includes(w.id), from: state.area })).join("")}
    </section>`;
};

/* ---------- Pro list and search ---------- */
SCREENS.Pros = () => {
  const cat = categoryById(state.category);
  const list = rankedWorkers({ category: state.category, query: state.query, filters: state.filters });
  const title = state.query ? "Search" : cat ? cat.plural : "Pros near you";
  const chip = (key, label, iconName) => `<button class="chip" type="button" data-action="filter" data-id="${key}" aria-pressed="${state.filters[key]}">${iconName ? icon(iconName) : ""}${label}</button>`;
  const anyFilter = Object.values(state.filters).some(Boolean);
  const count = `${list.length} ${list.length === 1 ? "pro" : "pros"}${state.query ? ` for “${esc(state.query)}”` : ""} near ${esc(state.area)}`;
  return `
    ${navHeader({ title: esc(title) })}
    ${searchForm(cat ? `Search ${cat.plural.toLowerCase()}` : "Search pros and services")}
    <div class="chips pros-chips" role="group" aria-label="Filters">
      ${chip("verified", "ID verified", "seal-check")}${chip("today", "Available today")}${chip("top", "4.8+ rating", "star")}
    </div>
    <p class="pros-count">${count}</p>
    ${list.length
      ? list.map((w) => workerCard(w, { saved: state.saved.includes(w.id), from: state.area })).join("")
      : emptyState({
        icon: "magnifying-glass",
        title: "No pros match",
        text: anyFilter ? "Try turning off a filter." : "Try a different word, like “fan” or “sink”.",
        action: anyFilter ? `<button class="btn btn-secondary" type="button" data-action="clear-filters">Clear filters</button>` : "",
      })}`;
};

/* ---------- Worker profile ---------- */
SCREENS.Worker = () => {
  const w = workerById(state.workerId);
  const cat = categoryById(w.category);
  const own = state.role === "worker" && w.id === WORKER_SELF;
  const saved = state.saved.includes(w.id);
  const tabs = ["About", "Work", "Reviews"];

  let body;
  if (state.workerTab === "Work") {
    body = `<div class="work-grid">${w.work.map((title, i) => `<figure><img src="${workPhoto(w, i)}" alt="" loading="lazy" /><figcaption>${esc(title)}</figcaption></figure>`).join("")}</div>`;
  } else if (state.workerTab === "Reviews") {
    body = `<ul class="reviews">${(REVIEW_TEXT[w.id] || []).map(([pid, date, text]) => {
      const p = PEOPLE[pid];
      return `<li class="review">
        <div class="review-head">${avatar(p, 36)}<div><b>${esc(p.name)}</b><span>${esc(p.area)}, ${esc(date)}</span></div></div>
        <div class="review-stars" aria-label="5 out of 5 stars">${icon("star-fill", "icon-sm").repeat(5)}</div>
        <p>${esc(text)}</p>
      </li>`;
    }).join("")}</ul>`;
  } else {
    const cred = w.credential
      ? `<div class="credential">${rowIcon("certificate")}<div><b>${esc(w.credential.title)}</b><span>${esc(w.credential.issuer)}, ${w.credential.year}</span></div></div>`
      : "";
    body = `<p class="about">${esc(w.about)}</p>${cred}
      <dl class="facts">
        <div><dt>${icon("clock", "icon-sm")}Next available</dt><dd>${w.available ? "Today" : "Tomorrow"}</dd></div>
        <div><dt>${icon("calendar-blank", "icon-sm")}On SugoBai since</dt><dd>${w.since}</dd></div>
      </dl>`;
  }

  return `
    ${navHeader({ end: own ? "" : saveButton(w, saved) })}
    <div class="profile-cover"><img src="${workPhoto(w, 0)}" alt="${esc(w.work[0])}" /></div>
    <section class="profile-head">
      ${avatar(w, 84, { verified: w.idVerified })}
      <h1>${esc(w.name)}</h1>
      <p>${esc(cat.trade)} in ${esc(w.area)}, ${distanceKm(state.area, w.area)} km away</p>
    </section>
    ${statRow(w)}
    <div class="segmented" role="tablist" aria-label="Profile sections">
      ${tabs.map((t) => `<button type="button" role="tab" aria-selected="${state.workerTab === t}" data-action="worker-tab" data-id="${t}">${t}</button>`).join("")}
    </div>
    <div class="profile-body" role="tabpanel">${body}</div>
    ${own ? "" : `<div class="action-bar">
      <button class="btn btn-secondary" type="button" data-action="message" data-id="${w.id}">${icon("chat-circle")}Message</button>
      <button class="btn btn-primary" type="button" data-action="request" data-id="${w.id}">Request, ${w.from ? "from " : ""}${money(w.rate)}</button>
    </div>`}`;
};

/* ---------- Sheets ---------- */
function areaSheet() {
  return sheet("Your area", `<div class="list">${Object.keys(AREAS).map((area) => row({
    lead: rowIcon("map-pin"),
    title: esc(area),
    meta: "Cebu City",
    end: area === state.area ? `<span class="row-end row-check">${icon("check-circle")}</span>` : "",
    action: "set-area", id: area,
  })).join("")}</div>`);
}

function postJobSheet() {
  return sheet("Post a job", `<form data-form="post-job">
    <label class="field">What do you need done?<input name="title" required maxlength="70" placeholder="Fix a leaking kitchen sink" /></label>
    <fieldset class="field" style="border:0;padding:0;margin:0 0 16px">
      <legend style="padding:0;margin-bottom:6px">Service</legend>
      <div class="option-grid">${CATEGORIES.map((c, i) => `<label class="option"><input type="radio" name="category" value="${c.id}" ${i === 0 ? "checked" : ""} /><span>${icon(c.icon)}${c.label}</span></label>`).join("")}</div>
    </fieldset>
    <label class="field">Details<textarea name="details" rows="3" maxlength="400" placeholder="What's the problem, and when do you need it done?"></textarea></label>
    <div class="field-row">
      <label class="field">Budget (₱)<input name="budget" type="number" inputmode="numeric" min="100" step="50" required placeholder="600" /></label>
      <label class="field">Area<select name="area">${Object.keys(AREAS).map((a) => `<option ${a === state.area ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
    </div>
    <button class="btn btn-primary btn-block" type="submit">Post job</button>
  </form>`);
}
