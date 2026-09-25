# Northlog Cargo

Logistics company website, shipment tracking, admin dashboard, and
customer support chat, built per the documents in `PRD/`.

## Current phase

**Phase 7, Security Hardening, complete.** Phase 6 (production launch)
is in progress: the Cloudflare Workers deployment path is set up and
verified to build correctly (see "Deploying to production" below), but
the actual live domain and business email are being finished outside
this repository.

**Iteration 1:** the Telegram integration has been removed, and
migration `0014` introduces the organization (organization_id)
foundation so Northlog can eventually serve more than one logistics
company — without touching the existing client's data.

**Iteration 2 (this state of the repo):** migration `0015` adds an
explicit platform-operator designation and the provisioning RPCs, and
the dashboard gains an internal `/admin/organizations` page where that
operator creates a new company together with its first admin. Tenant
isolation between two organizations is verified in the database.
See "Organizations" and "Removed: Telegram" below.

**Iteration 2.1:** a security review of Iterations 1–2, fixed by
migration `0016` — `pg_temp` search-path pinning on every
security-relevant function, a tenant check on private (general) chat
conversations, and storage writes scoped to the owning organization.
See "Security review (Iteration 2.1)" below.

## Stack

- Next.js 16 (App Router) plus TypeScript, strict mode
- Tailwind CSS v4
- Lucide React icons
- Supabase (Postgres, Auth, Storage)
- Cloudflare Workers via the OpenNext adapter (`@opennextjs/cloudflare`)
  for production hosting

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values. See the
comments in that file for where each one comes from.

Set `NEXT_PUBLIC_SITE_URL=https://northlog.xyz` for production. Locally,
`http://localhost:3000` is fine and is the default.

### 3. Run the database migrations

Run these in order via the Supabase dashboard's SQL Editor:

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_rls_and_public_function.sql
supabase/migrations/0003_admin_rpcs.sql
supabase/migrations/0004_storage.sql
supabase/migrations/0005_seed.sql
supabase/migrations/0006_customs_status.sql        (run alone, then commit, before 0007+)
supabase/migrations/0007_phase3_schema_and_functions.sql
supabase/migrations/0008_phase3_seed.sql
supabase/migrations/0009_widen_write_rpcs_for_bot.sql
supabase/migrations/0010_telegram_linking.sql
supabase/migrations/0011_fix_public_eta_and_notes.sql
supabase/migrations/0012_chat_support.sql
supabase/migrations/0013_chat_admin_rpcs.sql
supabase/migrations/0014_organizations_tenancy.sql
supabase/migrations/0015_platform_owner_provisioning.sql
supabase/migrations/0016_tenant_isolation_hardening.sql
```

`0006` adds a new value to the `shipment_status` enum. Postgres will not
let you reference it in the same transaction that added it, so run it
by itself first, then the rest.

Migrations are never edited once applied. `0014` is written to be safe
to run against the existing production database: it only creates,
backfills and re-scopes — it does not drop tables, truncate anything,
or touch Supabase Auth. `0015` is written the same way: it adds one
column with a default and a partial unique index, backfills a small
list table, and re-defines two functions — it drops nothing. `0016`
only pins function configuration, replaces chat function bodies with
an added authorization check, and replaces three storage policies with
narrower ones — it drops no tables, columns or rows, and leaves public
image reads untouched. All three files are idempotent (re-running them
changes nothing).

### 4. Create an admin user

Authentication, Users, Add User, in the Supabase dashboard, then add
the user to an organization (see "Organizations" below):

```sql
insert into organization_members (organization_id, user_id, role)
select o.id, u.id, 'OWNER'
from organizations o
join auth.users u on u.email = 'admin@example.com'
where o.slug = 'northlog-cargo';
```

A user with no `organization_members` row can sign in but sees an empty
dashboard: every query is filtered by organization membership.

Once `0015` is applied, later companies are created from the dashboard
by the platform operator: sign in, open **Organizations**, enter the
company name, its slug and the first admin's email address. The admin
account is created for them and emailed a one-time invitation link
landing on `/admin/accept-invite`, where they choose their own password,
so the SQL above is only for bootstrapping that first user.

### 5. Run the app

```bash
npm run dev
```

- Public site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin/login`
- Tracking IDs to try: `NMX-842731` (in transit), `NMX-113305` (delivered)

```bash
npm run lint
npm run build
```

## Organizations

Northlog is being prepared to host several independent logistics
companies. Iteration 1 establishes only the foundation:

```
organizations            one row per Northlog customer
organization_members     which auth user belongs to which organization (OWNER | ADMIN)

shipments.organization_id      the tenant root
conversations.organization_id  needed because general conversations have no shipment

tracking_events  -> tenant via their shipment
messages         -> tenant via their conversation
```

- The existing client was backfilled into the organization
  `northlog-cargo` ("Northlog Cargo") along with every existing
  shipment, conversation, and pre-existing auth user. No data was
  deleted, recreated, or moved.
- Row-level security on `shipments`, `tracking_events`, `conversations`
  and `messages` now resolves the caller's organization with
  `auth_organization_id()`. The organization ID is never taken from the
  browser — membership decides it.
- Both new tables are RLS-enabled. `organizations` is readable only by
  its members and `organization_members` only by the user concerned;
  neither has an INSERT/UPDATE/DELETE policy for `authenticated`, so
  membership is changed as the SQL editor or the service role, never
  from the browser.
- Public tracking and the public/customer chat still run through the
  same SECURITY DEFINER functions as before, so anonymous visitors are
  unaffected.
- Exactly one organization carries `is_default = true` (enforced by a
  partial unique index). That is the company the public website belongs
  to, and `default_organization_id()` files the site's general —
  non-shipment — support conversations under it. Iteration 1's
  "only while a single organization exists" guard would have broken
  public chat the moment a second company was provisioned, so `0015`
  replaced it with this explicit designation.

### Provisioning (Iteration 2)

`/admin/organizations` is an internal page for the **platform
operator** — the one person who may create companies. A customer admin
never sees it and cannot use what is behind it.

```
operator → company name + slug + admin email
        → Supabase Auth user created or found (server-side, service role)
        → create_organization_with_admin() inserts organization + OWNER membership in one transaction
        → that admin signs in at /admin and sees only their own organization
```

- **Who is the operator:** the `platform_owners` table (migration
  `0015`), a list of auth user IDs with RLS enabled and *zero* policies,
  so no browser role can read or write it. `is_platform_owner()` is a
  no-argument SECURITY DEFINER function that answers only about
  `auth.uid()`. The migration backfills the earliest pre-existing auth
  account (that account already had unrestricted access in Iteration 1).
  To name someone else:

  ```sql
  delete from platform_owners;
  insert into platform_owners (user_id)
  select id from auth.users where email = 'you@example.com';
  ```

- **Where authorization is enforced:** in three places, none of them the
  navigation. The page checks it before rendering, the server action
  checks it before doing anything, and
  `create_organization_with_admin()` / `list_organizations()` re-check it
  as their first statement — so calling the function directly through
  PostgREST gets the same refusal.

- **Auth users:** created with the service-role key, strictly inside
  the server action (`src/lib/organizations/provision.ts`). The key is
  read from `SUPABASE_SERVICE_ROLE_KEY`, never sent to the browser and
  never `NEXT_PUBLIC_`. No password is ever generated: Supabase Auth
  creates the user in an invited state and emails a one-time link whose
  `redirectTo` is `<NEXT_PUBLIC_SITE_URL>/admin/accept-invite`
  (`inviteRedirectUrl()` in `provision.ts`), and the admin sets their own
  password on that page.

- **Partial failure is reported, never hidden:** the Auth user is
  created first on purpose. If the organization transaction then fails,
  the response says the user exists but the organization does not and
  that retrying will reuse them — an orphaned Auth user is inert, while
  an organization with no admin would claim a slug and lie about
  success.

- **Multi-org behavior of the public site:** general support chat keeps
  filing under the default organization; shipment chat is derived from
  the shipment, so it is correct for every organization automatically.

Not built in this iteration: public signup, customer-facing onboarding,
invitations, organization switching, billing, subscriptions, tenant
branding, tenant analytics, advanced RBAC, an organization settings UI,
or any change to the login flow.

### Security review (Iteration 2.1)

Reviewed Iterations 1–2 against the database itself, not against the
passing test output. Three issues were verified and fixed by `0016`:

- **`pg_temp` search-path shadowing.** `set search_path = public`
  still searches the temporary schema first, so a caller able to run
  SQL could create a TEMP table that shadows a real one inside a
  SECURITY DEFINER function — verified: `is_platform_owner()` returned
  `true` for a non-owner when `platform_owners` was shadowed. Every
  security-relevant function now runs with `search_path = public,
  pg_temp` (temporary objects last), and 0014's policies reference
  their tables schema-qualified.

- **Chat conversations readable by UUID across tenants.**
  `get_conversation_json()`, `send_customer_message()` and
  `get_or_create_general_conversation()` are SECURITY DEFINER, so RLS
  never saw the request: direct table reads said no, the RPC said yes.
  General conversations are the only private kind, so they now carry a
  tenant check for signed-in callers — a member of another
  organization gets the same "Conversation not found." a missing
  conversation produces, and a refused send writes nothing. Shipment
  conversations stay reachable by tracking ID (the public tracking
  page contract from 0012), and the conversation UUID remains the
  credential for anonymous visitors.

- **Storage writes were not tenant-scoped.** The `0004` policies let
  any authenticated user upload, overwrite or delete any object in
  the public `shipment-images` bucket, and image paths are served by
  `get_public_shipment()` — a defacement path. Uploads now require an
  organization membership; overwriting or deleting an object further
  requires that it be referenced by a shipment of the caller's
  organization. Public reads (PRD §26) and the app's upload flow
  (fresh random UUID path, `upsert: false`) are unchanged.

Verified in the database harness (208 checks): every organization,
shipment, tracking event, conversation, message and storage object of
one organization stays invisible and unmodifiable from the other, a
user with no organization sees an empty database, platform-owner
functions refuse customers and `platform_owners` has no browser
write path, pre-existing data (tracking IDs, conversations, auth
users) is untouched, and re-running 0014–0016 changes nothing.

Known and deliberately left alone: the historical Telegram tables
from `0010`, the invoker-only token functions that go with them, and
admin RPCs that report success when they matched no row (a data
integrity wart, not an isolation hole).

## Removed: Telegram

The Telegram bot, webhook route, account linking, session state,
settings UI and `TELEGRAM_*` environment variables have been removed
from the application. Historical migrations (`0009`, `0010`) are kept
exactly as they were applied, so the `telegram_link_tokens`,
`telegram_accounts` and `telegram_sessions` tables remain in the
database with RLS enabled and are simply no longer referenced by any
code path. Dropping them is optional cleanup, deliberately kept out of
`0014`; do it as its own reviewed migration if you want it gone.

## Deploying to production (Cloudflare Workers)

This app uses Server Actions and middleware, so it needs the full
Next.js runtime, not a static export. Cloudflare's current
recommendation for this is the OpenNext adapter deploying to
Cloudflare Workers, not plain Cloudflare Pages (their older
Pages/Edge-runtime path doesn't fully support Server Actions). This
repo is already configured for it: `open-next.config.ts`,
`wrangler.jsonc`, and the `preview`/`deploy` scripts in `package.json`.

One deliberate, currently-necessary quirk: the session-refresh
middleware lives in `src/middleware.ts`, not the newer `src/proxy.ts`
convention Next.js 16 introduced. Next 16's `proxy.ts` always runs on
the Node.js runtime, which Cloudflare's OpenNext adapter doesn't
support yet ("Node.js middleware is not currently supported"). The
older `middleware.ts` convention is deprecated but still works and
runs on the Edge runtime, which OpenNext does support. Switch it back
once OpenNext adds Node.js middleware support (tracked upstream:
`cloudflare/workers-sdk#13755`, `#13937`).

### 1. Point the domain at Cloudflare

In the Cloudflare dashboard, add `northlog.xyz` as a site. Cloudflare
will give you two nameservers; set those at your domain registrar.
DNS propagation is usually minutes, occasionally longer.

### 2. Authenticate Wrangler

```bash
npx wrangler login
```

Opens a browser to authorize the CLI against your Cloudflare account.

### 3. Set the production site URL for this build

`NEXT_PUBLIC_*` variables are baked into the build at build time, not
read at runtime. Rather than editing `.env.local` back and forth
between `localhost` (for `npm run dev`) and the real domain (for
deploying), create `.env.production.local` with just:

```
NEXT_PUBLIC_SITE_URL=https://northlog.xyz
```

Next.js prefers this file during production builds automatically, so
`npm run deploy` picks up the real domain without touching
`.env.local`.

Supabase Auth independently refuses to honor a redirect it has not been
told about, so also add the invitation landing page to **Dashboard →
Authentication → URL Configuration → Redirect URLs**:

```
https://northlog.xyz/admin/accept-invite
```

Without that entry the invitation email's `redirectTo` is rejected and
the admin never reaches the accept page.

### 4. Deploy

```bash
npm run deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
and creates/updates a Worker named `northlog-cargo` (from
`wrangler.jsonc`). All `NEXT_PUBLIC_*` values present in your local env
files at this point get baked into the deployed bundle.

### 5. Set server-only secrets

These are read at request time, not baked into the build, so they need
to be set as actual Cloudflare secrets:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Each prompts for the value. Re-run any time the secret is rotated.

### 6. Attach the custom domain to the Worker

Cloudflare dashboard: Workers & Pages, `northlog-cargo`, Settings,
Domains & Routes, Add Custom Domain, `northlog.xyz`.

### 7. Business email (Zoho Mail)

Add Zoho's MX, SPF, DKIM, and DMARC records in Cloudflare's DNS panel
for `northlog.xyz`. The exact values come from Zoho's own
domain-verification flow when adding the domain there; there's nothing
to hardcode here.

### 8. Smoke test

- `https://northlog.xyz` loads over HTTPS, no certificate warnings
- `/tracking` with a real tracking ID
- `/admin/login` signs in, dashboard lists shipments
- a logged-in admin can create a shipment and post a status update
- the public chat widget can start a conversation and reply

### Local preview against the Workers runtime (optional)

To test the actual Cloudflare Workers shape locally before deploying:

```bash
cp .dev.vars.example .dev.vars   # fill in the same values as .env.local
npm run preview
```

## Structure

```
supabase/migrations/    Run these in order against your Supabase project

src/
├── app/
│   ├── admin/(protected)/
│   │   ├── settings/         Account settings (no configurable options yet)
│   │   ├── shipments/        List, create, detail and update
│   │   ├── support/          Support inbox
│   │   ├── organizations/    Platform-operator-only provisioning page
│   │   ├── AdminHeader.tsx   Nav, collapses to a mobile menu below md
│   │   └── layout.tsx        Auth guard + operator nav flag
│   ├── admin/login/
│   ├── privacy/, terms/      Simple legal pages
│   ├── tracking/actions.ts   Server Action bridge to the data access layer
│   └── ...                    about, services, contact, chat, home
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts, server.ts   Cookie authenticated (dashboard)
│   │   ├── service.ts             Service role (organization provisioning only)
│   │   └── middleware.ts          Session refresh, scoped to /admin
│   ├── chat/                Customer chat + admin inbox access layer
│   ├── organizations/       Provisioning + organization list access layer
│   ├── platform/            isPlatformOwner()
│   ├── shipments/           createShipment, addTrackingEvent, and so on.
│   └── validation/          Shared ValidationError, shipment + organization rules
└── types/                   shipment.ts (status enum), organization.ts, chat.ts
```

## How the pieces fit together

- One backend, two interfaces. The public website and the admin
  dashboard read and write the same `shipments` and `tracking_events`
  tables through the same `lib/shipments/*` functions. Nothing is
  duplicated per interface.
- One authentication path. Dashboard writes authenticate through the
  admin's browser session (cookies); there is no second credential
  type in the application.
- Tenant isolation lives in the database. RLS resolves the caller's
  organization with `auth_organization_id()`; the browser never supplies
  an organization ID, and a user in more than one organization always
  gets the same deterministic one (their oldest membership). The
  service-role client (`lib/supabase/service.ts`) bypasses RLS and is
  used by exactly one request path — creating/looking up the Supabase
  Auth user during organization provisioning, after authorization has
  already been checked. It must never be used to read dashboard
  business data or as a way around the organization boundary.
- Platform access is a list, not a role hierarchy. `platform_owners`
  (migration `0015`) decides who may provision organizations, is
  invisible to every browser role, and is consulted only by
  SECURITY DEFINER functions that take no arguments — so a customer
  admin has no way to ask whether someone else is the operator, or to
  reach organization creation at all.
- Public reads go through SECURITY DEFINER functions
  (`get_public_shipment`, `get_or_create_*_conversation`,
  `send_customer_message`), so anonymous visitors never get table access
  and the public contract stays structural rather than enforced by
  every future policy change. Those same functions re-check tenancy for
  signed-in callers (`0016`): a member of another organization is told
  the conversation does not exist, while tracking-ID and anonymous
  access behave exactly as the public pages expect.
- Design tokens (color, type, spacing, radius, shadow) are centralized
  in `src/app/globals.css`. Brand strings and contact details are
  centralized in `src/lib/constants.ts`. Neither should be hard-coded
  anywhere else.

## What's deliberately not built

Customer WhatsApp or SMS, an AI conversational assistant, GPS hardware
integration, automatic carrier APIs, payments, CRM, advanced analytics.
All explicitly out of scope per the PRDs.

Customer-facing multi-customer features — company onboarding, public
signup, invitations, organization switching, billing, subscriptions,
tenant branding — are future iterations. Organization provisioning for
the operator exists (see "Provisioning"); everything a *customer* would
do to manage their own company does not.

Business facts that were never confirmed (company founding story,
service coverage area, exact service list) remain clearly marked
placeholders in the About and Services pages rather than invented
content.

## Known limitations from this build session

This code was written and built (lint and `next build` both pass).
Migrations `0001`–`0013` were applied before this session; `0014`,
`0015` and `0016` have since been applied to the live Supabase project
and verified there — row counts and content checksums identical before
and after, all function/privilege/storage audits green, and live RLS
role tests (member, non-member, anonymous) passing with every
transaction rolled back. What has *not* been exercised against the live
database is the application itself: walk a shipment from creation to
delivery through the dashboard, and create one organization through
`/admin/organizations`, as the real end-to-end sign-off.
