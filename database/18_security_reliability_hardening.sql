-- Phase 15: security and reliability hardening.
-- Safe to run after Phase 14. This migration is additive except for replacing
-- the workspace creation RPC with a stricter version.

begin;

-- -----------------------------------------------------------------------------
-- 1) Daily AI request tracking.
-- -----------------------------------------------------------------------------

create table if not exists public.ai_request_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, usage_date)
);

create index if not exists idx_ai_request_usage_organization_date
on public.ai_request_usage (organization_id, usage_date desc);

create index if not exists idx_ai_request_usage_user_date
on public.ai_request_usage (user_id, usage_date desc);

alter table public.ai_request_usage enable row level security;

grant select, insert, update on public.ai_request_usage to authenticated;

drop policy if exists "Users can read own AI request usage" on public.ai_request_usage;
create policy "Users can read own AI request usage"
on public.ai_request_usage for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin'])
);

-- Writes happen through register_ai_generation_request so the count cannot be
-- manipulated directly from the browser.
drop policy if exists "Users can insert own AI request usage" on public.ai_request_usage;
drop policy if exists "Users can update own AI request usage" on public.ai_request_usage;

-- -----------------------------------------------------------------------------
-- 2) Normalized organisation-name helper and duplicate-name blocking.
-- -----------------------------------------------------------------------------

create or replace function public.normalize_organization_name(p_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'));
$$;

grant execute on function public.normalize_organization_name(text) to authenticated;

create or replace function public.organization_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.organizations org
    where public.normalize_organization_name(org.name) = public.normalize_organization_name(p_name)
  );
$$;

grant execute on function public.organization_name_available(text) to authenticated;

-- Replace the workspace creation RPC so future workspace creation cannot create
-- another organisation with the same normalized name through the app path.
create or replace function public.create_workspace_with_starter_data(
  p_name text,
  p_city text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  clean_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  clean_city text := nullif(regexp_replace(trim(coalesce(p_city, '')), '\s+', ' ', 'g'), '');
  normalized_name text := public.normalize_organization_name(p_name);
begin
  if auth.uid() is null then
    raise exception 'Authentication required to create a workspace.';
  end if;

  if length(clean_name) < 2 then
    raise exception 'Organization name is required.';
  end if;

  if exists (
    select 1
    from public.organizations org
    where public.normalize_organization_name(org.name) = normalized_name
  ) then
    raise exception 'An organisation with this name already exists. Ask the organisation admin to add you as a member.';
  end if;

  insert into public.profiles (id, email)
  values (auth.uid(), auth.email())
  on conflict (id) do update set email = excluded.email;

  insert into public.organizations (name, city, created_by)
  values (clean_name, clean_city, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'admin')
  on conflict (organization_id, user_id) do nothing;

  perform public.seed_organization_starter_data(new_org_id);

  return new_org_id;
end;
$$;

grant execute on function public.create_workspace_with_starter_data(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3) Server-side AI request limiter.
-- -----------------------------------------------------------------------------

create or replace function public.register_ai_generation_request(
  p_organization_id uuid,
  p_daily_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer := 0;
  next_count integer := 0;
  clean_limit integer := greatest(1, least(coalesce(p_daily_limit, 20), 200));
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_organization_id is null then
    raise exception 'Organisation is required.';
  end if;

  if not public.is_org_member(p_organization_id) then
    raise exception 'You do not have access to this organisation.';
  end if;

  select usage.request_count
  into current_count
  from public.ai_request_usage usage
  where usage.organization_id = p_organization_id
    and usage.user_id = auth.uid()
    and usage.usage_date = current_date
  for update;

  if found then
    if current_count >= clean_limit then
      return jsonb_build_object(
        'allowed', false,
        'used', current_count,
        'limit', clean_limit,
        'remaining', 0
      );
    end if;

    next_count := current_count + 1;

    update public.ai_request_usage usage
    set request_count = next_count,
        updated_at = now()
    where usage.organization_id = p_organization_id
      and usage.user_id = auth.uid()
      and usage.usage_date = current_date;
  else
    next_count := 1;

    insert into public.ai_request_usage (organization_id, user_id, usage_date, request_count)
    values (p_organization_id, auth.uid(), current_date, next_count);
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', next_count,
    'limit', clean_limit,
    'remaining', greatest(clean_limit - next_count, 0)
  );
end;
$$;

grant execute on function public.register_ai_generation_request(uuid, integer) to authenticated;

commit;
