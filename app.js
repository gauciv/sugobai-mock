const app = document.querySelector("#app-scroll");
const dialogRoot = document.querySelector("#dialog-root");
const toast = document.querySelector("#toast");
const locationOptions = ["Cebu City", "Mandaue City", "Lapu-Lapu City"];
const services = ["Electrical work", "Plumbing", "Cleaning", "Carpentry", "Painting", "Errands"];

const state = {
  view: "Home",
  role: "homeowner",
  location: locationOptions[0],
  query: "",
  selectedService: "",
  filters: { service: "", minRating: 0, availableOnly: false, verifiedOnly: false },
  selectedWorker: null,
  detailTab: "About",
  savedWorkerIds: ["maria"],
  jobs: [
    { id: "job-1", title: "Install a ceiling fan", service: "Electrical work", details: "Install one ceiling fan in the living room. Fan is already purchased.", location: "Cebu City", budget: 850, client: "Mika", status: "Open", posted: "25 min ago" },
    { id: "job-2", title: "Repair a leaking kitchen sink", service: "Plumbing", details: "The pipe below the sink is dripping. Hoping to have it checked this week.", location: "Cebu City", budget: 600, client: "Ana R.", status: "Open", posted: "1 hr ago" },
    { id: "job-3", title: "Deep clean a small apartment", service: "Cleaning", details: "One bedroom apartment, including kitchen and bathroom.", location: "Mandaue City", budget: 1200, client: "Paolo D.", status: "Open", posted: "2 hrs ago" },
    { id: "job-4", title: "Fix a loose cabinet door", service: "Carpentry", details: "Kitchen cabinet hinge needs repair or replacement.", location: "Cebu City", budget: 450, client: "Lena M.", status: "Open", posted: "3 hrs ago" },
  ],
  threads: {
    jun: [{ from: "Jun Reyes", text: "Hi Mika! I can take a look at the ceiling fan installation this afternoon.", time: "9:14 AM" }],
  },
  activeThread: null,
};

const workers = [
  { id: "jun", name: "Jun Reyes", initials: "JR", service: "Electrical work", location: "Cebu City", rating: 4.9, reviews: 38, rate: 350, unit: "visit", jobs: 38, years: 6, available: true, verified: true, certification: "TESDA Electrical Installation & Maintenance NC II", about: "A local electrician focused on safe, tidy repairs and clear communication. I handle home wiring, lighting, outlets, and small appliance installations.", portfolio: ["Ceiling light install", "Panel upgrade", "Kitchen lighting"] },
  { id: "maria", name: "Maria Santos", initials: "MS", service: "Cleaning", location: "Cebu City", rating: 5.0, reviews: 25, rate: 500, unit: "session", jobs: 25, years: 4, available: true, verified: true, certification: "Verified home service provider", about: "Reliable home cleaning with careful attention to kitchens, bathrooms, and move-in or move-out details.", portfolio: ["Apartment deep clean", "Move-in clean", "Kitchen refresh"] },
  { id: "rico", name: "Rico Mendoza", initials: "RM", service: "Plumbing", location: "Cebu City", rating: 4.8, reviews: 42, rate: 400, unit: "visit", jobs: 42, years: 8, available: false, verified: true, certification: "TESDA Plumbing NC II", about: "Eight years of residential plumbing repairs, from leaking faucets to fixture replacement and drain issues.", portfolio: ["Sink repair", "New faucet", "Shower fitting"] },
  { id: "ana", name: "Ana Villarin", initials: "AV", service: "Electrical work", location: "Mandaue City", rating: 4.8, reviews: 19, rate: 300, unit: "visit", jobs: 19, years: 3, available: true, verified: true, certification: "Electrical Safety Certificate", about: "Friendly neighborhood electrician for lighting, switches, and home safety checks.", portfolio: ["Pendant lights", "Outlet repair", "Safety check"] },
  { id: "tomas", name: "Tomas dela Cruz", initials: "TD", service: "Carpentry", location: "Mandaue City", rating: 4.9, reviews: 31, rate: 550, unit: "project", jobs: 31, years: 7, available: true, verified: true, certification: "TESDA Carpentry NC II", about: "Custom shelves, cabinet fixes, and practical furniture repairs made to fit your home.", portfolio: ["Custom shelves", "Cabinet repair", "Entry bench"] },
  { id: "luis", name: "Luis Garcia", initials: "LG", service: "Painting", location: "Lapu-Lapu City", rating: 4.7, reviews: 16, rate: 650, unit: "room", jobs: 16, years: 5, available: true, verified: false, certification: "Portfolio verified", about: "Interior repainting and wall touch-ups with clean edges and careful prep.", portfolio: ["Bedroom repaint", "Wall touch-up", "Kitchen color"] },
];

const byId = (id) => workers.find((worker) => worker.id === id);
let toastTimer;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

function setView(view) {
  state.view = view;
  state.activeThread = null;
  render();
}

function formatMoney(value) {
  return `₱${Number(value).toLocaleString("en-PH")}`;
}

function serviceOptions(selected = "") {
  return services.map((service) => `<option value="${escapeHtml(service)}" ${service === selected ? "selected" : ""}>${escapeHtml(service)}</option>`).join("");
}

function serviceTiles() {
  const icons = {
    "Electrical work": "ϟ", Plumbing: "⌁", Cleaning: "✦", Carpentry: "⌂", Painting: "◩", Errands: "＋",
  };
  return services.slice(0, 4).map((service, index) => `<button class="service-card service-${["orange", "blue", "lilac", "green"][index]}" type="button" data-action="service" data-service="${escapeHtml(service)}"><span class="service-icon"><span class="service-glyph">${icons[service]}</span></span><span class="service-name">${escapeHtml(service.replace(" work", ""))}</span></button>`).join("");
}

function visibleWorkers({ ignoreSearch = false, ignoreService = false } = {}) {
  const query = ignoreSearch ? "" : state.query.trim().toLowerCase();
  const service = ignoreService ? "" : (state.selectedService || state.filters.service);
  return workers.filter((worker) => {
    if (worker.location !== state.location) return false;
    if (service && worker.service !== service) return false;
    if (state.filters.minRating && worker.rating < state.filters.minRating) return false;
    if (state.filters.availableOnly && !worker.available) return false;
    if (state.filters.verifiedOnly && !worker.verified) return false;
    if (query && !`${worker.name} ${worker.service} ${worker.location} ${worker.about}`.toLowerCase().includes(query)) return false;
    return true;
  }).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
}

function topBar() {
  return `<div class="app-topline"><div class="location"><span class="eyebrow">YOUR LOCATION</span><button class="location-button" type="button" data-action="location" aria-label="Change location"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M14.2 7.5c0 3.8-5.2 8.3-5.2 8.3S3.8 11.3 3.8 7.5a5.2 5.2 0 1 1 10.4 0Z"/><circle cx="9" cy="7.4" r="1.8"/></svg><span>${escapeHtml(state.location)}</span><svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg></button></div><button class="avatar-button" type="button" data-action="profile" aria-label="Open profile">${state.role === "worker" ? "JR" : "M"}</button></div>`;
}

function searchRow() {
  return `<div class="search-row"><form class="search-card search-form" data-form="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg><input id="search-input" name="query" value="${escapeHtml(state.query)}" placeholder="Search services or pros" aria-label="Search services or professionals"/><button type="submit" class="search-submit" aria-label="Search">↗</button></form><button class="filter-button" type="button" data-action="filters" aria-label="Filter professionals"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M6 10h8m-5 5h2"/><circle cx="7" cy="5" r="1.5"/><circle cx="12" cy="10" r="1.5"/></svg></button></div>`;
}

function workerCard(worker) {
  const saved = state.savedWorkerIds.includes(worker.id);
  return `<article class="pro-card"><button class="pro-main" type="button" data-action="open-worker" data-id="${worker.id}"><span class="worker-avatar"><span>${worker.initials}</span>${worker.verified ? "<i>✓</i>" : ""}</span><span class="worker-info"><span class="worker-name">${escapeHtml(worker.name)} ${worker.verified ? '<span class="verified-mark">✓</span>' : ""}<span class="trade-chip">${escapeHtml(worker.service.replace(" work", ""))}</span></span><span class="worker-trade">${escapeHtml(worker.location)} · ${worker.available ? "Available today" : "Next opening tomorrow"}</span><span class="worker-proof"><span class="rating-star">★</span> ${worker.rating.toFixed(1)} <span class="proof-divider">·</span> ${worker.reviews} reviews <span class="proof-divider">·</span> ${worker.verified ? "ID verified" : "Profile verified"}</span></span><span class="worker-price">${formatMoney(worker.rate)}<small> / ${escapeHtml(worker.unit)}</small></span><span class="portfolio-strip"><span class="portfolio-work work-a"></span><span class="portfolio-work work-b"></span><span class="portfolio-work work-c"></span><span class="portfolio-caption">${worker.jobs} jobs completed<b>View profile & work →</b></span></span><span class="worker-book">View profile <span>→</span></span></button><button class="save-pro ${saved ? "is-saved" : ""}" type="button" data-action="save-worker" data-id="${worker.id}" aria-label="${saved ? "Remove saved professional" : "Save professional"}">${saved ? "♥" : "♡"}</button></article>`;
}

function emptyState(title, message, action = "") {
  return `<div class="empty-state"><span class="empty-state-icon">✦</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>${action}</div>`;
}

function homeView() {
  const featured = visibleWorkers({ ignoreService: true }).slice(0, 2);
  return `${topBar()}<section class="greeting"><p>Good morning, Mika <span class="wave" aria-hidden="true">✳</span></p><h1>Find the right<br />person for the <em>job.</em></h1></section>${searchRow()}<section class="home-hero"><div class="hero-copy"><span class="hero-label">LOCAL HELP, MADE SIMPLE</span><h2>Good work.<br /><em>Good people.</em></h2><button type="button" data-action="post-job">Post a job <span>→</span></button></div><div class="hero-art" aria-hidden="true"><span class="hero-orbit"></span><img src="assets/sugobai-logo.png" alt="" /></div><span class="hero-spark hero-spark-one" aria-hidden="true">✦</span><span class="hero-spark hero-spark-two" aria-hidden="true">✳</span></section><section class="services-section"><div class="section-heading"><h2>Popular services</h2><button class="text-link" type="button" data-action="services">See all <span>→</span></button></div><div class="service-grid">${serviceTiles()}</div></section><section class="pros-section"><div class="section-heading"><h2>Popular near you</h2><button class="text-link" type="button" data-action="pros">View all <span>→</span></button></div><div class="pro-list">${featured.length ? featured.map(workerCard).join("") : emptyState("No pros in this area yet", "Try another nearby location.")}</div></section><button class="worker-invite" type="button" data-action="worker-mode"><span>Skilled worker?</span> Find local jobs <b>→</b></button>`;
}

function pageHeading(title, subtitle = "", back = true) {
  return `<div class="page-heading">${back ? '<button class="back-button" type="button" data-action="home" aria-label="Back to home">←</button>' : ""}<div><span class="eyebrow">SUGOBAI · ${escapeHtml(state.location.toUpperCase())}</span><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div></div>`;
}

function servicesView() {
  return `${topBar()}${pageHeading("Find a service", "Choose a category to meet local pros.")}<div class="all-services-grid">${services.map((service, index) => `<button class="service-card service-${["orange", "blue", "lilac", "green", "blue", "orange"][index]}" type="button" data-action="service" data-service="${escapeHtml(service)}"><span class="service-icon"><span class="service-glyph">${["ϟ", "⌁", "✦", "⌂", "◩", "＋"][index]}</span></span><span class="service-name">${escapeHtml(service)}</span></button>`).join("")}</div>${searchRow()}${pageHeading(state.selectedService || "Recommended pros", "Profiles, ratings, and past work in one place.", false)}<div class="pro-list">${visibleWorkers().map(workerCard).join("") || emptyState("No matching pros", "Try another category or area.")}</div>`;
}

function prosView() {
  const pros = visibleWorkers();
  return `${topBar()}${pageHeading(state.selectedService || "Local professionals", `${pros.length} trusted ${pros.length === 1 ? "pro" : "pros"} near you.`)}${searchRow()}<div class="filter-summary">${state.filters.verifiedOnly ? "Verified only · " : ""}${state.filters.availableOnly ? "Available today · " : ""}${state.filters.minRating ? `${state.filters.minRating}+ stars · ` : ""}<button type="button" data-action="filters">Edit filters</button></div><div class="pro-list">${pros.map(workerCard).join("") || emptyState("No matching pros", "Adjust filters or change your location.")}</div>`;
}

function searchView() {
  const results = visibleWorkers({ ignoreService: true });
  const title = state.query ? `Results for “${state.query}”` : "Search local pros";
  return `${topBar()}${pageHeading(title, `${results.length} matching professionals.`)}${searchRow()}<div class="pro-list">${results.map(workerCard).join("") || emptyState("No results found", "Try another service or search term.")}</div>`;
}

function workerDetailView() {
  const worker = byId(state.selectedWorker);
  if (!worker) return homeView();
  const saved = state.savedWorkerIds.includes(worker.id);
  const body = state.detailTab === "About"
    ? `<div class="detail-section"><h3>About ${escapeHtml(worker.name.split(" ")[0])}</h3><p>${escapeHtml(worker.about)}</p><h3>Credentials & licenses</h3><div class="credential-row"><span class="credential-icon">✓</span><span><b>${escapeHtml(worker.certification)}</b><small>Identity checked · ${worker.years} years experience</small></span></div></div>`
    : state.detailTab === "Services"
      ? `<div class="detail-section"><h3>Services offered</h3><div class="detail-service"><span>${escapeHtml(worker.service)}</span><b>From ${formatMoney(worker.rate)} / ${escapeHtml(worker.unit)}</b></div><p>Final pricing is confirmed with the professional before work begins.</p></div>`
      : `<div class="detail-section"><h3>Reviews from homeowners</h3><div class="review-card"><span class="rating-star">★</span><b>${worker.rating.toFixed(1)} · ${worker.reviews} reviews</b><p>“Arrived on time, explained the work clearly, and left everything tidy.”</p><small>Recent homeowner review</small></div><div class="review-card"><span class="rating-star">★</span><b>Helpful and professional</b><p>“The quote was clear and the repair was done carefully.”</p><small>Verified completed job</small></div></div>`;
  return `<div class="detail-top"><button class="back-button" type="button" data-action="back">←</button><span>Professional profile</span><button class="detail-save ${saved ? "is-saved" : ""}" type="button" data-action="save-worker" data-id="${worker.id}" aria-label="${saved ? "Unsave" : "Save"} professional">${saved ? "♥" : "♡"}</button></div><div class="profile-cover"><span class="cover-orbit"></span><div class="profile-avatar">${worker.initials}<i>✓</i></div><span class="profile-location">⌖ ${escapeHtml(worker.location)}</span></div><section class="profile-summary"><h1>${escapeHtml(worker.name)} <span class="verified-mark">✓</span></h1><span class="profile-trade">${escapeHtml(worker.service)} · ${worker.years} years experience</span><div class="profile-stats"><span><b class="rating-star">★ ${worker.rating.toFixed(1)}</b><small>${worker.reviews} reviews</small></span><span><b>${worker.jobs}</b><small>jobs done</small></span><span><b>${worker.available ? "Today" : "Tomorrow"}</b><small>next available</small></span></div></section><div class="detail-tabs">${["About", "Services", "Reviews"].map((tab) => `<button type="button" data-action="detail-tab" data-tab="${tab}" class="${state.detailTab === tab ? "active" : ""}">${tab}</button>`).join("")}</div>${body}<section class="detail-section"><div class="section-heading"><h3>Recent work</h3><span class="muted-small">${worker.portfolio.length} projects</span></div><div class="detail-portfolio">${worker.portfolio.map((title, index) => `<div class="portfolio-item work-${["a", "b", "c"][index]}"><span>${escapeHtml(title)}</span></div>`).join("")}</div></section><div class="detail-actions"><button type="button" class="secondary-action" data-action="contact-worker" data-id="${worker.id}">Message</button><button type="button" class="primary-action" data-action="book-worker" data-id="${worker.id}">Request service · ${formatMoney(worker.rate)}</button></div>`;
}

function jobCard(job, workerMode = false) {
  const assigned = job.status !== "Open";
  const worker = job.assignedWorker ? byId(job.assignedWorker) : null;
  return `<article class="job-card"><div class="job-card-top"><span class="job-chip">${escapeHtml(job.service.replace(" work", ""))}</span><span class="job-status ${assigned ? "assigned" : ""}">${escapeHtml(job.status)}</span></div><h3>${escapeHtml(job.title)}</h3><p>${escapeHtml(job.details)}</p><div class="job-meta"><span>⌖ ${escapeHtml(job.location)}</span><span>◷ ${escapeHtml(job.posted || "Just now")}</span></div><div class="job-card-bottom"><b>${formatMoney(job.budget)}<small> budget</small></b>${worker && workerMode ? `<span class="assigned-worker">Accepted by you</span>` : worker ? `<span class="assigned-worker">Pro: ${escapeHtml(worker.name)}</span>` : workerMode && !assigned ? `<button class="primary-action compact" type="button" data-action="accept-job" data-id="${job.id}">Accept job</button>` : assigned ? `<span class="assigned-worker">Assigned to a pro</span>` : `<span class="awaiting-offers">Waiting for offers</span>`}</div></article>`;
}

function jobsView() {
  if (state.role === "worker") {
    const myJobs = state.jobs.filter((job) => job.assignedWorker === "jun");
    const openJobs = state.jobs.filter((job) => job.status === "Open" && job.client !== "Mika" && job.location === state.location);
    return `${topBar()}${pageHeading("Find local jobs", "Good work is closer than you think.")}<div class="role-banner worker-banner"><span>WORKER MODE</span><b>Build your reputation, one good job at a time.</b></div>${myJobs.length ? `<div class="section-heading"><h2>My accepted jobs</h2></div>${myJobs.map((job) => jobCard(job, true)).join("")}` : ""}<div class="section-heading jobs-heading"><h2>Jobs near you</h2><span class="muted-small">${openJobs.length} open</span></div>${openJobs.map((job) => jobCard(job, true)).join("") || emptyState("No open jobs nearby", "Check back soon or choose another area.")}`;
  }
  const mine = state.jobs.filter((job) => job.client === "Mika");
  return `${topBar()}${pageHeading("My jobs", "Track requests and connect with local pros.")}<button type="button" class="primary-action post-job-wide" data-action="post-job">＋ Post a new job</button>${mine.map((job) => jobCard(job)).join("") || emptyState("No jobs posted yet", "Post a job and nearby professionals can respond.", '<button class="primary-action" type="button" data-action="post-job">Post your first job</button>')}`;
}

function inboxView() {
  if (state.activeThread) {
    const worker = byId(state.activeThread);
    const messages = state.threads[state.activeThread] || [];
    return `<div class="detail-top"><button class="back-button" type="button" data-action="back-inbox">←</button><span>${escapeHtml(worker.name)}</span><button class="detail-save" type="button" data-action="open-worker" data-id="${worker.id}" aria-label="View professional profile">↗</button></div><div class="chat-thread">${messages.map((message) => `<div class="message-row ${message.from === "Mika" ? "mine" : "theirs"}"><span>${escapeHtml(message.text)}</span><small>${escapeHtml(message.time)}</small></div>`).join("")}</div><form class="message-compose" data-form="message"><input name="message" placeholder="Write a message..." aria-label="Write a message" required maxlength="300"/><button type="submit" aria-label="Send message">↑</button></form>`;
  }
  const threadIds = Object.keys(state.threads);
  return `${topBar()}${pageHeading("Inbox", "Your conversations with local pros.", false)}${threadIds.map((id) => { const worker = byId(id); const messages = state.threads[id]; const last = messages[messages.length - 1]; return `<button class="thread-card" type="button" data-action="open-thread" data-id="${id}"><span class="worker-avatar"><span>${worker.initials}</span><i>✓</i></span><span><b>${escapeHtml(worker.name)}</b><small>${escapeHtml(last.text)}</small></span><time>${escapeHtml(last.time)}</time></button>`; }).join("") || emptyState("Your inbox is ready", "Message a professional to start a conversation.", '<button class="primary-action" type="button" data-action="pros">Browse professionals</button>')}`;
}

function profileView() {
  const saved = state.savedWorkerIds.map(byId).filter(Boolean);
  const displayName = state.role === "worker" ? "Jun Reyes" : "Mika Santos";
  return `${topBar()}${pageHeading("Your profile", "Manage your SugoBai account.", false)}<div class="account-card"><div class="account-avatar">${state.role === "worker" ? "JR" : "M"}</div><div><h2>${displayName}</h2><p>${state.role === "worker" ? `${byId("jun").service} · ${escapeHtml(state.location)}` : `Homeowner · ${escapeHtml(state.location)}`}</p><span class="account-verified">✓ ${state.role === "worker" ? "Worker profile active" : "Homeowner account verified"}</span></div></div><button class="settings-row" type="button" data-action="switch-role"><span class="settings-icon">⇄</span><span><b>Switch to ${state.role === "worker" ? "homeowner" : "worker"} mode</b><small>${state.role === "worker" ? "Browse and post home service requests" : "Find jobs and earn in your community"}</small></span><span>→</span></button><button class="settings-row" type="button" data-action="saved-pros"><span class="settings-icon">♡</span><span><b>Saved professionals</b><small>${saved.length} saved ${saved.length === 1 ? "pro" : "pros"}</small></span><span>→</span></button><button class="settings-row" type="button" data-action="edit-location"><span class="settings-icon">⌖</span><span><b>Service location</b><small>${escapeHtml(state.location)}</small></span><span>→</span></button>${saved.length ? `<div class="section-heading profile-saved-heading"><h2>Your saved pros</h2></div><div class="pro-list">${saved.map(workerCard).join("")}</div>` : emptyState("Save a pro you like", "Their profile will be easy to find here.")}`;
}

function viewContent() {
  if (state.activeThread) return inboxView();
  switch (state.view) {
    case "Services": return servicesView();
    case "Professionals": return prosView();
    case "Search": return searchView();
    case "Worker": return workerDetailView();
    case "Jobs": return jobsView();
    case "Inbox": return inboxView();
    case "Profile": return profileView();
    case "Home":
    default: return homeView();
  }
}

function render() {
  app.innerHTML = viewContent();
  const activeTab = ["Home", "Services", "Professionals", "Search", "Worker"].includes(state.view) ? "Home" : state.view;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === activeTab));
  app.scrollTop = 0;
}

function openDialog(content) {
  dialogRoot.innerHTML = `<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog-panel" role="dialog" aria-modal="true">${content}</section></div>`;
}

function filterDialog() {
  openDialog(`<div class="dialog-heading"><div><span class="eyebrow">REFINE YOUR RESULTS</span><h2>Filter professionals</h2></div><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close">×</button></div><form data-form="filters" class="dialog-form"><label>Service category<select name="service"><option value="">All services</option>${serviceOptions(state.filters.service)}</select></label><label>Minimum rating<select name="minRating"><option value="0">Any rating</option><option value="4" ${state.filters.minRating === 4 ? "selected" : ""}>4.0 stars</option><option value="4.5" ${state.filters.minRating === 4.5 ? "selected" : ""}>4.5 stars</option><option value="4.8" ${state.filters.minRating === 4.8 ? "selected" : ""}>4.8 stars</option></select></label><label class="check-row"><input name="availableOnly" type="checkbox" ${state.filters.availableOnly ? "checked" : ""}/> Available today</label><label class="check-row"><input name="verifiedOnly" type="checkbox" ${state.filters.verifiedOnly ? "checked" : ""}/> Verified profiles only</label><button class="primary-action dialog-submit" type="submit">Show matching pros</button><button class="plain-action" type="button" data-action="clear-filters">Clear all filters</button></form>`);
}

function postJobDialog() {
  openDialog(`<div class="dialog-heading"><div><span class="eyebrow">GET A HAND WITH IT</span><h2>Post a job</h2></div><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close">×</button></div><form data-form="post-job" class="dialog-form"><label>What do you need done?<input name="title" placeholder="e.g. Fix a leaking kitchen sink" required maxlength="70"/></label><label>Service category<select name="service" required><option value="">Choose a service</option>${serviceOptions()}</select></label><label>Job details<textarea name="details" placeholder="Share a few details so pros can prepare." rows="3" required maxlength="400"></textarea></label><div class="form-two"><label>Budget (₱)<input name="budget" type="number" min="100" step="50" placeholder="500" required/></label><label>Location<select name="location">${locationOptions.map((place) => `<option ${place === state.location ? "selected" : ""}>${place}</option>`).join("")}</select></label></div><button class="primary-action dialog-submit" type="submit">Publish job</button></form>`);
}

function changeRole() {
  state.role = state.role === "worker" ? "homeowner" : "worker";
  state.view = state.role === "worker" ? "Jobs" : "Profile";
  state.activeThread = null;
  render();
  showToast(state.role === "worker" ? "Worker mode is on — local jobs are ready" : "Homeowner mode is on");
}

function startConversation(workerId, message = "Hi! I’m interested in your service.") {
  if (!state.threads[workerId]) state.threads[workerId] = [];
  if (message) state.threads[workerId].push({ from: "Mika", text: message, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
  state.activeThread = workerId;
  state.view = "Inbox";
  render();
}

function handleAction(action, element) {
  const id = element.dataset.id;
  switch (action) {
    case "home":
      state.view = "Home"; state.selectedService = ""; state.query = ""; state.activeThread = null; render(); break;
    case "back": state.view = "Professionals"; render(); break;
    case "back-inbox": state.activeThread = null; render(); break;
    case "profile": state.view = "Profile"; state.activeThread = null; render(); break;
    case "location": {
      const next = (locationOptions.indexOf(state.location) + 1) % locationOptions.length;
      state.location = locationOptions[next]; render(); showToast(`Showing pros near ${state.location}`); break;
    }
    case "filters": filterDialog(); break;
    case "clear-filters": state.filters = { service: "", minRating: 0, availableOnly: false, verifiedOnly: false }; state.selectedService = ""; dialogRoot.innerHTML = ""; state.view = "Professionals"; render(); showToast("Filters cleared"); break;
    case "post-job": postJobDialog(); break;
    case "services": state.view = "Services"; state.selectedService = ""; render(); break;
    case "pros": state.view = "Professionals"; render(); break;
    case "service": state.selectedService = element.dataset.service; state.filters.service = ""; state.view = "Professionals"; render(); break;
    case "open-worker": state.selectedWorker = id; state.detailTab = "About"; state.view = "Worker"; state.activeThread = null; render(); break;
    case "save-worker": {
      if (state.savedWorkerIds.includes(id)) { state.savedWorkerIds = state.savedWorkerIds.filter((savedId) => savedId !== id); showToast("Removed from saved professionals"); }
      else { state.savedWorkerIds.push(id); showToast("Professional saved to your profile"); }
      render(); break;
    }
    case "detail-tab": state.detailTab = element.dataset.tab; render(); break;
    case "contact-worker": startConversation(id); break;
    case "book-worker": {
      const worker = byId(id);
      const job = { id: `job-${Date.now()}`, title: `${worker.service.replace(" work", "")} service request`, service: worker.service, details: `Service request sent to ${worker.name}. They’ll confirm the final scope and price in your inbox.`, location: state.location, budget: worker.rate, client: "Mika", status: "Request sent", assignedWorker: worker.id, posted: "Just now" };
      state.jobs.unshift(job);
      if (!state.threads[id]) state.threads[id] = [];
      state.threads[id].push({ from: "Mika", text: `Hi ${worker.name.split(" ")[0]}, I’d like to request your ${worker.service.toLowerCase()} service.`, time: "Just now" });
      state.view = "Jobs"; render(); showToast("Request sent — it’s now in My Jobs"); break;
    }
    case "worker-mode": state.role = "worker"; state.view = "Jobs"; render(); showToast("Worker mode is on — browse open local jobs"); break;
    case "switch-role": changeRole(); break;
    case "saved-pros": state.view = "Profile"; render(); document.querySelector(".profile-saved-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }); break;
    case "edit-location": handleAction("location", element); break;
    case "accept-job": {
      const job = state.jobs.find((item) => item.id === id);
      if (job && job.status === "Open") { job.status = "Accepted"; job.assignedWorker = "jun"; render(); showToast(`You accepted “${job.title}”`); }
      break;
    }
    case "open-thread": state.activeThread = id; state.view = "Inbox"; render(); break;
    case "close-dialog": if (element.classList.contains("dialog-backdrop") || element.classList.contains("dialog-close")) dialogRoot.innerHTML = ""; break;
    case "show-tab":
      state.view = element.dataset.tab;
      state.activeThread = null;
      if (state.view === "Home") { state.selectedService = ""; state.query = ""; }
      else state.selectedService = "";
      render(); break;
  }
}

app.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (actionElement) handleAction(actionElement.dataset.action, actionElement);
});

document.querySelector(".tab-bar").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) handleAction("show-tab", tab);
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  state.view = "Home"; state.selectedService = ""; state.query = ""; state.activeThread = null; render();
});

dialogRoot.addEventListener("click", (event) => {
  if (event.target.closest(".dialog-panel") && !event.target.closest("[data-action]")) return;
  const actionElement = event.target.closest("[data-action]");
  if (actionElement) handleAction(actionElement.dataset.action, actionElement);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dialogRoot.innerHTML) dialogRoot.innerHTML = "";
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!form.matches("[data-form]")) return;
  event.preventDefault();
  const data = new FormData(form);
  switch (form.dataset.form) {
    case "search":
      state.query = String(data.get("query") || "").trim();
      state.view = "Search"; state.selectedService = ""; render();
      if (!state.query) showToast("Showing all local professionals");
      break;
    case "filters":
      state.filters = { service: String(data.get("service") || ""), minRating: Number(data.get("minRating") || 0), availableOnly: data.has("availableOnly"), verifiedOnly: data.has("verifiedOnly") };
      state.selectedService = ""; dialogRoot.innerHTML = ""; state.view = "Professionals"; render(); showToast(`${visibleWorkers().length} pros match your filters`);
      break;
    case "post-job": {
      const job = { id: `job-${Date.now()}`, title: String(data.get("title")).trim(), service: String(data.get("service")), details: String(data.get("details")).trim(), location: String(data.get("location")), budget: Number(data.get("budget")), client: "Mika", status: "Open", posted: "Just now" };
      state.jobs.unshift(job); dialogRoot.innerHTML = ""; state.view = "Jobs"; state.role = "homeowner"; render(); showToast("Your job is live for nearby professionals");
      break;
    }
    case "message": {
      const message = String(data.get("message") || "").trim();
      if (message && state.activeThread) { state.threads[state.activeThread].push({ from: "Mika", text: message, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }); render(); }
      break;
    }
  }
});

render();
