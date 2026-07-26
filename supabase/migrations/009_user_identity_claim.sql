-- Identity linking: one-time claim of legacy public.users into auth.users.id
-- Additive only — does not delete user rows.
-- Auto-merge ONLY when exactly one auth.users + one eligible legacy public.users for the same email.
--
-- BEFORE applying: if multiple ACTIVE public.users share the same lower(email),
-- resolve or mark extras — otherwise users_email_active_unique_idx creation will fail.
-- Inventory:
--   select lower(trim(email)) e, count(*) from public.users
--   where email is not null group by 1 having count(*) > 1;

-- 1) Columns on public.users
alter table public.users
  add column if not exists identity_status text not null default 'active',
  add column if not exists merged_into uuid,
  add column if not exists merged_at timestamptz,
  add column if not exists merge_reason text;

comment on column public.users.identity_status is 'active | anonymous | merged';
comment on column public.users.merged_into is 'Canonical public.users.id (auth.users.id) after merge';
comment on column public.users.merged_at is 'When this row was soft-merged';
comment on column public.users.merge_reason is 'e.g. email_claim_v1, batch_migration_v1';

update public.users
set identity_status = 'active'
where identity_status is null or identity_status = '';

-- 2) Audit + conflict tables
create table if not exists public.user_identity_merges (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  legacy_user_id uuid not null,
  email text not null,
  previous_plan text,
  previous_credits integer,
  previous_subscription_id text,
  previous_subscription_status text,
  previous_subscription_start timestamptz,
  previous_subscription_end timestamptz,
  canonical_plan_before text,
  canonical_credits_before integer,
  status text not null default 'started',
  merge_reason text not null default 'email_claim_v1',
  error_message text,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create index if not exists user_identity_merges_email_idx
  on public.user_identity_merges (lower(email), created_at desc);

create table if not exists public.user_identity_conflicts (
  id uuid primary key default gen_random_uuid(),
  normalized_email text not null,
  reason text not null,
  auth_user_ids jsonb not null default '[]'::jsonb,
  public_user_ids jsonb not null default '[]'::jsonb,
  meta jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create index if not exists user_identity_conflicts_email_idx
  on public.user_identity_conflicts (normalized_email, created_at desc);

alter table public.user_identity_merges enable row level security;
alter table public.user_identity_conflicts enable row level security;

-- 3) Partial unique: one ACTIVE customer email
drop index if exists public.users_email_unique_idx;

create unique index if not exists users_email_active_unique_idx
  on public.users (lower(email))
  where identity_status = 'active' and email is not null and length(trim(email)) > 0;

-- 4) Auth trigger: do not create a second active free row when email already owned
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  em text;
  existing_active int;
begin
  em := case when new.email is not null then lower(trim(new.email)) else null end;

  if em is not null then
    select count(*)::int into existing_active
    from public.users u
    where u.identity_status = 'active'
      and u.email is not null
      and lower(trim(u.email)) = em
      and u.id <> new.id;

    if existing_active > 0 then
      -- Leave insert to claim_user_identity (auth sync). Avoid duplicate active identity.
      return new;
    end if;
  end if;

  insert into public.users (id, email, display_name, plan, credits, total_conversions, identity_status)
  values (
    new.id,
    em,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'free',
    3,
    0,
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 5) Atomic claim (single transaction)
create or replace function public.claim_user_identity(
  p_auth_user_id uuid,
  p_email text,
  p_merge_reason text default 'email_claim_v1'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  em text;
  auth_cnt int;
  auth_id_check uuid;
  legacy_cnt int;
  legacy_id uuid;
  legacy_rec public.users%rowtype;
  canon_rec public.users%rowtype;
  canon_exists boolean;
  audit_id uuid;
  new_plan text;
  new_credits int;
  new_sub_id text;
  new_sub_status text;
  new_sub_start timestamptz;
  new_sub_end timestamptz;
  new_total int;
  auth_ids jsonb;
  pub_ids jsonb;
begin
  em := lower(trim(coalesce(p_email, '')));
  if p_auth_user_id is null or em = '' then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  -- Gate 1: exactly one auth.users for email
  select count(*)::int into auth_cnt
  from auth.users au
  where au.email is not null and lower(trim(au.email)) = em;

  select au.id into auth_id_check
  from auth.users au
  where au.email is not null and lower(trim(au.email)) = em
  limit 1;

  if auth_cnt <> 1 or auth_id_check is distinct from p_auth_user_id then
    select coalesce(jsonb_agg(au.id::text), '[]'::jsonb) into auth_ids
    from auth.users au
    where au.email is not null and lower(trim(au.email)) = em;

    select coalesce(jsonb_agg(u.id::text), '[]'::jsonb) into pub_ids
    from public.users u
    where u.email is not null and lower(trim(u.email)) = em
      and u.identity_status in ('active', 'anonymous');

    insert into public.user_identity_conflicts (normalized_email, reason, auth_user_ids, public_user_ids)
    values (
      em,
      case when auth_cnt <> 1 then 'multiple_or_zero_auth' else 'auth_id_mismatch' end,
      auth_ids,
      pub_ids
    );

    return jsonb_build_object(
      'ok', false,
      'code', 'conflict',
      'reason', case when auth_cnt <> 1 then 'multiple_or_zero_auth' else 'auth_id_mismatch' end,
      'logged', true
    );
  end if;

  -- Gate 2–4: exactly one eligible legacy; ids differ; neither merged
  select count(*)::int into legacy_cnt
  from public.users u
  where u.email is not null
    and lower(trim(u.email)) = em
    and u.id <> p_auth_user_id
    and u.identity_status in ('active', 'anonymous')
    and u.merged_into is null;

  if legacy_cnt = 0 then
    return jsonb_build_object('ok', true, 'code', 'no_legacy', 'merged', false);
  end if;

  if legacy_cnt <> 1 then
    select coalesce(jsonb_agg(u.id::text), '[]'::jsonb) into pub_ids
    from public.users u
    where u.email is not null and lower(trim(u.email)) = em
      and u.identity_status in ('active', 'anonymous');

    insert into public.user_identity_conflicts (normalized_email, reason, auth_user_ids, public_user_ids)
    values (em, 'multiple_legacy', jsonb_build_array(p_auth_user_id::text), pub_ids);

    return jsonb_build_object('ok', false, 'code', 'conflict', 'reason', 'multiple_legacy', 'logged', true);
  end if;

  select u.* into legacy_rec
  from public.users u
  where u.email is not null
    and lower(trim(u.email)) = em
    and u.id <> p_auth_user_id
    and u.identity_status in ('active', 'anonymous')
    and u.merged_into is null
  limit 1;

  legacy_id := legacy_rec.id;

  if legacy_rec.identity_status = 'merged' or legacy_rec.merged_into is not null then
    return jsonb_build_object('ok', false, 'code', 'conflict', 'reason', 'legacy_already_merged');
  end if;

  select exists(
    select 1 from public.users c where c.id = p_auth_user_id
  ) into canon_exists;

  if canon_exists then
    select c.* into canon_rec from public.users c where c.id = p_auth_user_id;
    if canon_rec.identity_status = 'merged' or canon_rec.merged_into is not null then
      insert into public.user_identity_conflicts (normalized_email, reason, auth_user_ids, public_user_ids)
      values (
        em,
        'canonical_already_merged',
        jsonb_build_array(p_auth_user_id::text),
        jsonb_build_array(legacy_id::text)
      );
      return jsonb_build_object('ok', false, 'code', 'conflict', 'reason', 'canonical_already_merged', 'logged', true);
    end if;
  end if;

  -- Rule 6: audit BEFORE mutations
  insert into public.user_identity_merges (
    auth_user_id,
    legacy_user_id,
    email,
    previous_plan,
    previous_credits,
    previous_subscription_id,
    previous_subscription_status,
    previous_subscription_start,
    previous_subscription_end,
    canonical_plan_before,
    canonical_credits_before,
    status,
    merge_reason
  ) values (
    p_auth_user_id,
    legacy_id,
    em,
    legacy_rec.plan,
    legacy_rec.credits,
    legacy_rec.subscription_id,
    legacy_rec.subscription_status,
    legacy_rec.subscription_start,
    legacy_rec.subscription_end,
    case when canon_exists then canon_rec.plan else null end,
    case when canon_exists then canon_rec.credits else null end,
    'started',
    coalesce(nullif(trim(p_merge_reason), ''), 'email_claim_v1')
  )
  returning id into audit_id;

  -- Entitlement merge rules
  if not canon_exists then
    new_plan := coalesce(legacy_rec.plan, 'free');
    new_credits := coalesce(legacy_rec.credits, 3);
    new_sub_id := legacy_rec.subscription_id;
    new_sub_status := legacy_rec.subscription_status;
    new_sub_start := legacy_rec.subscription_start;
    new_sub_end := legacy_rec.subscription_end;
    new_total := coalesce(legacy_rec.total_conversions, 0);
  else
    if coalesce(canon_rec.plan, 'free') = 'free' and coalesce(legacy_rec.plan, 'free') <> 'free' then
      new_plan := legacy_rec.plan;
    else
      new_plan := coalesce(canon_rec.plan, legacy_rec.plan, 'free');
    end if;

    new_credits := greatest(coalesce(canon_rec.credits, 0), coalesce(legacy_rec.credits, 0));
    new_total := coalesce(canon_rec.total_conversions, 0) + coalesce(legacy_rec.total_conversions, 0);

    if (canon_rec.subscription_status is null or lower(coalesce(canon_rec.subscription_status, '')) in ('', 'cancelled', 'expired'))
       and legacy_rec.subscription_id is not null then
      new_sub_id := legacy_rec.subscription_id;
      new_sub_status := coalesce(legacy_rec.subscription_status, 'active');
      new_sub_start := legacy_rec.subscription_start;
      new_sub_end := legacy_rec.subscription_end;
    else
      new_sub_id := canon_rec.subscription_id;
      new_sub_status := canon_rec.subscription_status;
      new_sub_start := canon_rec.subscription_start;
      new_sub_end := canon_rec.subscription_end;
    end if;
  end if;

  -- Ensure / update canonical row (must become the only active for this email)
  if not canon_exists then
    insert into public.users (
      id, email, display_name, plan, credits, total_conversions,
      subscription_id, subscription_status, subscription_start, subscription_end,
      identity_status
    ) values (
      p_auth_user_id,
      em,
      legacy_rec.display_name,
      new_plan,
      new_credits,
      new_total,
      new_sub_id,
      new_sub_status,
      new_sub_start,
      new_sub_end,
      'active'
    );
  else
    update public.users
    set
      email = coalesce(nullif(lower(trim(email)), ''), em),
      display_name = coalesce(display_name, legacy_rec.display_name),
      plan = new_plan,
      credits = new_credits,
      total_conversions = new_total,
      subscription_id = new_sub_id,
      subscription_status = new_sub_status,
      subscription_start = new_sub_start,
      subscription_end = new_sub_end,
      identity_status = 'active',
      merged_into = null,
      merged_at = null,
      merge_reason = null,
      updated_at = now()
    where id = p_auth_user_id;
  end if;

  -- Remount images (same transaction)
  update public.images
  set user_id = p_auth_user_id
  where user_id = legacy_id;

  -- Remount login_logs (user_id is text)
  update public.login_logs
  set user_id = p_auth_user_id::text
  where user_id = legacy_id::text;

  -- Soft-merge legacy (never delete)
  update public.users
  set
    identity_status = 'merged',
    merged_into = p_auth_user_id,
    merged_at = now(),
    merge_reason = coalesce(nullif(trim(p_merge_reason), ''), 'email_claim_v1')
  where id = legacy_id;

  update public.user_identity_merges
  set status = 'committed', committed_at = now()
  where id = audit_id;

  return jsonb_build_object(
    'ok', true,
    'code', 'merged',
    'merged', true,
    'auth_user_id', p_auth_user_id,
    'legacy_user_id', legacy_id,
    'audit_id', audit_id,
    'plan', new_plan,
    'credits', new_credits
  );

exception
  when others then
    -- Entire function runs in one transaction; exception rolls back all mutations.
    raise warning 'claim_user_identity failed: %', sqlerrm;
    return jsonb_build_object(
      'ok', false,
      'code', 'failed',
      'error', sqlerrm
    );
end;
$$;

revoke all on function public.claim_user_identity(uuid, text, text) from public;
grant execute on function public.claim_user_identity(uuid, text, text) to service_role;

comment on function public.claim_user_identity is
  'One-time transactional merge of a single eligible legacy public.users row into auth.users.id';
