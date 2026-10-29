// Mock content for the SugoBai presentation. Areas are barangays/districts in Cebu City.
const AREAS = {
  Lahug: [10.3333, 123.8985],
  Mabolo: [10.3185, 123.9150],
  Banilad: [10.3430, 123.9120],
  "IT Park": [10.3300, 123.9060],
  Talamban: [10.3655, 123.9170],
  Guadalupe: [10.3195, 123.8870],
  "Capitol Site": [10.3150, 123.8925],
};

const CATEGORIES = [
  { id: "electrical", label: "Electrical", trade: "Electrician", plural: "Electricians", icon: "lightning" },
  { id: "plumbing", label: "Plumbing", trade: "Plumber", plural: "Plumbers", icon: "pipe-wrench" },
  { id: "cleaning", label: "Cleaning", trade: "House cleaner", plural: "House cleaners", icon: "broom" },
  { id: "carpentry", label: "Carpentry", trade: "Carpenter", plural: "Carpenters", icon: "hammer" },
  { id: "painting", label: "Painting", trade: "Painter", plural: "Painters", icon: "paint-roller" },
  { id: "errands", label: "Errands", trade: "Errand runner", plural: "Errand runners", icon: "moped" },
];

// Homeowners who post jobs and write reviews. Rating is what pros gave them after a job.
const PEOPLE = Object.fromEntries([
  ["mika", "Mika Ramos", "Lahug", 2023, true, 4.9, 9],
  ["joy", "Joy Rosales", "Mabolo", 2022, true, 5.0, 14],
  ["paolo", "Paolo Diaz", "IT Park", 2024, true, 4.8, 7],
  ["lena", "Lena Mercado", "Banilad", 2023, true, 4.9, 11],
  ["carlo", "Carlo Mendoza", "Guadalupe", 2024, false, 4.7, 5],
  ["bea", "Bea Villanueva", "Capitol Site", 2022, true, 5.0, 16],
  ["nestor", "Nestor Gabuya", "Talamban", 2025, true, 4.8, 2],
  ["rhea", "Rhea Uy", "Banilad", 2025, false, 4.9, 3],
  ["arnel", "Arnel Sy", "Lahug", 2024, true, 4.8, 4],
].map(([id, name, area, since, idVerified, rating, hires]) => [id, { id, name, area, since, idVerified, rating, hires, photo: `assets/people/${id}.webp` }]));

// What pros wrote about a homeowner after a job: [workerId, date, text].
const CLIENT_REVIEWS = {
  mika: [
    ["rico", "Oct 2026", "Clear about the problem and had the area under the sink cleared before I came."],
    ["tomas", "Jun 2026", "Paid right after the job and offered merienda. Easy to work with."],
  ],
  joy: [
    ["jun", "Sep 2026", "Fan was already unboxed and the breaker was labeled. Paid on the spot."],
    ["ramil", "Oct 2026", "Sent photos of the drain beforehand, so I brought the right parts."],
  ],
  paolo: [
    ["marites", "Oct 2026", "Left the condo key with the guard as agreed. Very organized."],
  ],
  lena: [
    ["jun", "Aug 2026", "Gate was open when I arrived and she was home to show me the problem."],
    ["nonoy", "Jul 2026", "Bought the paint ahead of time and paid in full the same day."],
  ],
  carlo: [
    ["arvin", "Oct 2026", "Knew exactly where he wanted the outlet. Quick to reply in chat."],
  ],
  bea: [
    ["lorna", "Oct 2026", "Kind and respectful. She trusts me with the house keys now."],
    ["jessa", "Oct 2026", "Clear grocery list and paid back the receipt total right away."],
  ],
  nestor: [
    ["nonoy", "Oct 2026", "Showed me all the rusty spots first. Paid the agreed price, no haggling."],
  ],
  rhea: [
    ["cherry", "Sep 2026", "Had the color picked and the furniture moved before I arrived."],
  ],
  arnel: [
    ["dodong", "Oct 2026", "Explained what he wanted with photos. Paid on time."],
  ],
};

const WORKERS = [
  {
    id: "jun", name: "Jun Cabahug", category: "electrical", area: "Talamban",
    rating: 4.9, reviews: 38, jobs: 52, rate: 600, unit: "visit", from: true, available: true,
    idVerified: true, since: 2023,
    credential: { title: "Electrical Installation and Maintenance NC II", issuer: "TESDA", year: 2018 },
    about: "Licensed electrician for homes and small shops. I install ceiling fans and lights, fix tripping breakers and add outlets. I explain the work and the price before I start.",
    work: ["Kitchen wall lights", "Wall outlet replacement", "Pendant light installed"],
  },
  {
    id: "marites", name: "Marites Ybañez", category: "cleaning", area: "Mabolo",
    rating: 5.0, reviews: 61, jobs: 74, rate: 900, unit: "half day", from: false, available: true,
    idVerified: true, since: 2022,
    credential: null,
    about: "General and deep cleaning for condos and houses. I bring my own supplies. Move-in and move-out cleaning available on weekends.",
    work: ["Kitchen cabinets wiped down", "Bathroom sink and fixtures", "Floors mopped, condo unit"],
  },
  {
    id: "rico", name: "Rico Abellana", category: "plumbing", area: "Lahug",
    rating: 4.8, reviews: 42, jobs: 57, rate: 550, unit: "visit", from: true, available: false,
    idVerified: true, since: 2023,
    credential: { title: "Plumbing NC II", issuer: "TESDA", year: 2016 },
    about: "Leaks, clogged drains, faucet and toilet replacement. Fifteen years of residential plumbing around Lahug and Busay.",
    work: ["Water line repair", "New bathroom faucet", "Shower enclosure installed"],
  },
  {
    id: "ana", name: "Ana Pacaña", category: "electrical", area: "Banilad",
    rating: 4.8, reviews: 19, jobs: 23, rate: 500, unit: "visit", from: true, available: true,
    idVerified: true, since: 2024,
    credential: { title: "Electrical Installation and Maintenance NC II", issuer: "TESDA", year: 2021 },
    about: "Switches, outlets, lighting and safety checks before you move into a new place. Weekday evenings are fine.",
    work: ["Switch installation", "Outlet wiring", "Safety check with a tester"],
  },
  {
    id: "tomas", name: "Tomas Alcoseba", category: "carpentry", area: "Talamban",
    rating: 4.9, reviews: 31, jobs: 40, rate: 850, unit: "day", from: false, available: true,
    idVerified: true, since: 2022,
    credential: { title: "Carpentry NC II", issuer: "TESDA", year: 2012 },
    about: "Cabinet repair, wall shelves and small furniture made to fit your space. I can buy the materials for you and show the receipts.",
    work: ["Wooden corner shelf", "Cabinet hinge repair", "Narra table and stool"],
  },
  {
    id: "luis", name: "Luis Tumulak", category: "painting", area: "IT Park",
    rating: 4.7, reviews: 16, jobs: 18, rate: 750, unit: "day", from: false, available: true,
    idVerified: false, since: 2025,
    credential: null,
    about: "Interior and exterior repainting with careful masking and clean edges. Price is for labor; paint is billed at cost.",
    work: ["Accent wall, clean edges", "Bedroom repaint", "Apartment exterior"],
  },
  {
    id: "kent", name: "Kent Lapitan", category: "errands", area: "IT Park",
    rating: 4.9, reviews: 88, jobs: 140, rate: 150, unit: "errand", from: true, available: true,
    idVerified: true, since: 2024,
    credential: null,
    about: "Motorcycle errands around Cebu City: groceries, bills payment, parcel drop-off and pick-up. Within 5 km.",
    work: ["Errands by motorcycle", "Groceries left at the door", "Pharmacy pick-up handoff"],
  },
  {
    id: "dodong", name: "Dodong Villaflor", category: "carpentry", area: "Lahug",
    rating: 4.8, reviews: 27, jobs: 35, rate: 800, unit: "day", from: false, available: true,
    idVerified: true, since: 2023,
    credential: { title: "Carpentry NC II", issuer: "TESDA", year: 2009 },
    about: "Doors that won't close, sagging cabinets, termite-damaged trim. Thirty years of carpentry around Lahug and Camputhaw.",
    work: ["Door edge planed to close", "Trim boards cut to size", "Old window frames restored"],
  },
  {
    id: "grace", name: "Grace Sanchez", category: "cleaning", area: "Lahug",
    rating: 4.9, reviews: 22, jobs: 29, rate: 850, unit: "half day", from: false, available: true,
    idVerified: true, since: 2024,
    credential: null,
    about: "Weekly and one-time cleaning for apartments and boarding houses. I do laundry and ironing too if you need it.",
    work: ["Bathroom vanity wiped down", "Mirror and lamp dusted", "Kitchen cabinets cleaned"],
  },
  {
    id: "ramil", name: "Ramil Ouano", category: "plumbing", area: "Mabolo",
    rating: 4.7, reviews: 14, jobs: 20, rate: 500, unit: "visit", from: true, available: true,
    idVerified: true, since: 2024,
    credential: { title: "Plumbing NC II", issuer: "TESDA", year: 2019 },
    about: "Clogged drains, low water pressure and water heater hookups. I bring common parts so most fixes are done in one visit.",
    work: ["New water lines roughed in", "Shower pipe stub-out", "Towel warmer hooked up"],
  },
  {
    id: "cherry", name: "Cherry Lim", category: "painting", area: "Banilad",
    rating: 4.9, reviews: 11, jobs: 13, rate: 700, unit: "day", from: false, available: false,
    idVerified: true, since: 2025,
    credential: null,
    about: "Room repaints and accent walls. I help you pick colors and I cover every floor and fixture before I open a can.",
    work: ["White wall, second coat", "Room masked before painting", "Sage green accent wall"],
  },
  {
    id: "nonoy", name: "Nonoy Cabrera", category: "painting", area: "Talamban",
    rating: 4.8, reviews: 24, jobs: 31, rate: 750, unit: "day", from: false, available: true,
    idVerified: true, since: 2023,
    credential: null,
    about: "Gates, grills, walls and roofs. Rust is scraped and primed before any topcoat, so the paint lasts through the rainy season.",
    work: ["Ceiling repainted", "Charcoal feature wall", "Gray wall, rolled smooth"],
  },
  {
    id: "arvin", name: "Arvin Tan", category: "electrical", area: "Guadalupe",
    rating: 4.7, reviews: 9, jobs: 12, rate: 550, unit: "visit", from: true, available: true,
    idVerified: false, since: 2025,
    credential: { title: "Electrical Installation and Maintenance NC II", issuer: "TESDA", year: 2024 },
    about: "Lights, outlets and aircon circuits. Newly certified, careful, and happy to explain what I'm doing.",
    work: ["Outlet strip wired", "Four-gang outlet installed", "Hallway ceiling light"],
  },
  {
    id: "lorna", name: "Lorna Dela Cruz", category: "cleaning", area: "Guadalupe",
    rating: 5.0, reviews: 47, jobs: 66, rate: 800, unit: "half day", from: false, available: false,
    idVerified: true, since: 2022,
    credential: null,
    about: "Thorough house cleaning, kitchens especially. Twenty years keeping homes in Guadalupe and Capitol Site spotless.",
    work: ["Toilet deep-cleaned", "Bathroom sink scrubbed", "Dishes washed by hand"],
  },
  {
    id: "edgar", name: "Edgar Rosal", category: "plumbing", area: "Capitol Site",
    rating: 4.9, reviews: 35, jobs: 48, rate: 600, unit: "visit", from: true, available: true,
    idVerified: true, since: 2022,
    credential: { title: "Plumbing NC II", issuer: "TESDA", year: 2011 },
    about: "Leaks, toilets, sinks and new water lines for small renovations. I quote before I start and clean up after.",
    work: ["Shower and toilet installed", "Water line on a finished wall", "Bathroom vanity hookup"],
  },
  {
    id: "jessa", name: "Jessa Uy", category: "errands", area: "Capitol Site",
    rating: 4.8, reviews: 52, jobs: 90, rate: 150, unit: "errand", from: true, available: true,
    idVerified: true, since: 2024,
    credential: null,
    about: "Groceries, pharmacy runs, bills and parcels by motorcycle. I send photos of receipts as I go.",
    work: ["Errands by motorcycle", "Groceries ready for drop-off", "Parcel left at the door"],
  },
];

const REVIEW_TEXT = {
  jun: [
    ["joy", "Sep 2026", "Arrived on time, installed the fan and cleaned up after. He showed me the breaker he used."],
    ["lena", "Aug 2026", "Explained the problem clearly and the price was what he quoted."],
  ],
  marites: [
    ["paolo", "Oct 2026", "Our condo has never been this clean. She even did the windows."],
    ["mika", "Sep 2026", "Careful with our things and finished early. Booking her again."],
  ],
  rico: [
    ["mika", "Oct 2026", "Fixed the leak under the sink in under an hour. Fair price."],
    ["joy", "Jul 2026", "Replaced our toilet flush. Neat work and he brought the parts."],
  ],
  ana: [
    ["lena", "Oct 2026", "Checked all our outlets before we moved in and found two loose ones."],
    ["paolo", "Aug 2026", "Quick, polite and the new lights look great."],
  ],
  tomas: [
    ["joy", "Sep 2026", "The shelves are solid and he matched the wood to our cabinets."],
    ["mika", "Jun 2026", "Fixed every loose hinge in the kitchen. Very patient."],
  ],
  luis: [
    ["paolo", "Oct 2026", "Clean lines and no mess on the floor. Took two days as promised."],
  ],
  kent: [
    ["lena", "Oct 2026", "Did my grocery list exactly and sent the receipt right away."],
    ["joy", "Oct 2026", "Paid our bills at the mall and was back in 40 minutes."],
  ],
  dodong: [
    ["arnel", "Oct 2026", "Rehung our warped bedroom door. It closes properly for the first time in years."],
    ["mika", "Aug 2026", "Built a shoe rack that fits the space exactly. Fair price for the wood."],
  ],
  grace: [
    ["arnel", "Sep 2026", "Fast and very tidy. She noticed things I always forget, like the fan blades."],
  ],
  ramil: [
    ["joy", "Oct 2026", "Unclogged our kitchen drain in 20 minutes and showed me what caused it."],
  ],
  cherry: [
    ["rhea", "Sep 2026", "Our daughter's room looks lovely. No paint on the floor anywhere."],
  ],
  nonoy: [
    ["nestor", "Oct 2026", "Scraped and repainted our whole gate. Still no rust after the typhoon."],
    ["lena", "Jul 2026", "Repainted our roof before the rains. Neat edges and he cleaned up well."],
  ],
  arvin: [
    ["carlo", "Oct 2026", "Added an outlet for our aircon and labeled the breaker. Polite and careful."],
  ],
  lorna: [
    ["bea", "Oct 2026", "Best cleaning we've ever had. The kitchen tiles look new."],
    ["carlo", "Aug 2026", "Very trustworthy. We leave her the keys now."],
  ],
  edgar: [
    ["bea", "Sep 2026", "Fixed the running toilet and a leaking faucet in one visit."],
    ["carlo", "Jul 2026", "Explained the quote clearly and finished on time."],
  ],
  jessa: [
    ["bea", "Oct 2026", "Got all the medicine on my list and sent the receipt right away."],
    ["paolo", "Sep 2026", "Picked up my parcel from the courier and delivered it within the hour."],
  ],
};

const SEED_JOBS = [
  // Posted by the account holder (Jun, as a homeowner).
  { id: "job-gate", title: "Repaint the front gate and grills", category: "painting", details: "Steel gate and window grills, some rust. Paint already bought.", area: "Talamban", budget: 1800, client: "jun", status: "Open", posted: "40 min ago", offers: ["nonoy", "cherry"],
    terms: { nonoy: { price: 1800, when: "Tomorrow" }, cherry: { price: 1600, when: "This week" } } },
  { id: "job-clean", title: "Deep clean before the fiesta", category: "cleaning", details: "Two-storey house, three bedrooms. Kitchen and bathrooms most important.", area: "Talamban", budget: 1500, client: "jun", status: "Open", posted: "3 hr ago", offers: [] },
  // Electrical jobs Jun can send offers on, one or two per area.
  { id: "job-1", title: "Install a ceiling fan in the sala", category: "electrical", details: "One ceiling fan, already bought. Ceiling is plywood, wiring is already there.", area: "Lahug", budget: 800, client: "mika", status: "Open", posted: "25 min ago", offers: ["jun", "ana"],
    terms: { jun: { price: 800, when: "Tomorrow" }, ana: { price: 700, when: "Today" } } },
  { id: "job-5", title: "Breaker keeps tripping at night", category: "electrical", details: "Main breaker trips when the aircon and rice cooker run together.", area: "Talamban", budget: 700, client: "nestor", status: "Open", posted: "15 min ago", offers: [] },
  { id: "job-6", title: "Add two outlets in the bedroom", category: "electrical", details: "Need outlets on the wall by the desk. Concrete wall, surface wiring is fine.", area: "Guadalupe", budget: 900, client: "carlo", status: "Open", posted: "50 min ago", offers: ["arvin"] },
  { id: "job-11", title: "Check outlets before a party", category: "electrical", details: "Two outlets spark when plugged in. Want them checked before Saturday.", area: "Mabolo", budget: 600, client: "joy", status: "Open", posted: "Yesterday", offers: [] },
  { id: "job-12", title: "Wall lights for the front porch", category: "electrical", details: "Two outdoor wall lights, already bought. Switch should be inside the door.", area: "Capitol Site", budget: 1200, client: "bea", status: "Open", posted: "2 hr ago", offers: [] },
  { id: "job-13", title: "Aircon outlet is loose", category: "electrical", details: "The plug wobbles and the outlet gets warm. Condo unit, 12th floor.", area: "IT Park", budget: 500, client: "paolo", status: "Open", posted: "4 hr ago", offers: [] },
  { id: "job-14", title: "Replace a dead light switch", category: "electrical", details: "Hallway switch stopped working. Bulb is fine.", area: "Banilad", budget: 400, client: "rhea", status: "Open", posted: "5 hr ago", offers: [] },
  // Other trades, so the marketplace isn't only electrical.
  { id: "job-2", title: "Leaking pipe under the kitchen sink", category: "plumbing", details: "Slow drip under the sink, worse at night. Hoping someone can check it this week.", area: "Mabolo", budget: 600, client: "joy", status: "Open", posted: "1 hr ago", offers: [] },
  { id: "job-3", title: "General cleaning, 2-bedroom condo", category: "cleaning", details: "Kitchen, two bathrooms and floors. Supplies provided if needed.", area: "IT Park", budget: 1500, client: "paolo", status: "Open", posted: "2 hr ago", offers: [] },
  { id: "job-4", title: "Fix a loose cabinet hinge", category: "carpentry", details: "Upper kitchen cabinet door is hanging from one hinge.", area: "Banilad", budget: 400, client: "lena", status: "Open", posted: "3 hr ago", offers: [] },
  { id: "job-7", title: "Pick up medicine and groceries", category: "errands", details: "Pharmacy then the supermarket on Escario. List will be sent in chat.", area: "Capitol Site", budget: 250, client: "bea", status: "Open", posted: "10 min ago", offers: ["jessa"] },
  { id: "job-9", title: "Paint one bedroom wall", category: "painting", details: "Accent wall, about 3 by 4 meters. Color is picked out.", area: "Lahug", budget: 1200, client: "arnel", status: "Open", posted: "6 hr ago", offers: [] },
];

// The signed-in account. Jun is one person with two modes: he hires pros for his own
// home in Talamban (homeowner mode) and takes electrical jobs (worker mode).
const WORKER_SELF = "jun";

const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
const workerById = (id) => WORKERS.find((w) => w.id === id);
const personById = (id) => PEOPLE[id] || workerById(id);
const workerPhoto = (w) => `assets/people/${w.id}.webp`;
const workPhoto = (w, i) => `assets/work/${w.id}-${i + 1}.webp`;

// Road distance estimate between two areas, in km.
function distanceKm(from, to) {
  const [a1, o1] = AREAS[from];
  const [a2, o2] = AREAS[to];
  const rad = Math.PI / 180;
  const h = Math.sin(((a2 - a1) * rad) / 2) ** 2 + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin(((o2 - o1) * rad) / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3;
  return Math.max(0.8, Math.round(km * 10) / 10);
}
