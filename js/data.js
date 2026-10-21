// Mock content for the SugoBai presentation. Areas are barangays/districts in Cebu City.
const AREAS = {
  Lahug: [10.3333, 123.8985],
  Mabolo: [10.3185, 123.9150],
  Banilad: [10.3430, 123.9120],
  "IT Park": [10.3300, 123.9060],
  Talamban: [10.3655, 123.9170],
};

const CATEGORIES = [
  { id: "electrical", label: "Electrical", trade: "Electrician", plural: "Electricians", icon: "lightning" },
  { id: "plumbing", label: "Plumbing", trade: "Plumber", plural: "Plumbers", icon: "pipe-wrench" },
  { id: "cleaning", label: "Cleaning", trade: "House cleaner", plural: "House cleaners", icon: "broom" },
  { id: "carpentry", label: "Carpentry", trade: "Carpenter", plural: "Carpenters", icon: "hammer" },
  { id: "painting", label: "Painting", trade: "Painter", plural: "Painters", icon: "paint-roller" },
  { id: "errands", label: "Errands", trade: "Errand runner", plural: "Errand runners", icon: "moped" },
];

// People who post jobs, write reviews, or use the app as a homeowner.
const PEOPLE = {
  mika: { id: "mika", name: "Mika Ramos", area: "Lahug", photo: "assets/people/mika.webp" },
  joy: { id: "joy", name: "Joy Rosales", area: "Mabolo", photo: "assets/people/joy.webp" },
  paolo: { id: "paolo", name: "Paolo Diaz", area: "IT Park", photo: "assets/people/paolo.webp" },
  lena: { id: "lena", name: "Lena Mercado", area: "Banilad", photo: "assets/people/lena.webp" },
};

const WORKERS = [
  {
    id: "jun", name: "Jun Cabahug", category: "electrical", area: "Talamban",
    rating: 4.9, reviews: 38, jobs: 52, rate: 600, unit: "visit", from: true, available: true,
    idVerified: true, since: 2023,
    credential: { title: "Electrical Installation and Maintenance NC II", issuer: "TESDA", year: 2018 },
    about: "Licensed electrician for homes and small shops. I install ceiling fans and lights, fix tripping breakers and add outlets. I explain the work and the price before I start.",
    work: ["Ceiling light installation", "Wall outlet replacement", "Kitchen wall lights"],
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
};

const SEED_JOBS = [
  { id: "job-1", title: "Install a ceiling fan in the sala", category: "electrical", details: "One ceiling fan, already bought. Ceiling is plywood, wiring is already there.", area: "Lahug", budget: 800, client: "mika", status: "Open", posted: "25 min ago", offers: ["jun", "ana"] },
  { id: "job-2", title: "Leaking pipe under the kitchen sink", category: "plumbing", details: "Slow drip under the sink, worse at night. Hoping someone can check it this week.", area: "Mabolo", budget: 600, client: "joy", status: "Open", posted: "1 hr ago", offers: [] },
  { id: "job-3", title: "General cleaning, 2-bedroom condo", category: "cleaning", details: "Kitchen, two bathrooms and floors. Supplies provided if needed.", area: "IT Park", budget: 1500, client: "paolo", status: "Open", posted: "2 hr ago", offers: [] },
  { id: "job-4", title: "Fix a loose cabinet hinge", category: "carpentry", details: "Upper kitchen cabinet door is hanging from one hinge.", area: "Banilad", budget: 400, client: "lena", status: "Open", posted: "3 hr ago", offers: [] },
];

const WORKER_SELF = "jun"; // the account used in worker mode

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
