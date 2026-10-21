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

/* ---------- Jobs ---------- */
const STATUS_BADGE = { Open: "badge-open", Requested: "badge-neutral", Hired: "badge-done" };

function jobMeta(job, from) {
  const where = from ? `${esc(job.area)}, ${distanceKm(from, job.area)} km` : esc(job.area);
  return `<div class="job-meta"><span>${icon("map-pin", "icon-sm")}${where}</span><span>${icon("clock", "icon-sm")}${esc(job.posted)}</span></div>`;
}

function offerRow(job, w) {
  return `<div class="offer">
    ${avatar(w, 40, { verified: w.idVerified })}
    <div class="offer-body"><b>${esc(w.name)}</b>${trustLine(w, { jobs: false })}</div>
    <button class="btn btn-secondary btn-sm" type="button" data-action="hire" data-id="${job.id}:${w.id}">Hire</button>
  </div>`;
}

function homeownerJobCard(job) {
  const cat = categoryById(job.category);
  const hired = job.hired && workerById(job.hired);
  let foot;
  if (hired) {
    foot = `<button class="offer offer-link" type="button" data-action="open-thread" data-id="${hired.id}">
      ${avatar(hired, 40, { verified: hired.idVerified })}
      <div class="offer-body"><b>${esc(hired.name)}</b><span>${job.status === "Requested" ? "Waiting for them to confirm" : "Hired. Message to set a schedule."}</span></div>
      ${icon("chat-circle")}
    </button>`;
  } else if (job.offers.length) {
    foot = `<p class="job-foot-label">${job.offers.length} ${job.offers.length === 1 ? "offer" : "offers"}</p>${job.offers.map((id) => offerRow(job, workerById(id))).join("")}`;
  } else {
    foot = `<p class="job-foot-label is-muted">No offers yet. Nearby pros usually reply within an hour.</p>`;
  }
  return `<article class="job-card">
    <div class="job-head">${rowIcon(cat.icon)}<div class="job-title"><h3>${esc(job.title)}</h3>${jobMeta(job)}</div></div>
    <div class="job-line"><span class="badge ${STATUS_BADGE[job.status]}">${esc(job.status)}</span><span class="job-budget">${money(job.budget)}<small> budget</small></span></div>
    <div class="job-foot">${foot}</div>
  </article>`;
}

function workerJobCard(job) {
  const client = PEOPLE[job.client];
  const hired = job.hired === WORKER_SELF;
  const offered = job.offers.includes(WORKER_SELF);
  return `<article class="job-card">
    <div class="job-poster">${avatar(client, 32)}<span><b>${esc(client.name)}</b></span></div>
    <h3 class="job-card-title">${esc(job.title)}</h3>
    ${job.details ? `<p class="job-details">${esc(job.details)}</p>` : ""}
    ${jobMeta(job, workerById(WORKER_SELF).area)}
    <div class="job-line">
      <span class="job-budget">${money(job.budget)}<small> budget</small></span>
      ${hired ? `<span class="badge badge-done">${icon("check-circle")}Hired</span>`
        : offered ? `<span class="badge badge-neutral">${icon("paper-plane-right")}Offer sent</span>`
        : `<button class="btn btn-secondary btn-sm" type="button" data-action="offer" data-id="${job.id}">Send offer</button>`}
    </div>
  </article>`;
}

SCREENS.Jobs = () => {
  if (state.role === "worker") {
    const self = workerById(WORKER_SELF);
    const jobs = state.jobs
      .filter((j) => (j.status === "Open" || j.hired === WORKER_SELF) && j.client !== WORKER_SELF)
      .sort((a, b) => distanceKm(self.area, a.area) - distanceKm(self.area, b.area));
    return `${pageHeader("Jobs near you", { sub: `Open requests around ${self.area}, closest first` })}
      ${jobs.length ? jobs.map(workerJobCard).join("") : emptyState({ icon: "briefcase", title: "No open jobs nearby", text: "New requests show up here as soon as they're posted." })}`;
  }
  const mine = state.jobs.filter((j) => j.client === "mika");
  if (!mine.length) {
    return `${pageHeader("Your jobs")}
      ${emptyState({ icon: "briefcase", title: "No jobs yet", text: "Describe what you need and nearby pros will send you offers.", action: `<button class="btn btn-primary" type="button" data-action="post-job">${icon("plus")}Post a job</button>` })}`;
  }
  return `${pageHeader("Your jobs", { end: `<button class="btn btn-primary btn-sm" type="button" data-action="post-job">${icon("plus", "icon-sm")}Post a job</button>` })}
    ${mine.map(homeownerJobCard).join("")}`;
};

/* ---------- Inbox and thread ---------- */
// Threads are keyed by worker id. In worker mode, only the worker's own thread (with Mika) is visible.
function visibleThreads() {
  const ids = Object.keys(state.threads).filter((id) => state.threads[id].length);
  return state.role === "worker" ? ids.filter((id) => id === WORKER_SELF) : ids;
}
const counterpart = (threadId) => (state.role === "worker" ? PEOPLE.mika : workerById(threadId));
const myId = () => (state.role === "worker" ? WORKER_SELF : "mika");

SCREENS.Inbox = () => {
  const ids = visibleThreads();
  if (!ids.length) {
    return `${pageHeader("Inbox")}${emptyState({
      icon: "chat-circle",
      title: "No messages yet",
      text: state.role === "worker" ? "Clients who message you will show up here." : "Message a pro from their profile to ask about price or schedule.",
      action: state.role === "worker" ? "" : `<button class="btn btn-secondary" type="button" data-action="all-pros">Find a pro</button>`,
    })}`;
  }
  return `${pageHeader("Inbox")}<div class="list">${ids.map((id) => {
    const other = counterpart(id);
    const last = state.threads[id].at(-1);
    const isWorker = !!other.category;
    const unread = state.role !== "worker" && state.unread.includes(id);
    return row({
      lead: avatar(other, 48, { verified: isWorker && other.idVerified }),
      top: `<span class="row-top"><span class="row-title">${esc(other.name)}</span><span class="row-end">${esc(last.time)}</span></span>`,
      meta: `${unread ? `<span class="unread-dot"><span class="visually-hidden">New: </span></span>` : ""}${last.from === myId() ? "You: " : ""}${esc(last.text)}`,
      action: "open-thread", id,
    }).replace('class="row"', `class="row${unread ? " is-unread" : ""}"`);
  }).join("")}</div>`;
};

SCREENS.Thread = () => {
  const id = state.threadId;
  const other = counterpart(id);
  const isWorker = !!other.category;
  const messages = state.threads[id] || [];
  const title = `<span class="thread-title">${avatar(other, 32)}<span><b>${esc(other.name)}</b>${isWorker ? `<span class="${other.idVerified ? "trust-verified" : "trust-pending"}">${other.idVerified ? "ID verified" : "ID pending"}</span>` : `<span>${esc(other.area)}</span>`}</span></span>`;
  const end = isWorker ? `<button class="btn btn-ghost" type="button" data-action="open-worker" data-id="${other.id}">Profile</button>` : "";
  return `
    ${navHeader({ title, end })}
    <div class="thread">
      ${messages.length ? "" : `<p class="thread-hint">Ask ${esc(firstName(other.name))} about price, schedule or what to prepare.</p>`}
      ${messages.map((m) => `<div class="bubble ${m.from === myId() ? "mine" : ""}"><p>${esc(m.text)}</p><time>${esc(m.time)}</time></div>`).join("")}
    </div>
    <form class="composer" data-form="message">
      <button class="icon-btn" type="button" aria-label="Attach a photo" data-action="attach">${icon("camera")}</button>
      <input name="text" autocomplete="off" maxlength="300" placeholder="Message ${esc(firstName(other.name))}" aria-label="Message" />
      <button class="icon-btn composer-send" type="submit" aria-label="Send">${icon("paper-plane-right")}</button>
    </form>`;
};

/* ---------- Profile tab ---------- */
SCREENS.Profile = () => {
  const worker = state.role === "worker";
  const user = me();
  const head = worker
    ? `<div class="account">${avatar(user, 64, { verified: user.idVerified })}<div><h2>${esc(user.name)}</h2><p>${esc(categoryById(user.category).trade)} in ${esc(user.area)}</p></div></div>
       <div class="account-trust">${trustLine(user)}</div>`
    : `<div class="account">${avatar(user, 64)}<div><h2>${esc(user.name)}</h2><p>Homeowner in ${esc(state.area)}</p></div></div>`;

  const rows = worker
    ? [
      row({ lead: rowIcon("user"), title: "View my public profile", meta: "What homeowners see", end: chevron(), action: "my-profile" }),
      row({ lead: rowIcon("map-pin"), title: "Service area", meta: `${esc(user.area)} and nearby`, end: chevron(), action: "area" }),
      row({ lead: rowIcon("arrows-left-right"), title: "Switch to homeowner mode", meta: "Book pros for your own home", end: chevron(), action: "switch-role" }),
    ]
    : [
      row({ lead: rowIcon("map-pin"), title: "Your area", meta: `${esc(state.area)}, Cebu City`, end: chevron(), action: "area" }),
      row({ lead: rowIcon("arrows-left-right"), title: "Switch to worker mode", meta: "Find jobs and get hired near you", end: chevron(), action: "switch-role" }),
    ];

  const saved = state.saved.map(workerById);
  const savedList = worker ? "" : `<section class="section">
      <div class="section-head"><h2>Saved pros</h2></div>
      ${saved.length
        ? `<div class="list">${saved.map((w) => row({
          lead: avatar(w, 44, { verified: w.idVerified }),
          top: `<span class="row-title">${esc(w.name)}</span>`,
          meta: `${esc(categoryById(w.category).trade)} in ${esc(w.area)}`,
          end: chevron(), action: "open-worker", id: w.id,
        })).join("")}</div>`
        : `<p class="saved-empty">Tap ${icon("heart", "icon-sm")} on a pro to keep them here.</p>`}
    </section>`;

  return `${pageHeader("Profile")}${head}<div class="list account-rows">${rows.join("")}</div>${savedList}`;
};

/* ---------- Sheets ---------- */
function areaSheet() {
  return sheet(state.role === "worker" ? "Service area" : "Your area", `<div class="list">${Object.keys(AREAS).map((area) => row({
    lead: rowIcon("map-pin"),
    title: esc(area),
    meta: "Cebu City",
    end: area === (state.role === "worker" ? workerById(WORKER_SELF).area : state.area) ? `<span class="row-end row-check">${icon("check-circle")}</span>` : "",
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
