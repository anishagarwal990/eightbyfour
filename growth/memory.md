# EightByFour — Business Memory

Human-readable master context for the Growth Command Center. This file is the
version-controlled **seed**, not the live source of truth — `/admin/growth`
reads and edits the `growth_memory` table (seeded from this file and the
sibling `*.json` files by `scripts/seed-growth.mjs`), because a serverless
request can't write back to the repo. When you want the live business memory
to change permanently, edit the JSON here too and re-seed, or export from the
admin UI back into these files — keep them in sync by hand for now.

Every growth workflow — SEO briefs, outreach messages, ad angles, CRO copy —
should read from this file's context before generating anything. It is the
one place that says who EightByFour is, so no workflow re-invents the
positioning differently each time.

---

## Company

**EightByFour** (site brand: EightxFour) — an interior-material procurement
and services platform operating in Hyderabad.

- **Business model**: sourcing marketplace + consolidated-quote procurement
  desk. Not a single-brand e-commerce store — a platform that sources across
  25+ manufacturers and returns one itemised, organised quote per customer
  requirement.
- **Core value proposition**: send an interior material requirement (a BOQ, a
  product list, or just a description) and get back one consolidated,
  compared, priced quotation — instead of calling ten dealers and reconciling
  ten different formats by hand.
- **Major categories**: Plywood, Laminates, MDF, HDHMR, Veneers, Hardware,
  Adhesives, Doors, ACP, Corian / Acrylic Solid Surface, WPC / PVC boards,
  Louvers / Wall Panels, Edge Banding, Blockboard, Birch Ply, Cement Boards,
  Screws / Nails, Stone Panels, and other allied interior materials.
- **Services vertical — Studio EightByFour**: modular wardrobes, modular
  kitchens, carpenter-made furniture, factory-made modular furniture,
  laminate cold pressing, Corian / acrylic solid surface installation,
  furniture quotation tools, material calculators, project procurement,
  visualization tools, 3D / exploded-view furniture estimators.
- **Geography**: Hyderabad, India (site-wide "Currently serving Hyderabad" —
  see `app/page.tsx` `WHY_EIGHTBYFOUR`). Some content already targets
  outstation contractors executing projects locally in Hyderabad.
- **Current stage**: early — see `seo/baselines/decor-code-baseline-2026-09-03.md`
  for the actual traffic picture. Site launched into search ~August 2026;
  ~3,210 pages indexed; climbing from near-zero to a few hundred organic
  clicks a month as of the baseline date. Not yet ranking for head terms —
  winning on decor-code long-tail and building category/price-page depth.
  Read that baseline before assuming any SEO number here is current; it
  isn't — this file is strategy, not a live metrics dashboard.

## Primary promise

> Send your interior requirements → receive consolidated pricing / quotation
> → compare → procure.

Say it plainly, not as a slogan: a customer sends a list once, and one
quotation comes back covering every category on that list, organised so it
can be checked line by line against what they asked for.

## Competitive strengths

- Strong market pricing — sourced direct from manufacturers, not marked up
  through a reseller layer.
- Transparent comparison — real rates and real specs shown before a customer
  has to call anyone.
- Multiple brands per category, sourced and compared side by side.
- Multi-category sourcing from one request — plywood, laminate, hardware and
  adhesive in the same quotation.
- Consolidated procurement — one document, one delivery schedule, instead of
  five vendor threads.
- Local execution knowledge — Hyderabad-specific stock, sizing conventions
  (e.g. "18mm" sold as 19mm nominal), and delivery timelines.
- Project procurement support for teams executing outside their home market.
- Ability to combine product sourcing with Studio EightByFour's installation
  and fabrication services in one relationship.

## Strategic insight — do not narrow the ambition

EightByFour should not be understood, built for, or marketed as "an online
plywood shop." The plywood/laminate catalogue is the wedge, not the ceiling.
The larger opportunity — the one every growth workflow should keep in view —
is becoming **the procurement layer for interiors**: the place a contractor,
designer or project team sends *any* interior material requirement and gets
one answer back, regardless of category. Content, ads, and product decisions
that only reinforce "buy plywood here" are underselling the platform.

## Customer segments

See `growth/icp.json` for the machine-readable version of the fields below.
Full detail lives in the Customer Intelligence module once seeded.

| Segment | Buys | Buying trigger | Best EightByFour angle |
|---|---|---|---|
| Homeowner | Small mixed lists — laminate shade, plywood sheets, hardware, adhesive | Renovation or new-build interior fit-out starting | "Compare real prices before you commit to a carpenter's quote." |
| Carpenter | Repeat small-to-mid orders, brand/grade-specific | An active job needs material today or this week | Fast, reliable stock + delivery; decor-code lookup for exact shade match |
| Interior Contractor | Multi-category BOQs, recurring | New project signed, needs a supplier who won't be the bottleneck | Consolidated BOQ quoting — one list, one quote, one delivery schedule |
| Turnkey Contractor | Full-project material lists across every category | Project kickoff; needs to lock material cost early | Project procurement desk — price certainty across the whole scope |
| Architect | Spec-driven — certifications, grades, finish codes | Specifying materials for a client project | Transparent specs and certifications, not just a price list |
| Interior Designer | Shade/finish-led — laminate, veneer, solid surface | Presenting material options to a client | Real shade catalogue with codes, images, and same-day rate confirmation |
| Builder | Bulk board/plywood/cement orders | Ongoing construction, recurring restock | Volume pricing, consistent grade certification |
| Retail Rollout Company | Standardised material kits, repeated per site | Opening multiple outlets on a template fit-out | One procurement partner across every site, not a new vendor search each time |
| Hospitality Project Team | Large mixed-category orders, tight timelines | Fit-out or renovation on a hard deadline | Reliability + consolidated procurement under time pressure |
| Commercial Project Team | Multi-category, compliance-driven (fire-retardant, IS certs) | Office/commercial fit-out with a spec sheet | Certification-backed sourcing, one accountable supplier |
| Outstation company executing locally | Full project lists, no local supplier relationships | Executing a project in Hyderabad without local sourcing contacts | "EightByFour is your local material procurement desk — you don't need a Hyderabad contact of your own." |

## Brand voice

EightByFour should sound: knowledgeable, commercially sharp, trustworthy,
modern, concise, premium but not pretentious, practical, execution-oriented.

Lead with proof and concrete benefit, not adjectives. Say what happens
("send your list, get one quote back") rather than what it feels like
("seamless experience").

**Avoid** (generic AI/marketing language — flag and rewrite if any workflow
produces these): leverage, unlock, seamlessly, revolutionary, game-changing,
empower, synergy, cutting-edge, transformative, robust, scalable, streamline.

## Positioning themes

Directions, not mandatory final slogans — test and validate before treating
any of these as settled:

- "Your interior procurement desk."
- "Send the list. Compare the quote."
- "Know what your materials should cost."
- "One quote for your interior material requirement."
- "Project procurement without calling ten suppliers."

## Growth goals

See `growth/growth-goals.json`. Summary: move off decor-code long-tail
dependency by building real category-hub depth and price-page coverage
(veneer, solid surface, birch ply already shipped — see `lib/pricePages.ts`),
start local/GBP-driven demand capture, and begin the backlink program
(manufacturer dealer-locator listings first — zero-cost, highest authority
per SKU already stocked).

## Content pillars

See `growth/content-pillars.json`.
