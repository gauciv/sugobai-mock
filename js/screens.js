// One function per screen. Screens only render content; the device wrapper and shell are in index.html.
const SCREENS = {};

// One account in both modes.
const me = () => workerById(WORKER_SELF);

function searchForm(placeholder = "Try “leaking sink” or “aircon”") {
  return `<form class="search" role="search" data-form="search">
    ${icon("magnifying-glass")}
    <input name="q" type="search" value="${esc(state.query)}" placeholder="${esc(placeholder)}" aria-label="Search pros and services" enterkeyhint="search" />
  </form>`;
}

// Closest first, then best rated. The account holder never shows up in their own results.
function rankedWorkers({ category = "", query = "", filters = {} } = {}) {
  const q = query.toLowerCase();
  return WORKERS.filter((w) => {
    if (w.id === WORKER_SELF) return false;
    const cat = categoryById(w.category);
    if (category && w.category !== category) return false;
    if (filters.verified && !w.idVerified) return false;
    if (filters.today && !isFreeToday(w)) return false;
    if (filters.top && w.rating < 4.8) return false;
    if (q && !`${w.name} ${cat.label} ${cat.trade} ${w.area} ${w.about} ${w.work.join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => distanceKm(state.area, a.area) - distanceKm(state.area, b.area) || b.rating - a.rating || b.reviews - a.reviews);
}

/* ---------- Home ---------- */
SCREENS.Home = () => {
  if (state.role === "worker") return workerHome();
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
      <div class="section-head"><h2>Pros near you</h2><button class="btn btn-ghost" type="button" data-action="all-pros">See all</button></div>
      ${state.loading ? skeletonCards(2) : top.map((w) => workerCard(w, { saved: state.saved.includes(w.id), from: state.area })).join("")}
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
    ${state.loading ? skeletonCards(3) : list.length
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
  const own = w.id === WORKER_SELF;
  const saved = state.saved.includes(w.id);
  const busy = activeJobOf(w.id);
  const tabs = ["About", "Work", "Reviews"];

  let body;
  if (state.workerTab === "Work") {
    body = w.work.length ? `<div class="work-grid">${w.work.map((title, i) => `<figure><img src="${workPhoto(w, i)}" alt="" loading="lazy" /><figcaption>${esc(title)}</figcaption></figure>`).join("")}</div>`
      : `<p class="saved-empty">No work photos yet.</p>`;
  } else if (state.workerTab === "Reviews") {
    body = `<ul class="reviews">${(REVIEW_TEXT[w.id] || []).map(([pid, date, text, rating = 5]) => {
      const p = personById(pid);
      // Your own review isn't a link: there's no homeowner profile page for yourself.
      const head = `${avatar(p, 36)}<div><b>${pid === WORKER_SELF ? "You" : esc(p.name)}</b><span>${esc(p.area)}, ${esc(date)}</span></div>`;
      return `<li class="review">
        ${pid === WORKER_SELF ? `<div class="review-head">${head}</div>` : `<button class="review-head" type="button" data-action="open-client" data-id="${p.id}">${head}</button>`}
        <div class="review-stars" aria-label="${rating} out of 5 stars">${icon("star-fill", "icon-sm").repeat(rating)}${icon("star", "icon-sm").repeat(5 - rating)}</div>
        ${text ? `<p>${esc(text)}</p>` : ""}
      </li>`;
    }).join("")}</ul>`;
  } else {
    const cred = w.credential
      ? `<div class="credential">${rowIcon("certificate")}<div><b>${esc(w.credential.title)}</b><span>${esc(w.credential.issuer)}, ${w.credential.year}</span></div></div>`
      : "";
    body = `<p class="about">${esc(w.about)}</p>${cred}
      <dl class="facts">
        <div><dt>${icon("clock", "icon-sm")}Next available</dt><dd>${busy ? fmtDay(addDays(busy.agreed.due, 1)) : w.available ? "Today" : "Tomorrow"}</dd></div>
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
      ${busy
        ? `<button class="btn btn-primary" type="button" disabled>On a job until ${fmtShort(busy.agreed.due)}</button>`
        : `<button class="btn btn-primary" type="button" data-action="request" data-id="${w.id}">Request, ${w.from ? "from " : ""}${money(w.rate)}</button>`}
    </div>`}`;
};

/* ---------- Homeowner profile ---------- */
// Deliberately unlike the worker profile: no cover, tabs or hire bar. Pros see who's
// asking, how they treat pros, and what they need done right now.
SCREENS.Client = () => {
  const c = PEOPLE[state.clientId];
  const asWorker = state.role === "worker";
  const open = state.jobs.filter((j) => j.client === c.id && j.status === "Open");
  const reviews = CLIENT_REVIEWS[c.id] || [];
  return `
    ${navHeader()}
    <section class="client-head">
      ${avatar(c, 72, { verified: c.idVerified })}
      <div>
        <span class="client-role">${icon("house", "icon-sm")}Homeowner</span>
        <h1>${esc(c.name)}</h1>
        <p>${esc(c.area)}, on SugoBai since ${c.since}</p>
      </div>
    </section>
    <div class="stat-row">
      <div class="stat"><b>${icon("star-fill")}${c.rating.toFixed(1)}</b><span>from pros</span></div>
      <div class="stat"><b>${c.hires}</b><span>pros hired</span></div>
      <div class="stat ${c.idVerified ? "stat-verified" : ""}"><b>${icon(c.idVerified ? "seal-check" : "identification-card")}${c.idVerified ? "Yes" : "Pending"}</b><span>ID verified</span></div>
    </div>
    <section class="section">
      <div class="section-head"><h2>Open jobs</h2></div>
      ${open.length
        ? open.map((job) => workerJobCard(job, { poster: false, canOffer: asWorker && job.category === me().category })).join("")
        : `<p class="saved-empty">No open jobs right now.</p>`}
    </section>
    ${reviews.length ? `<section class="section">
      <div class="section-head"><h2>What pros say</h2></div>
      <ul class="reviews">${reviews.map(([wid, date, text]) => {
        const w = workerById(wid);
        return `<li class="review">
          <button class="review-head" type="button" data-action="open-worker" data-id="${w.id}">${avatar(w, 36, { verified: w.idVerified })}<div><b>${esc(w.name)}</b><span>${esc(categoryById(w.category).trade)}, ${esc(date)}</span></div></button>
          <p>${esc(text)}</p>
        </li>`;
      }).join("")}</ul>
    </section>` : ""}
    ${asWorker ? `<div class="action-bar action-bar-single">
      <button class="btn btn-secondary" type="button" data-action="message-client" data-id="${c.id}">${icon("chat-circle")}Message ${esc(firstName(c.name))}</button>
    </div>` : ""}`;
};

/* ---------- Jobs ---------- */
// Badge per status. "Done" means the pro marked it finished and payment is pending.
const STATUS_BADGE = {
  Open: ["badge-open", "Open"],
  Requested: ["badge-neutral", "Requested"],
  "In progress": ["badge-progress", "In progress"],
  Done: ["badge-attention", "Ready to pay"],
  Completed: ["badge-done", "Completed"],
};
function statusBadge(job) {
  let [cls, label] = STATUS_BADGE[job.status];
  if (job.status === "Done" && state.role === "worker") label = "Waiting for payment";
  return `<span class="badge ${cls}">${label}</span>`;
}
// Budget while taking offers, the agreed price once hired, what was paid once completed.
function jobAmount(job) {
  if (job.paid) return `<span class="job-budget">${money(job.paid.total)}<small> paid</small></span>`;
  if (job.agreed) return `<span class="job-budget">${money(job.agreed.price)}<small> agreed</small></span>`;
  return `<span class="job-budget">${money(job.budget)}<small> budget</small></span>`;
}

function jobMeta(job, from) {
  const where = from ? `${esc(job.area)}, ${distanceKm(from, job.area)} km` : esc(job.area);
  return `<div class="job-meta"><span>${icon("map-pin", "icon-sm")}${where}</span><span>${icon("clock", "icon-sm")}${esc(job.posted)}</span></div>`;
}

function offerTerms(job, workerId) {
  return job.terms?.[workerId] || { price: job.budget, due: addDays(state.today, 2) };
}

// Countdown to the agreed due date. Past it, shows what's coming off the pay so far.
function dueStatus(job) {
  const left = daysBetween(state.today, job.agreed.due);
  if (left < 0) return `<span class="due due-late">${icon("warning-circle", "icon-sm")}${plural(-left, "day")} late, −${money(lateDeduction(job, state.today).amount)}</span>`;
  if (left === 0) return `<span class="due due-soon">${icon("clock", "icon-sm")}Due today</span>`;
  if (left === 1) return `<span class="due due-soon">${icon("clock", "icon-sm")}Due tomorrow</span>`;
  return `<span class="due">${icon("clock", "icon-sm")}${left} days left</span>`;
}
function deadlineRow(job) {
  return `<div class="deadline"><span>${icon("calendar-blank", "icon-sm")}Due ${fmtDay(job.agreed.due)}</span>${dueStatus(job)}</div>`;
}
const lateRuleText = () => `Each day late takes ${LATE_RULE.perDay * 100}% off the price, up to ${LATE_RULE.cap * 100}%.`;

function offerRow(job, w) {
  const t = offerTerms(job, w.id);
  return `<div class="offer">
    ${avatar(w, 40, { verified: w.idVerified })}
    <div class="offer-body"><b>${esc(w.name)}</b>${trustLine(w, { jobs: false })}<span><b class="offer-price">${money(t.price)}</b>, done by ${fmtDay(t.due)}</span></div>
    <button class="btn btn-secondary btn-sm" type="button" data-action="hire" data-id="${job.id}:${w.id}">Hire</button>
  </div>`;
}

// The pro on a job, linking to your conversation with them.
function proRow(w, meta) {
  return `<button class="offer offer-link" type="button" data-action="open-thread" data-id="pro:${w.id}">
    ${avatar(w, 40, { verified: w.idVerified })}
    <div class="offer-body"><b>${esc(w.name)}</b><span>${meta}</span></div>
    ${icon("chat-circle")}
  </button>`;
}

function stars(n) {
  return `<span class="stars" aria-label="${n} out of 5 stars">${icon("star-fill", "icon-sm").repeat(n)}</span>`;
}

function homeownerJobFoot(job) {
  const w = job.hired && workerById(job.hired);
  const name = w && esc(firstName(w.name));
  if (job.status === "In progress") {
    const ext = job.extension;
    return `${proRow(w, `Hired ${fmtShort(job.agreed.start)}`)}${deadlineRow(job)}
      ${ext ? `<div class="notice">
        <p>${icon("hourglass-medium")}<span><b>${name} asks to move the due date to ${fmtDay(ext.to)}.</b> “${esc(ext.reason)}”</span></p>
        <div class="notice-actions">
          <button class="btn btn-secondary btn-sm" type="button" data-action="decline-time" data-id="${job.id}">Keep ${fmtShort(job.agreed.due)}</button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="approve-time" data-id="${job.id}">Move to ${fmtShort(ext.to)}</button>
        </div>
      </div>` : ""}`;
  }
  if (job.status === "Done") {
    const d = lateDeduction(job, state.today);
    return `${proRow(w, `Marked done ${fmtDay(job.finished)}`)}
      <p class="job-note">${d.late ? `${icon("warning-circle", "icon-sm")}Finished ${plural(d.late, "day")} late, so ${money(d.amount)} comes off.` : `${icon("check-circle", "icon-sm")}Finished on time.`} Check the work, then pay.</p>
      <button class="btn btn-primary btn-block" type="button" data-action="pay" data-id="${job.id}">${icon("wallet")}Pay ${money(d.total)}</button>`;
  }
  if (job.status === "Completed") {
    const off = job.paid.deduction ? `, ${money(job.paid.deduction)} late deduction` : "";
    return `${proRow(w, `Finished ${fmtShort(job.finished)}${off}`)}
      ${job.reviewed
        ? `<p class="job-note">${stars(job.reviewed)}You rated ${name}</p>`
        : `<button class="btn btn-secondary btn-block job-foot-btn" type="button" data-action="review" data-id="${job.id}">${icon("star")}Rate ${name}</button>`}`;
  }
  if (job.offers.length) {
    return `<p class="job-foot-label">${plural(job.offers.length, "offer")}</p>${job.offers.map((id) => offerRow(job, workerById(id))).join("")}`;
  }
  if (job.requested) {
    const r = workerById(job.requested);
    return `<div class="offer">${avatar(r, 40, { verified: r.idVerified })}<div class="offer-body"><b>${esc(r.name)}</b><span>Waiting for a price and finish date</span></div></div>`;
  }
  return `<p class="job-foot-label is-muted">No offers yet. Nearby pros usually reply within an hour.</p>`;
}

function homeownerJobCard(job) {
  const cat = categoryById(job.category);
  const removable = job.status === "Open" || job.status === "Requested";
  return `<article class="job-card${job.status === "Completed" ? " is-past" : ""}">
    <div class="job-head">${rowIcon(cat.icon)}<div class="job-title"><h3>${esc(job.title)}</h3>${jobMeta(job)}</div>
      ${removable ? `<button class="icon-btn job-delete" type="button" data-action="delete-job" data-id="${job.id}" aria-label="Delete ${esc(job.title)}">${icon("trash")}</button>` : ""}
    </div>
    <div class="job-line">${statusBadge(job)}${jobAmount(job)}</div>
    <div class="job-foot">${homeownerJobFoot(job)}</div>
  </article>`;
}

// Shown above job lists while Jun is on a job, in place of a disabled button on every card.
function busyNote() {
  const job = activeJobOf(WORKER_SELF);
  return job ? `<p class="job-note busy-note">${icon("briefcase", "icon-sm")}You're on a job until ${fmtDay(job.agreed.due)}. Mark it done to send new offers.</p>` : "";
}

function workerJobCard(job, { poster = true, canOffer = true } = {}) {
  const client = PEOPLE[job.client];
  const offered = job.offers.includes(WORKER_SELF);
  canOffer = canOffer && !activeJobOf(WORKER_SELF);
  return `<article class="job-card">
    ${poster ? `<button class="job-poster" type="button" data-action="open-client" data-id="${client.id}">${avatar(client, 32)}<span><b>${esc(client.name)}</b></span></button>` : ""}
    <h3 class="job-card-title">${esc(job.title)}</h3>
    ${job.details ? `<p class="job-details">${esc(job.details)}</p>` : ""}
    ${jobMeta(job, workerById(WORKER_SELF).area)}
    <div class="job-line">
      <span class="job-budget">${money(job.budget)}<small> budget</small></span>
      ${offered ? `<span class="badge badge-neutral">${icon("paper-plane-right")}Offer sent, ${money(offerTerms(job, WORKER_SELF).price)}</span>`
        : canOffer ? `<button class="btn btn-secondary btn-sm" type="button" data-action="offer" data-id="${job.id}">Send offer</button>` : ""}
    </div>
  </article>`;
}

// Jun's job as a worker: the one in progress, else one that's done and waiting for payment.
const currentJob = () => activeJobOf(WORKER_SELF) || state.jobs.find((j) => j.hired === WORKER_SELF && j.status === "Done");

function currentJobCard(job) {
  const client = PEOPLE[job.client];
  const name = esc(firstName(client.name));
  let foot;
  if (job.status === "Done") {
    const d = lateDeduction(job, state.today);
    foot = `<p class="job-note">${icon("hourglass-medium", "icon-sm")}Waiting for ${name} to check the work and pay. You'll get ${money(d.total)}${d.amount ? ` after a ${money(d.amount)} late deduction` : ""}.</p>`;
  } else if (job.extension || daysBetween(state.today, job.agreed.due) < 0) {
    // Already asked, or already late: more time can only be asked for up to the due date.
    const note = job.extension
      ? `You asked to move it to ${fmtDay(job.extension.to)}. Waiting for ${name}.`
      : `${lateRuleText()} Finish as soon as you can.`;
    foot = `${deadlineRow(job)}<p class="job-note">${icon(job.extension ? "hourglass-medium" : "warning-circle", "icon-sm")}${note}</p>
      <div class="job-actions job-actions-single"><button class="btn btn-primary" type="button" data-action="mark-done" data-id="${job.id}">${icon("check-circle")}Mark as done</button></div>`;
  } else {
    foot = `${deadlineRow(job)}
      <div class="job-actions">
        <button class="btn btn-secondary" type="button" data-action="ask-time" data-id="${job.id}">${icon("hourglass-medium")}More time</button>
        <button class="btn btn-primary" type="button" data-action="mark-done" data-id="${job.id}">${icon("check-circle")}Mark as done</button>
      </div>`;
  }
  return `<article class="job-card job-current">
    <div class="job-current-head">
      <button class="job-poster" type="button" data-action="open-client" data-id="${client.id}">${avatar(client, 32)}<span><b>${esc(client.name)}</b></span></button>
      <button class="icon-btn" type="button" data-action="open-thread" data-id="client:${client.id}" aria-label="Message ${esc(client.name)}">${icon("chat-circle")}</button>
    </div>
    <h3 class="job-card-title">${esc(job.title)}</h3>
    ${jobMeta(job, me().area)}
    <div class="job-line">${statusBadge(job)}${jobAmount(job)}</div>
    <div class="job-foot">${foot}</div>
  </article>`;
}

// Open jobs in Jun's trade that he could send an offer on, closest first.
function workerJobs() {
  const self = workerById(WORKER_SELF);
  return state.jobs
    .filter((j) => j.category === self.category && j.status === "Open" && j.client !== WORKER_SELF)
    .sort((a, b) => distanceKm(self.area, a.area) - distanceKm(self.area, b.area));
}

// Worker-mode home: their standing, the job they're on, new jobs, and offers waiting on a reply.
function workerHome() {
  const self = workerById(WORKER_SELF);
  const current = currentJob();
  const fresh = workerJobs().filter((j) => !j.offers.includes(WORKER_SELF)).slice(0, 2);
  const pending = state.jobs.filter((j) => j.offers.includes(WORKER_SELF) && j.status === "Open");
  return `
    <header class="home-header">
      <img class="home-mark" src="assets/sugobai-mark-96.webp" alt="SugoBai" width="36" height="36" />
      <button class="area-button" type="button" data-action="area" aria-label="Change service area, currently ${esc(self.area)}">
        ${icon("map-pin")}<span>Working in ${esc(self.area)}</span>${icon("caret-down", "icon-sm")}
      </button>
    </header>
    <h1 class="home-title">Ready for work, ${esc(firstName(self.name))}?</h1>
    ${statRow(self)}
    ${current ? `<section class="section">
      <div class="section-head"><h2>Current job</h2></div>
      ${currentJobCard(current)}
    </section>` : ""}
    <section class="section">
      <div class="section-head"><h2>New jobs near you</h2><button class="btn btn-ghost" type="button" data-action="tab" data-tab="Jobs">See all</button></div>
      ${busyNote()}
      ${state.loading ? skeletonCards(2) : fresh.length ? fresh.map((job) => workerJobCard(job)).join("") : `<p class="saved-empty">You've sent an offer on every job nearby.</p>`}
    </section>
    ${pending.length ? `<section class="section">
      <div class="section-head"><h2>Your offers</h2></div>
      <div class="list">${pending.map((job) => {
        const client = PEOPLE[job.client];
        const t = offerTerms(job, WORKER_SELF);
        return row({
          lead: avatar(client, 44),
          top: `<span class="row-top"><span class="row-title">${esc(job.title)}</span></span>`,
          meta: `${money(t.price)} by ${fmtShort(t.due)}, waiting for ${esc(firstName(client.name))}`,
          end: chevron(), action: "open-thread", id: `client:${job.client}`,
        });
      }).join("")}</div>
    </section>` : ""}`;
}

function workerJobsTab() {
  const self = me();
  const current = currentJob();
  const open = workerJobs();
  const past = state.jobs.filter((j) => j.hired === WORKER_SELF && j.status === "Completed");
  return `${pageHeader("Jobs", { sub: `${categoryById(self.category).label} work around ${self.area}` })}
    ${current ? `<section class="section section-first">
      <div class="section-head"><h2>Current job</h2></div>
      ${currentJobCard(current)}
    </section>` : ""}
    <section class="section${current ? "" : " section-first"}">
      <div class="section-head"><h2>Open jobs near you</h2></div>
      ${busyNote()}
      ${state.loading ? skeletonCards(3) : open.length ? open.map((job) => workerJobCard(job)).join("") : emptyState({ icon: "briefcase", title: "No open jobs nearby", text: "New requests show up here as soon as they're posted." })}
    </section>
    ${past.length ? `<section class="section">
      <div class="section-head"><h2>Completed</h2></div>
      <div class="list">${past.map((job) => {
        const client = PEOPLE[job.client];
        return row({
          lead: avatar(client, 44),
          top: `<span class="row-top"><span class="row-title">${esc(job.title)}</span><span class="row-end">${money(job.paid.total)}</span></span>`,
          meta: job.paid.deduction ? `<span class="row-late">${money(job.paid.deduction)} off, ${plural(lateDeduction(job, state.today).late, "day")} late</span>` : `Paid ${fmtShort(job.paid.on)}, on time`,
          end: "", action: "open-thread", id: `client:${job.client}`,
        });
      }).join("")}</div>
    </section>` : ""}`;
}

// Homeowner jobs: what needs you first (pay, approve), then work underway, then open posts.
const HOMEOWNER_ORDER = ["Done", "In progress", "Requested", "Open"];

SCREENS.Jobs = () => {
  if (state.role === "worker") return workerJobsTab();
  const mine = state.jobs.filter((j) => j.client === WORKER_SELF);
  if (!mine.length) {
    return `${pageHeader("Your jobs")}
      ${emptyState({ icon: "briefcase", title: "No jobs yet", text: "Describe what you need and nearby pros will send you offers.", action: `<button class="btn btn-primary" type="button" data-action="post-job">${icon("plus")}Post a job</button>` })}`;
  }
  const active = mine.filter((j) => j.status !== "Completed").sort((a, b) => HOMEOWNER_ORDER.indexOf(a.status) - HOMEOWNER_ORDER.indexOf(b.status));
  const past = mine.filter((j) => j.status === "Completed");
  // One primary action per screen: paying wins over posting.
  const postCls = active.some((j) => j.status === "Done") ? "btn-secondary" : "btn-primary";
  return `${pageHeader("Your jobs", { end: `<button class="btn ${postCls} btn-sm" type="button" data-action="post-job">${icon("plus", "icon-sm")}Post a job</button>` })}
    ${active.map(homeownerJobCard).join("")}
    ${past.length ? `<section class="section"><div class="section-head"><h2>Completed</h2></div>${past.map(homeownerJobCard).join("")}</section>` : ""}`;
};

/* ---------- Inbox and thread ---------- */
// Jun's threads as a homeowner are keyed "pro:<workerId>"; as a worker, "client:<personId>".
function visibleThreads() {
  const prefix = state.role === "worker" ? "client:" : "pro:";
  return Object.keys(state.threads).filter((id) => id.startsWith(prefix) && state.threads[id].length);
}
const counterpart = (threadId) => personById(threadId.split(":")[1]);
const myId = () => WORKER_SELF;

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
    const unread = state.unread.includes(id) && last.from !== myId();
    return row({
      lead: avatar(other, 48, { verified: isWorker && other.idVerified }),
      top: `<span class="row-top"><span class="row-title">${esc(other.name)}</span><span class="row-end">${esc(last.time)}</span></span>`,
      meta: `${unread ? `<span class="unread-dot"><span class="visually-hidden">New: </span></span>` : ""}${last.from === myId() ? "You: " : ""}${esc(last.text)}`,      action: "open-thread", id,
    }).replace('class="row"', `class="row${unread ? " is-unread" : ""}"`);
  }).join("")}</div>`;
};

SCREENS.Thread = () => {
  const id = state.threadId;
  const other = counterpart(id);
  const isWorker = !!other.category;
  const messages = state.threads[id] || [];
  const title = `<span class="thread-title">${avatar(other, 32)}<span><b>${esc(other.name)}</b>${isWorker ? `<span class="${other.idVerified ? "trust-verified" : "trust-pending"}">${other.idVerified ? "ID verified" : "ID pending"}</span>` : `<span>${esc(other.area)}</span>`}</span></span>`;
  const end = `<button class="btn btn-ghost" type="button" data-action="${isWorker ? "open-worker" : "open-client"}" data-id="${other.id}">Profile</button>`;
  return `
    ${navHeader({ title, end })}
    <div class="thread">
      ${messages.length ? "" : `<p class="thread-hint">Ask ${esc(firstName(other.name))} about price, schedule or what to prepare.</p>`}
      ${messages.map((m) => m.from === "system"
        ? `<p class="thread-event"><span>${esc(m.text)}</span><time>${esc(m.time)}</time></p>`
        : `<div class="bubble ${m.from === myId() ? "mine" : ""}"><p>${esc(m.text)}</p><time>${esc(m.time)}</time></div>`).join("")}
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
    : `<div class="account">${avatar(user, 64, { verified: user.idVerified })}<div><h2>${esc(user.name)}</h2><p>Homeowner in ${esc(state.area)}</p></div></div>`;

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
  return sheet(state.role === "worker" ? "Service area" : "Your area in Cebu City", `<div class="list list-compact">${Object.keys(AREAS).map((area) => row({
    lead: rowIcon("map-pin"),
    title: esc(area),
    end: area === (state.role === "worker" ? workerById(WORKER_SELF).area : state.area) ? `<span class="row-end row-check">${icon("check-circle")}</span>` : "",
    action: "set-area", id: area,
  })).join("")}</div>`);
}

function deleteJobSheet(job) {
  const n = job.offers.length;
  const asked = job.requested && workerById(job.requested);
  const effect = n ? ` The ${n === 1 ? "offer" : `${n} offers`} on it will be declined.`
    : asked ? ` ${esc(firstName(asked.name))} will be told the request is cancelled.` : "";
  return sheet("Delete this job?", `<p class="sheet-text">“${esc(job.title)}” will be removed from SugoBai.${effect}</p>
    <div class="sheet-actions">
      <button class="btn btn-secondary" type="button" data-action="close-sheet">Keep job</button>
      <button class="btn btn-danger" type="button" data-action="confirm-delete" data-id="${job.id}">${icon("trash")}Delete</button>
    </div>`);
}

function offerSheet(job) {
  const client = PEOPLE[job.client];
  const cat = categoryById(job.category);
  const name = firstName(client.name);
  return sheet("Send an offer", `<form data-form="offer" data-id="${job.id}">
    <div class="offer-job">${rowIcon(cat.icon)}<div><b>${esc(job.title)}</b><span>${esc(name)} in ${esc(job.area)}, budget ${money(job.budget)}</span></div></div>
    <label class="field">Your price (₱)<input name="price" type="number" inputmode="numeric" min="100" step="50" required value="${job.budget}" /></label>
    ${dayPicker({ legend: "I'll finish by", name: "due", from: state.today, count: 7, checked: 1 })}
    <p class="field-hint">${icon("warning-circle", "icon-sm")}<span>${lateRuleText()} Pick a date you can keep.</span></p>
    <label class="field">Message to ${esc(name)}<textarea name="note" rows="3" maxlength="300">Hi ${esc(name)}, I've done this kind of ${esc(cat.label.toLowerCase())} job many times. I'll bring my own tools.</textarea></label>
    <button class="btn btn-primary btn-block" type="submit">${icon("paper-plane-right")}Send offer</button>
  </form>`);
}

// A row of day buttons starting at `from`. Labels: Today, Tomorrow, then weekday + date.
function dayPicker({ legend, name, from, count, checked = 0 }) {
  const days = Array.from({ length: count }, (_, i) => addDays(from, i));
  const top = (iso) => {
    const d = daysBetween(state.today, iso);
    return d === 0 ? "Today" : d === 1 ? "Tmrw" : parseDay(iso).toLocaleDateString("en-US", { weekday: "short" });
  };
  return `<fieldset class="fieldset">
    <legend>${esc(legend)}</legend>
    <div class="day-picker">${days.map((iso, i) => `<label class="option day"><input type="radio" name="${name}" value="${iso}" ${i === checked ? "checked" : ""} aria-label="${fmtDay(iso)}" /><span><small>${top(iso)}</small><b>${parseDay(iso).getDate()}</b><small>${parseDay(iso).toLocaleDateString("en-US", { month: "short" })}</small></span></label>`).join("")}</div>
  </fieldset>`;
}

// Worker asks the homeowner to move the due date. If they agree, nothing comes off.
function moreTimeSheet(job) {
  const name = esc(firstName(PEOPLE[job.client].name));
  return sheet("Ask for more time", `<form data-form="more-time" data-id="${job.id}">
    <p class="sheet-text">Due ${fmtDay(job.agreed.due)}. If ${name} agrees to a new date, finishing by then counts as on time.</p>
    ${dayPicker({ legend: "Move it to", name: "to", from: addDays(job.agreed.due, 1), count: 4 })}
    <label class="field">Why do you need more time?<textarea name="reason" rows="3" maxlength="200" required placeholder="Waiting for a part, or the weather"></textarea></label>
    <button class="btn btn-primary btn-block" type="submit">${icon("paper-plane-right")}Send to ${name}</button>
  </form>`);
}

function markDoneSheet(job) {
  const name = esc(firstName(PEOPLE[job.client].name));
  const d = lateDeduction(job, state.today);
  const pay = d.amount
    ? `You're ${plural(d.late, "day")} late, so ${money(d.amount)} comes off. You'll get <b>${money(d.total)}</b>.`
    : `You're on time. You'll get <b>${money(d.total)}</b>.`;
  return sheet("Mark this job as done?", `<p class="sheet-text">${name} will be asked to check the work and pay. ${pay}</p>
    <div class="sheet-actions">
      <button class="btn btn-secondary" type="button" data-action="close-sheet">Not yet</button>
      <button class="btn btn-primary" type="button" data-action="confirm-done" data-id="${job.id}">${icon("check-circle")}Mark as done</button>
    </div>`);
}

// Homeowner pays through SugoBai. The late deduction is applied here, so it's automatic.
function paySheet(job) {
  const w = workerById(job.hired);
  const name = esc(firstName(w.name));
  const d = lateDeduction(job, state.today);
  return sheet(`Pay ${firstName(w.name)}`, `<form data-form="pay" data-id="${job.id}">
    <div class="offer-job">${avatar(w, 40, { verified: w.idVerified })}<div><b>${esc(job.title)}</b><span>${esc(w.name)}, finished ${fmtDay(job.finished)}</span></div></div>
    <dl class="summary">
      <div><dt>Agreed price</dt><dd>${money(job.agreed.price)}</dd></div>
      <div><dt>Due date</dt><dd>${fmtDay(job.agreed.due)}</dd></div>
      ${d.late ? `<div class="is-late"><dt>${icon("warning-circle", "icon-sm")}${plural(d.late, "day")} late (${Math.round(d.rate * 100)}% off)</dt><dd>−${money(d.amount)}</dd></div>` : ""}
      <div class="summary-total"><dt>You pay</dt><dd>${money(d.total)}</dd></div>
    </dl>
    <fieldset class="fieldset">
      <legend>Pay with</legend>
      <div class="option-grid">${["GCash", "Maya", "Card"].map((m, i) => `<label class="option"><input type="radio" name="method" value="${m}" ${i === 0 ? "checked" : ""} /><span>${m}</span></label>`).join("")}</div>
    </fieldset>
    <p class="field-hint">${icon("seal-check", "icon-sm")}<span>Paying confirms the job is done. ${name} gets the money right away.</span></p>
    <button class="btn btn-primary btn-block" type="submit">${icon("wallet")}Pay ${money(d.total)}</button>
  </form>`);
}

function reviewSheet(job) {
  const w = workerById(job.hired);
  const name = esc(firstName(w.name));
  return sheet(`Rate ${firstName(w.name)}`, `<form data-form="review" data-id="${job.id}">
    <p class="sheet-text">${job.paid.on === state.today ? `You paid ${money(job.paid.total)}. ` : ""}How did ${name} do on “${esc(job.title)}”?</p>
    <fieldset class="fieldset">
      <legend class="visually-hidden">Rating</legend>
      <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="star-${n}" name="stars" value="${n}" ${n === 5 ? "checked" : ""} /><label for="star-${n}" aria-label="${plural(n, "star")}">${icon("star-fill", "icon-lg")}</label>`).join("")}</div>
    </fieldset>
    <label class="field">What went well? (optional)<textarea name="text" rows="3" maxlength="300" placeholder="On time, clean work, fair price"></textarea></label>
    <button class="btn btn-primary btn-block" type="submit">Post review</button>
  </form>`);
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
