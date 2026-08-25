# EightByFour — Phase 1 Strategic Brief
**Business understanding · Competitive research · Positioning · UX audit**

Prepared: 25 August 2026 · Scope: analysis only, no code or design changes made.
Evidence base: repository at `main` (Next.js 16 / Supabase), live production site `www.eightbyfour.com` (desktop 1280 + mobile 375 captures), live competitor sites, live Supabase-backed category counts read off the production catalogue page.

> **Note on skills (corrected 25 Aug 2026):** `redesign-existing-projects`, `anti-ui-slop` and `web-design-guidelines` are not installed in this environment; `ui-ux-pro-max` is. **No skill was invoked during Phase 1** — the analysis below is my own, structured on standard UX frameworks. An earlier version of this note said the installed equivalents were "applied as analytical frames rather than invoked", which reads as more than it was. `ux-heuristics-review` and `cognitive-load-conversion` were subsequently loaded in Phase 2 and run against the Phase 2 prototype; their findings are recorded there, not here.

---

## 1. Current business understanding

### 1.1 What the business actually is (verified)

EightByFour ("EightxFour" in copy, `8×4` as the mark) is a **Hyderabad-only interior and construction material procurement operation**, a unit of DRG Group (`app/about/page.tsx`). The website is simultaneously three things today:

1. A **catalogue** of real SKUs held in Supabase (`products` table, surfaced through `lib/data/products.ts`).
2. A **lead-capture funnel** that terminates in WhatsApp.
3. An **SEO surface** — 12 guides, 2 comparisons, 7 application pages, 8 Hyderabad landing pages in `content/`, plus dynamic sitemap, JSON-LD (Product/Breadcrumb/FAQ/Organization/Collection/Service/WebSite), and a Google Merchant feed route.

The commercial machinery is real and well built: `inquiries` table with UTM attribution, GA4 + Meta Pixel event mapping (`docs/META-MARKETING.md`), inquiry reference codes (`REF-1234-CEN`), file upload to Supabase Storage, WhatsApp deep-link handoff.

### 1.2 The catalogue, as it truly stands

Live counts, read from the production `/products` page on 25 Aug 2026:

| Category | SKUs | | Category | SKUs |
|---|---|---|---|---|
| Laminates | 2,464 | | Plywood | 27 |
| Veneers | 493 | | Adhesives | 10 |
| Corian / Acrylic Solid Surface | 115 | | MDF and HDHMR | 4 |
| Stone Panels | 66 | | Boil Boards | 2 |
| | | | Birch Plywood, NFC, Blockboards | 1 each |
| **Zero-SKU categories (11)** | Aluminium Sections, GI Sheets, Steel Pipes, Cement Boards, Louvers, Wall Panels, Hardware, Timber, Nails, Screws | 0 |

**Total ≈ 3,184 SKUs across 11 live categories; 11 of 22 categories are empty.**

Three structural facts follow, and they matter more than anything else in this brief:

- **The catalogue is a decorative-surfaces catalogue.** Laminates + Veneers + Corian + Stone = 3,138 of 3,184 SKUs — **98.6%**. Plywood, the category the brand name itself refers to (8×4 is a plywood sheet), has 27 SKUs.
- **The site claims "750+ SKUs In Stock"** on the homepage (`app/page.tsx` `STATS`), on `/about`, and inside the "we source beyond what's listed" copy. The real number is over four times that. The claim is stale in the direction that *undersells* the business, while the mega-menu simultaneously computes and displays the true total (`totalProducts` in `SiteHeader.tsx`). Two different numbers for the same fact are visible in the same viewport.
- **"25+ Manufacturers Sourced"** is supported: ~19 stocked brands with product counts plus 21 source-only brands (`lib/source-only-brands.ts`: Hafele, Hettich, Blum, EBCO, Godrej, Action Tesa, LX Hausys, Staron, Europa, Archidply, Durian, Abro, Ozone, Dorset, etc.).

### 1.3 What "BOQ functionality" actually is today

There is **no BOQ product**. Verified in `context/QuoteModalContext.tsx` and `components/QuoteRequestForm.tsx`:

- A user can type free-text line items (`desc` + `qty`) into a list, and/or attach one file ≤20MB (`.pdf .doc .docx .xls .xlsx .csv` + images).
- On submit: file uploads to the `inquiry-uploads` bucket, a row is written to `inquiries`, and **`window.open()` fires a `wa.me` deep link with the whole thing serialized as plain text**.
- Nothing is parsed, matched to SKUs, priced, or returned in-product. There is no quote object, no status, no revision, no history, no login.

So the real business model is: **web catalogue + SEO → structured lead → human procurement over WhatsApp**. That is a legitimate and, at this stage, correct model. But the site's language ("platform", "compare on one screen", "options side-by-side") promises product mechanics that do not exist. That gap is the single largest credibility risk in the current experience — see §2.4.

### 1.4 Users, as the repo defines them

`WHO_WE_SERVE` in `app/page.tsx` names five: Homeowners, Interior Designers, Architects, Contractors, Builders & Procurement Teams. All five resolve to only **three** Hyderabad landing pages (`homeowner-materials`, `architect-material-sourcing`, `contractor-procurement`), with designers and architects sharing one, and builders and contractors sharing another. The persona list is wider than the content behind it.

### 1.5 Design system inventory (`app/globals.css`, `app/layout.tsx`)

- **Type:** two faces, enforced. Space Grotesk (display: mark, h1–h3, numerals, eyebrows via `.tracked-caps`) + General Sans, self-hosted (body/UI). Clean, deliberate, well documented in code.
- **Colour:** near-monochrome. `--ink #121212`, `--paper #ffffff`, `--paper-dim #ececec`, `--card #f6f6f6`, single accent `--burgundy #6e1f2e` (aliased three ways: `--accent`, `--walnut`, `--burgundy`), borders as black alphas. **No dark mode. No semantic token layer** — components mostly write `style={{ color: "var(--burgundy)" }}` inline rather than through role tokens.
- **Scale:** fluid heads (`--fs-hero: clamp(44px, 5.6vw, 78px)`), fixed `--fs-body: 15px`. No spacing scale token set — spacing is raw Tailwind utilities.
- **Motion:** a genuine system — `--ease-standard`, `--ease-out-soft`, three durations, `Reveal`/`reveal-stagger`/`reveal-strong` with `prefers-reduced-motion` honoured throughout.
- **Chrome:** three stacked bars — `SkuRibbon` (40px, sticky, auto-scrolling category ticker), a contact bar (30px), then the header. On mobile a fourth surface, `MobileStickyCTA`, is pinned to the bottom.

Verdict: the **craft floor is high** — real fonts, real motion discipline, real accessibility touches (`:focus-visible`, reduced motion, aria labels), thoughtful code comments. The problem is not execution quality. It is **strategy, hierarchy and honesty of claim**.

---

## 2. Current website diagnosis

### 2.1 The five-second test — what a first-time visitor concludes

Captured live, mobile 375×812, first screen, top to bottom:

1. An auto-scrolling ticker whose first three visible items are **"Birch Plywood 1 · Boil Boards 2 · MDF and HDHMR 4"**.
2. The `8×4` mark and a hamburger.
3. A three-line wrapped eyebrow: `PLYWOOD · LAMINATES · VENEERS · WALL PANELS · HARDWARE · SOLID SURFACE`.
4. Grey small-caps line: "Interior & Construction Material Procurement in Hyderabad".
5. Enormous headline: **"Give Us Your List. Get Your Quote."**
6. Paragraph, then "FIRST RESPONSE IN UNDER 15 MINUTES", then "Prefer to browse first? See all products →".
7. The quote widget begins — and is immediately overlapped by the sticky bottom bar carrying **Call | WhatsApp | Get My Quote**.

**There is not a single material, product, photograph or texture in the entire first screen. Zero.** A company selling 2,464 laminates and 493 veneers shows the visitor nothing to look at.

**What do I think EightByFour is in five seconds?**

Honest answer: *a local trade supplier with a contact form, dressed in nice typography.* Ranked by how a visitor would guess:

| Guess | Why they'd guess it | Verdict |
|---|---|---|
| **Quote-request service / lead form** | The dominant headline is an imperative to hand over a list; three CTAs all say "quote" | This is what it reads as, and it undersells the business |
| **Plywood dealer** | The mark is `8×4` (a plywood sheet size), the ticker opens with plywood categories | Actively wrong — plywood is 0.8% of the catalogue |
| **Catalogue / supplier** | The mega-menu, once opened, is genuinely deep | True, but invisible above the fold |
| **Procurement company** | Only stated in the small grey line above the headline and in `/about` | The intended answer, delivered in the smallest type on the page |
| **Marketplace / ecommerce** | No cart, no prices above the fold | Correctly not read as this |

**Exactly why the ambiguity exists** — five compounding causes:

1. **The headline describes a transaction, not a business.** "Give Us Your List. Get Your Quote." tells you what to *do*, never who they *are*. Any hardware shop, printer, or freight broker could run that headline unchanged. It is category-generic.
2. **The category identifier is set in ~14px grey above a ~78px headline.** The only sentence that says what the company is has the lowest visual weight in the hero. Hierarchy directly inverts importance.
3. **The eyebrow list contradicts the catalogue.** It leads with Plywood and includes Wall Panels and Hardware — two of the eleven categories with zero SKUs — while burying Laminates and Veneers, which are 93% of real stock.
4. **The mark reinforces the wrong category.** `8×4` is board vernacular. For a business whose depth is decorative surfaces, the name pre-loads the wrong expectation before a word is read.
5. **No proof of inventory is visible before the ask.** The visitor is asked to hand over a BOQ from a page that has shown them nothing it can supply. That is a cold-open conversion request, and it is why the "give us your list" framing feels like a form rather than a service.

### 2.2 Information hierarchy audit

Current homepage order (`app/page.tsx`):

`Hero + quote widget → Stats strip → Manufacturer logo strip → Category photo grid → How It Works → Who We Serve → Use-Case Nav → Why This Matters (Old vs New + 4 differentiators) → Testimonials → Resources link farm → Closing CTA`

**Too early**
- **The quote widget.** It is the hero's co-equal element, asking for the requirement before establishing capability, range, or trust. Classic conversion inversion — the ask precedes the reason.
- **The SkuRibbon.** The very first pixels of the site are an auto-scrolling list that, on mobile, opens on the three thinnest categories in the catalogue (1, 2 and 4 SKUs). It is an anti-trust signal in the highest-value real estate on the page. It also motion-competes with the hero for attention and cannot be dismissed.
- **Two CTA layers before content.** Header "Request a Quote" + hero widget + mobile sticky bar = three simultaneous quote asks above the fold.

**Too late**
- **Any image of a material.** First real product photography is the `CategoryPhotoGrid`, four sections down.
- **"How It Works."** The four-step explanation of the actual service arrives after the stats, the logo strip and the category grid — long after the visitor has already decided whether they understand the business.
- **Who We Serve.** Persona self-identification lands fifth. For a multi-audience business (homeowner vs. procurement team have opposite needs), this is the fork in the road and it is placed after the road.
- **Trust and testimonials.** Ninth section, well below the fold on every device.

**Missing entirely**
- **A sentence that defines the company** in headline-weight type.
- **Proof of the actual depth** — "2,464 laminate shades, 493 veneers" is the single most persuasive fact the business owns, and it appears nowhere. The homepage instead states a stale, smaller number.
- **Any evidence of an output.** The site promises organized, comparable quotes but never shows one. No sample quote, no screenshot, no line-item mock. The core value proposition has zero visual proof.
- **Turnaround, commercial terms, delivery, GST/credit, MOQ.** "Same/Next-Day Delivery" appears only as a stat chip.
- **Physical presence.** Competitors in this exact market (HINCH, Material Depot) lead with experience centres and addresses. EightByFour has an office (`/contact`) but no showroom or warehouse imagery anywhere.

**Over-weighted**
- **The hero headline.** `clamp(44px, 5.6vw, 78px)` on a generic sentence. Maximum type on minimum meaning.
- **The Old Way vs New Way table.** Seven negatives against five positives, in a bordered panel, mid-page. It is well written but it is *argument*, and argument is a substitute for evidence. A prospect who has seen 2,464 real shades needs no persuading about supplier phone calls.
- **The 17-tile category grid**, of which **11 tiles have zero SKUs** and render placeholder photography. The grid's implicit promise — "we stock all of this" — is 65% unfulfilled on inspection.

**Does the homepage explain the company before asking for conversion?** No. It asks in the H1 and explains from section four onward.

**Are catalogue and procurement connected?** Weakly, and asymmetrically. Browsing → quoting works (every product page has a quote form; `openModal(prefillDesc)` seeds a line item). But **quoting → browsing does not**, and the shortlist is a dead end: `lib/saved.ts` stores saved product IDs in `localStorage`, `SavedProductsView` renders them as cards — and offers **no action to quote the shortlist**. A user can assemble exactly the list the business asks for and has no button to send it. This is the most valuable broken link in the product.

### 2.3 Interaction and UX defects found

| # | Finding | Location | Severity |
|---|---|---|---|
| 1 | Saved shortlist cannot be converted into a quote | `SavedProductsView.tsx` | **High** — breaks the primary journey |
| 2 | No comparison surface exists anywhere, though copy promises it three times | site-wide | **High** — claim/product mismatch |
| 3 | 11 of 22 category pages have zero SKUs but appear as equals in nav, grid and index | `lib/categories.ts`, `app/page.tsx` | **High** — trust |
| 4 | "750+ SKUs" contradicts the mega-menu's own computed total (~3,184) | `app/page.tsx`, `app/about`, `SiteHeader.tsx` | **High** — credibility |
| 5 | Ticker opens on 1-, 2- and 4-SKU categories on mobile | `SkuRibbon.tsx` | Medium |
| 6 | Three stacked chrome bars consume ~90px of a 450px desktop viewport; a fourth pinned bar on mobile | `layout.tsx` | Medium |
| 7 | Triple-redundant quote CTA above the fold | header + hero + sticky bar | Medium |
| 8 | Hero eyebrow wraps to three lines on mobile and leads with empty categories | `app/page.tsx` | Medium |
| 9 | Emoji used as UI iconography (📞, ↗) beside a bespoke SVG icon set | `MobileStickyCTA.tsx` | Low — craft inconsistency |
| 10 | Product quote path exits to WhatsApp with no in-site confirmation of what happens next beyond a ref code | `QuoteRequestForm.tsx` | Medium |
| 11 | Category filters are collection chips only; no cross-cutting filters (finish, colour, thickness, price, brand) on a 2,464-SKU category | `CategoryFilterBar.tsx` | **High** — see §3 |
| 12 | 33% of products have no description, 34% no applications (per `SEO-AUDIT-REPORT.md`, still open) | data | Medium |
| 13 | Homepage reveal animations gate content on IntersectionObserver; observed rendering blank on a fast/background scroll | `Reveal.tsx` + `globals.css` | Low, verify |

### 2.4 The honesty gap (the finding that should shape Phase 2)

Three claims are made on the homepage that the product does not deliver:

- "Quotes come back organized, one format" — quotes come back as WhatsApp messages.
- "Compare brand, spec and price on one screen" — no such screen exists.
- "You compare — see options side-by-side" — nothing is side-by-side anywhere on the site.

A procurement professional who takes these literally will be disappointed at the first interaction. The Phase 2 fix is a fork, and it must be chosen deliberately: **either build the minimum artefact that makes the claim true** (a shortlist that becomes a request; a comparable specification table; a quote presented in-site), **or re-word to what is genuinely offered** ("one person, one thread, one consolidated price"). Recommendation in §7: build a thin version of the first, because it is also the differentiating position.

---

## 3. Competitor analysis

### 3.1 Classification

| Class | Companies | What they teach |
|---|---|---|
| **Procurement-led** | HomeRun, KYZO, Infra.Market | Speed and logistics as the product; RFQ/lead mechanics; trade credentials |
| **Material discovery / commerce** | Material Depot, Frikly, HINCH, Plyneer (hybrid) | Merchandising, room-based discovery, category depth, assisted selling |
| **Manufacturer / catalogue** | Plyneer | Multi-axis technical taxonomy; spec presentation |
| **Professional tooling (experience benchmark)** | Materialogue, Studio Matrx | Specification workflow; audience respect; restraint |

### 3.2 Positioning — what each one owns

| Company | "X = ______" |
|---|---|
| **HomeRun** | = **60-minute delivery of site materials in Bangalore.** Quick-commerce, applied to construction. |
| **KYZO** | = **India's construction procurement platform for the interior trade.** Contractor discounts, 4-hour delivery, Bangalore + Hyderabad. |
| **HINCH** | = **Hyderabad's one-stop interior materials destination, with a physical experience centre.** Breadth + showroom + video consultation. |
| **Material Depot** | = **Pinterest for Indian interior materials, that you can buy.** Room/theme discovery, aggressive discounting, experience centres. |
| **Frikly** | = **Decorative surfaces, sold over WhatsApp and in-store.** Louvers, panels, acrylics. |
| **Materialogue** | = **The material library and specification workspace for design professionals.** Not a shop. |
| **Plyneer** | = **A plywood manufacturer with a properly engineered catalogue.** |
| **Studio Matrx** | = **AI that turns a design into a BOQ.** |
| **Infra.Market** | = **National manufacturing-backed building-materials supply.** |
| **EightByFour today** | = **… (unclaimed).** This is both the problem and the opening. |

### 3.3 Detailed reads

#### HomeRun — home-run.co · *procurement-led, quick-commerce*
- **First 5 seconds:** "Construction materials with 60-minute delivery in Bangalore." Unmistakable.
- **User:** the site in execution mode — contractors and homeowners who need cement, hinges or Fevicol *today*.
- **Hero:** headline states the entire proposition; support copy is pure commercial incentive ("free delivery on first 5 orders, up to 2% cashback, pay on delivery"). CTA is a search box and a cart. Differentiation is time.
- **Discovery:** 14 flat categories, all execution SKUs (Cement, Tiling, Waterproofing, Wires & MCB, Sanitary). Search-first, no inspiration layer, no BOQ.
- **Commercial:** true ecommerce + "Bulk Prices". Transactional, priced, instant.
- **Trust:** ₹ raised ($6.6M, Sorin), cashback guarantee, stated hours, full address, "Customers love HomeRun".
- **Visuals:** functional quick-commerce grid. Dense, unlovely, fast. Zero aspiration.
- **Weakness:** commodity-only. No specification help, no design consideration, no project view. Cannot serve an architect.
- **Lesson for EightByFour:** owning a *number* (60 minutes) beats owning an adjective. EightByFour's "<15 min first response" is a comparable asset and is currently rendered as a 12px caption.

#### KYZO — kyzo.in · *procurement-led, closest direct competitor*
- **First 5 seconds:** "Explore. Compare. Choose with Confidence." — plus "browse our wide range of interior materials".
- **User:** interior contractors, designers, furniture OEMs, carpenters. Explicit trade segmentation via "Sign Up as Contractor".
- **Hero:** verbs first, category second. Reasonably clear but abstract — three verbs is a *process* claim, not a business definition. Same failure mode as EightByFour, one notch better executed.
- **Discovery:** brand-led ("Shop From Leading Brands") then demand-led ("Most In-Demand Products"). Same interior-material set: plywood, laminates, pre-laminated boards, MDF, hardware.
- **Commercial:** contractor sign-up gating discounts — a real, defensible trade mechanic. 4-hour delivery in **Bangalore and Hyderabad**, so this is a live competitor in EightByFour's own city.
- **Trust:** GSTIN and registered entity in the footer, phone, iOS + Android apps, testimonials, FAQs.
- **Visuals:** clean but templated ecommerce; generic SaaS-marketing rhythm.
- **Weakness:** "Explore. Compare. Choose." is undifferentiated; nothing here is *procurement* in the project sense — no BOQ, no consolidated quoting. It is a trade store with delivery.
- **Lesson:** the trade-account mechanic (identify as a contractor → unlock pricing) converts identity into commercial value. EightByFour names five personas and monetises none of them.

#### HINCH — hinch.in · *material discovery, Hyderabad, the direct local threat*
- **First 5 seconds:** "Your One-Stop Interior Materials Destination" + a new laminate collection.
- **User:** homeowners first, trade second, Hyderabad-centric.
- **Hero:** breadth claim + a merchandising hook (new Digital Laminates). CTA "EXPLORE COLLECTION" and, distinctively, "Book a Free Video Call".
- **Discovery:** category nav (Laminates, Louvers, Wall Panels, Veneers, Hardware, Plywood & Boards, Outdoor) **plus room nav** (Living Room, Wardrobe, Kitchen). Two axes, both obvious.
- **Commercial:** consultation-led — free video call, book a visit, get directions. Trade discounts "up to 30%". 48hr dispatch.
- **Trust:** the strongest set in the comparison group: **10,000+ products, 200+ brands, 5,000+ customers, 4.9★, 500+ virtual calls**, per-category counts (3,200+ laminates, 2,400+ plywood, 1,800+ hardware), full Hyderabad address, opening hours.
- **Visuals:** warm, retail, competent; more shop than platform.
- **Weakness:** it is a very good *shop*. No project-level thinking, no BOQ, no multi-category consolidation for a site. Numbers are stated but unverifiable.
- **Lesson, and a warning:** HINCH occupies "one-stop Hyderabad interior materials" already, with bigger stated numbers and a physical location. **EightByFour cannot win on breadth-of-shop in Hyderabad.** It must win on a different axis. Note also that HINCH publishes per-category counts as proof — precisely the asset EightByFour has and hides.

#### Material Depot — materialdepot.com · *material discovery, best-in-class merchandising*
- **First 5 seconds:** a countdown sale banner, "Upto ₹25,000 Off", pin-code delivery selector, and a rotating search placeholder cycling "subway tiles… acrylic laminates… tropical wallpapers…".
- **User:** aspirational homeowners mid-renovation; designers secondarily.
- **Hero:** discount-led, not proposition-led. The proposition arrives in a "Why Material Depot?" block: 10k+ Happy Homes, **Pinteresty Materials**, Installation Support, Doorstep Delivery.
- **Discovery — the strongest in the set, five parallel axes:** category (Tiles, Laminates, Wallpapers, Louvers & Panels, Quartz), **room** (Kitchen/Bath/Living/Bedroom/Outdoor), **theme** (Scandinavian Kitchen, Tropical Bathroom, Marble Theme), **trending collections** (Subway Tiles, Marble Laminates, Pastel Louvers), and **inspiration** ("Shop This Look" on styled room photography). Plus a 3D Visualizer and a daily Q&A.
- **Product cards:** hard-working and highly technical — code, size, thickness, finish, **suitability** ("Suitable for Living Room, Bedroom & Bathroom"), price per sq.ft *and* per box, discount %, and honest caveats ("Width is subjected to 5% variation", "MOQ = 30 Sq. Ft."). This is the best product-card writing in the entire competitive set.
- **Commercial:** full ecommerce + "Shop on Call" + experience centres (Bengaluru ×5, Hyderabad) with ratings ("4.7, 2,109 ratings", "8,500 sq ft").
- **Weakness:** heavy, loud, discount-dependent; the sale timer and % badges make it feel like a flash-sale site, which caps perceived quality. Buried under merchandising is real substance.
- **Lesson:** **discovery axes are cheap and enormously effective.** EightByFour has the raw data (finish, shade code, thickness, brand, application) to build room-, finish- and application-based entry points and currently exposes almost none of it. And EightByFour's own product-card content should be held to Material Depot's standard: suitability, unit, variation notes.

#### Frikly — frikly.com · *material discovery, WhatsApp-native*
- **First 5 seconds:** "Design your space, define your story!" + a discount code. Pretty, vague.
- **User:** homeowners buying decorative surfaces.
- **Discovery:** narrow and deep — decorative wall panels, laminates, acrylics, 3D panels, louvers, veneer — organised by pattern type (Bookmatch, Ombre, Metallic) and finish, plus room browsing.
- **Commercial:** WhatsApp-first ("Namaste! Get instant help & offer by chatting with us now!"), video-call shopping, real cart with per-sq.ft pricing, COD, three physical stores.
- **Weakness:** hero says nothing; brand voice is decorative; scope is surfaces-only.
- **Lesson:** this is the closest analogue to EightByFour's *actual* catalogue mix (decorative surfaces) and it publishes prices per piece and per sq.ft openly. Frikly's transparency on unit pricing is a competitive pressure EightByFour's "Price: Available on Request" will feel.

#### Plyneer — plyneer.com · *manufacturer catalogue benchmark*
- **Owns:** manufacturer credibility with a real catalogue engine.
- **Taxonomy — the lesson here:** six independent axes for one category. Shop by **Category** (MR/BWR/BWP/Calibrated), **Brand** (Bullet, Silver, Gold, Shield), **Range** (Affordable → Luxury), **Room**, **Guarantee** (10–35 years / Lifetime), **Application** (Carcass, Shutters, Panelling). Plus "Get quote in 30 seconds" and "Delivery in 4 hours".
- **Weakness:** Shopify-generic visual design; manufacturer-brand-first, so it can never be a neutral advisor.
- **Lesson:** EightByFour already normalises grade, warranty buckets and certification codes in `lib/productFilters.ts` — the hard part is done. Those axes are simply not surfaced as navigation. **Shop by guarantee / by application / by grade** are free wins sitting in the codebase.

#### Materialogue — materialogue.com · *experience benchmark (deliberately not a peer)*
- **First 5 seconds:** "Materials, Simplified." / "Exclusively for Architects, Interior Designers and Design Professionals." / "Start free."
- **Model:** a specification *workspace*, not a shop — free for designers, monetised via brands. Different business, and the brief is right that it should not be copied.
- **What it does that EightByFour should learn from — principles only:**
  1. **Two lines establish everything.** What it is (materials, simplified) and who it is for (exclusively professionals). Audience exclusion is the strongest clarity device available, and it is free.
  2. **The product is shown, not described.** The homepage renders a live filter panel — brand, colour, size, finish, price slider, "12 materials", "Search within results…" — with real cards. The visitor *sees* the tool. EightByFour describes an experience ("compare on one screen") and shows nothing.
  3. **A three-verb spine, honestly scoped:** SELECT → MANAGE → PROCURE, expanded as EXPLORE / DISCOVER / COMPARE. Procurement is stated as an endpoint, not overclaimed as automated.
  4. **Numbers as scope, not hype:** "20+ brands, 10,000+ materials, 100+ sub-categories."
  5. **Testimonials that are credentials.** Named principals of named practices (Studio Osmosis, Fadd Studio, Group Seven, Pinakin Studio). Peer proof, professionally calibrated. EightByFour's testimonials are anonymous rows in a table.
  6. **Restraint.** No discounts, no urgency, no countdown, no stock photography of happy families. The audience is treated as competent.
- **Weakness:** for a supply business, it is an unconvertible model — it manages selection but does not deliver a sheet to a site.

#### Studio Matrx — studiomatrx.org · *the BOQ layer, worth watching*
- Offers an **AI BOQ Generator**, material comparison and specs, and material **price-pulse tracking across 50+ Indian cities**, with export-ready PDFs containing colour codes, material specs, dimensions and a Bill of Quantities.
- **Why it matters:** if the BOQ becomes machine-generated upstream, the value shifts downstream to whoever can *price and fulfil* a BOQ fastest. That is exactly EightByFour's position — but only if it can genuinely ingest a BOQ.

#### Infra.Market · *scale reference*
- "283+ manufacturing facilities, 22 states, 17,256 retail touchpoints, 11 brands." Inquiry/RFQ-driven, no checkout.
- **Lesson:** at national scale, procurement stops being ecommerce and becomes relationship + logistics. Confirms that EightByFour's WhatsApp-and-human model is not primitive — it is the category norm. The differentiation must come from how *legible* that process is made, not from replacing it with software.

### 3.4 What the field consistently gets wrong

1. **The hero explains a process, never a business.** "Explore. Compare. Choose." / "Design your space, define your story!" / "Give Us Your List." — three competitors, one failure.
2. **Multi-category BOQ is unserved.** Not one of them lets a professional submit a real project requirement spanning plywood + laminate + hardware + adhesive and receive one consolidated, line-itemed price. Every one of them optimises the single-SKU purchase.
3. **Trade identity is barely used.** Only KYZO and HINCH acknowledge that a contractor and a homeowner deserve different prices, terms and interfaces — and neither changes the *experience*, only the discount.
4. **Discounting is the reflex.** Countdown timers, "45% OFF", "₹25,000 off". This trains buyers to distrust the list price and caps every one of these brands below "professional".
5. **Specification support is absent.** Buying guides exist as SEO. Nobody helps a designer decide *between* two boards at the moment of choosing.
6. **Nobody shows a quote.** In an entire category built on quoting, no competitor shows what their output looks like.
7. **Post-order is invisible.** Delivery is claimed as a number; scheduling against a site timeline, partial dispatch, and site-level coordination — the actual pain — go unaddressed.

### 3.5 What users already expect (table stakes — not differentiators)

Search that tolerates a shade code · category + room browsing · brand logos · real photography · prices or an honest reason for their absence · WhatsApp · a phone number and an address · delivery timing · trade pricing on identification · mobile-first.

EightByFour currently meets: search (good — Fuse.js over ~3,184 SKUs including shade codes), brands, WhatsApp, phone, address, mobile layout. It **fails or partially fails**: room/application browsing, photography above the fold, price transparency, trade identity, delivery specificity.

---

## 4. Competitive opportunity map

```
                        SINGLE PURCHASE
                              │
        HomeRun ●             │            ● Frikly
        (speed)               │              (WhatsApp surfaces)
                    KYZO ●    │    ● Material Depot
                              │      (inspiration + commerce)
   TRANSACTIONAL ─────────────┼───────────────────── ADVISORY
                              │
       Infra.Market ●         │    ● Materialogue
       (scale supply)         │      (specification workspace)
                              │    ● Studio Matrx (AI BOQ)
                              │
                    ┏━━━━━━━━━┻━━━━━━━━━━┓
                    ┃   OPEN TERRITORY   ┃
                    ┃  project-level,    ┃
                    ┃  multi-category,   ┃
                    ┃  advisory + supply ┃
                    ┗━━━━━━━━━━━━━━━━━━━━┛
                       WHOLE REQUIREMENT
```

**The white space, stated plainly:** every competitor sells *a material*. Nobody serves *a requirement*. The quadrant of "whole project requirement, spanning categories, with advice attached, priced as one thing" is empty in Hyderabad and largely empty in India.

**What EightByFour can uniquely own, and can defend:**

1. **The consolidated multi-category quote.** A BOQ mixing plywood, laminate, hardware and adhesive returns as one line-itemed price. Nobody in the set does this. It is also what the business already does by hand — the site simply does not say so credibly.
2. **Real, verifiable specification depth in decorative surfaces.** 2,464 laminates with shade codes and finishes, 493 veneers, 115 solid-surface shades. That is a genuinely large, spec-grade dataset — and it is exactly what an architect needs to *specify* rather than merely buy.
3. **Spec-to-site continuity.** "The shade code you specified is the shade code that arrives." Architects lose this constantly; nobody is selling it.
4. **Legible human procurement.** The 15-minute response is real. Make the human process visible and named rather than hiding it behind platform language.

**What EightByFour cannot win:** breadth of shop (HINCH), delivery speed (HomeRun's 60 minutes), price theatre (Material Depot), scale supply (Infra.Market). Do not compete on any of these.

---

## 5. Main user journeys

For each: what the user has, what they need, what the site does today, and what it should do.

**A — "I know exactly what product I need."** *(e.g. "Merino 591 SF, 40 sheets")*
Today: strong. Search handles shade codes (`lib/search-index.ts` folds `sd_code` and `finish` into the title). Product page → variant → quote form → WhatsApp. **Gap:** price is "Available on Request" on most SKUs; no stock/lead-time indicator. **Should:** fastest path on the site — search result straight to a quote line with quantity, no page detour required.

**B — "I have a BOQ."** *(contractor, procurement team — the highest-value journey)*
Today: upload a file into a modal, and it is emailed to a human via WhatsApp. No acknowledgement of structure, no line count, no confirmation of what was understood. **Gap:** the visitor cannot tell whether anything happened. **Should:** a dedicated `/boq` destination that (i) accepts the file, (ii) **echoes back what was received** — line count, categories detected, "12 of 34 lines matched to catalogue SKUs" — and (iii) states the turnaround commitment. Even a semi-manual echo, delivered within the promised 15 minutes, would be unmatched in this market. This is the single highest-leverage build.

**C — "I need multiple different materials."** *(the everyday case)*
Today: the shortlist exists (`localStorage`) and **cannot be sent**. Categories are browsed independently with no accumulating basket of intent. **Should:** promote the shortlist to a first-class **"Requirement"** — persistent, visible in the header with a count, addable from any product card, with quantity per line, and one primary action: *Send this requirement*. This one change connects catalogue to procurement and fixes journey C, half of D, and the tail of A and E.

**D — "Help me decide between products/brands."**
Today: unsupported. Guides exist (`plywood-grades-explained`, `mdf-vs-hdhmr`, `blockboard-vs-plywood`, `laminate-vs-veneer`) but sit in an SEO silo, unlinked from the moment of decision. No comparison view. **Should:** (i) a two-to-three-SKU spec comparison built from fields already in the database (grade, thickness, warranty bucket, certification codes, finish, price) — the normalisation work is already done in `lib/productFilters.ts`; (ii) surface the relevant guide *inside* the category and product pages, not only in a resources list.

**E — "I'm browsing for inspiration or specification."** *(architects, designers)*
Today: weak. Entry is by category only. No room, no finish, no colour family, no application, no project imagery. A 2,464-item laminate list with collection chips is not browsable. **Should:** add discovery axes the data already supports — finish, shade family, brand, application, room — plus at least one editorial/visual surface. This is where the Materialogue *principle* applies: show the library and let it be filtered, in front of the visitor, not described.

**F — "Just source this whole thing for me."** *(the actual business)*
Today: this is what EightByFour does best and communicates least — it is compressed into "Give Us Your List." **Should:** name it as a service with a named human, a stated process, a stated turnaround, and evidence of a completed requirement. Not a form: an *engagement*.

**Complexity control.** Six journeys do not need six interfaces. They need **two doors and one spine**:
- Door 1 — **Browse** (A, D, E)
- Door 2 — **Send a requirement** (B, C, F)
- Spine — **the Requirement object**, which both doors fill and which produces one quote.

Everything folds into that. Anything that does not serve either door or the spine should not ship in Phase 2.

---

## 6. Recommended positioning

### The position

> **EightByFour is the procurement partner for interior projects in Hyderabad: one requirement, every material category, one consolidated quote — with a specification-grade catalogue of 3,000+ surfaces behind it.**

Two proprietary assets, held together: **project-level consolidation** (nobody has it) and **specification depth in surfaces** (uniquely large and real). The catalogue proves the sourcing is real; the sourcing makes the catalogue useful beyond browsing. Neither works alone — and the site currently presents them as unrelated.

### Positioning statement (internal)

*For architects, designers, contractors and procurement teams building in Hyderabad — who lose days chasing separate suppliers for plywood, laminate, hardware and adhesive — EightByFour is a material procurement partner that takes the entire requirement, in whatever form it exists, and returns one organized, comparable quote. Unlike trade stores and quick-delivery apps that sell materials one SKU at a time, EightByFour works at the level of the project, backed by a catalogue of 3,000+ specification-grade surfaces and direct manufacturer relationships.*

### Value proposition — three registers

- **Primary (the site's spine):** *One requirement. Every category. One quote.*
- **Supporting:** *Send a BOQ, a product list, a drawing, or a sentence. We organize it, source it across 25+ manufacturers, and come back inside 15 minutes with options you can act on.*
- **Proof line:** *3,184 SKUs live — 2,464 laminate shades, 493 veneers, 115 solid-surface colours — and we source well beyond what's listed.*

### Candidate headlines (Phase 2 to test — direction, not final copy)

| Headline | Owns | Risk |
|---|---|---|
| **One requirement. Every material. One quote.** | The consolidation position, exactly | Needs a category line beneath it |
| **Send the whole requirement. Get one quote.** | Journey B/F | Slightly transactional |
| **Every material your project needs, sourced by one partner.** | Warm, complete | Longer |
| **The material partner for Hyderabad interiors.** | Category + place, plainly | Less mechanism |

Whichever is chosen, **a category line in real type must sit adjacent** — e.g. *"Interior & construction material procurement · Hyderabad"* — at 18–20px, not 14px grey.

---

## 7. Homepage messaging principles

1. **Say what the company is before asking for anything.** The definition gets headline-adjacent weight, not caption weight.
2. **Lead with the asset, not the argument.** "2,464 laminate shades. 493 veneers. Every board, adhesive and fitting sourced to order." Facts outperform the Old-Way/New-Way table.
3. **One number, owned.** Pick either "<15 minutes to first response" or "one quote instead of five vendor calls" and make it structural. HomeRun owns 60 minutes; this is the equivalent move.
4. **Never claim a mechanic that does not exist.** Either build the comparison and the consolidated quote artefact, or stop saying "side-by-side". Non-negotiable.
5. **Fix the numbers and keep them fixed.** Retire "750+" everywhere. Compute displayed counts from the same source the mega-menu uses so a number can never contradict itself on one screen.
6. **Name the humans.** "First response in under 15 minutes" is stronger with a face and a name than with a stopwatch. Human procurement is the product; hiding it behind "platform" costs trust rather than earning it.
7. **Segment by need, not by job title.** Replace the five-persona list with two or three doors framed by what the visitor has: *"I have a BOQ" · "I know what I need" · "I'm still choosing."*
8. **Stop selling empty categories.** Show what is stocked; offer sourcing for the rest as a separate, positive statement ("Beyond the catalogue: hardware, adhesives, fittings — sourced to order"). Never present a 0-SKU category as a peer of a 2,464-SKU one.
9. **Write like the trade.** Grade, thickness, code, finish, sq.ft, GST, lead time. Material Depot's card copy is the standard to beat, and it is a low bar to clear with better taste.
10. **No discounting, no urgency, no countdowns.** Ceding the price-theatre ground is how EightByFour reads as a partner rather than a shop.

---

## 8. Homepage UX principles

1. **Material in the first screen.** Non-negotiable. A surfaces business that shows no surface has forfeited its main advantage.
2. **Reclaim vertical space.** Three stacked chrome bars plus a mobile sticky bar is four persistent surfaces. Fold the ticker into the header or delete it; merge the contact bar.
3. **One primary action above the fold, not three.** The hero owns the action; the header CTA becomes secondary; the mobile sticky bar appears on scroll, not at rest over the hero.
4. **The quote widget earns its place by being shown working, or it moves down.** Either it demonstrates the mechanic (type a line → see a matched SKU with brand, code and thumbnail) or it is a form in the hero — and a form in the hero asks before it gives.
5. **Two doors, one spine.** *Browse* and *Send a requirement*, both leading to the same Requirement object. Every homepage element should serve one of the three.
6. **Proof before persuasion.** Real counts, real brand logos, real photography, real named testimonials — before the Old-vs-New argument. If proof lands, the argument becomes unnecessary; cut it or shrink it hard.
7. **Show the output.** A single realistic image of a consolidated line-itemed quote will do more than any paragraph on this page. This is the highest-conversion asset the redesign can produce.
8. **Persona fork early, and make it about state, not identity.**
9. **Mobile is the primary canvas.** Contractors and carpenters are on phones. Design mobile-first, then desktop — the current hero was clearly composed at desktop width (three-line wrapped eyebrow, hero type at 40% of a mobile screen).
10. **Preserve the craft floor.** The type system, motion system and reduced-motion discipline are good. Keep the two-face system; add a semantic token layer and a spacing scale so the design system can carry a redesign instead of being re-improvised inline.
11. **Ensure the ticker cannot lead with the weakest data.** Sort by count descending, cap it, or remove it.
12. **Keep every SEO surface intact.** `/products/[slug]`, `/brands/[slug]`, `/guides`, `/comparisons`, `/applications`, `/hyderabad/*`, pagination routes, sitemap, JSON-LD and canonicals must survive the redesign unchanged. Homepage restructuring is safe; route or heading-hierarchy changes are not, without deliberate care.

---

## 9. What to imitate conceptually (never visually)

| Source | Principle to take | Explicitly do NOT take |
|---|---|---|
| **Materialogue** | Audience clarity in two lines; show the tool rather than describe it; named-practice testimonials; numbers as scope; total restraint | Its layout, palette, wording, components, "Start free" SaaS framing, or its free-for-designers business model |
| **Material Depot** | Multiple parallel discovery axes (category / room / theme / collection); product cards that state suitability, unit, and honest variation caveats | Countdown timers, discount badges, sale-led hero, visual density |
| **HomeRun** | Own one hard number and put it in the headline | Quick-commerce framing; commodity-only catalogue |
| **HINCH** | Publish per-category counts as proof; consultation as a CTA ("book a video call") | One-stop-shop positioning — it is taken in this city |
| **Plyneer** | Multi-axis taxonomy (grade / application / warranty / room) — EightByFour's data already supports it | Manufacturer-first framing; Shopify-generic visuals |
| **KYZO** | Trade identification unlocking real commercial value | "Explore. Compare. Choose." abstraction |
| **Studio Matrx** | Treat the BOQ as a first-class object with structured output | Not-for-profit positioning; AI-first framing |
| **Frikly** | Unit-level price transparency (per piece and per sq.ft) | Decorative brand voice; vague hero |

---

## 10. What EightByFour must not become

| Trap | Verdict | Distinction that matters |
|---|---|---|
| **Traditional plywood dealer website** | **Avoid — and actively escape.** The `8×4` mark and the plywood-led eyebrow are pulling this way now, while 98.6% of stock is decorative surfaces. Dealer sites sell *stock on hand*; EightByFour sells *a sourced requirement*. |
| **Generic building-material marketplace** | **Avoid.** A marketplace's job is matching many sellers to many buyers and it wins on liquidity and price. EightByFour has one relationship per customer and wins on consolidation and judgement. It cannot out-liquidity Infra.Market and should not try. |
| **Pure ecommerce catalogue** | **Avoid as the primary identity; keep as a component.** Cart-and-checkout implies fixed price, fixed quantity, no advice — the opposite of BOQ procurement. But the catalogue must stay excellent: it is the proof that the sourcing is real. Catalogue in service of procurement, not instead of it. |
| **Materialogue clone** | **Avoid.** Different business (free tool monetised by brands vs. a supplier earning on fulfilment). Copying its interface would produce a workspace with nothing to manage. Take principles, never assets. |
| **Interior-design inspiration site** | **Avoid as identity; borrow the surface.** Mood boards and room photography do not sell 40 sheets of 18mm BWP. But *some* visual discovery is required for architects and designers (journey E). Inspiration as a discovery layer, never as the proposition. |
| **SaaS-style procurement dashboard** | **Avoid now; possible in the long run.** There is no logged-in user, no repeat-order data, and no ops team behind a dashboard. Shipping dashboard chrome (login, sidebar, "workspace") for a WhatsApp business is theatre, and buyers detect it. Earn it with volume first. |
| **Generic AI-designed landing page** | **Avoid absolutely.** The current site is *not* this — the type system, motion discipline and code comments show real authorship. The redesign must protect that. Signals to refuse in Phase 2: gradient-on-dark hero, glassmorphism cards, three-icon feature triptychs, purple/indigo accents, stock 3D illustrations, "Trusted by 10,000+ builders" without names, `transition: all`, glow effects. The current burgundy-on-paper palette with two real faces is a genuine asset — sharpen it, do not replace it. |

---

## 11. Top 10 redesign priorities

Ordered by business impact per unit of effort. 1–4 are the redesign; 5–10 make it hold together.

1. **Establish the position in the hero.** Company definition in headline-adjacent type + a headline that states the consolidation position + material photography in the first screen. Fixes the five-second failure, which is the reason this project exists.
2. **Promote the shortlist to a Requirement, and let it be sent.** Header-visible count, add-from-anywhere, quantity per line, one primary action. Connects catalogue to procurement, fixes journeys A, C, D and E, and makes the "give us your list" promise literally true. Highest ratio of impact to effort on this list.
3. **Build a real `/boq` destination with a structured echo-back.** Accept the file, confirm what was received (lines, categories, matched SKUs), state the turnaround. Owns the highest-value journey; nothing in the market does this.
4. **Resolve the honesty gap.** Ship a minimum comparison view (two to three SKUs, spec table from existing normalised fields) *or* remove every "side-by-side / one screen" claim. And show one realistic consolidated quote as an image. Do not ship the redesign with the claims unresolved.
5. **Fix the numbers and their source.** Retire "750+" from `app/page.tsx` and `app/about/page.tsx`; drive every displayed count from the same computed source as the mega-menu; publish real per-category depth as the proof asset.
6. **Restructure the catalogue's front door around stock reality.** Live categories lead; the 11 empty categories become a positively framed "sourced to order" statement, not equal tiles. Keep the routes for SEO; change the presentation.
7. **Add discovery axes from data that already exists.** Finish, shade family, brand, application, room, grade, warranty bucket, certification. `lib/productFilters.ts` has already done the normalisation. Fixes journey E and makes 2,464 laminates browsable.
8. **Reclaim the chrome.** Collapse ticker + contact bar + header into one or two surfaces; make the mobile sticky bar scroll-triggered; reduce three simultaneous quote CTAs to one primary plus one persistent.
9. **Rebuild trust content as evidence.** Named testimonials with practice or firm attribution (Materialogue's standard), named procurement contacts, delivery specifics, office/warehouse photography, GST and entity details in the footer (KYZO does this and it reads as legitimacy).
10. **Formalise the design system before the visual work.** Semantic token layer over the current primitives, a spacing scale, documented component states, and a decision on the `8×4` mark's relationship to a surfaces-led business. Prevents the redesign from being re-improvised inline as it was before.

---

## 12. Phase 2 handoff brief

**Objective:** design system + homepage design, on the strategy above.

**The one-sentence problem:** the homepage asks for a BOQ before it has told the visitor what the company is, shown a single material, or proved that a 3,184-SKU catalogue exists behind it.

**Position to design against:** *One requirement. Every material category. One quote.* — Hyderabad interior and construction material procurement, backed by a specification-grade surfaces catalogue.

**Non-negotiables**
- Material photography in the first screen, mobile included.
- Company definition legible within five seconds, in real type.
- One primary action above the fold.
- No claim that the product cannot deliver (comparison, "one screen", "side-by-side").
- Every displayed number computed from one source; "750+" retired.
- All existing routes, JSON-LD and metadata preserved.
- Mobile-first composition.

**Structural spine for the homepage** (design brief, not a layout):
Hero (definition + position + material) → proof of real depth (counts, brands, photography) → the two doors (Browse / Send a requirement) → how the service actually works, with named humans → evidence of an output (the consolidated quote) → discovery entry points (category / finish / application / room) → trust (named testimonials, delivery, business identity) → resources → close.

**Design system deliverables for Phase 2**
- Semantic token layer over the existing primitives (`--surface-*`, `--text-*`, `--border-*`, `--accent-*`), replacing inline `var(--burgundy)` usage.
- Spacing and radius scale (currently ad hoc).
- Typographic scale locked to the two-face system — keep Space Grotesk + General Sans.
- Component states documented: Button (4 variants exist), Card, chip/filter, product card, form field, modal.
- Decision required: whether the `8×4` mark stays primary for a business that is 98.6% decorative surfaces.

**Explicitly out of scope for Phase 2:** login/accounts, a dashboard, a payment flow, pricing-model changes, national expansion, and any actual BOQ parsing engine (design the echo-back interface; the matching can be human-in-the-loop behind it).

**Open questions for the business** (answers change the design):
1. Is the plywood/hardware/boards catalogue genuinely being built out, or is EightByFour in practice a surfaces specialist that sources everything else to order? The homepage architecture differs materially between these two truths.
2. Can prices be shown for any segment (laminates by shade, veneers by species), or is "Available on Request" permanent? Frikly and Material Depot both publish per-sq.ft pricing; opacity is a competitive liability.
3. Is a trade account with real commercial value (pricing tier, credit, terms) on the roadmap? It is the strongest retention mechanic in the competitive set.
4. What is the true, defensible turnaround for a full BOQ quote — not the first response? That number, if it can be committed to, is the headline.
5. Hyderabad-only for how long? "Currently serving Hyderabad" is a strength today and a ceiling later; the design should be able to absorb a second city without a rewrite.
