// State, routing and events.
const appEl = document.querySelector("#app");
const scrollEl = document.querySelector("#app-scroll");
const sheetRoot = document.querySelector("#sheet-root");
const toastEl = document.querySelector("#toast");

const state = {
  role: "homeowner",          // or "worker"
  area: "Talamban",           // homeowner mode: where Jun lives
  loading: false,             // brief skeleton while results for a new area load
  view: "Home",               // Home | Pros | Worker | Client | Jobs | Inbox | Thread | Profile
  stack: [],                  // previous views, for back
  category: "",               // Pros: category filter
  query: "",                  // Pros: search text
  filters: { verified: false, today: false, top: false },
  workerId: null,
  workerTab: "About",
  clientId: null,
  threadId: null,
  saved: ["marites", "rico"],
  today: DEMO_TODAY,
  jobs: structuredClone(SEED_JOBS),
  // "pro:<workerId>": Jun hiring a pro. "client:<personId>": Jun working for a homeowner.
  // Messages from "system" are job events (hired, due date moved, paid) shown inline.
  threads: {
    "pro:nonoy": [
      { from: "jun", text: "Hi Nonoy, can you look at our gate this week? It's rusting at the bottom.", time: "Nov 9" },
      { from: "nonoy", text: "Yes po, I can start tomorrow. I'll scrape and prime first so it lasts.", time: "Nov 9" },
      { from: "system", text: "You hired Nonoy for ₱1,800, due Fri, Nov 13", time: "Nov 9" },
      { from: "nonoy", text: "Pasensya po, it rained on Tuesday so the primer needs one more day. I asked to move the date to Saturday.", time: "8:12 AM" },
    ],
    "pro:marites": [
      { from: "system", text: "You paid Marites ₱900", time: "Yesterday" },
      { from: "jun", text: "Thank you, Ate Marites! The house looks great.", time: "Yesterday" },
      { from: "marites", text: "Salamat po! See you again next month.", time: "Yesterday" },
    ],
    "pro:rico": [
      { from: "rico", text: "The faucet part is ₱450. Labor is ₱550, so ₱1,000 total.", time: "Nov 8" },
      { from: "jun", text: "Okay, go ahead. Thanks Rico.", time: "Nov 8" },
      { from: "system", text: "Rico marked the job done", time: "Yesterday" },
      { from: "rico", text: "Done po. The new faucet is in and there's no more drip. Sorry it took an extra day.", time: "Yesterday" },
    ],
    "client:mika": [
      { from: "mika", text: "Hi Jun, can you install a ceiling fan in Lahug this week?", time: "9:02 AM" },
      { from: "jun", text: "Hi Mika! Yes, I can come Friday afternoon. Is there existing wiring on the ceiling?", time: "9:14 AM" },
    ],
    "client:joy": [
      { from: "joy", text: "Hi Jun, are you free to check our outlets in Mabolo this Saturday?", time: "Yesterday" },
    ],
    "client:lena": [
      { from: "system", text: "Lena hired you for ₱900, due Fri, Nov 13", time: "Nov 10" },
      { from: "jun", text: "Good afternoon po. I'm on my way, around 15 minutes.", time: "Yesterday" },
      { from: "jun", text: "The old fixture is out. The new one needs a longer bracket, so I'll bring it tomorrow and finish.", time: "Yesterday" },
      { from: "lena", text: "Okay po, thank you Jun!", time: "Yesterday" },
    ],
  },
  unread: ["pro:nonoy", "pro:rico", "client:joy"],
};

const TABS = ["Home", "Jobs", "Inbox", "Profile"];
const PUSHED = ["Pros", "Worker", "Client", "Thread"];   // screens with a back button
const NO_TABBAR = ["Worker", "Client", "Thread"];       // full-screen detail screens

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2400);
}

function go(view, patch = {}) {
  if (PUSHED.includes(view)) state.stack.push({ view: state.view, workerTab: state.workerTab, workerId: state.workerId, clientId: state.clientId, threadId: state.threadId });
  else state.stack = [];
  Object.assign(state, patch, { view });
  render();
}

function back() {
  const prev = state.stack.pop();
  if (prev) Object.assign(state, prev);
  else state.view = "Home";
  render({ keepScroll: false });
}

function currentTab() {
  if (TABS.includes(state.view)) return state.view;
  if (state.view === "Thread") return "Inbox";
  return "Home";
}

let renderedKey = "";
function render({ keepScroll = false } = {}) {
  const top = scrollEl.scrollTop;
  // Keep a half-typed message when a simulated reply re-renders the same thread.
  const key = `${state.view}:${state.threadId}`;
  const draft = key === renderedKey ? scrollEl.querySelector(".composer input")?.value : "";
  const screen = SCREENS[state.view] || SCREENS.Home;
  scrollEl.innerHTML = screen();
  renderedKey = key;
  if (draft) scrollEl.querySelector(".composer input").value = draft;
  scrollEl.dataset.view = state.view;
  appEl.classList.toggle("no-tabbar", NO_TABBAR.includes(state.view));
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === currentTab()) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  scrollEl.scrollTop = keepScroll ? top : 0;
  scrollEl.querySelectorAll("img").forEach((img) => { if (img.complete && img.naturalWidth) markLoaded(img); });
}

function openSheet(html) {
  sheetRoot.innerHTML = html;
  sheetRoot.querySelector(".sheet")?.focus({ preventScroll: true });
}
function closeSheet() { sheetRoot.innerHTML = ""; }

function toggleSaved(id) {
  const worker = workerById(id);
  if (state.saved.includes(id)) {
    state.saved = state.saved.filter((s) => s !== id);
    showToast(`Removed ${firstName(worker.name)} from saved`);
  } else {
    state.saved.push(id);
    showToast(`Saved ${firstName(worker.name)}`);
  }
  render({ keepScroll: true });
}

// Same account, other mode: cover the screen with a short handoff so the change reads as one person switching hats.
function switchRole() {
  if (appEl.querySelector(".role-switch")) return;
  const toWorker = state.role !== "worker";
  const overlay = document.createElement("div");
  overlay.className = "role-switch";
  overlay.setAttribute("role", "status");
  overlay.innerHTML = `${avatar(me(), 72)}
    <p><b>${toWorker ? "Worker mode" : "Homeowner mode"}</b><span>${toWorker ? "Find jobs and get hired near you" : "Book pros for your home"}</span></p>
    <span class="role-switch-bar"></span>`;
  closeSheet();
  toastEl.classList.remove("visible");
  appEl.append(overlay);
  setTimeout(() => {
    state.role = toWorker ? "worker" : "homeowner";
    go("Home");
  }, 450);
  setTimeout(() => overlay.classList.add("is-leaving"), 1100);
  setTimeout(() => overlay.remove(), 1400);
}

// Add a message and move its thread to the top of the inbox.
function addMessage(threadId, from, text) {
  const { [threadId]: thread = [], ...rest } = state.threads;
  state.threads = { [threadId]: [...thread, { from, text, time: nowTime() }], ...rest };
}
const sendMessage = (threadId, text) => addMessage(threadId, WORKER_SELF, text);
const postEvent = (threadId, text) => addMessage(threadId, "system", text);
function receive(threadId, from, text) {
  addMessage(threadId, from, text);
  const reading = state.view === "Thread" && state.threadId === threadId;
  if (!reading && !state.unread.includes(threadId)) state.unread.push(threadId);
}

// The other side of a job is played by the demo: their reply lands a few seconds later.
function later(fn, ms = 2600) {
  setTimeout(() => { fn(); render({ keepScroll: true }); }, ms);
}

const nowTime = () => new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const jobById = (id) => state.jobs.find((j) => j.id === id);
// Thread between Jun and the other side of a job, from Jun's side.
const jobThread = (job) => (job.client === WORKER_SELF ? `pro:${job.hired}` : `client:${job.client}`);

const ACTIONS = {
  back,
  "close-sheet": (el, event) => { if (event.target === el || el.matches("button")) closeSheet(); },
  tab: (el) => { state.category = ""; state.query = ""; go(el.dataset.tab); },
  category: (el) => go("Pros", { category: el.dataset.id, query: "" }),
  "all-pros": () => go("Pros", { category: "", query: "" }),
  "clear-filters": () => { state.filters = { verified: false, today: false, top: false }; render(); },
  filter: (el) => { const key = el.dataset.id; state.filters[key] = !state.filters[key]; render({ keepScroll: true }); },
  "open-worker": (el) => go("Worker", { workerId: el.dataset.id, workerTab: "About" }),
  "open-client": (el) => go("Client", { clientId: el.dataset.id }),
  "worker-tab": (el) => { state.workerTab = el.dataset.id; render({ keepScroll: true }); },
  save: (el) => toggleSaved(el.dataset.id),
  message: (el) => {
    const id = `pro:${el.dataset.id}`;
    if (!state.threads[id]) state.threads[id] = [];
    go("Thread", { threadId: id });
  },
  "message-client": (el) => {
    const id = `client:${el.dataset.id}`;
    if (!state.threads[id]) state.threads[id] = [];
    go("Thread", { threadId: id });
  },
  attach: () => showToast("Photo sharing isn't available in this preview"),
  "open-thread": (el) => { state.unread = state.unread.filter((id) => id !== el.dataset.id); go("Thread", { threadId: el.dataset.id }); },
  area: () => openSheet(areaSheet()),
  "set-area": (el) => {
    closeSheet();
    if (state.role === "worker") workerById(WORKER_SELF).area = el.dataset.id;
    else state.area = el.dataset.id;
    // Show skeletons briefly, as a real app would while fetching results for the new area.
    state.loading = true;
    render();
    setTimeout(() => {
      state.loading = false;
      render({ keepScroll: true });
      showToast(state.role === "worker" ? `Showing jobs near ${el.dataset.id}` : `Showing pros near ${el.dataset.id}`);
    }, 700);
  },
  "post-job": () => openSheet(postJobSheet()),
  request: (el) => {
    const worker = workerById(el.dataset.id);
    const name = firstName(worker.name);
    const cat = categoryById(worker.category);
    const job = { id: `job-${Date.now()}`, title: `${cat.label} request for ${name}`, category: worker.category, details: "", area: state.area, budget: worker.rate, client: WORKER_SELF, status: "Requested", posted: "Just now", offers: [], requested: worker.id };
    state.jobs.unshift(job);
    sendMessage(`pro:${worker.id}`, `Hi ${name}, I sent you a request for ${cat.label.toLowerCase()} work in ${state.area}.`);
    go("Jobs");
    showToast(`Request sent to ${name}`);
    // The pro answers with a price and a finish date, which Jun can then hire.
    later(() => {
      if (!jobById(job.id) || job.status !== "Requested") return;
      const due = addDays(state.today, 2);
      job.offers = [worker.id];
      job.terms = { [worker.id]: { price: worker.rate, due } };
      receive(`pro:${worker.id}`, worker.id, `Hi Jun! I can do it for ${money(worker.rate)} and finish by ${fmtDay(due)}.`);
      showToast(`${name} sent a price and finish date`);
    });
  },
  hire: (el) => {
    const [jobId, workerId] = el.dataset.id.split(":");
    const job = jobById(jobId);
    const { price, due } = offerTerms(job, workerId);
    Object.assign(job, { status: "In progress", hired: workerId, offers: [], agreed: { price, start: state.today, due } });
    const name = firstName(workerById(workerId).name);
    postEvent(`pro:${workerId}`, `You hired ${name} for ${money(price)}, due ${fmtDay(due)}`);
    render({ keepScroll: true });
    showToast(`You hired ${name}. Due ${fmtDay(due)}.`);
  },
  "approve-time": (el) => {
    const job = jobById(el.dataset.id);
    job.agreed.due = job.extension.to;
    delete job.extension;
    postEvent(jobThread(job), `You moved the due date to ${fmtDay(job.agreed.due)}`);
    render({ keepScroll: true });
    showToast(`Due date moved to ${fmtDay(job.agreed.due)}`);
  },
  "decline-time": (el) => {
    const job = jobById(el.dataset.id);
    delete job.extension;
    postEvent(jobThread(job), `You kept the due date, ${fmtDay(job.agreed.due)}`);
    render({ keepScroll: true });
    showToast(`Due date stays ${fmtDay(job.agreed.due)}`);
  },
  pay: (el) => openSheet(paySheet(jobById(el.dataset.id))),
  review: (el) => openSheet(reviewSheet(jobById(el.dataset.id))),
  "ask-time": (el) => openSheet(moreTimeSheet(jobById(el.dataset.id))),
  "mark-done": (el) => openSheet(markDoneSheet(jobById(el.dataset.id))),
  "confirm-done": (el) => {
    const job = jobById(el.dataset.id);
    const client = PEOPLE[job.client];
    const name = firstName(client.name);
    Object.assign(job, { status: "Done", finished: state.today });
    postEvent(jobThread(job), "You marked the job done");
    closeSheet();
    render({ keepScroll: true });
    showToast(`${name} will check the work and pay`);
    later(() => {
      const d = lateDeduction(job, state.today);
      Object.assign(job, { status: "Completed", paid: { total: d.total, deduction: d.amount, on: state.today } });
      me().jobs += 1;
      postEvent(jobThread(job), `${name} paid you ${money(d.total)}`);
      receive(jobThread(job), client.id, "Salamat Jun! Everything works. I'll book you again.");
      showToast(`${name} paid you ${money(d.total)}`);
    }, 3200);
  },
  "delete-job": (el) => openSheet(deleteJobSheet(jobById(el.dataset.id))),
  "confirm-delete": (el) => {
    state.jobs = state.jobs.filter((j) => j.id !== el.dataset.id);
    closeSheet();
    render({ keepScroll: true });
    showToast("Job deleted");
  },
  offer: (el) => openSheet(offerSheet(state.jobs.find((j) => j.id === el.dataset.id))),
  "switch-role": switchRole,
  "my-profile": () => go("Worker", { workerId: WORKER_SELF, workerTab: "About" }),
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || !appEl.contains(el)) return;
  ACTIONS[el.dataset.action]?.(el, event);
});

document.querySelector("#tabbar").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) ACTIONS.tab(tab);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sheetRoot.innerHTML) closeSheet();
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  FORMS[form.dataset.form]?.(data, form);
});

const FORMS = {
  search: (data) => go("Pros", { query: String(data.get("q") || "").trim(), category: state.view === "Pros" ? state.category : "" }),
  "post-job": (data) => {
    state.jobs.unshift({
      id: `job-${Date.now()}`, title: String(data.get("title")).trim(), category: String(data.get("category")),
      details: String(data.get("details") || "").trim(), area: String(data.get("area")), budget: Number(data.get("budget")),
      client: WORKER_SELF, status: "Open", posted: "Just now", offers: [],
    });
    closeSheet(); state.role = "homeowner"; go("Jobs");
    showToast("Job posted. Nearby pros can now send offers.");
  },
  offer: (data, form) => {
    const job = jobById(form.dataset.id);
    const price = Number(data.get("price"));
    const due = String(data.get("due"));
    job.offers.push(WORKER_SELF);
    (job.terms ||= {})[WORKER_SELF] = { price, due };
    const note = String(data.get("note") || "").trim();
    sendMessage(`client:${job.client}`, `${note ? `${note} ` : ""}My offer: ${money(price)}, done by ${fmtDay(due)}.`);
    closeSheet();
    render({ keepScroll: true });
    showToast(`Offer sent to ${firstName(PEOPLE[job.client].name)}`);
  },
  pay: (data, form) => {
    const job = jobById(form.dataset.id);
    const w = workerById(job.hired);
    const d = lateDeduction(job, state.today);
    Object.assign(job, { status: "Completed", paid: { total: d.total, deduction: d.amount, on: state.today, method: String(data.get("method")) } });
    w.jobs += 1;
    postEvent(`pro:${w.id}`, `You paid ${firstName(w.name)} ${money(d.total)}`);
    render({ keepScroll: true });
    openSheet(reviewSheet(job)); // the review sheet confirms the payment, so no toast under it
  },
  review: (data, form) => {
    const job = jobById(form.dataset.id);
    const w = workerById(job.hired);
    const stars = Number(data.get("stars"));
    const text = String(data.get("text") || "").trim();
    job.reviewed = stars;
    (REVIEW_TEXT[w.id] ||= []).unshift([WORKER_SELF, parseDay(state.today).toLocaleDateString("en-US", { month: "short", year: "numeric" }), text, stars]);
    w.rating = Math.round(((w.rating * w.reviews + stars) / (w.reviews + 1)) * 10) / 10;
    w.reviews += 1;
    closeSheet();
    render({ keepScroll: true });
    showToast(`Thanks! Your review is on ${firstName(w.name)}'s profile.`);
  },
  "more-time": (data, form) => {
    const job = jobById(form.dataset.id);
    const client = PEOPLE[job.client];
    const name = firstName(client.name);
    const to = String(data.get("to"));
    job.extension = { to, reason: String(data.get("reason")).trim() };
    postEvent(jobThread(job), `You asked to move the due date to ${fmtDay(to)}`);
    closeSheet();
    render({ keepScroll: true });
    showToast(`Asked ${name} for more time`);
    later(() => {
      if (!job.extension) return;
      job.agreed.due = job.extension.to;
      delete job.extension;
      postEvent(jobThread(job), `${name} moved the due date to ${fmtDay(to)}`);
      showToast(`${name} said yes. New due date ${fmtDay(to)}.`);
    }, 3200);
  },
  message: (data, form) => {
    const text = String(data.get("text") || "").trim();
    if (!text) return;
    sendMessage(state.threadId, text);
    render();
    scrollEl.scrollTop = scrollEl.scrollHeight;
    scrollEl.querySelector("input[name=text]")?.focus();
  },
};

// Presentation QR: open full view; close on the X, a click outside the code, or Escape (native to <dialog>).
const qrView = document.querySelector("#qr-view");
document.querySelector("#qr-open").addEventListener("click", () => qrView.showModal());
qrView.addEventListener("click", (event) => {
  if (!event.target.closest("img, p")) qrView.close();
});

// Image skeletons: images shimmer until they load (or fail), then stop.
const markLoaded = (img) => img.classList.add("is-loaded");
document.addEventListener("load", (event) => { if (event.target.tagName === "IMG") markLoaded(event.target); }, true);
document.addEventListener("error", (event) => { if (event.target.tagName === "IMG") markLoaded(event.target); }, true);

// Device frame: scale so the whole phone fits the viewport. Only has a visible effect in framed mode.
function fitFrame() {
  const scale = Math.min(1, (innerHeight - 48) / 868, (innerWidth - 48) / 414);
  document.documentElement.style.setProperty("--frame-scale", scale.toFixed(3));
}
addEventListener("resize", fitFrame);
fitFrame();

function tickClock() {
  document.querySelector("#device-time").textContent = new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "");
}
tickClock();
setInterval(tickClock, 30000);

render();
