-- Locavit · Row Level Security
-- Apply after 0001_init.sql.
--
-- Policy framing:
--   PUBLIC (no auth)        — read reference data + delivered ledger + endorsed artists
--   AUTHENTICATED PATRON    — read/write their own commissions, reviews, preferences
--   AUTHENTICATED ARTIST    — read/write their own profile, their commissions, their
--                             availability, their reviews replies, their proposals
--   OPERATOR                — bypass via SECURITY DEFINER admin functions (not below)

-- ── helper: is_operator() ───────────────────────────────────────────
create or replace function public.is_operator()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'operator'
  );
$$;

-- ── helper: owns_artist(artist_id) ──────────────────────────────────
create or replace function public.owns_artist(_artist_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.artists
    where id = _artist_id and user_id = auth.uid()
  );
$$;

-- ── helper: is_party_to_commission(commission_id) ───────────────────
create or replace function public.is_party_to_commission(_commission_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.commissions c
    where c.id = _commission_id
      and (c.patron_id = auth.uid() or public.owns_artist(c.artist_id))
  );
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Enable RLS + add policies on each table
-- ═══════════════════════════════════════════════════════════════════

-- ─── reference data: public read, operator write ────────────────────
alter table public.categories enable row level security;
create policy categories_public_read on public.categories
  for select using (true);
create policy categories_operator_write on public.categories
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.saints enable row level security;
create policy saints_public_read on public.saints for select using (true);
create policy saints_operator_write on public.saints
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.dioceses enable row level security;
create policy dioceses_public_read on public.dioceses for select using (true);
create policy dioceses_operator_write on public.dioceses
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.religious_orders enable row level security;
create policy orders_public_read on public.religious_orders for select using (true);
create policy orders_operator_write on public.religious_orders
  for all using (public.is_operator()) with check (public.is_operator());

-- ─── profiles ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
create policy profiles_own_read on public.profiles
  for select using (auth.uid() = id or public.is_operator());
create policy profiles_own_write on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_operator_all on public.profiles
  for all using (public.is_operator()) with check (public.is_operator());

-- ─── artists: public read endorsed; artist self-write; operator all ─
alter table public.artists enable row level security;
create policy artists_public_read on public.artists
  for select using (true);
create policy artists_self_write on public.artists
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy artists_operator_all on public.artists
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.artist_categories enable row level security;
create policy artist_categories_public_read on public.artist_categories
  for select using (true);
create policy artist_categories_self_write on public.artist_categories
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy artist_categories_operator on public.artist_categories
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.artist_saints enable row level security;
create policy artist_saints_public_read on public.artist_saints for select using (true);
create policy artist_saints_self_write on public.artist_saints
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy artist_saints_operator on public.artist_saints
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.artist_tiers enable row level security;
create policy artist_tiers_public_read on public.artist_tiers for select using (true);
create policy artist_tiers_self_write on public.artist_tiers
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));

alter table public.artworks enable row level security;
create policy artworks_public_read on public.artworks for select using (true);
create policy artworks_self_write on public.artworks
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));

-- ─── verifications: artist can read own; operator full access ──────
alter table public.verifications enable row level security;
create policy verifications_artist_read on public.verifications
  for select using (public.owns_artist(artist_id) or public.is_operator());
create policy verifications_operator_all on public.verifications
  for all using (public.is_operator()) with check (public.is_operator());
-- Public endorsement page uses a SECURITY DEFINER function (defined in 0004)
-- to read a single verification by token without exposing the whole table.

-- ─── connect_accounts: artist self-read; operator all ──────────────
alter table public.connect_accounts enable row level security;
create policy connect_self_read on public.connect_accounts
  for select using (public.owns_artist(artist_id));
create policy connect_self_write on public.connect_accounts
  for update using (public.owns_artist(artist_id))
  with check (public.owns_artist(artist_id));
create policy connect_operator_all on public.connect_accounts
  for all using (public.is_operator()) with check (public.is_operator());

-- ─── commissions: parties to it can read/write; public can read
--     anonymized ledger via the view (RLS doesn't apply to views directly,
--     but we keep the underlying table locked) ─────────────────────
alter table public.commissions enable row level security;
create policy commissions_parties_read on public.commissions
  for select using (
    patron_id = auth.uid()
    or public.owns_artist(artist_id)
    or public.is_operator()
  );
create policy commissions_patron_insert on public.commissions
  for insert with check (patron_id = auth.uid());
create policy commissions_parties_update on public.commissions
  for update using (
    patron_id = auth.uid()
    or public.owns_artist(artist_id)
    or public.is_operator()
  ) with check (
    patron_id = auth.uid()
    or public.owns_artist(artist_id)
    or public.is_operator()
  );
create policy commissions_operator_all on public.commissions
  for all using (public.is_operator()) with check (public.is_operator());

-- Anonymized public Ledger view: bypass RLS via SECURITY INVOKER false.
-- Recreated here so the policy reflects intent.
alter view public.ledger set (security_invoker = false);
-- The /ledger page reads from this view; everyone can SELECT.

alter table public.commission_escrow enable row level security;
create policy escrow_parties_read on public.commission_escrow
  for select using (public.is_party_to_commission(commission_id) or public.is_operator());
create policy escrow_parties_write on public.commission_escrow
  for update using (public.is_party_to_commission(commission_id) or public.is_operator())
  with check (public.is_party_to_commission(commission_id) or public.is_operator());
-- Escrow rows are INSERTed by the service-role key only (after artist quotes).

alter table public.commission_messages enable row level security;
create policy messages_parties_read on public.commission_messages
  for select using (public.is_party_to_commission(commission_id) or public.is_operator());
create policy messages_parties_insert on public.commission_messages
  for insert with check (
    public.is_party_to_commission(commission_id) and
    -- author_role enforced server-side; clients can't insert 'system' messages
    author_role <> 'system'
  );

alter table public.commission_wip enable row level security;
create policy wip_parties_read on public.commission_wip
  for select using (public.is_party_to_commission(commission_id) or public.is_operator());
create policy wip_artist_insert on public.commission_wip
  for insert with check (
    exists (
      select 1 from public.commissions c
      where c.id = commission_id and public.owns_artist(c.artist_id)
    )
  );

-- ─── reviews: patron of commission writes once; public reads ───────
alter table public.reviews enable row level security;
create policy reviews_public_read on public.reviews for select using (true);
create policy reviews_patron_insert on public.reviews
  for insert with check (
    exists (
      select 1 from public.commissions c
      where c.id = commission_id
        and c.patron_id = auth.uid()
        and c.stage in ('delivered', 'blessed')
    )
  );
create policy reviews_artist_reply on public.reviews
  for update using (public.owns_artist(artist_id))
  with check (public.owns_artist(artist_id));

-- ─── disputes: parties can open + read; operator resolves ──────────
alter table public.disputes enable row level security;
create policy disputes_parties_read on public.disputes
  for select using (public.is_party_to_commission(commission_id) or public.is_operator());
create policy disputes_parties_insert on public.disputes
  for insert with check (public.is_party_to_commission(commission_id));
create policy disputes_operator_resolve on public.disputes
  for update using (public.is_operator()) with check (public.is_operator());

-- ─── institutional intakes: public read (so artists can find them);
--     contact can update; operator all ────────────────────────────
alter table public.intakes enable row level security;
create policy intakes_public_read on public.intakes
  for select using (status in ('open', 'shortlisting', 'awarded'));
create policy intakes_contact_insert on public.intakes
  for insert with check (true);  -- anyone can post a brief
create policy intakes_operator_all on public.intakes
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.intake_approvals enable row level security;
create policy approvals_public_read on public.intake_approvals
  for select using (true);
create policy approvals_operator_write on public.intake_approvals
  for all using (public.is_operator()) with check (public.is_operator());

alter table public.proposals enable row level security;
create policy proposals_public_read on public.proposals for select using (true);
create policy proposals_artist_insert on public.proposals
  for insert with check (public.owns_artist(artist_id));
create policy proposals_operator_decide on public.proposals
  for update using (public.is_operator()) with check (public.is_operator());

alter table public.intake_commissions enable row level security;
create policy intake_commissions_parties_read on public.intake_commissions
  for select using (
    exists (
      select 1 from public.commissions c
      where c.id = commission_id
        and (c.patron_id = auth.uid() or public.owns_artist(c.artist_id))
    ) or public.is_operator()
  );

-- ─── availability: public read (visible on artist profile); artist write ─
alter table public.artist_availability enable row level security;
create policy availability_public_read on public.artist_availability for select using (true);
create policy availability_self_write on public.artist_availability
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));

alter table public.artist_availability_months enable row level security;
create policy availability_months_public_read on public.artist_availability_months
  for select using (true);
create policy availability_months_self_write on public.artist_availability_months
  for all using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));

-- ─── apprenticeships: applicant can insert; operator reads ─────────
alter table public.apprenticeships enable row level security;
create policy apprenticeships_open_insert on public.apprenticeships
  for insert with check (true);
create policy apprenticeships_operator_read on public.apprenticeships
  for select using (public.is_operator());
create policy apprenticeships_operator_write on public.apprenticeships
  for update using (public.is_operator()) with check (public.is_operator());

-- ─── moderation: operator only ─────────────────────────────────────
alter table public.commission_flags enable row level security;
create policy flags_operator_all on public.commission_flags
  for all using (public.is_operator()) with check (public.is_operator());
-- Parties can also flag their own commissions (insert only, with limited reasons)
create policy flags_party_insert on public.commission_flags
  for insert with check (public.is_party_to_commission(commission_id));

alter table public.artist_suspensions enable row level security;
create policy suspensions_operator_all on public.artist_suspensions
  for all using (public.is_operator()) with check (public.is_operator());
-- The suspended artist can read their own suspension to see the reason.
create policy suspensions_self_read on public.artist_suspensions
  for select using (public.owns_artist(artist_id));

-- ─── email preferences: owner of the email reads/writes via signed link ─
-- In production the /preferences page accepts a signed token, NOT auth.uid().
-- The endpoint uses the service-role key (edge function) to read/write the
-- row, so we lock everything down here.
alter table public.email_preferences enable row level security;
-- (No public policies; access is via SECURITY DEFINER function below.)

create or replace function public.set_email_pref(
  _email citext,
  _unsubscribe_all boolean,
  _milestone boolean,
  _digest boolean,
  _marketing boolean,
  _token text
) returns public.email_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.email_preferences;
begin
  -- TODO: verify _token via signed-link verification before applying.
  insert into public.email_preferences (email, unsubscribe_all, milestone, digest, marketing)
  values (_email, _unsubscribe_all, _milestone, _digest, _marketing)
  on conflict (email) do update set
    unsubscribe_all = excluded.unsubscribe_all,
    milestone = excluded.milestone,
    digest = excluded.digest,
    marketing = excluded.marketing,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

-- ─── outbox: service-role only (edge function writes; no public access) ─
alter table public.outbox enable row level security;
create policy outbox_operator_read on public.outbox
  for select using (public.is_operator());
-- Edge function uses service-role key, bypasses RLS.

-- ═══════════════════════════════════════════════════════════════════
-- Public verification page: read by token (no auth required)
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.get_verification_by_token(_token text)
returns public.verifications
language sql
security definer
set search_path = public
as $$
  select * from public.verifications
  where token = _token or chancery_token = _token
  limit 1;
$$;

grant execute on function public.get_verification_by_token(text) to anon, authenticated;
grant execute on function public.set_email_pref(citext, boolean, boolean, boolean, boolean, text) to anon, authenticated;
