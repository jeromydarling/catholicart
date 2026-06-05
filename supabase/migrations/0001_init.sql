-- Locavit · initial schema
-- Postgres + Supabase. Apply in order: 0001_init.sql → 0002_rls.sql → 0003_seed.sql.
--
-- Conventions:
--   - All tables use uuid primary keys (gen_random_uuid()).
--   - All timestamps are timestamptz (UTC).
--   - Updatable rows carry created_at + updated_at; triggers maintain
--     updated_at automatically.
--   - User-facing strings stored as text (not varchar) — Postgres treats
--     them identically.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- case-insensitive emails

-- ────────────────────────────────────────────────────────────────────
-- updated_at trigger helper
-- ────────────────────────────────────────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- profiles — extends auth.users with role + display name
-- ────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('patron', 'artist', 'operator');

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.user_role not null default 'patron',
  display_name  text,
  email         citext,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto-create a profile row when a new auth.users row is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- Reference tables: categories, saints, dioceses, orders
-- ────────────────────────────────────────────────────────────────────
create table public.categories (
  slug         text primary key,
  name         text not null,
  short_name   text not null,
  blurb        text,
  pattern      text,
  palette_from text,
  palette_to   text,
  sort_order   integer not null default 0
);

create table public.saints (
  slug         text primary key,
  name         text not null,
  also         text[] not null default '{}',
  feast_month  smallint not null check (feast_month between 1 and 12),
  feast_day    smallint not null check (feast_day between 1 and 31),
  patron_of    text[] not null default '{}',
  blurb        text,
  palette_from text,
  palette_to   text
);

create table public.dioceses (
  name        text primary key,
  longitude   double precision not null,
  latitude    double precision not null
);

create table public.religious_orders (
  slug         text primary key,
  name         text not null,
  charism      text,
  palette_from text,
  palette_to   text
);

-- ────────────────────────────────────────────────────────────────────
-- artists + tags
-- ────────────────────────────────────────────────────────────────────
create table public.artists (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  user_id                uuid references public.profiles(id) on delete set null,
  honorific              text,
  name                   text not null,
  city                   text not null,
  region                 text not null,
  bio                    text[] not null default '{}',
  portrait_from          text,
  portrait_to            text,
  accepting_commissions  boolean not null default true,
  years_practicing       integer not null default 0,
  starting_at            integer not null default 0,
  custom_pricing         boolean not null default true,
  diocese_name           text references public.dioceses(name),
  order_slug             text references public.religious_orders(slug),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index artists_user_id_idx on public.artists(user_id);
create index artists_diocese_idx on public.artists(diocese_name);
create index artists_starting_at_idx on public.artists(starting_at);
create trigger artists_updated_at before update on public.artists
  for each row execute function public.tg_set_updated_at();

-- Many-to-many: artists ↔ categories
create table public.artist_categories (
  artist_id     uuid references public.artists(id) on delete cascade,
  category_slug text references public.categories(slug) on delete cascade,
  primary key (artist_id, category_slug)
);
create index artist_categories_category_idx on public.artist_categories(category_slug);

-- Many-to-many: artists ↔ saints they're known to depict
create table public.artist_saints (
  artist_id  uuid references public.artists(id) on delete cascade,
  saint_slug text references public.saints(slug) on delete cascade,
  primary key (artist_id, saint_slug)
);

-- Tiers (price + turnaround windows the artist offers)
create table public.artist_tiers (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           uuid not null references public.artists(id) on delete cascade,
  tier_id             text not null,                 -- "small" / "mid" / "major"
  name                text not null,
  description         text,
  starting_at         integer not null,
  turnaround_weeks_min integer not null,
  turnaround_weeks_max integer not null,
  sort_order          integer not null default 0,
  unique (artist_id, tier_id)
);

-- Artworks the artist has in their portfolio (display-only).
create table public.artworks (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.artists(id) on delete cascade,
  title        text not null,
  year         integer,
  medium       text,
  dimensions   text,
  caption      text,
  pattern      text,
  palette_from text,
  palette_to   text,
  sort_order   integer not null default 0
);
create index artworks_artist_idx on public.artworks(artist_id);

-- ────────────────────────────────────────────────────────────────────
-- Pastor / chancery verification
-- ────────────────────────────────────────────────────────────────────
create type public.verifier_role as enum ('pastor', 'chancery', 'religious-superior');
create type public.verification_status as enum (
  'pending',
  'endorsed',
  'endorsed-chancery-pending',
  'chancery-confirmed',
  'declined',
  'discuss',
  'expired',
  'revoked'
);

create table public.verifications (
  id                              uuid primary key default gen_random_uuid(),
  artist_id                       uuid references public.artists(id) on delete cascade,
  token                           text not null unique,
  chancery_token                  text unique,
  status                          public.verification_status not null default 'pending',
  role                            public.verifier_role not null,
  verifier_name                   text not null,
  verifier_email                  citext not null,
  verifier_email_is_free_webmail  boolean not null default false,
  parish_or_community             text not null,
  parish_website                  text,
  diocese                         text,
  chancery_email                  citext,
  notes                           text,
  chancery_notes                  text,
  created_at                      timestamptz not null default now(),
  endorsed_at                     timestamptz,
  chancery_confirmed_at           timestamptz,
  expires_at                      timestamptz
);
create index verifications_artist_idx on public.verifications(artist_id);
create index verifications_status_idx on public.verifications(status);

-- ────────────────────────────────────────────────────────────────────
-- Stripe Connect accounts (one per artist)
-- ────────────────────────────────────────────────────────────────────
create type public.connect_status as enum ('not-onboarded', 'onboarding', 'verified');
create type public.tax_form_status as enum ('missing', 'pending', 'on-file');

create table public.connect_accounts (
  artist_id              uuid primary key references public.artists(id) on delete cascade,
  stripe_account_id      text unique,
  status                 public.connect_status not null default 'not-onboarded',
  payout_account_bank    text,
  payout_account_last4   text,
  tax_form_status        public.tax_form_status not null default 'missing',
  started_at             timestamptz,
  verified_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger connect_accounts_updated_at before update on public.connect_accounts
  for each row execute function public.tg_set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- Commissions + escrow + thread + WIP + blessing + certificate
-- ────────────────────────────────────────────────────────────────────
create type public.commission_stage as enum (
  'scoping',
  'awaiting-deposit',
  'in-progress',
  'midpoint-review',
  'final-review',
  'delivered',
  'blessed',
  'cancelled'
);
create type public.escrow_stage as enum ('deposit', 'midpoint', 'final');
create type public.escrow_status as enum ('unfunded', 'held', 'released', 'refunded');
create type public.ip_terms as enum (
  'patron-exclusive',
  'shared-prints',
  'artist-retains',
  'shared-custom'
);
create type public.message_author_role as enum ('patron', 'artist', 'system');

create table public.commissions (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           uuid not null references public.artists(id) on delete restrict,
  patron_id           uuid references public.profiles(id) on delete set null,
  patron_name         text not null,
  patron_email        citext not null,
  category_slug       text references public.categories(slug),
  setting             text,
  scope               text not null,
  artist_quote_note   text,
  artist_total_usd    integer,
  platform_fee_pct    numeric(5, 4) not null default 0.10,
  platform_fee_usd    integer,
  total_due_usd       integer,
  preferred_deadline  date,
  feast_slug          text,
  feast_name          text,
  feast_date          date,
  patron_saint        text,
  diocese             text,
  parish_or_chapel    text,
  ip_terms            public.ip_terms not null default 'patron-exclusive',
  ip_custom_note      text,
  stage               public.commission_stage not null default 'scoping',
  -- Shipping (optional, post-delivery)
  shipping_carrier         text,
  shipping_tracking        text,
  shipping_insured_for     integer,
  shipping_shipped_at      timestamptz,
  shipping_delivered_at    timestamptz,
  shipping_notes           text,
  -- Blessing (optional)
  blessing_recorded_at     timestamptz,
  blessing_recorded_by     text,
  blessing_parish_or_chapel text,
  blessing_note            text,
  -- Certificate (set when stage transitions to delivered)
  certificate_issued_at    timestamptz,
  certificate_serial       text unique,
  certificate_title        text,
  -- Audit
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  completed_at             timestamptz,
  cancelled_at             timestamptz
);
create index commissions_artist_idx on public.commissions(artist_id);
create index commissions_patron_idx on public.commissions(patron_id);
create index commissions_stage_idx on public.commissions(stage);
create index commissions_completed_idx on public.commissions(completed_at desc);
create trigger commissions_updated_at before update on public.commissions
  for each row execute function public.tg_set_updated_at();

create table public.commission_escrow (
  id              uuid primary key default gen_random_uuid(),
  commission_id   uuid not null references public.commissions(id) on delete cascade,
  stage           public.escrow_stage not null,
  label           text not null,
  pct             numeric(4, 4) not null,
  amount_usd      integer not null,
  status          public.escrow_status not null default 'unfunded',
  funded_at       timestamptz,
  released_at     timestamptz,
  stripe_payment_intent_id text,
  stripe_transfer_id       text,
  unique (commission_id, stage)
);
create index commission_escrow_status_idx on public.commission_escrow(status);

create table public.commission_messages (
  id            uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  author_role   public.message_author_role not null,
  author_id     uuid references public.profiles(id) on delete set null,
  author_name   text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index commission_messages_commission_idx on public.commission_messages(commission_id, created_at);

create table public.commission_wip (
  id            uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  caption       text not null,
  image_url     text,                   -- supabase storage URL once uploaded
  palette_from  text,
  palette_to    text,
  pattern       text,
  posted_at     timestamptz not null default now()
);
create index commission_wip_commission_idx on public.commission_wip(commission_id, posted_at);

-- ────────────────────────────────────────────────────────────────────
-- Reviews
-- ────────────────────────────────────────────────────────────────────
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  commission_id      uuid not null unique references public.commissions(id) on delete cascade,
  artist_id          uuid not null references public.artists(id) on delete cascade,
  patron_id          uuid references public.profiles(id) on delete set null,
  patron_name        text not null,
  rating             smallint not null check (rating between 1 and 5),
  body               text not null,
  artist_reply_body  text,
  artist_reply_at    timestamptz,
  created_at         timestamptz not null default now()
);
create index reviews_artist_idx on public.reviews(artist_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- Disputes
-- ────────────────────────────────────────────────────────────────────
create type public.dispute_opened_by as enum ('patron', 'artist');
create type public.dispute_status as enum (
  'open',
  'resolved-mediated',
  'resolved-refund',
  'resolved-release',
  'withdrawn'
);

create table public.disputes (
  id                uuid primary key default gen_random_uuid(),
  commission_id     uuid not null references public.commissions(id) on delete cascade,
  opened_by         public.dispute_opened_by not null,
  reason            text not null,
  status            public.dispute_status not null default 'open',
  opened_at         timestamptz not null default now(),
  resolved_at       timestamptz,
  resolution_note   text,
  stripe_dispute_id text unique
);
create index disputes_commission_idx on public.disputes(commission_id);
create index disputes_status_idx on public.disputes(status);

-- ────────────────────────────────────────────────────────────────────
-- Institutional intakes + proposals
-- ────────────────────────────────────────────────────────────────────
create type public.intake_kind as enum (
  'diocese-bulk', 'parish-altar', 'religious-order', 'school', 'other-institution'
);
create type public.intake_status as enum (
  'draft', 'open', 'shortlisting', 'awarded', 'closed'
);
create type public.invoicing_terms as enum (
  'stripe-immediate', 'net-30', 'net-60', 'purchase-order'
);
create type public.approval_status as enum ('pending', 'approved', 'declined');
create type public.proposal_status as enum (
  'submitted', 'shortlisted', 'awarded', 'declined', 'withdrawn'
);

create table public.intakes (
  id                  uuid primary key default gen_random_uuid(),
  kind                public.intake_kind not null,
  institution_name    text not null,
  diocese             text,
  contact_name        text not null,
  contact_email       citext not null,
  contact_role        text,
  title               text not null,
  brief               text not null,
  craft               text,                  -- category slug OR "mixed"
  budget_total_usd    integer,
  budget_per_work_usd integer,
  quantity            integer not null default 1,
  preferred_delivery  date,
  feast_slug          text,
  feast_name          text,
  feast_date          date,
  invoicing_terms     public.invoicing_terms not null default 'net-30',
  po_number           text,
  status              public.intake_status not null default 'open',
  awarded_proposal_id uuid,                  -- FK added after proposals table
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index intakes_status_idx on public.intakes(status);
create trigger intakes_updated_at before update on public.intakes
  for each row execute function public.tg_set_updated_at();

create table public.intake_approvals (
  id            uuid primary key default gen_random_uuid(),
  intake_id     uuid not null references public.intakes(id) on delete cascade,
  role          text not null,
  name          text,
  email         citext,
  status        public.approval_status not null default 'pending',
  decided_at    timestamptz,
  note          text,
  sort_order    integer not null default 0
);
create index intake_approvals_intake_idx on public.intake_approvals(intake_id);

create table public.proposals (
  id                uuid primary key default gen_random_uuid(),
  intake_id         uuid not null references public.intakes(id) on delete cascade,
  artist_id         uuid not null references public.artists(id) on delete restrict,
  price_per_work_usd integer not null,
  total_price_usd    integer not null,
  estimated_weeks    integer not null,
  pitch_body         text not null,
  palette_from       text,
  palette_to         text,
  status             public.proposal_status not null default 'submitted',
  submitted_at       timestamptz not null default now(),
  decided_at         timestamptz
);
create index proposals_intake_idx on public.proposals(intake_id);
create index proposals_artist_idx on public.proposals(artist_id);

-- Once proposals exists, wire the awarded_proposal_id FK
alter table public.intakes
  add constraint intakes_awarded_proposal_fk
  foreign key (awarded_proposal_id) references public.proposals(id) on delete set null;

-- Commissions spawned from an intake (one or many per intake)
create table public.intake_commissions (
  intake_id     uuid not null references public.intakes(id) on delete cascade,
  commission_id uuid not null references public.commissions(id) on delete cascade,
  primary key (intake_id, commission_id)
);

-- ────────────────────────────────────────────────────────────────────
-- Artist availability + cap
-- ────────────────────────────────────────────────────────────────────
create type public.availability_status as enum ('accepting', 'full', 'away');

create table public.artist_availability (
  artist_id       uuid primary key references public.artists(id) on delete cascade,
  concurrent_cap  integer,
  updated_at      timestamptz not null default now()
);

create table public.artist_availability_months (
  artist_id  uuid not null references public.artists(id) on delete cascade,
  month_key  text not null,             -- "YYYY-MM"
  status     public.availability_status not null,
  primary key (artist_id, month_key)
);

-- ────────────────────────────────────────────────────────────────────
-- Apprenticeship applications
-- ────────────────────────────────────────────────────────────────────
create type public.apprenticeship_status as enum (
  'submitted', 'shortlisted', 'interviewed', 'offered', 'declined', 'matched'
);

create table public.apprenticeships (
  id                  uuid primary key default gen_random_uuid(),
  applicant_name      text not null,
  applicant_email     citext not null,
  applicant_age       integer,
  craft               text references public.categories(slug),
  desired_master_id   uuid references public.artists(id) on delete set null,
  parish_or_community text,
  pastor_email        citext,
  portfolio_url       text,
  letter              text not null,
  status              public.apprenticeship_status not null default 'submitted',
  created_at          timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- Moderation
-- ────────────────────────────────────────────────────────────────────
create type public.flag_reason as enum (
  'ai-generated', 'inappropriate', 'fraud', 'quality', 'other'
);
create type public.flagged_by as enum ('operator', 'patron', 'artist');

create table public.commission_flags (
  commission_id  uuid primary key references public.commissions(id) on delete cascade,
  reason         public.flag_reason not null,
  note           text,
  flagged_at     timestamptz not null default now(),
  flagged_by     public.flagged_by not null
);

create table public.artist_suspensions (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references public.artists(id) on delete cascade,
  reason        text not null,
  suspended_at  timestamptz not null default now(),
  lifted_at     timestamptz
);
create index artist_suspensions_active_idx
  on public.artist_suspensions(artist_id) where lifted_at is null;

-- ────────────────────────────────────────────────────────────────────
-- Email preferences (keyed by email since recipients may not have accounts)
-- ────────────────────────────────────────────────────────────────────
create table public.email_preferences (
  email             citext primary key,
  unsubscribe_all   boolean not null default false,
  milestone         boolean not null default true,
  digest            boolean not null default true,
  marketing         boolean not null default true,
  updated_at        timestamptz not null default now()
);
create trigger email_preferences_updated_at before update on public.email_preferences
  for each row execute function public.tg_set_updated_at();

-- Outbox: every transactional email we send (mirrors /outbox UI in dev)
create type public.outbox_status as enum ('queued', 'sent', 'failed', 'skipped-unsubscribed');
create type public.outbox_category as enum (
  'transactional', 'milestone', 'digest', 'marketing'
);

create table public.outbox (
  id              uuid primary key default gen_random_uuid(),
  event_kind      text not null,
  event_payload   jsonb not null,
  category        public.outbox_category not null,
  subject         text not null,
  preheader       text,
  recipients      jsonb not null,         -- [{ email, name, role }]
  rendered_html   text not null,
  rendered_text   text not null,
  status          public.outbox_status not null default 'queued',
  resend_id       text,                   -- Resend's email id
  failure_reason  text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);
create index outbox_status_idx on public.outbox(status, created_at desc);
create index outbox_category_idx on public.outbox(category, created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- Public views for crawler-visible content (the Ledger, etc.)
-- ────────────────────────────────────────────────────────────────────
create or replace view public.ledger as
  select
    c.id,
    c.scope,
    c.stage,
    c.completed_at,
    c.created_at,
    c.feast_name,
    c.parish_or_chapel,
    c.diocese,
    c.category_slug,
    c.artist_total_usd,
    c.platform_fee_usd,
    c.platform_fee_pct,
    c.certificate_serial,
    c.certificate_title,
    a.slug as artist_slug,
    a.name as artist_name,
    a.honorific as artist_honorific
  from public.commissions c
  join public.artists a on a.id = c.artist_id
  where c.stage <> 'cancelled';

-- ────────────────────────────────────────────────────────────────────
-- Full-text search index for artists (replaces the client-side fuzzy match)
-- ────────────────────────────────────────────────────────────────────
alter table public.artists
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(honorific, '')), 'B')
    || setweight(to_tsvector('english', array_to_string(bio, ' ')), 'D')
    || setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(region, '')), 'C')
  ) stored;
create index artists_search_idx on public.artists using gin(search_vector);
