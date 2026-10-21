# SugoBai UI redesign: audit and plan

Status: **built (2026-10-21)**; after screenshots in `design-audit/after/`. Approved with changes: The changes below override the rest of this document wherever they conflict.

## Decisions after review
- **Compact, calm UI is the priority.** As a user, not a lot should be going on. So:
  - Type scale tightened: display 26, title 20, heading 17, body 15, small 14, caption 13. The 13px floor stays.
  - Spacing tightened: gutter 16, card padding 14, gap between sections 24.
  - Removed from the plan: job status stepper (now one status badge + an offers line), worker earnings summary, inbox tip and suggestions, "Common jobs in Cebu" list, and "Sorted by rating" note.
  - Empty states: icon, title, one line, one action. Low-content screens stay calm instead of being filled.
  - Worker card: photo strip kept (it's the trust signal), but as a single row of short thumbnails.
  - Max one primary action per screen.
- **No QR code.** There's no deploy URL yet. The backdrop is just the flat color and the logo.
- **Fonts load from Google Fonts.** The venue Wi-Fi is reliable.
- **"All services" screen dropped.** All six categories live on Home.
- WIP baseline committed as `2e1a504`.
- **Type changed to a single family: Schibsted Grotesk (400–700).** Atkinson Hyperlegible Next has a slashed zero with no plain-zero alternate (checked ss01–ss04, salt, cv01, zero). That made every price, date and rating read technical (₱6ØØ, 2Ø26). One family also keeps the UI calmer.

Before screenshots: `design-audit/before/` (19 states × 390×844 and 1440×900, plus `-bottom` captures where the screen scrolls). Captured from the current working tree, including the uncommitted changes to `app.js`, `index.html` and `styles.css`.

---

## 1. Inventory

The app is vanilla HTML/CSS/JS with no build step. `app.js` renders template strings into `#app-scroll` based on `state.view`.

### Screens
| # | Screen | Function in `app.js` | Notes |
|---|---|---|---|
| 1 | Home | `homeView` | Greeting, headline, search, cartoon banner, 4 category tiles, 2 worker cards, "Skilled worker?" link |
| 2 | All services | `servicesView` | Category grid, **then** a search bar, **then** a pro list (three jobs on one screen) |
| 3 | Professionals list | `prosView` | Filter summary + worker cards, with empty state |
| 4 | Search results | `searchView` | Same as 3 with a query title |
| 5 | Worker profile | `workerDetailView` | Tabs About / Services / Reviews, recent work, sticky Message + Request |
| 6 | Jobs (homeowner) | `jobsView` | "Post a new job" + job cards. Has a back button although it's a top-level tab |
| 7 | Jobs (worker mode) | `jobsView` | "WORKER MODE" banner, accepted jobs, open jobs nearby |
| 8 | Inbox list | `inboxView` | One thread by default, mostly blank |
| 9 | Inbox thread | `inboxView` (activeThread) | Bubbles + composer |
| 10 | Profile (homeowner / worker) | `profileView` | Account card, settings rows, saved pros |
| 11 | Filters sheet | `filterDialog` | |
| 12 | Post a job sheet | `postJobDialog` | |
| – | Empty states | `emptyState` | Pros list, search, jobs, inbox, saved pros |
| – | Toast | `showToast` | |

### Shared pieces (currently template helpers, not real components)
`topBar` (location + avatar, on every tab), `pageHeading` (eyebrow + title + optional back), `searchRow`, `workerCard`, `jobCard`, `serviceTiles`, `emptyState`, dialog shell, tab bar, phone frame markup in `index.html`.

## 2. Audit: what's wrong, with evidence

**Root cause of the tiny text.** The phone screen renders at about 300 CSS px wide, so every size was shrunk to compensate. `styles.css` has **69 font declarations under 10px** (6px ×10, 7px ×26, 8px ×22, 9px ×11). Meta text, tab labels, prices, ratings and filter links all sit at 7–9px. Fix: the framed screen will be exactly **390×844 CSS px**, the same as a real iPhone 14/15, and the whole device gets scaled with `transform`. Screens then use real phone sizes (16px body), and they look identical framed or full-screen.

**The phone frame shows on real phones.** At 390×844 the frame, fake 9:41 status bar, dynamic island and home indicator all render inside the real phone (see `01-home@390x844.png`). The only frame rules are `max-width: 760px` / `390px` shrink rules.

**Generic AI aesthetic (all screens).**
- Backdrop: `.ambient` blobs with concentric rings, a radial gradient and a dotted 25px grid (`.stage`).
- Gradients on surfaces and buttons: `.worker-book`, `.primary-action`, `.avatar-button`, `.worker-avatar`, `.profile-avatar`, hero and profile cover.
- Highlight word in the headline: "person for the *job.*" in orange, plus "Good work. *Good people.*" in blue.
- Blue (`#277ce1`) is the de facto action color while the brand is orange, so there are two competing accents.

**Eyebrow labels with no information.** "YOUR LOCATION", "LOCAL HELP, MADE SIMPLE", "SUGOBAI · CEBU CITY" (on every page heading), "WORKER MODE", "REFINE YOUR RESULTS", "GET A HAND WITH IT".

**No real assets.**
- Initials circles for every person (`JR`, `MS`, `M`).
- Diagonal-line CSS placeholders for every work photo (`.work-a/b/c`, `.portfolio-item`).
- Category "icons" are Unicode glyphs: `ϟ ⌁ ✦ ⌂ ◩ ＋`. Plumbing (`⌁`) is unreadable, and Cleaning is a sparkle.
- More glyphs used as icons: `⌖ ◷ ♡ ♥ ↗ ⇄ ✳ ←`, and `→` appended to most buttons.

**Redundant UI.**
- `topBar()` (location + avatar) repeats on Home, Services, Pros, Search, Jobs, Inbox and Profile. The avatar duplicates the Profile tab.
- `pageHeading()` defaults to `back = true`, so Jobs (a top-level tab) gets a back button that goes Home.
- The worker card has "View profile & work →" **and** a full-width "View profile →" button, both inside one big button (nested interactive meaning, one tap target).
- The Services screen mixes a category index, search and a pro list.

**Focus and active states.** No `:focus-visible` styles anywhere. Tapping a tab leaves the browser's default focus ring, which shows as the hard black rectangle. The active tab is only a blue tint.

**Low-content screens.** Jobs with one job is about 60% blank (`10-jobs-homeowner@390x844.png`). Inbox with one thread is about 75% blank. Empty states are a sparkle glyph and one line of text.

**Trust signals buried.** "★ 5.0 · 25 reviews · ID verified" is 7–8px grey text. Verified shows up as three different 11px check marks, in three different places on one card. "Jobs completed" only appears in a caption. The profile shows stats, but the credential is a small row under About.

**Content.** All workers are in "Cebu City / Mandaue / Lapu-Lapu" with no neighborhood. Prices like ₱350/visit for an electrician are low for Cebu. No worker does Errands, so that category is always empty.

**Dead code.** `.preview-status`, `.side-note`, `.preview-footer`, `.promo-*`, `.sun`, `.bag`, `.brand-mark`, `.recent-section` have no markup. The logo is a 3.3 MB, 2005×2048 PNG.

## 3. Design direction: "Neighborhood hardware store"

SugoBai replaces flyers taped to electric posts and Facebook-group posts. The trustworthy local version of that is the corner hardware store or a barangay hall noticeboard done properly: plain, sturdy, honest materials, clear prices, people you can recognize. The visual language follows from that:

- **Photos of real work carry the design.** The memorable element, and the one place the design gets bold, is that **every worker appears with their work**. Worker cards open with a strip of three past-job photos, and the profile opens on a full-bleed photo of a finished job. Everything around it stays quiet.
- **One trust line, everywhere.** Verified ID, rating with review count, and jobs completed form a single component (`TrustLine`) at a readable size (14px, ink, with icons). It appears in the same order and form on cards, profiles, inbox threads and job offers. Nothing about trust is grey.
- **Warm, sturdy neutrals.** A concrete-grey page, white cards, dark slate ink. Safety orange from the hard hat is the only accent, used for the primary action and the brand. No gradients, glass or blobs.
- **Hierarchy through type and space.** Size, weight and spacing do the work. Color is the last resort.
- **Sentence case, plain words.** No eyebrows, no appended arrows, no middle-dot strings. Meta is laid out as structure (icon + value), not joined with `·`.

### Review against the brief and defaults
- The first pass had a cream page (#F4F1EA family) with a serif display. That's a known generic AI look, and a serif doesn't fit a practical services app. **Changed** to a cooler concrete grey (#F3F2EF) with a sturdy grotesk.
- I considered a trust-green accent for buttons. The brief says one accent, so green is limited to **semantic** use (verified and available), always paired with an icon and words.
- I considered making the hero a big headline with a "200+ pros" stat row, which is the default stat treatment. **Rejected.** Home opens with the question and the search box, then photos.
- Yellow rating stars are a template habit. **Changed** to ink stars, which are calmer and still read instantly.

## 4. Tokens

### Color
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--paper` | `#F3F2EF` | App background (warm concrete) | – |
| `--surface` | `#FFFFFF` | Cards, sheets, bars | – |
| `--line` | `#E2DFD9` | 1px borders, dividers | – |
| `--ink` | `#1E242C` | Primary text, icons, stars | 13.96 on paper |
| `--ink-2` | `#48505B` | Secondary text | 7.29 on paper |
| `--ink-3` | `#5F6772` | Meta text (lowest allowed) | 5.11 on paper |
| `--accent` | `#F7841A` | Brand orange, sampled from the hard hat. Primary button fill, active indicators | Ink text on it: 6.15 |
| `--accent-ink` | `#A34A00` | Orange as **text** (links, prices on chips) | 5.30 on paper |
| `--accent-wash` | `#FDEBD8` | Selected chip, active tab pill | accent-ink on it: 5.10 |
| `--trust` | `#1E6B47` | Verified / available text and icons only | 5.77 on paper |
| `--trust-wash` | `#E3F1E8` | Verified badge background | trust on it: 5.54 |

All text pairs pass WCAG AA. **Note:** white text on the brand orange is only 2.54:1, so primary buttons use **ink text on orange**. That's a deliberate safety-signage look, and it's accessible. Dark mode is out of scope for the presentation.

### Type (max 2 families, Google Fonts)
- **Schibsted Grotesk** (600/700) for headings, names and prices. It was drawn for a Scandinavian news publisher: sturdy and plain-spoken, with slightly condensed letterforms that fit long Filipino names ("Tomas Alcoseba") on one line. It feels like signage, not startup.
- **Atkinson Hyperlegible Next** (400/600) for body, meta and UI. Braille Institute designed it for maximum legibility, with clearly distinct `1 l I` and `0 O` and open numerals. That matters for prices (₱1,200), ratings (4.9) and the range of ages and phones the app has to work for.
- Not Inter, Poppins, Plus Jakarta Sans, DM Sans or Manrope (the current fonts).

Scale (px, at a real 390px screen):

| Token | Size / line height | Use |
|---|---|---|
| `--t-display` | 30 / 34, 700 | Home question, page titles |
| `--t-title` | 22 / 28, 700 | Section titles, profile name |
| `--t-heading` | 18 / 24, 600 | Card titles, worker names on cards |
| `--t-body` | 16 / 24, 400 | Body, inputs (16px also stops iOS zooming into inputs) |
| `--t-small` | 14 / 20, 400/600 | Trust line, meta, secondary |
| `--t-caption` | 13 / 18, 600 | Tab labels, badges. **Floor: nothing smaller than 13px.** |

### Spacing, radius, elevation
- Spacing on a 4px base: `4 8 12 16 20 24 32 40`. Screen gutter **20px**, card padding 16, gap between sections 32.
- Radius follows hierarchy, so not everything shares one value: chips/badges `6`, inputs/buttons `10`, cards `14`, photos inside cards `10`, sheets `20` (top corners), avatars and pills `999`.
- Elevation: cards are flat with a 1px `--line` border. Shadows appear only where something floats: the sticky action bar, bottom sheets, the toast and the device frame.
- Tap targets ≥ 44×44.

### Focus and motion
- `:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }`, plus the radius of the element. No outline on mouse or touch focus.
- Motion only answers actions: the sheet slides up (200ms), the toast fades, the save heart toggles. `prefers-reduced-motion` turns it off. No load animations.

## 5. Layout sketches (390px)

```
HOME                                   WORKER CARD (the bold element)
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ [logo] ⌖ Lahug, Cebu City ▾  │       │ ┌────────┬────────┬────────┐ │
│                              │       │ │ photo  │ photo  │ photo  │ │  past work, 3-up
│ What needs doing,            │       │ └────────┴────────┴────────┘ │
│ Mika?                        │       │ (avatar) Jun Cabahug      ♡  │
│ ┌──────────────────────┐ ┌─┐ │       │          Electrician · 2.1 km│  ← trade + distance (layout, not dots)
│ │🔍 Try "leaking sink"  │ │≡│ │       │ ✓ ID verified ★ 4.9 (38) 38 jobs│ ← TrustLine 14px
│ └──────────────────────┘ └─┘ │       │ From ₱600 / visit  Available today│
│ ┌────┐┌────┐┌────┐           │       └──────────────────────────────┘
│ │ ⚡ ││ 🔧 ││ 🧹 │ …         │        One tap target → profile. Save is a separate button.
│ └────┘└────┘└────┘           │
│ Electr. Plumb. Clean. Carp.  │       WORKER PROFILE
│                              │       ┌──────────────────────────────┐
│ Top-rated near you           │       │ ←  [full-bleed work photo] ♡ │
│ [worker card]                │       │   (avatar 88)                │
│ [worker card]                │       │ Jun Cabahug                  │
│                              │       │ Electrician in Talamban      │
│ Do you do this kind of work? │       │ [TrustLine, large, 3 cells]  │
│ Find jobs near you  (link)   │       │ About | Work | Reviews       │
├──────────────────────────────┤       │ …                            │
│  Home   Jobs   Inbox  Profile│       │ [Message] [Request · ₱600]   │
└──────────────────────────────┘       └──────────────────────────────┘
```
Alignment: everything left-aligned to the 20px gutter. Center alignment only inside empty states.

## 6. Component changes

| Component | Change |
|---|---|
| **Device frame** (new, one wrapper) | See §7. Owns the status bar, island, side buttons and home indicator. Screens never see it. |
| **AppShell** | Scroll area + tab bar. Pads with `var(--safe-top)` / `var(--safe-bottom)`, which the frame sets to fixed values and real phones get from `env(safe-area-inset-*)`. |
| **Headers** (3 variants) | `HomeHeader`: logo mark + location picker, **Home and the pro list only**. `PageHeader`: big title, **no back button** on tabs (Jobs, Inbox, Profile). `NavHeader`: back button + title on pushed screens (profile, thread, pro list). No eyebrows anywhere. |
| **Button** | `primary` (orange fill, ink text), `secondary` (white, 1px ink-20 border), `ghost` (text only, accent-ink), `icon` (44px). Flat, radius 10, height 48 (40 compact). No gradients, no `→`. |
| **Icon** | Phosphor **Regular**, one weight everywhere. Inline SVG `<use>` from a local sprite (`assets/icons.svg`), no CDN at runtime. |
| **Avatar** | Real photo, sizes 32 / 44 / 64 / 88. Optional verified badge (trust-colored seal-check on a white ring). Never initials. |
| **Badge** | `verified` (trust-wash + seal-check + "ID verified"), `pending` (neutral, "ID check pending"), `available`, job `status` (Open / Offers / Hired / Done). |
| **TrustLine** (new) | ID verified · rating (review count) · jobs completed. Two sizes: inline (cards, threads) and stat row (profile). The same order everywhere. |
| **WorkerCard** | Photo strip → avatar + name + trade + distance → TrustLine → price + availability. Removes both "View profile" calls to action (the whole card opens the profile). |
| **JobCard** | Title, category icon, area, date needed, budget as a heading. A **status stepper** (Posted → Offers → Hired → Done, a real sequence) and offers from pros (avatar stack + TrustLine) fill the low-content screen with useful information. |
| **CategoryTile** | Phosphor icon + label, 2 rows × 3 on Home (all 6 categories fit, so the separate "All services" screen goes away). |
| **ListRow** | Inbox threads and Profile settings rows: icon/avatar, 16px title, 14px meta, chevron. |
| **Tabs (segmented)** | Profile About / Work / Reviews. Ink text, white active segment, no blue. |
| **Bottom nav** | Phosphor icons, 13px labels. Active = ink icon + label on an `--accent-wash` pill behind the icon. Inactive = ink-3. Real `:focus-visible`. Adds `aria-current="page"`. |
| **Sheet** | Dialogs become bottom sheets with a drag handle, 20px top radius, title + close. No eyebrow. |
| **EmptyState** | Icon in a 56px paper circle, a 18px title, one line of direction, one action, **plus useful content below**: example jobs with typical Cebu prices (Jobs) or saved pros to message (Inbox). |
| **Toast** | Ink background, 14px, above the tab bar. |

### Screen-level changes
- **Home:** removes the cartoon banner, highlight word, eyebrow, avatar button and "See all" for services (all six now fit). Adds "Top-rated near you" with photo cards. The worker-mode link becomes a plain row.
- **All services screen:** merged into Home's grid, and the `Services` view is removed. A category tap opens the pro list, with category chips at the top for switching.
- **Pro list / search:** NavHeader + search + horizontal filter chips (Verified, Available today, 4.5+) that show active filters inline (replaces the 7px filter summary). Sort note: "Sorted by rating".
- **Worker profile:** full-bleed cover photo (their best job), big avatar, TrustLine stat row, credential card (TESDA NC II with issuing body and year) **at the top of About**. Tabs: About / Work (photo grid, captions) / Reviews (reviewer avatar + name + area + date). Sticky Message + Request.
- **Jobs (homeowner):** PageHeader "Your jobs" + Post a job button. The job card has the stepper and an "Offers" section. With no jobs: empty state + "Common jobs in Cebu" quick-start list with typical prices.
- **Jobs (worker):** no "WORKER MODE" banner. The header subtitle says "Showing jobs near Talamban", plus the earnings and jobs-done summary. Job cards get poster avatar + "Posted by Ana · Mabolo".
- **Inbox:** thread rows show avatar + TrustLine (compact) + last message + time. Low content: a quiet "Tip: send a photo of the problem to get a faster quote" note and "Message a saved pro" suggestions.
- **Thread:** NavHeader with avatar + name + verified badge. Bubbles: ink for mine, white for theirs. Photo attach button in the composer (visual only).
- **Profile:** account header with photo, verified badge for the account, list rows with Phosphor icons. Saved pros as compact cards.
- **Filters / Post a job:** bottom sheets, 16px inputs, segmented rating choice instead of a select, and an area picker with Cebu barangays.

## 7. Phone frame behavior

One wrapper in `index.html`: `<div class="device"> chrome… <div class="app">…</div> </div>`. CSS media queries alone decide whether the chrome renders. A ~10-line script only computes the frame's scale factor. Screens use `var(--safe-top|bottom)` and never check the mode.

| Mode | Media query | Behavior |
|---|---|---|
| **Framed** (desktop/laptop) | `(min-width: 700px) and (hover: hover) and (pointer: fine)` | Screen is exactly 390×844 CSS px inside a bezel (about 414×868 total). Scale = `min(1, (innerHeight − 48) / 868)` via `transform: scale()`, centered. 1366×768 → 0.83, 1440×900 → 1. The status bar shows the real current time. `--safe-top: 54px; --safe-bottom: 34px`. |
| **Phone** | anything not framed, under 600px wide | No frame, status bar, island or home indicator. `height: 100dvh`. `--safe-top: env(safe-area-inset-top)`, `--safe-bottom: env(safe-area-inset-bottom)`. Needs `viewport-fit=cover` added to the viewport meta. |
| **Tablet** | not framed, `min-width: 600px` (for example an iPad, whose pointer is coarse) | No frame. App capped at `max-width: 480px`, centered on `--paper-deep`, with 1px side borders. Full height. |

Why these numbers: `pointer: fine` + `hover` separates laptops from tablets better than width does. An iPad in landscape is 1180px wide but has a coarse pointer, so it gets the tablet layout. 700px keeps the frame off narrow desktop windows, where it wouldn't fit next to a margin. A desktop window under 700px gets the phone/tablet treatment, which is also how to preview the unframed mode.

**Backdrop:** a flat `--paper-deep` (`#E7E5E0`), a step darker than the app so the device stands out. Small logo + "SugoBai" wordmark top left. **To the right of the phone:** a white card with a QR code, "Open SugoBai on your phone" and the short URL (QR generated once at build time as an SVG and stored in `assets/`, no runtime library). **I need the deployed URL for this.**

## 8. Assets

### Icons: Phosphor Regular (MIT), vendored as one SVG sprite
I checked that every name below exists in `@phosphor-icons/core@2.1.1`:

| Use | Icon |
|---|---|
| Electrical | `lightning` |
| Plumbing | `pipe-wrench` |
| Cleaning | `broom` |
| Carpentry | `hammer` |
| Painting | `paint-roller` |
| Errands | `moped` (motorcycle errand runners are the local norm) |
| Nav | `house`, `briefcase`, `chat-circle`, `user` |
| Trust | `seal-check` (ID verified), `identification-card` (ID pending), `star`, `check-circle` (jobs done), `certificate` (TESDA) |
| UI | `map-pin`, `magnifying-glass`, `sliders-horizontal`, `heart`, `arrow-left`, `caret-down`, `caret-right`, `clock`, `calendar-blank`, `paper-plane-right`, `plus`, `x`, `camera`, `image` |

### Photos
Sourced from **Pexels and Unsplash** (both free licenses, no attribution required, but each will be credited). I'll prefer photos shot in the Philippines or Southeast Asia, and confirm each is a real photograph, not AI-generated, from the photographer's page. Downloaded, cropped and converted with Pillow to **WebP q≈78**. Network access to both sites works from this environment, so no `ASSETS_TODO.md` should be needed.

| Slot | Files | Size | Search terms |
|---|---|---|---|
| Worker avatars (7) | `assets/people/{jun,marites,rico,ana,tomas,luis,kent}.webp` | 256×256 | "filipino electrician portrait", "filipina cleaner portrait", "filipino construction worker", "southeast asian carpenter", "filipino painter", "motorcycle rider philippines" |
| Homeowner + posters (4) | `assets/people/{mika,ana-r,paolo,lena}.webp` | 256×256 | "filipina woman portrait smiling", "filipino man portrait casual" |
| Past work (3 per worker, 21) | `assets/work/{worker}-{1..3}.webp` | 960×720 (4:3) | e.g. "ceiling light installation", "electrical panel wiring", "kitchen sink pipe repair", "clean kitchen apartment", "wooden shelves carpentry", "freshly painted room", "motorcycle delivery philippines" |
| Logo | `assets/sugobai-mark.webp` + `.png` fallback | 256px and 96px | from the existing logo (3.3 MB → about 20 KB) |
| QR | `assets/qr.svg` | vector | generated from your URL |

Total budget: about 2 MB. Every file's source URL, photographer, license and the date downloaded goes in `ASSETS_CREDITS.md`.

## 9. Content: realistic Cebu data

| Worker | Trade | Area | Price | Credential | ID |
|---|---|---|---|---|---|
| Jun Cabahug | Electrician | Talamban | From ₱600 / visit | TESDA Electrical Installation & Maintenance NC II | Verified |
| Marites Ybañez | House cleaning | Mabolo | ₱900 / half day | – | Verified |
| Rico Abellana | Plumber | Lahug | From ₱550 / visit | TESDA Plumbing NC II | Verified |
| Ana Pacaña | Electrician | Banilad | From ₱500 / visit | TESDA EIM NC II | Verified |
| Tomas Alcoseba | Carpenter | Talamban | ₱850 / day | TESDA Carpentry NC II | Verified |
| Luis Tumulak | Painter | IT Park | ₱750 / day + materials | – | **Pending** (shows the pending state) |
| Kent Lapitan | Errands (motorcycle) | IT Park | ₱150 / errand | – | Verified |

Homeowner: **Mika Ramos**, Lahug. Example jobs: "Install a ceiling fan in the sala" (₱800, Lahug), "Leaking pipe under kitchen sink" (₱600, Mabolo), "General cleaning, 2BR condo near IT Park" (₱1,500), "Fix a loose cabinet hinge" (₱400, Banilad). Locations become **areas within Cebu City** (Lahug, Mabolo, Banilad, IT Park, Talamban), with distance in km from the user's area. Mandaue and Lapu-Lapu stay as cities in the area picker.

## 10. File structure

Still no build step, and the page must work from `file://` (classic scripts, no ES modules):
```
index.html            device wrapper + app shell
styles/tokens.css     color, type, space, radius
styles/frame.css      device + three modes + backdrop
styles/components.css button, avatar, badge, trustline, cards, nav, sheet, toast, empty
styles/screens.css    per-screen layout only
js/data.js            workers, jobs, areas, categories
js/components.js      template functions for components
js/screens.js         one function per screen
js/app.js             state, routing, events, frame scaling
assets/icons.svg, assets/people/, assets/work/, assets/qr.svg
ASSETS_CREDITS.md
```
Old `styles.css` and `app.js` get deleted at the end, once nothing references them.

## 11. Commit sequence

0. *(Your call, see the questions below)* Commit the current uncommitted WIP as a baseline.
1. `docs: add design audit, plan and before screenshots`
2. `feat(tokens): add color, type and spacing tokens and new fonts`
3. `feat(assets): add Phosphor icon sprite, optimized logo and stock photos with credits`
4. `feat(frame): one device wrapper with framed, phone and tablet modes and a new backdrop`
5. `feat(components): button, avatar, badge, trust line, cards, nav, sheet, toast, empty state`
6. `feat(data): realistic Cebu workers, areas, prices and jobs`
7. `feat(home): redesign home`
8. `feat(pros): redesign pro list and search, and merge the services screen`
9. `feat(profile): redesign worker profile`
10. `feat(jobs): redesign jobs for homeowner and worker, with low-content states`
11. `feat(inbox): redesign inbox list, thread and empty state`
12. `feat(account): redesign profile tab`
13. `feat(sheets): redesign filter and post-job sheets`
14. `chore: remove the old stylesheet and dead code, and add after screenshots`

After each screen commit: screenshots at 390×844 and 1440×900 into `design-audit/after/`, compared with `before/`. I'll also do one check at 1366×768 (frame must not be cut off) and 820×1180 with a coarse pointer (tablet mode).

## 12. Questions for you

1. **Deployed URL** for the QR code. Should I build the QR card at all?
2. **Uncommitted changes:** commit them as a baseline before I start (step 0), or fold them into the redesign commits?
3. **Merging "All services" into Home.** OK to drop that screen, since all six categories fit on Home?
4. **Fonts:** load from Google Fonts (current approach), or self-host the WOFF2 files in `assets/fonts/` so the live presentation works without Wi-Fi? I'd recommend self-hosting.
