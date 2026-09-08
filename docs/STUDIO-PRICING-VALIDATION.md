# Studio pricing — validation register

**Internal. Not customer-facing.**

Every commercial input Studio uses to produce a wardrobe estimate, where it
came from, and what still has to be proven before we quote against it.

Regenerate the numbers any time with:

```bash
node scripts/studio-pricing-sanity.ts
```

## Status key

| Status | Meaning |
|---|---|
| **CATALOGUE** | Derived from a live EightByFour product (₹/sheet ÷ 32 sq ft). Moves when the catalogue moves. |
| **BUSINESS-VALIDATED** | Signed off against real quotations or executed jobs. *Nothing is in this state yet.* |
| **PROVISIONAL** | A considered figure with a stated basis, but not yet checked against the market. |
| **UNVALIDATED** | A working number we set to make the model run. No external basis. |

---

## 1. Carcass board rates
`lib/studio/estimator/config.ts` → `CARCASS_MATERIALS`

| Variable | Current | Source | Status | Where used | Validation needed |
|---|---|---|---|---|---|
| Prelam Particle Board | ₹45.3/sqft | Catalogue `particle` ₹1,450/sheet | CATALOGUE | Wardrobe carcass | Is the catalogue rate our **selling** rate or **procurement** rate? A quote built on procurement rate has no material margin in it. |
| MDF | ₹61.9/sqft | Catalogue `mdf` ₹1,980/sheet | CATALOGUE | Wardrobe carcass | Same selling-vs-procurement question. |
| Prelam MDF | ₹62/sqft | — | **UNVALIDATED** | Wardrobe carcass | No catalogue product exists. Need a real supplier reference. Currently sits ₹0.1 above plain MDF, which is almost certainly wrong — prelam should carry a premium. |
| MR / Commercial Ply | ₹85.6/sqft | Catalogue `commercial-ply` ₹2,740/sheet | CATALOGUE | Wardrobe carcass | Ranks **above HDHMR** in the ladder. Verify that is the real market order — customers will notice. |
| HDHMR | ₹83.8/sqft | Catalogue `hdhmr` ₹2,680/sheet | CATALOGUE | Wardrobe carcass | Confirm thickness assumed is 18 mm. |
| BWR Plywood | ₹80/sqft | — | **UNVALIDATED** | Wardrobe carcass | No catalogue product. This is the **default carcass** on both the estimator and the designer, so it is the single most-quoted rate in Studio. Needs a real product reference urgently. |
| BWP Plywood | ₹108.8/sqft | Catalogue `bwp-ply` ₹3,480/sheet | CATALOGUE | Wardrobe carcass | Confirm 19 mm and grade. |
| FR Plywood | ₹105/sqft | — | **UNVALIDATED** | Wardrobe carcass | No catalogue product. Currently prices *below* BWP, which may be wrong for a fire-retardant grade. |

## 2. Carcass finish
`config.ts` → `CARCASS_FINISH`

| Variable | Current | Source | Status | Where used | Validation needed |
|---|---|---|---|---|---|
| Internal laminate | ₹500/sheet | — | **UNVALIDATED** | Non-prelam carcass | Real balancing/liner laminate rate. |
| External laminate | ₹1,300/sheet | — | **UNVALIDATED** | Non-prelam carcass | Catalogue laminates run ₹1,180–₹2,140/sheet, so ₹1,300 is plausible but arbitrary. Pick a reference SKU. |
| Laminate consumption multiplier | 1.0 sheet per carcass sheet | — | **UNVALIDATED** | Non-prelam carcass | Test against real jobs. One laminate sheet per board sheet ignores that laminate covers only visible faces. **Likely over-charges.** |

## 3. Shutter cores
`config.ts` → `SHUTTER_CORES`

| Variable | Current | Source | Status | Validation needed |
|---|---|---|---|---|
| Prelam Particle Board | ₹45.3/sqft | Catalogue `particle` | CATALOGUE | — |
| MDF | ₹61.9/sqft | Catalogue `mdf` | CATALOGUE | — |
| Prelam MDF | ₹66/sqft | — | **UNVALIDATED** | Supplier reference. |
| Blockboard | ₹78/sqft | — | **UNVALIDATED** | No catalogue product; `/products/blockboards` exists but is not wired to a rate. |
| HDHMR | ₹83.8/sqft | Catalogue `hdhmr` | CATALOGUE | — |
| Plywood | ₹108.8/sqft | Catalogue `ply` | CATALOGUE | — |

## 4. Shutter finishes
`config.ts` → `SHUTTER_FINISHES`

| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Laminate | ₹100/sqft | **UNVALIDATED** | Should be derivable from catalogue laminate ₹/sheet + pressing labour. Currently a flat guess. |
| Acrylic | ₹260/sqft | **UNVALIDATED** | Catalogue has acrylic at ₹4,180–4,460/sheet (≈₹135/sqft material). ₹260 implies ~₹125 of labour. Check. |
| PU paint | ₹320/sqft | **UNVALIDATED** | Needs a booth/spray quotation. |
| Veneer | ₹300/sqft | **UNVALIDATED** | Catalogue veneer ₹3,980/sheet ≈ ₹124/sqft material. Polishing is the rest — quote it. |
| Membrane | ₹140/sqft | **UNVALIDATED** | Needs a vendor rate. |
| Prelam / none | ₹0 | PROVISIONAL | Correct by definition. |
| Shutter fabrication | ₹50/sqft | **UNVALIDATED** | Edge banding + pressing + hanging. Needs a real figure. |

## 5. Aluminium + glass
| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Profile — natural / black / champagne / premium | ₹240 / 280 / 300 / 360 per sqft | **UNVALIDATED** | Whole system is a placeholder. V1 prices per sq ft of shutter face rather than per running metre of profile, which is **not how aluminium is actually bought**. Expect this to be materially wrong. |
| Glass — clear / tinted / frosted / fluted / back-painted | ₹90 / 120 / 130 / 220 / 180 per sqft | **UNVALIDATED** | Same. |
| Alu fabrication | ₹120/sqft | **UNVALIDATED** | Same. |

## 6. Hardware
| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Basic | ₹80/sqft | **UNVALIDATED** | Define what is actually in each package (hinge brand, runner type, count per sq ft). Today the customer buys a word, not a specification. |
| Standard | ₹120/sqft | **UNVALIDATED** | Same. This is the default. |
| Premium | ₹190/sqft | **UNVALIDATED** | Same. |

## 7. Labour, overheads and geometry
| Variable | Current | Status | Where used | Validation needed |
|---|---|---|---|---|
| **Carpenter labour** | ₹600/sqft | **UNVALIDATED** | All wardrobes | ⚠️ **Identical to factory.** The build-method toggle currently changes nothing in the price. Needs 3 carpenter quotations. |
| **Factory labour** | ₹600/sqft | **UNVALIDATED** | All wardrobes | ⚠️ Same. Needs 3 factory quotations. Until these differ, the toggle is cosmetic. |
| Miscellaneous | ₹50/sqft | **UNVALIDATED** | All wardrobes | What is in it — consumables, transport, wastage? Define before defending it. |
| Margin | ₹100/sqft | **UNVALIDATED** | All wardrobes | A flat ₹/sqft margin means margin **percentage falls as spec rises** — 8.7% on prelam PB, 5.7% on BWP. Decide whether margin should be a percentage instead. |
| Carcass consumption multiplier | 4.0× elevation | **UNVALIDATED** | All wardrobes | Measure against 10 executed wardrobes. Drives the single largest material line. |
| Shutter area multiplier | 1.0× elevation | PROVISIONAL | All wardrobes | Reasonable for a full-front wardrobe; wrong for open or part-height units. |
| Sheet area | 32 sq ft (8×4) | **BUSINESS-VALIDATED** | Everywhere | Standard board size. Safe. |

## 8. Fit-out (visual designer only)
`lib/studio/estimator/adapter.ts` → `FIT_OUT_RATES`

| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Shelf | ₹165 each | **UNVALIDATED** | Cut + band + fit. Excludes the board itself — confirm that is intended. |
| Drawer | ₹2,400 each | **UNVALIDATED** | Box + runners + front. Catalogue drawer bank is ₹8,400 for 3 (₹2,800 each) — reconcile. |
| Hanging rail | ₹1,450 each | **UNVALIDATED** | Rail + caps + bracket. |
| Partition | ₹340 each | **not currently charged** | Deliberately excluded — already implied by the 4× carcass multiplier. Re-check when that multiplier is validated. |
| Loft | ₹620/sqft × 0.35 | **UNVALIDATED** | The 0.35 factor is arbitrary. |

---

## 9. Laminate pressing
`lib/studio/pressing.ts`

| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Hot press | ₹340 per sheet face | **UNVALIDATED** | Charged the same whether the board and laminate are bought here or the customer brings them. |
| Press-grade adhesive | ₹190 per face | **UNVALIDATED** | Always charged — it is applied in the workshop, not brought by the customer. |
| Cut to size | ₹26/ft × ~28 ft/sheet | **UNVALIDATED** | |
| Edge banding | ₹42/ft × ~34 ft/sheet | **UNVALIDATED** | |
| Delivery | ₹1,600 + ₹140/sheet | **UNVALIDATED** | |

**Bring-your-own board + laminate** (`materialSource: "own"`): board, front and back laminate lines are dropped; press work, adhesive, trimming and delivery are unchanged. The FAQ always said this was allowed — the configurator can now price it.

**Material now comes from the live catalogue**, not a 5-item shortlist
(`lib/studio/materialCatalogue.ts`, `/api/studio/materials`). Two consequences
worth knowing before anyone reads a pressing total as final:

| Case | What the quote does |
|---|---|
| Board with a rate | Boards are priced per **sq ft as a range across thicknesses** — there is no per-thickness rate on most rows. The sheet figure is the bottom of that range × 32 sq ft, shown as **"from ₹X — confirmed for your thickness"**. |
| Laminate with a rate | `price_table.starting_price` is already per sheet. Used directly. |
| No rate on file | ~150 of 1,000 sampled laminates and several boards have `price_table: null`. The line is **₹0** with "rate confirmed on your order", and the quote carries a `pendingNote`. |
| Entered by hand | Same as above — always ₹0 and pending. |

**The total is therefore "everything priced so far", not a quotation**, whenever
`pendingNote` is set. The estimate panel says so; the bundle headline switches
from "Finished panel" to "From".

## 10. Solid surface
`lib/studio/solidSurface.ts`

| Variable | Current | Status | Validation needed |
|---|---|---|---|
| Fabrication | max(₹130 × finished sq ft, ₹2,600 × sheets) | **BUSINESS-STATED** | Owner's rule. One line — covers cutting, every seam, every cut-out, edge build-up, splashback, polishing. Edge/cut-out/backsplash choices no longer carry their own charge. |
| Site fitting | ₹340/run ft, min ₹6,500 | **UNVALIDATED** | The ₹6,500 site minimum makes small supply-here jobs (e.g. a 3  ft vanity + a full sheet) read high — flagged, not changed. |
| Substrate & brackets | ₹280/run ft | **UNVALIDATED** | Still charged in bring-your-own mode — it is EightByFour ply, not the customer's. |
| Adhesive & filler | ₹1,450/sheet | **UNVALIDATED** | Always charged — colour-matched in the workshop. |
| Delivery | ₹2,400 + ₹400/sheet | **UNVALIDATED** | |

**Bring-your-own sheet** (`materialSource: "own"`): the Corian/HIMACS/Staron sheet line is dropped; fabrication, fitting and delivery are unchanged. "No compulsion to buy the surface from us."


## Findings from the sanity matrix

Run `node scripts/studio-pricing-sanity.ts`.

1. **Build method does not change the price.** Carpenter and factory both total
   ₹1,05,523 on the default wardrobe. The UI offers it as a real decision.
   Copy on both the estimator and the `/studio` spec/price demo now states that
   the two routes are priced the same today and describes what actually differs
   (lead time, weeks of work in the home, edge finishing), rather than implying
   a cost gap the model does not contain. That is a holding position: the rates
   still need to diverge on real quotations.
2. **No economies of scale.** ₹1,649/sqft at 6′, 8′, 10′ and 12′ — identical.
   Every cost is purely linear in elevation area. Real jobs have fixed setup,
   delivery and measurement costs that should amortise across a bigger unit.
3. **Flat ₹100/sqft margin means margin % falls as spec rises** — 8.7% on a
   prelam PB wardrobe, 5.7% on BWP. Probably backwards from what we want.
4. **Prelam MDF (₹62) is priced ₹0.1 above plain MDF (₹61.9).** A pre-finished
   board should carry a clear premium. The number is a placeholder.
5. **MR ply (₹85.6) prices above HDHMR (₹83.8).** That comes from real catalogue
   data, so it may be correct — but it makes the ladder read oddly.
6. **Service is 45% of a prelam PB wardrobe** (₹48,000 of ₹73,376) and 43% of a
   BWP one. Sanity-check that ratio against real jobs.
7. **The catalogue cannot express the default carcass.** BWR Plywood is the
   estimator's default board, but no catalogue product maps to it — so a
   specification coming from the visual designer or the hero configurator can
   never select it, and the adapter's fallback is the only route to it. The
   consequence a customer sees: the hero on `/studio` opens on a BWP Plywood
   wardrobe (₹1,11,495) and the wardrobe page opens on a BWR Plywood one
   (₹1,05,523). Both numbers are correct for the specification shown beside
   them — they are the same engine — but the two front doors start from
   different wardrobes.

   **Decision needed, and it is a commercial one, not a code one:** either
   catalogue a real BWR plywood product, or change the estimator's default to a
   board we actually stock. Not fixed unilaterally because it moves the
   headline number on the flagship page.

## Migration path for the other furniture types

Wardrobe is the **first and only** type on the new commercial model. Kitchen has
its own geometry-derived engine and should keep it — the product is structurally
different. TV unit, vanity, crockery, study, storage, office and retail still use
`priceFurniture()` (per-sheet catalogue rates, per-type `carcassFactor`).

Do not force the wardrobe ×4 model onto them. Each needs its own consumption
multiplier measured from real jobs. Order of migration should follow sales
volume, not code tidiness.
