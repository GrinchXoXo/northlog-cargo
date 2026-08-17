-- Phase 4 — Telegram Operations
-- Migration 0010: Telegram linking + conversation state
--
-- Three tables:
--   telegram_link_tokens — short-lived, single-use tokens for the
--     dashboard "Connect Telegram" deep-link flow (PRD section 5)
--   telegram_accounts — the durable admin ↔ Telegram user mapping
--   telegram_sessions — durable conversation state per Telegram user,
--     so guided flows (/create, /update) survive across webhook calls
--     without relying on server memory (PRD section 22)
--
-- All three are accessed by the webhook via the service-role key (no
-- browser session exists in a webhook request), so RLS here mainly
-- protects the dashboard-facing reads/writes (an admin checking their
-- own connection status) rather than the bot backend, which bypasses
-- RLS by design and enforces authorization in application code instead.

-- pgcrypto provides gen_random_bytes(), used below for link tokens.
-- Supabase projects normally have this enabled already; explicit here
-- so this migration doesn't silently depend on that.
create extension if not exists pgcrypto;

create table if not exists telegram_link_tokens (
  token text primary key,
  admin_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists telegram_link_tokens_admin_id_idx
  on telegram_link_tokens (admin_id);

create table if not exists telegram_accounts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  telegram_user_id bigint not null unique,
  telegram_username text,
  active boolean not null default true,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists telegram_accounts_admin_id_active_idx
  on telegram_accounts (admin_id)
  where active;

drop trigger if exists telegram_accounts_set_updated_at on telegram_accounts;
create trigger telegram_accounts_set_updated_at
  before update on telegram_accounts
  for each row
  execute function set_updated_at();

create table if not exists telegram_sessions (
  telegram_user_id bigint primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table telegram_link_tokens enable row level security;
alter table telegram_accounts enable row level security;
alter table telegram_sessions enable row level security;

-- No public/authenticated policies on telegram_sessions at all — it is
-- exclusively a bot-backend (service-role) concern; a dashboard user has
-- no legitimate reason to read or write raw conversation state.

create policy "Admins can create their own link tokens"
  on telegram_link_tokens for insert
  to authenticated
  with check (admin_id = auth.uid());

create policy "Admins can read their own link tokens"
  on telegram_link_tokens for select
  to authenticated
  using (admin_id = auth.uid());

create policy "Admins can read their own telegram account"
  on telegram_accounts for select
  to authenticated
  using (admin_id = auth.uid());

create policy "Admins can disconnect their own telegram account"
  on telegram_accounts for update
  to authenticated
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- ---------------------------------------------------------------------
-- Token lifecycle helpers
-- ---------------------------------------------------------------------

-- Cryptographically random, URL-safe, well within Telegram's 64-char
-- deep-link payload limit. Called from the dashboard as the
-- authenticated admin, so admin_id is trusted to be auth.uid() there.
create or replace function create_telegram_link_token(p_ttl_minutes int default 10)
returns text
language plpgsql
security invoker
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  v_token := replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-');
  v_token := rtrim(v_token, '=');

  insert into telegram_link_tokens (token, admin_id, expires_at)
  values (v_token, auth.uid(), now() + make_interval(mins => p_ttl_minutes));

  return v_token;
end;
$$;

grant execute on function create_telegram_link_token(int) to authenticated;

-- Redeems a link token: validates it, marks it used, and upserts the
-- telegram_accounts row. Service-role only — this is called from the
-- webhook after Telegram delivers /start <token>, where there is no
-- admin session to rely on.
create or replace function redeem_telegram_link_token(
  p_token text,
  p_telegram_user_id bigint,
  p_telegram_username text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_admin_id uuid;
begin
  select admin_id into v_admin_id
  from telegram_link_tokens
  where token = p_token
    and used_at is null
    and expires_at > now();

  if v_admin_id is null then
    return null;
  end if;

  update telegram_link_tokens set used_at = now() where token = p_token;

  insert into telegram_accounts (admin_id, telegram_user_id, telegram_username, active, linked_at)
  values (v_admin_id, p_telegram_user_id, p_telegram_username, true, now())
  on conflict (telegram_user_id) do update set
    admin_id = excluded.admin_id,
    telegram_username = excluded.telegram_username,
    active = true,
    linked_at = now();

  return v_admin_id;
end;
$$;

grant execute on function redeem_telegram_link_token(text, bigint, text) to service_role;
