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
  // Every chat is about one job, between its homeowner and one pro: "<jobId>:<workerId>".
  // Newest first, so key order is inbox order. Messages from "system" are job events.
  threads: {
    "job-clean:grace": [
      { from: "grace", text: "Hello sir! Si Grace ni, nag offer ko sa imong deep clean. Pwede ra ko sa Friday, buntag ko moadto. Magdala ba ko vacuum o naa ra mo?", time: "11:40 AM" },
      { from: "jun", text: "Naa mi vacuum Te. Ang kusina jud ang pinaka hugaw, daghan mantika sa bungbong hehe", time: "11:52 AM" },
    ],
    "job-clean:marites": [
      { from: "marites", text: "Maayong buntag Sir Jun! Kung ako imong kuhaon, magdala ko ug kauban para mahuman ra sa usa ka adlaw 😊", time: "10:30 AM" },
    ],
    "job-gate:nonoy": [
      { from: "jun", text: "Bai Nonoy, pwede nimo ma check among gate karong semanaha? Nag taya na man sa ubos.", time: "Nov 9" },
      { from: "nonoy", text: "Sige sir, ugma ra ko makasugod. Kiskisan sa nako ang taya unya primer usa para dili dayon mo balik.", time: "Nov 9" },
      { from: "system", text: "You hired Nonoy for ₱1,800, due Fri, Nov 13", time: "Nov 9" },
      { from: "nonoy", text: "Sir pasensya kaayo, nag ulan man gud niadtong Martes, dili pa uga ang primer. Nag request ko nga i-move sa Sabado ang due ha.", time: "8:12 AM" },
    ],
    "job-sala:marites": [
      { from: "system", text: "You confirmed the job. Final price ₱900", time: "Yesterday" },
      { from: "jun", text: "Salamat kaayo Te Marites! Limpyo kaayo ang balay, nakuyawan ang mga bisita hehe", time: "Yesterday" },
      { from: "marites", text: "Way sapayan sir! Chat lang ko balik next month kung kinahanglan nimo 🙏", time: "Yesterday" },
    ],
    "job-faucet:rico": [
      { from: "rico", text: "Sir ang piyesa sa gripo ₱450, labor ₱550. ₱1,000 tanan.", time: "Nov 8" },
      { from: "jun", text: "Sige Rico, go lang. Salamat", time: "Nov 8" },
      { from: "system", text: "Rico marked the job done", time: "Yesterday" },
      { from: "rico", text: "Sir human na. Bag-o na ang gripo, wala nay tulo. Pasensya kay nalangan ug usa ka adlaw, nahutdan man ug stock ang hardware.", time: "Yesterday" },
    ],
    "job-1:jun": [
      { from: "mika", text: "Hi Jun! Pwede ka mag install ug ceiling fan diri sa Lahug karong semanaha?", time: "9:02 AM" },
      { from: "jun", text: "Hi Ma'am Mika! Naa pa koy gitapos nga trabaho sa Banilad hangtod ugma. Inig human ana, mag send dayon ko ug offer ha.", time: "9:14 AM" },
    ],
    "job-11:jun": [
      { from: "joy", text: "Jun, libre ka sa Sabado? Pa check unta nako among outlets diri sa Mabolo, mo spark man gud inig saksak 😅", time: "Yesterday" },
    ],
    "job-lena:jun": [
      { from: "system", text: "Lena hired you for ₱900, due Fri, Nov 13", time: "Nov 10" },
      { from: "jun", text: "Maayong hapon Ma'am Lena. Otw na ko, mga 15 mins.", time: "Yesterday" },
      { from: "jun", text: "Ma'am natangtang na nako ang daan nga fixture. Kulang lang ug mas taas nga bracket ang bag-o, dal-on nako ugma para mahuman na.", time: "Yesterday" },
      { from: "lena", text: "Sige Jun, salamat kaayo! Naa ra ko diri ugma tibuok adlaw.", time: "Yesterday" },
    ],
  },
  unread: ["job-gate:nonoy", "job-faucet:rico", "job-clean:marites", "job-11:jun"],
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
  const input = scrollEl.querySelector(".composer input");
  if (draft && input) input.value = draft;
  scrollEl.dataset.view = state.view;
  appEl.classList.toggle("no-tabbar", NO_TABBAR.includes(state.view));
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === currentTab()) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  // Unread dot on the Inbox tab, for chats in the current mode.
  const unread = state.unread.some((id) => state.threads[id] && inRole(id));
  const inboxTab = document.querySelector('.tab[data-tab="Inbox"]');
  inboxTab.toggleAttribute("data-unread", unread);
  inboxTab.setAttribute("aria-label", unread ? "Inbox, new messages" : "Inbox");
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

// One job at a time: hiring a pro withdraws their offers everywhere else, and a request
// still waiting on them reopens to other pros.
function hireWorker(job, workerId) {
  const { price, due } = offerTerms(job, workerId);
  Object.assign(job, { status: "In progress", hired: workerId, offers: [], agreed: { price, start: state.today, due } });
  let withdrawn = 0;
  for (const other of state.jobs) {
    if (other === job) continue;
    if (other.offers.includes(workerId)) {
      other.offers = other.offers.filter((id) => id !== workerId);
      withdrawn += 1;
    }
    if (other.requested === workerId && other.status === "Requested") {
      delete other.requested;
      other.status = "Open";
    }
  }
  return { price, due, withdrawn };
}

const nowTime = () => new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const jobById = (id) => state.jobs.find((j) => j.id === id);

/* ---------- Chats: one per job and pro ---------- */
const threadKey = (jobId, workerId) => `${jobId}:${workerId}`;
// The chat with whoever was hired. When Jun is the worker, job.hired is Jun himself.
const jobThread = (job) => threadKey(job.id, job.hired);

// Who's on the other side of a chat, and whether Jun is the homeowner in it.
function threadInfo(id) {
  const [jobId, workerId] = id.split(":");
  const job = jobById(jobId);
  const asClient = job.client === WORKER_SELF;
  return { job, workerId, asClient, other: asClient ? workerById(workerId) : PEOPLE[job.client] };
}

// "open": nobody hired yet, so messages are capped. "active": with the hired pro.
// "closed": the job is completed or went to another pro, so the chat is read-only.
function threadStage(id) {
  const { job, workerId } = threadInfo(id);
  if (job.status === "Completed") return "closed";
  if (job.hired) return job.hired === workerId ? "active" : "closed";
  return "open";
}
// PH mobile numbers (0917 123 4567, +63 917…), or any run of 7+ digits with spaces or dashes.
const PHONE_SRC = String.raw`(?:\+?63|0)?9\d{2}[\s-]?\d{3}[\s-]?\d{4}|\d[\d\s-]{5,}\d`;
const PHONE = new RegExp(PHONE_SRC);
const PHONE_ALL = new RegExp(PHONE_SRC, "g");
const sentCount = (id) => (state.threads[id] || []).filter((m) => m.from === WORKER_SELF).length;
const messagesLeft = (id) => Math.max(0, CHAT_RULE.preHireLimit - sentCount(id));

// Homeowner mode shows chats on Jun's own jobs; worker mode, chats where Jun is the pro.
function inRole(id) {
  const [jobId, workerId] = id.split(":");
  const job = jobById(jobId);
  if (!job) return false;
  return state.role === "worker" ? workerId === WORKER_SELF : job.client === WORKER_SELF;
}

function openThread(id) {
  state.threads[id] ||= [];
  state.unread = state.unread.filter((u) => u !== id);
  go("Thread", { threadId: id });
}

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
  // Chats are about a job: reopen one that's still going, or pick a job to ask about.
  message: (el) => {
    const w = workerById(el.dataset.id);
    const existing = Object.keys(state.threads).find((id) => id.endsWith(`:${w.id}`) && inRole(id) && threadStage(id) !== "closed");
    if (existing) return openThread(existing);
    const jobs = state.jobs.filter((j) => j.client === WORKER_SELF && j.category === w.category && !j.hired && (j.status === "Open" || j.status === "Requested"));
    if (jobs.length === 1) return openThread(threadKey(jobs[0].id, w.id));
    openSheet(messageAboutSheet({ jobs, worker: w }));
  },
  "message-client": (el) => {
    const c = PEOPLE[el.dataset.id];
    const existing = Object.keys(state.threads).find((id) => id.endsWith(`:${WORKER_SELF}`) && jobById(id.split(":")[0])?.client === c.id && threadStage(id) !== "closed");
    if (existing) return openThread(existing);
    const jobs = state.jobs.filter((j) => j.client === c.id && j.category === me().category && j.status === "Open");
    if (jobs.length === 1) return openThread(threadKey(jobs[0].id, WORKER_SELF));
    openSheet(messageAboutSheet({ jobs, client: c }));
  },
  "start-thread": (el) => { closeSheet(); openThread(el.dataset.id); },
  attach: () => showToast("Photo sharing isn't available in this preview"),
  "open-thread": (el) => openThread(el.dataset.id),
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
    closeSheet();
    sendMessage(threadKey(job.id, worker.id), `Hi ${name}! Nag send ko nimo ug request para sa ${cat.label.toLowerCase()} diri sa ${state.area}. Libre ka karong semanaha?`);
    go("Jobs");
    showToast(`Request sent to ${name}`);
    // The pro answers with a price and a finish date, which Jun can then hire.
    later(() => {
      if (!jobById(job.id) || job.status !== "Requested") return;
      const due = addDays(state.today, 2);
      job.offers = [worker.id];
      job.terms = { [worker.id]: { price: worker.rate, due } };
      receive(threadKey(job.id, worker.id), worker.id, `Hello sir! Kaya ra na nako. ${money(worker.rate)} akong singil, mahuman nako by ${fmtDay(due)}.`);
      showToast(`${name} sent a price and finish date`);
    });
  },
  hire: (el) => {
    const [jobId, workerId] = el.dataset.id.split(":");
    const { price, due } = hireWorker(jobById(jobId), workerId);
    const name = firstName(workerById(workerId).name);
    postEvent(threadKey(jobId, workerId), `You hired ${name} for ${money(price)}, due ${fmtDay(due)}`);
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
  "check-work": (el) => openSheet(confirmWorkSheet(jobById(el.dataset.id))),
  // Homeowner confirms the work. SugoBai records the final quote; payment happens offline.
  "confirm-work": (el) => {
    const job = jobById(el.dataset.id);
    const w = workerById(job.hired);
    const d = lateDeduction(job, state.today);
    Object.assign(job, { status: "Completed", final: { total: d.total, deduction: d.amount, on: state.today } });
    w.jobs += 1;
    postEvent(jobThread(job), `You confirmed the job. Final price ${money(d.total)}`);
    render({ keepScroll: true });
    openSheet(reviewSheet(job)); // the review sheet says what to pay, so no toast under it
  },
  review: (el) => openSheet(reviewSheet(jobById(el.dataset.id))),
  "rate-client": (el) => openSheet(clientReviewSheet(jobById(el.dataset.id))),
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
    showToast(`${name} will check the work`);
    later(() => {
      const d = lateDeduction(job, state.today);
      Object.assign(job, { status: "Completed", final: { total: d.total, deduction: d.amount, on: state.today } });
      me().jobs += 1;
      postEvent(jobThread(job), `${name} confirmed the job. Final price ${money(d.total)}`);
      receive(jobThread(job), client.id, "Salamat kaayo Jun! Okay na kaayo tanan. Kuhaon ra tika balik sunod 👍");
      showToast(`${name} confirmed the job. Final price ${money(d.total)}`);
    }, 3200);
  },
  "delete-job": (el) => openSheet(deleteJobSheet(jobById(el.dataset.id))),
  "confirm-delete": (el) => {
    state.jobs = state.jobs.filter((j) => j.id !== el.dataset.id);
    // Its chats go with it: every chat belongs to a job.
    for (const id of Object.keys(state.threads)) if (id.startsWith(`${el.dataset.id}:`)) delete state.threads[id];
    state.unread = state.unread.filter((id) => !id.startsWith(`${el.dataset.id}:`));
    closeSheet();
    render({ keepScroll: true });
    showToast("Job deleted");
  },
  offer: (el) => {
    if (activeJobOf(WORKER_SELF)) return showToast("Finish your current job first");
    openSheet(offerSheet(jobById(el.dataset.id)));
  },
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

// Review text: show the problem inline and keep the sheet open until it passes REVIEW_RULE.
function reviewOk(form, text) {
  const problem = reviewProblem(text);
  const box = form.querySelector("[data-review-text]");
  form.querySelector("[data-review-error]").textContent = problem;
  box.toggleAttribute("aria-invalid", !!problem);
  if (problem) box.focus();
  return !problem;
}

// Live character count while writing a review.
document.addEventListener("input", (event) => {
  const box = event.target.closest("[data-review-text]");
  if (!box) return;
  const n = box.value.trim().length;
  const count = box.form.querySelector("[data-review-count]");
  count.textContent = `${n} / ${REVIEW_RULE.max}`;
  count.classList.toggle("is-short", n < REVIEW_RULE.min);
  if (!reviewProblem(box.value.trim())) {
    box.form.querySelector("[data-review-error]").textContent = "";
    box.removeAttribute("aria-invalid");
  }
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
    sendMessage(threadKey(job.id, WORKER_SELF), `${note ? `${note} ` : ""}Akong offer: ${money(price)}, mahuman by ${fmtDay(due)}.`);
    closeSheet();
    render({ keepScroll: true });
    const client = PEOPLE[job.client];
    const name = firstName(client.name);
    showToast(`Offer sent to ${name}`);
    // The homeowner accepts. Jun is then on that job, and his other offers are withdrawn.
    later(() => {
      if (job.status !== "Open" || !job.offers.includes(WORKER_SELF) || activeJobOf(WORKER_SELF)) return;
      const { withdrawn } = hireWorker(job, WORKER_SELF);
      postEvent(jobThread(job), `${name} hired you for ${money(price)}, due ${fmtDay(due)}`);
      receive(jobThread(job), client.id, `Sige Jun, ikaw na lang akong kuhaon. Kita ta!`);
      showToast(`${name} hired you${withdrawn ? `, so your other ${withdrawn === 1 ? "offer was" : `${withdrawn} offers were`} withdrawn` : ""}`);
    }, 4500);
  },
  review: (data, form) => {
    const job = jobById(form.dataset.id);
    const w = workerById(job.hired);
    const stars = Number(data.get("stars"));
    const text = String(data.get("text") || "").trim();
    if (!reviewOk(form, text)) return;
    job.reviewed = stars;
    (REVIEW_TEXT[w.id] ||= []).unshift([WORKER_SELF, monthYear(state.today), text, stars]);
    w.rating = Math.round(((w.rating * w.reviews + stars) / (w.reviews + 1)) * 10) / 10;
    w.reviews += 1;
    closeSheet();
    render({ keepScroll: true });
    showToast(`Thanks! Your review is on ${firstName(w.name)}'s profile.`);
  },
  "review-client": (data, form) => {
    const job = jobById(form.dataset.id);
    const c = PEOPLE[job.client];
    const stars = Number(data.get("stars"));
    const text = String(data.get("text") || "").trim();
    if (!reviewOk(form, text)) return;
    job.clientReviewed = stars;
    (CLIENT_REVIEWS[c.id] ||= []).unshift([WORKER_SELF, monthYear(state.today), text, stars]);
    c.rating = Math.round(((c.rating * c.hires + stars) / (c.hires + 1)) * 10) / 10;
    closeSheet();
    render({ keepScroll: true });
    showToast(`Thanks! Other pros will see your review of ${firstName(c.name)}.`);
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
    let text = String(data.get("text") || "").trim();
    const id = state.threadId;
    const stage = threadStage(id);
    if (!text || stage === "closed" || (stage === "open" && !messagesLeft(id))) return;
    // Before hiring, phone numbers are hidden so the job is agreed on SugoBai.
    if (stage === "open" && PHONE.test(text)) {
      text = text.replace(PHONE_ALL, "[number hidden until hired]");
      showToast("Phone numbers are shared after hiring");
    }
    sendMessage(id, text);
    form.reset(); // so render doesn't carry the sent text over as a draft
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
