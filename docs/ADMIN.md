# Admin area

`/admin` — sign in with an email and password, search the catalogue, edit product fields and per-thickness rates in the browser.

Same data model and the same rules as `scripts/catalogue.mjs` (see [CATALOGUE-TOOL.md](CATALOGUE-TOOL.md)). Both read one field allowlist, `lib/catalogue/fields.ts`, so a column added or removed there changes both surfaces at once.

Use the CLI for bulk work — a whole rate card, a category of descriptions. Use `/admin` for one product at a time, and for anyone who should not be running a terminal against the service-role key.

---

## Setup — do this before the first sign-in

**1. Apply the hardening migration.** Run `supabase/admin-hardening.sql` in the Supabase SQL editor.

This is not optional. The existing policy is:

```sql
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (true) with check (true);
```

`authenticated` means *any* signed-in user on the project, not "admin". `inquiries_admin_read` is the same shape and exposes customer names, phone numbers, email addresses and uploaded BOQ files. The migration replaces that with an explicit `admin_users` allowlist and adds an append-only audit log.

The app **fails closed** if the migration has not run: `requireAdmin()` calls the `is_admin()` function, and if that function does not exist it refuses access rather than falling back to "any signed-in user".

**2. Disable public sign-ups.** Supabase dashboard → Authentication → Providers → turn off *Allow new users to sign up*.

The allowlist decides who is an admin. Disabling sign-up is what stops strangers creating accounts at all. Do both — either alone leaves a gap.

**3. Create your user.** Authentication → Users → Add user. Set a real password; there is no self-serve reset wired up.

**4. Add them to the allowlist.**

```sql
insert into public.admin_users (id, email, note)
select id, email, 'founder' from auth.users where email = 'you@example.com';
```

**5. Sign in** at `/admin/login`.

---

## Security model

| Layer | What it does |
|---|---|
| `middleware.ts` | Redirects anonymous requests away from `/admin/*` and keeps the session cookie fresh so a save does not fail mid-edit. The cheap first door, not the lock. |
| `app/admin/layout.tsx` | Calls `requireAdmin()`. Renders a "no access" screen for a signed-in user who is not allowlisted, and for the case where the migration has not been applied. |
| Every Server Action | Calls `requireAdmin()` again. A Server Action is a public POST endpoint — the middleware and the layout guard the *page*, not the action, so an action that trusted the page would be callable by anyone who learned its id. |
| Postgres RLS | The real gate. Writes use the signed-in user's own JWT, never the service-role key, so `products_admin_write` decides what lands. |

Two deliberate choices worth knowing:

- **`getUser()`, never `getSession()`.** `getSession()` returns whatever is in the cookie without verifying it, which is forgeable. `getUser()` revalidates the JWT against the auth server.
- **The service-role key never reaches the web app.** It stays in `scripts/`, run by a human at a terminal. A bug in an admin route cannot escalate to unrestricted database access.

`admin_users` has no INSERT/UPDATE/DELETE policy for any role. Membership is changed from the SQL editor or with the service-role key — a compromised admin session cannot add a second admin. `admin_audit` has no UPDATE or DELETE policy, so it is append-only: an admin cannot edit away the record of their own change.

`/admin` is `Disallow`ed in `robots.txt` and carries `robots: noindex, nofollow`.

---

## Editing product fields

`/admin` → search or filter → click a product.

The filter dropdown includes three that map to real gaps: **No price**, **No per-thickness rates**, **No description**.

Cell rules match the CSV tool:

- An empty box saves as **NULL**, which is what the site treats as "no value" — not an empty string.
- List columns (`thicknesses`, `certifications`, `applications`, `features`, `how_to_apply`, `finishes`, `gallery_img_urls`) are pipe-separated: `a | b | c`.
- `category` and `brand` are editable but flagged in the form — they move the product to a different page.
- `slug`, `id`, `created_at`, `updated_at` are not editable anywhere. The slug is the product's live URL.

Only fields present in the submitted form are considered, and only fields that actually changed are written. Saving an untouched form is a no-op, not a rewrite.

---

## Editing per-thickness rates

The reason this exists. `variants` is nested three deep — cores → sizes → thicknesses → price — which is right for the app and impossible to edit as JSON. The editor flattens it to one row per combination and rebuilds the nesting on save.

Products with no rates yet are seeded from their `thicknesses` array with blank cells. That is the fill-in grid for a rate card.

| Cell | Meaning |
|---|---|
| a number | A real rate for that thickness. `₹` and thousands commas are accepted. |
| blank | No rate yet. The thickness stays stocked but unpriced — the site shows "Request current price" rather than a guess. |
| `n/a` | Not stocked at that thickness. Removed from the product's `thicknesses` array. |

Two behaviours the editor tells you about before you save:

**The headline band only re-derives from a complete grid.** If every stocked thickness has a rate, `price_table.min_price` / `max_price` are recomputed from those rates so the band and the grid cannot contradict each other. If the grid is partly filled, `price_table` is left alone — deriving a band from the three thicknesses someone typed first would present that as the product's full range.

**Row order sets the product page's default thickness.** `firstThickness()` in `lib/pricing.ts` reads the first entry. The catalogue stores thicknesses thickest-first, so plywood opens on 25mm rather than 4mm. Nothing re-sorts on save.

Saving revalidates the product page and the price pages that read it.

---

## Audit log

Every write records `{ column: { from, to } }` against the product slug and the actor's email, in `admin_audit`. There is no UI for it yet — read it in the SQL editor:

```sql
select created_at, actor_email, row_slug, changes
from public.admin_audit
order by created_at desc
limit 50;
```

An audit write that fails is logged to the server console and does not block the edit. Losing the record of a change is better than losing the change.

The CLI's equivalent is `scripts/snapshots/` — a full row dump before every `--apply`, with a printed rollback command.

---

## Not built yet

- **Undo in the browser.** The audit log records the old value but there is no restore button. The CLI has `restore`; the UI does not.
- **Inquiries inbox.** `inquiries` rows — real quote requests with uploaded BOQ files — are only readable in the SQL editor. The RLS is in place for a UI; the UI is not.
- **Pack pricing** (`price_table` as an array — the 10 Fevicol products). Not editable in either surface.
- **`spec_table`, `custom_faqs`** — nested JSON, no editor.
- **Create or delete products.** Update only, on an existing slug.
- **Image upload.** Image columns take a URL; there is no picker or uploader.
- **Brands table.**
- **Storefront chrome bleeds into `/admin`.** The site header, footer and ticker render around the admin pages because `app/layout.tsx` is the only root layout. The mobile sticky CTA is suppressed on `/admin` (it covered the save buttons); the rest is cosmetic, plus a wasted category-count query per admin request. Proper fix is splitting into `app/(storefront)` and `app/(admin)` route groups with separate root layouts — a mechanical but wide change, deliberately not bundled in here.
