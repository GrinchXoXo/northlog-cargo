# Northlog Phase 7 Security Audit Report

Date: August 17, 2026
Scope: static code and configuration review of the full repository
(public site, tracking, Supabase schema/RLS/RPCs, admin dashboard,
Telegram bot, storage policies), plus `npm audit`.

Not in scope for this pass, because they require access this build
environment does not have: live database queries against the real
Supabase project, live HTTP tests against a deployed URL, Cloudflare
configuration, and Telegram webhook behavior under load. Section 6
below is a checklist of exactly those tests for you to run once the
app is live, matching the PRD's required test tables.

Severity is used per the PRD: CRITICAL, HIGH, MEDIUM, LOW,
INFORMATIONAL.

---

## 1. Findings

### 1.1 HIGH — Public tracking page has shown no Estimated Delivery for any shipment created since Phase 3

**Component:** `get_public_shipment()` (originally `0002`, superseded in
`0007`)

**Finding:** Phase 3 switched shipment creation and updates to write a
single `estimated_delivery_at` column instead of the original
`estimated_delivery_from`/`estimated_delivery_to` range. The admin-
facing functions were updated to use the new column. The *public*
tracking function was not: it kept building `estimatedDelivery.from`
and `estimatedDelivery.to` from the old, now-dead columns, which have
been null for every shipment created since Phase 3 (including
`NMX-404885`, created live through the Telegram bot during testing).
A separate `estimatedDeliveryAt` field was added to the same function's
output with the correct value, but the frontend type contract and
`DeliveryEstimate` component only ever read `estimatedDelivery.from`/
`.to`.

This is a correctness bug with a security-adjacent angle: it is exactly
the kind of schema drift Phase 3's own PRD warned about (never assume
the PRD matches the live database), and it went undetected because
this project has never had a live end-to-end test run against a real
database from within this environment until you ran the Telegram bot
test.

**Evidence:** `supabase/migrations/0007_phase3_schema_and_functions.sql`,
compare the `estimatedDelivery` object (reads `s.estimated_delivery_from`/
`s.estimated_delivery_to`) against the sibling `estimatedDeliveryAt`
field (reads `s.estimated_delivery_at`, populated by every write path
since).

**Fix:** `supabase/migrations/0011_fix_public_eta_and_notes.sql`.
`estimatedDelivery.from`/`.to` now derive from `estimated_delivery_at`
when present, falling back to the legacy columns only for pre-Phase-3
rows that never got the new column populated. No frontend changes
needed; the existing `{ from, to }` contract is preserved.

**Verification needed from you:** after running `0011`, check
`/tracking?id=NMX-404885` (or another shipment created since Phase 3)
and confirm Estimated Delivery now shows a real date instead of being
blank.

---

### 1.2 MEDIUM — Internal operator notes were exposed on the public tracking page

**Component:** `get_public_shipment()`

**Finding:** `tracking_events.note` is free text an admin or the
Telegram bot's "Note" action writes for internal operational context
(the Phase 4 PRD explicitly warns about this: "do not expose internal-
only notes publicly"). The public function returned it verbatim in
every event's JSON. Nothing in the current public UI happened to render
it, but the field was present in the API response and would show up to
anyone inspecting the response directly (browser devtools, a script
polling the tracking function), not just users reading the rendered
page.

**Evidence:** same function, `events` array construction, `'note',
e.note`.

**Fix:** included in `0011`, alongside the ETA fix. The public function
no longer includes `note` in its output at all.

**Verification needed from you:** add a note to a shipment via the
dashboard or `/update` in Telegram, then check that
`get_public_shipment()`'s response for that tracking ID does not
contain it (Section 6.1 has the exact query).

---

### 1.3 LOW — No security headers configured

**Component:** `next.config.ts`

**Finding:** The app shipped with zero response headers beyond Next's
defaults; none of `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, or `Permissions-Policy` were set.

**Fix:** Added all four to `next.config.ts`. These are conservative,
well-understood headers with essentially no risk of breaking anything,
verified present in the build's `routes-manifest.json`.

**Deliberately not added:** a Content-Security-Policy. Getting a CSP
right requires testing against the real deployed app (confirming
Supabase's origin, any inline styles Tailwind/Next inject, etc. don't
get blocked), which isn't possible from this build environment. A
broken CSP silently breaking your live site is worse than no CSP.
**Recommendation:** add one after deployment, with real browser testing
against the production URL, not as part of this pass.

---

### 1.4 LOW — No length limit on tracking ID input (public and admin lookup paths)

**Component:** `TrackingForm.tsx`, `getShipmentByTrackingId.ts`,
`getShipmentForAdmin.ts`

**Finding:** The Phase 7 PRD's tracking security test table explicitly
lists "Extremely long ID" as a required case. Neither the public form
nor either lookup function capped input length. Not independently
exploitable (the underlying query is a simple indexed equality lookup,
not a regex or anything with pathological worst-case cost), but sloppy
input handling on an unauthenticated, public endpoint is worth closing
regardless.

**Fix:** Added a 64-character cap: `maxLength` on the form input
(UX-level), and a defensive length check in both lookup functions
(server-side, the check that actually matters) that returns "not
found" for anything over that length before it reaches the database.

---

### 1.5 INFORMATIONAL — `admin_profiles` table is unused

**Finding:** Created in Phase 2 as optional metadata scaffolding
(`display_name` alongside the Supabase Auth user), RLS correctly
locked down (own-row-only), but no application code ever reads or
writes it. Not a vulnerability; RLS is already correctly restrictive
even though nothing uses it. Flagging so it's a deliberate decision,
not forgotten scaffolding: either wire it up if you want admin display
names somewhere, or leave it, or drop it in a future cleanup pass.

---

### 1.6 INFORMATIONAL / PROCESS — Telegram bot token exposure

**Finding:** `TELEGRAM_BOT_TOKEN` was pasted in plaintext into this
chat conversation multiple times during setup and debugging.

**This is not a code vulnerability**, but per this PRD's own
instruction ("if a real credential was previously committed, rotate
it: deleting it from the current file is not enough"), the same
principle applies to a credential that ended up somewhere it didn't
need to be, chat history included.

**Action required from you, not code:** regenerate the bot token via
@BotFather (`/revoke` or `/token`) before this goes to production, and
update `TELEGRAM_BOT_TOKEN` in whatever environment (local `.env.local`,
hosting platform) actually runs the deployed app. The old token should
stop working immediately once revoked.

---

## 2. Reviewed, no issue found

- **RLS coverage:** all 6 tables (`shipments`, `tracking_events`,
  `admin_profiles`, `telegram_link_tokens`, `telegram_accounts`,
  `telegram_sessions`) have RLS enabled. `telegram_sessions` has zero
  policies by design (service-role only, correct for pure bot-backend
  state). Write policies on `shipments`/`tracking_events` are scoped
  to `authenticated`, not per-admin, which is correct: this is a
  shared operational team, not siloed per-admin data.
- **Public data contract:** beyond the two issues fixed above, the
  public function does not expose internal database IDs, admin
  identities, authentication data, or any field outside the documented
  contract.
- **XSS:** no `dangerouslySetInnerHTML` anywhere in the codebase. All
  user-controlled content (product descriptions, notes, sender names)
  renders through React's default escaping.
- **File uploads:** both the dashboard and Telegram upload paths
  allowlist `image/jpeg`, `image/png`, `image/webp` only (not SVG or
  HTML), enforced both in application validation and at the Supabase
  Storage bucket level. Storage filenames are server-generated
  (`crypto.randomUUID()`), never derived from user-supplied names.
- **Secrets:** no hardcoded keys or tokens anywhere in `src/`.
  `.gitignore` covers all `.env*` files. This sandboxed working
  directory is not itself a git repository, so there's no history to
  sweep here; if you've been committing to git locally, run `git log
  -p -- .env.local` (or similar) yourself to confirm nothing was ever
  committed there.
- **Dependencies:** `npm audit` reports 0 vulnerabilities.
- **Authorization:** every admin write path (dashboard Server Actions
  and Telegram bot commands) either uses a cookie-authenticated client
  with RLS enforcing `authenticated`-only access, or, for the bot,
  explicitly resolves and verifies an active `telegram_accounts` link
  before doing anything, with the service-role key confined to
  `lib/telegram/*` and the webhook route only, never in client-bundled
  code.
- **Error handling:** no raw Supabase/Postgres error text is passed
  through to user-facing UI or bot messages; every catch path
  substitutes a generic message and logs the real error server-side
  only.

---

## 3. Accepted risks (not fixed in this pass, documented per PRD section 24)

### 3.1 No in-app rate limiting

**Risk:** login, public tracking lookup, and the Telegram webhook have
no application-level rate limiting. A scripted flood of tracking
lookups or login attempts is not blocked by this code.

**Why not fixed here:** the PRD itself says the MVP does not need a
custom distributed rate-limiting system and to use Cloudflare's
capabilities where appropriate. This app doesn't have a Cloudflare
account attached yet (that's Phase 6), so there's nothing to configure
from here.

**Mitigating factors in the meantime:** Supabase Auth has its own
built-in rate limiting on sign-in attempts, independent of this app's
code. Tracking lookups are read-only and rate-limited implicitly by
Postgres connection limits under genuine abuse.

**Action needed:** once Phase 6 sets up Cloudflare, enable basic rate
limiting on `/admin/login`, `/tracking`, and `/api/telegram/webhook`
at the Cloudflare layer.

### 3.2 No Content-Security-Policy

See 1.3. Needs live testing against the deployed app before shipping
one; a wrong CSP breaks the site rather than securing it.

### 3.3 HTTPS enforcement

Not testable from here; the app has no hardcoded `http://` production
links (verified), but actual HTTPS redirect/enforcement is a Cloudflare
DNS/SSL configuration matter, out of this repository's scope. Phase 6
territory.

---

## 4. Fixes applied in this pass

| File | Change |
|---|---|
| `supabase/migrations/0011_fix_public_eta_and_notes.sql` | New migration. Fixes the ETA bug (1.1) and removes public note exposure (1.2). **You need to run this one, same as every other migration.** |
| `src/lib/shipments/getShipmentByTrackingId.ts` | 64-char cap on public tracking ID input (1.4) |
| `src/lib/shipments/getShipmentForAdmin.ts` | Same cap on the admin/bot lookup path (1.4) |
| `src/components/tracking/TrackingForm.tsx` | `maxLength={64}` on the input (1.4, UX-level) |
| `next.config.ts` | Added `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` (1.3) |

`npm run lint` and `npm run build` both pass after all changes. The
`X-Content-Type-Options` header was confirmed present in the actual
build output (`routes-manifest.json`), not just source.

---

## 5. Action items for you (not code)

1. **Run `supabase/migrations/0011_fix_public_eta_and_notes.sql`** in
   the Supabase SQL Editor, same as every prior migration.
2. **Regenerate your Telegram bot token** via @BotFather before
   production use (see 1.6), and update it everywhere it's configured.
3. **Verify the ETA fix live**: check `/tracking?id=NMX-404885` shows a
   real Estimated Delivery after running `0011`.
4. Carry the rate-limiting and CSP items (Section 3) into Phase 6 as
   concrete follow-ups once Cloudflare is attached.

---

## 6. Live test checklist (run these yourself once deployed or against your dev environment; I cannot reach your Supabase project from this sandbox)

### 6.1 Database tests (run in Supabase SQL Editor as the `anon` role, or via a REST call with only the anon key)

| Test | Expected | How to check |
|---|---|---|
| Read `shipments` table directly (not via the function) as anon | DENIED | `select * from shipments;` using the anon key via `supabase-js` with no session, or PostgREST directly |
| Insert into `shipments` as anon | DENIED | Attempt an insert with the anon key, no session |
| Insert into `tracking_events` as anon | DENIED | Same |
| `get_public_shipment('NMX-842731')` as anon | ALLOWED, returns the documented public fields only | `select get_public_shipment('NMX-842731');` |
| Confirm no `note` field in the above result | Field absent | Inspect the JSON output |
| Confirm `estimatedDelivery.from`/`.to` populated for `NMX-404885` (post-`0011`) | Real date, not null | Same query with that tracking ID |

### 6.2 Admin/auth tests

| Test | Expected |
|---|---|
| Visit `/admin` while signed out | Redirected to `/admin/login` |
| Sign in with correct credentials | Redirected to `/admin`, dashboard loads |
| Sign in with wrong password | Generic "Invalid email or password," no detail on which field was wrong |
| Sign out, then try to load `/admin/shipments` directly via URL | Redirected to login |

### 6.3 Tracking input tests

| Test | Expected |
|---|---|
| Valid tracking ID | Shipment displays |
| Invalid tracking ID | "We couldn't find a shipment..." |
| Empty submission | Client-side validation message, no request sent |
| 100+ character string | "Not found," no error/crash |
| `<script>alert(1)</script>` as the ID | Treated as literal text, "not found," never executed |

### 6.4 Telegram tests

| Test | Expected |
|---|---|
| Unlinked Telegram account sends `/help` | "Your Telegram account is not connected..." |
| Linked account sends `/help` | Command list |
| Expired/reused link token | "This connection link has expired..." |
| Malformed `/update` input (e.g., garbage tracking ID) | "Shipment not found," no crash |
