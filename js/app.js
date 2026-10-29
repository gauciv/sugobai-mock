// State, routing and events.
const appEl = document.querySelector("#app");
const scrollEl = document.querySelector("#app-scroll");
const sheetRoot = document.querySelector("#sheet-root");
const toastEl = document.querySelector("#toast");

const state = {
  role: "homeowner",          // or "worker"
  area: "Talamban",           // homeowner mode: where Jun lives
  loading: false,             // brief skeleton while results for a new area load
  view: "Home",               // Home | Pros | Worker | Jobs | Inbox | Thread | Profile
  stack: [],                  // previous views, for back
  category: "",               // Pros: category filter
  query: "",                  // Pros: search text
  filters: { verified: false, today: false, top: false },
  workerId: null,
  workerTab: "About",
  threadId: null,
  saved: ["marites", "rico"],
  jobs: SEED_JOBS.map((job) => ({ ...job, offers: [...job.offers] })),
  // "pro:<workerId>": Jun hiring a pro. "client:<personId>": Jun working for a homeowner.
  threads: {
    "pro:nonoy": [
      { from: "jun", text: "Hi Nonoy, can you look at our gate this week? It's rusting at the bottom.", time: "10:05 AM" },
      { from: "nonoy", text: "Yes po, I can come tomorrow morning. I'll scrape and prime first so it lasts.", time: "10:21 AM" },
    ],
    "pro:marites": [
      { from: "jun", text: "Thank you, Ate Marites! The house looks great.", time: "Yesterday" },
      { from: "marites", text: "Salamat po! See you again next month.", time: "Yesterday" },
    ],
    "pro:rico": [
      { from: "rico", text: "The faucet part is ₱450. Labor is ₱550, so ₱1,000 total.", time: "Mon" },
      { from: "jun", text: "Okay, go ahead. Thanks Rico.", time: "Mon" },
    ],
    "client:mika": [
      { from: "mika", text: "Hi Jun, can you install a ceiling fan in Lahug this week?", time: "9:02 AM" },
      { from: "jun", text: "Hi Mika! Yes, I can come Thursday afternoon. Is there existing wiring on the ceiling?", time: "9:14 AM" },
    ],
    "client:joy": [
      { from: "joy", text: "Hi Jun, are you free to check our outlets in Mabolo this Saturday?", time: "Yesterday" },
    ],
    "client:lena": [
      { from: "jun", text: "Good afternoon po. I'm on my way, around 15 minutes.", time: "Mon" },
      { from: "lena", text: "Okay po, the gate is open. Thank you!", time: "Mon" },
    ],
  },
  unread: ["pro:nonoy", "client:joy"],
};

const TABS = ["Home", "Jobs", "Inbox", "Profile"];
const PUSHED = ["Pros", "Worker", "Thread"];       // screens with a back button
const NO_TABBAR = ["Worker", "Thread"];           // full-screen detail screens

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2400);
}

function go(view, patch = {}) {
  if (PUSHED.includes(view)) state.stack.push({ view: state.view, workerTab: state.workerTab, workerId: state.workerId });
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

function render({ keepScroll = false } = {}) {
  const top = scrollEl.scrollTop;
  const screen = SCREENS[state.view] || SCREENS.Home;
  scrollEl.innerHTML = screen();
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
function sendMessage(threadId, text) {
  const { [threadId]: thread = [], ...rest } = state.threads;
  state.threads = { [threadId]: [...thread, { from: WORKER_SELF, text, time: nowTime() }], ...rest };
}

const nowTime = () => new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

const ACTIONS = {
  back,
  "close-sheet": (el, event) => { if (event.target === el || el.matches("button")) closeSheet(); },
  tab: (el) => { state.category = ""; state.query = ""; go(el.dataset.tab); },
  category: (el) => go("Pros", { category: el.dataset.id, query: "" }),
  "all-pros": () => go("Pros", { category: "", query: "" }),
  "clear-filters": () => { state.filters = { verified: false, today: false, top: false }; render(); },
  filter: (el) => { const key = el.dataset.id; state.filters[key] = !state.filters[key]; render({ keepScroll: true }); },
  "open-worker": (el) => go("Worker", { workerId: el.dataset.id, workerTab: "About" }),
  "worker-tab": (el) => { state.workerTab = el.dataset.id; render({ keepScroll: true }); },
  save: (el) => toggleSaved(el.dataset.id),
  message: (el) => {
    const id = `pro:${el.dataset.id}`;
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
    const cat = categoryById(worker.category);
    state.jobs.unshift({ id: `job-${Date.now()}`, title: `${cat.label} request for ${firstName(worker.name)}`, category: worker.category, details: "", area: state.area, budget: worker.rate, client: WORKER_SELF, status: "Requested", posted: "Just now", offers: [], hired: worker.id });
    sendMessage(`pro:${worker.id}`, `Hi ${firstName(worker.name)}, I sent you a request for ${cat.label.toLowerCase()} work in ${state.area}.`);
    go("Jobs");
    showToast(`Request sent to ${firstName(worker.name)}`);
  },
  hire: (el) => {
    const [jobId, workerId] = el.dataset.id.split(":");
    const job = state.jobs.find((j) => j.id === jobId);
    job.status = "Hired"; job.hired = workerId;
    render({ keepScroll: true });
    showToast(`You hired ${firstName(workerById(workerId).name)}`);
  },
  "delete-job": (el) => openSheet(deleteJobSheet(state.jobs.find((j) => j.id === el.dataset.id))),
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
    const job = state.jobs.find((j) => j.id === form.dataset.id);
    const price = Number(data.get("price"));
    job.offers.push(WORKER_SELF);
    (job.terms ||= {})[WORKER_SELF] = { price, when: String(data.get("when")) };
    const note = String(data.get("note") || "").trim();
    sendMessage(`client:${job.client}`, `${note ? `${note} ` : ""}My offer: ${money(price)}, ${String(data.get("when")).toLowerCase()}.`);
    closeSheet();
    render({ keepScroll: true });
    showToast(`Offer sent to ${firstName(PEOPLE[job.client].name)}`);
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
