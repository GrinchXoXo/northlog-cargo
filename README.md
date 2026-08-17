# Northlog Cargo

Logistics company website, shipment tracking, admin dashboard, and
Telegram operations bot, built per the documents in `PRD/`.

## Current phase

**Phase 5, Performance, Responsive Design and Production Polish.** This
phase does not add features. It takes Phases 1 through 4 and makes them
responsive, faster, accessible, and production-ready: real branding
instead of placeholders, a genuine mobile pass on the public site,
tracking page, and admin dashboard, and a cleanup sweep for leftover
placeholder content.

## Stack

- Next.js 16 (App Router) plus TypeScript, strict mode
- Tailwind CSS v4
- Lucide React icons
- Supabase (Postgres, Auth, Storage)
- Telegram Bot API (webhook based, plain `fetch`, no bot framework)

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
```

`0006` adds a new value to the `shipment_status` enum. Postgres will not
let you reference it in the same transaction that added it, so run it
by itself first, then the rest.

### 4. Create an admin user

Authentication, Users, Add User, in the Supabase dashboard.

### 5. Set up the Telegram bot

1. Message `@BotFather` in Telegram, `/newbot`, save the token as
   `TELEGRAM_BOT_TOKEN`.
2. Generate a random secret (`openssl rand -hex 32`) as
   `TELEGRAM_WEBHOOK_SECRET`.
3. Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to your bot's username, no
   `@`.
4. Get a public HTTPS URL for the webhook. Telegram cannot reach
   `localhost`. Use your deployed URL, or a tunnel for local testing
   (`cloudflared tunnel --url http://localhost:3000` or
   `ngrok http 3000`).
5. Register the webhook:

   ```bash
   curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook \
     -d url=https://<your-domain>/api/telegram/webhook \
     -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

### 6. Run the app

```bash
npm run dev
```

- Public site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin/login`
- Tracking IDs to try: `NMX-842731` (in transit), `NMX-113305` (delivered)

To connect Telegram: sign into the dashboard, go to Settings, tap
Connect Telegram, tap the generated link, confirm in Telegram. Then try
`/create`, `/track`, `/update` in the bot.

```bash
npm run lint
npm run build
```

## Structure

```
supabase/migrations/    Run these in order against your Supabase project

src/
├── app/
│   ├── admin/(protected)/
│   │   ├── settings/         Connect and disconnect Telegram
│   │   ├── shipments/        List, create, detail and update
│   │   ├── AdminHeader.tsx   Nav, collapses to a mobile menu below md
│   │   └── layout.tsx        Auth guard
│   ├── admin/login/
│   ├── api/telegram/webhook/ Telegram Bot API entry point
│   ├── privacy/, terms/      Simple legal pages
│   ├── tracking/actions.ts   Server Action bridge to the data access layer
│   └── ...                    about, services, contact, home
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts, server.ts   Cookie authenticated (dashboard)
│   │   ├── service.ts             Service role (Telegram webhook only)
│   │   └── middleware.ts          Session refresh, scoped to /admin
│   ├── shipments/          createShipment, addTrackingEvent, and so on.
│   │                          Shared by the dashboard and the bot via an
│   │                          optional injected client and actor context
│   ├── telegram/
│   │   ├── api.ts              Telegram Bot API, fetch based
│   │   ├── dispatcher.ts       Routes incoming updates
│   │   ├── commands/           /create, /track, /update flows
│   │   ├── session.ts          Durable conversation state in Postgres
│   │   ├── linking.ts          Account linking and authorization
│   │   └── image.ts            Telegram photo to Supabase Storage
│   └── validation/
└── types/shipment.ts       Canonical status enum, includes CUSTOMS_CLEARANCE
```

## How the pieces fit together

- One backend, four interfaces. The website, dashboard, and Telegram bot
  all read and write the same `shipments` and `tracking_events` tables
  through the same `lib/shipments/*` functions. Nothing is duplicated
  per interface.
- Two authentication paths, one set of functions. Dashboard writes
  authenticate through the admin's browser session (cookies). The
  Telegram webhook has no session. It verifies the Telegram user against
  `telegram_accounts`, then calls the same `createShipment` and
  `addTrackingEvent` functions with an explicit service role client and
  resolved admin ID. See `lib/shipments/context.ts`.
- The only service role key usage in this app is inside `lib/telegram/*`
  and the webhook route. It bypasses RLS, so authorization is enforced
  in code (`resolveAdminForTelegramUser`) before any shipment operation,
  not by the database.
- Account linking is entirely self service: a short lived, single use
  token generated from Settings, redeemed through a Telegram deep link,
  with an explicit confirm tap in the bot before the link is finalized.
- Conversation state for guided bot flows lives in Postgres
  (`telegram_sessions`), not server memory, and expires after 30
  minutes. See `lib/telegram/session.ts`.
- Design tokens (color, type, spacing, radius, shadow) are centralized
  in `src/app/globals.css`. Brand strings and contact details are
  centralized in `src/lib/constants.ts`. Neither should be hard-coded
  anywhere else.

## What's deliberately not built

Customer Telegram accounts, WhatsApp or SMS, an AI conversational
assistant, GPS hardware integration, automatic carrier APIs, payments,
CRM, advanced analytics. All explicitly out of scope per the PRDs. The
bot uses guided workflows and buttons throughout, not natural language
understanding, on purpose.

Business facts that were never confirmed (company founding story,
service coverage area, exact service list) remain clearly marked
placeholders in the About and Services pages rather than invented
content.

## Known limitations from this build session

This code was written and built (lint and `next build` both pass) in a
sandboxed environment that cannot reach `supabase.co` or
`api.telegram.org`. Nothing here has been exercised against a live
Telegram bot or a live database. Treat running through the setup steps
above, then `/create`, `/track`, and `/update` in the bot, as the real
verification step.
