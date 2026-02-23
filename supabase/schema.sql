-- Supabase schema for the AssiWorks Opening registration flow.
-- 이 스크립트를 Supabase SQL Editor 혹은 psql로 실행하면 됩니다.

create extension if not exists "pgcrypto";

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  affiliation text,
  position text,
  note text,
  cancel_token text not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.registrations add column if not exists affiliation text;
alter table public.registrations add column if not exists position text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrations'
      and column_name = 'company'
  ) then
    execute 'update public.registrations
      set affiliation = coalesce(affiliation, company)
      where affiliation is null and company is not null';
  end if;
end $$;

create unique index if not exists registrations_cancel_token_key on public.registrations (cancel_token);
create index if not exists registrations_email_idx on public.registrations ((lower(email)));
create index if not exists registrations_created_at_idx on public.registrations (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists registrations_set_updated_at on public.registrations;

create trigger registrations_set_updated_at
before update on public.registrations
for each row
execute procedure public.set_updated_at();

-- ============================================================
-- invitations table for the Invitation Management feature
-- ============================================================

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  affiliation     text,
  position        text,
  category        text not null default '일반',
  email_sent_at   timestamptz,
  sms_sent_at     timestamptz,
  sns_sent_at     timestamptz,
  call_at         timestamptz,
  attendance      text not null default 'undecided',
  memo            text,
  registration_id uuid references public.registrations(id) on delete set null,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

create index if not exists invitations_email_idx on public.invitations ((lower(email)));
create index if not exists invitations_created_at_idx on public.invitations (created_at desc);
create index if not exists invitations_registration_id_idx on public.invitations (registration_id);

drop trigger if exists invitations_set_updated_at on public.invitations;

create trigger invitations_set_updated_at
before update on public.invitations
for each row
execute procedure public.set_updated_at();
