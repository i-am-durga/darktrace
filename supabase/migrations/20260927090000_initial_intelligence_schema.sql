create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'analyst' check (role in ('analyst', 'senior_analyst', 'administrator')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('forum', 'marketplace', 'paste', 'clearnet', 'certificate', 'dns', 'public_dataset', 'analyst_input', 'synthetic_dataset')),
  url text,
  description text,
  trust_level text not null default 'medium' check (trust_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (name, type)
);

create table public.actors (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  category text not null default 'unknown' check (category in ('marketplace', 'forum', 'ransomware', 'fraud', 'credential_seller', 'malware', 'phishing', 'infrastructure', 'unknown')),
  description text,
  status text not null default 'monitoring' check (status in ('active', 'inactive', 'monitoring', 'archived')),
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  first_seen timestamptz,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.identifiers (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.actors(id) on delete set null,
  type text not null check (type in ('handle', 'username', 'pgp_key', 'wallet', 'email', 'domain', 'onion_address', 'certificate', 'telegram_handle', 'forum_id')),
  value text not null,
  normalized_value text not null,
  first_seen timestamptz,
  last_seen timestamptz,
  source_id uuid references public.sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.actors(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  observed_at timestamptz not null default now(),
  title text not null,
  content text not null default '',
  content_hash text not null,
  observation_type text not null check (observation_type in ('post', 'listing', 'message', 'profile', 'infrastructure', 'transaction_reference', 'credential_reference', 'analyst_note')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  source_entity_type text not null check (source_entity_type in ('actor', 'identifier', 'observation', 'infrastructure', 'source')),
  source_entity_id uuid not null,
  target_entity_type text not null check (target_entity_type in ('actor', 'identifier', 'observation', 'infrastructure', 'source')),
  target_entity_id uuid not null,
  relationship_type text not null check (relationship_type in ('same_handle', 'shared_pgp', 'shared_wallet', 'shared_email', 'shared_infrastructure', 'linguistic_similarity', 'temporal_similarity', 'behavioral_similarity', 'marketplace_association', 'forum_association', 'infrastructure_association', 'analyst_link')),
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  score numeric(5, 4) check (score >= 0 and score <= 1),
  description text not null default '',
  evidence_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_distinct_entities check (source_entity_type <> target_entity_type or source_entity_id <> target_entity_id)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid references public.observations(id) on delete set null,
  evidence_type text not null check (evidence_type in ('text', 'identifier', 'pgp', 'wallet', 'domain', 'certificate', 'dns', 'screenshot_reference', 'analyst_note', 'metadata')),
  description text not null default '',
  content text not null default '',
  content_hash text not null,
  captured_at timestamptz not null default now(),
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.infrastructure (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.actors(id) on delete set null,
  type text not null check (type in ('domain', 'ip', 'certificate', 'hosting', 'asn', 'dns', 'service_banner', 'onion_service_reference')),
  value text not null,
  normalized_value text not null,
  provider text,
  asn text,
  country text,
  first_seen timestamptz,
  last_seen timestamptz,
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.actors(id) on delete set null,
  analysis_type text not null check (analysis_type in ('persona_similarity', 'behavioral_similarity', 'infrastructure_correlation', 'identifier_correlation', 'timeline_correlation')),
  score numeric(5, 4) check (score >= 0 and score <= 1),
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  signals jsonb not null default '[]'::jsonb,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  analyst_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null default 'pending' check (decision in ('pending', 'confirmed', 'rejected', 'inconclusive')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.actors(id) on delete set null,
  type text not null check (type in ('new_identifier', 'relationship_candidate', 'infrastructure_change', 'new_observation', 'high_confidence_match')),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id) on delete set null
);

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'monitoring', 'closed', 'archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investigation_entities (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  entity_type text not null check (entity_type in ('actor', 'identifier', 'observation', 'infrastructure', 'relationship', 'evidence')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (investigation_id, entity_type, entity_id)
);

create index actors_canonical_name_idx on public.actors (canonical_name);
create unique index actors_canonical_name_case_insensitive_unique_idx on public.actors (lower(canonical_name));
create index actors_category_idx on public.actors (category);
create index actors_status_idx on public.actors (status);
create index identifiers_normalized_value_idx on public.identifiers (normalized_value);
create index identifiers_type_idx on public.identifiers (type);
create index identifiers_actor_id_idx on public.identifiers (actor_id);
create index observations_actor_id_idx on public.observations (actor_id);
create index observations_observed_at_idx on public.observations (observed_at desc);
create index observations_source_id_idx on public.observations (source_id);
create index relationships_source_entity_idx on public.relationships (source_entity_id);
create index relationships_target_entity_idx on public.relationships (target_entity_id);
create index evidence_observation_id_idx on public.evidence (observation_id);
create index infrastructure_normalized_value_idx on public.infrastructure (normalized_value);
create index infrastructure_type_idx on public.infrastructure (type);
create index infrastructure_actor_id_idx on public.infrastructure (actor_id);
create index alerts_status_idx on public.alerts (status);
create index investigations_status_idx on public.investigations (status);
create index investigations_created_by_idx on public.investigations (created_by);
create index investigation_entities_investigation_idx on public.investigation_entities (investigation_id);
create index reviews_relationship_idx on public.reviews (relationship_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger actors_set_updated_at before update on public.actors
for each row execute function public.set_updated_at();
create trigger relationships_set_updated_at before update on public.relationships
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();
create trigger investigations_set_updated_at before update on public.investigations
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    'analyst'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (id, display_name, role)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), ''),
  'analyst'
from auth.users as u
on conflict (id) do nothing;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles as p where p.id = (select auth.uid())
$$;

create or replace function public.has_analyst_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('analyst', 'senior_analyst', 'administrator'), false)
$$;

create or replace function public.has_administrator_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'administrator', false)
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.has_analyst_role() from public, anon;
revoke all on function public.has_administrator_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_analyst_role() to authenticated;
grant execute on function public.has_administrator_role() to authenticated;

alter table public.profiles enable row level security;
create policy profiles_read_self on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sources', 'actors', 'identifiers', 'observations', 'relationships', 'evidence',
    'infrastructure', 'analysis_results', 'reviews', 'alerts', 'investigations',
    'investigation_entities'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      table_name || '_read_authenticated', table_name
    );
  end loop;
end;
$$;

grant select on public.sources, public.actors, public.identifiers, public.observations,
  public.relationships, public.evidence, public.infrastructure, public.analysis_results,
  public.reviews, public.alerts, public.investigations, public.investigation_entities
  to authenticated;

grant insert, update, delete on public.sources, public.actors, public.identifiers,
  public.relationships, public.infrastructure to authenticated;
grant insert on public.observations, public.evidence, public.analysis_results, public.reviews
  to authenticated;
grant insert, update on public.alerts to authenticated;
grant insert, update on public.investigations to authenticated;
grant insert, delete on public.investigation_entities to authenticated;

create policy sources_admin_manage on public.sources for all to authenticated
using (public.has_administrator_role()) with check (public.has_administrator_role());
create policy sources_analyst_insert on public.sources for insert to authenticated
with check (public.has_analyst_role());

create policy actors_analyst_insert on public.actors for insert to authenticated
with check (public.has_analyst_role());
create policy actors_analyst_update on public.actors for update to authenticated
using (public.has_analyst_role()) with check (public.has_analyst_role());
create policy actors_admin_delete on public.actors for delete to authenticated
using (public.has_administrator_role());

create policy identifiers_analyst_insert on public.identifiers for insert to authenticated
with check (public.has_analyst_role());
create policy identifiers_analyst_update on public.identifiers for update to authenticated
using (public.has_analyst_role()) with check (public.has_analyst_role());
create policy identifiers_admin_delete on public.identifiers for delete to authenticated
using (public.has_administrator_role());

create policy observations_analyst_insert on public.observations for insert to authenticated
with check (public.has_analyst_role());
create policy evidence_analyst_insert on public.evidence for insert to authenticated
with check (public.has_analyst_role());

create policy relationships_analyst_insert on public.relationships for insert to authenticated
with check (public.has_analyst_role());
create policy relationships_analyst_update on public.relationships for update to authenticated
using (public.has_analyst_role()) with check (public.has_analyst_role());

create policy infrastructure_analyst_insert on public.infrastructure for insert to authenticated
with check (public.has_analyst_role());
create policy infrastructure_analyst_update on public.infrastructure for update to authenticated
using (public.has_analyst_role()) with check (public.has_analyst_role());

create policy analysis_results_analyst_insert on public.analysis_results for insert to authenticated
with check (public.has_analyst_role());

create policy reviews_analyst_insert on public.reviews for insert to authenticated
with check (analyst_id = (select auth.uid()) and public.has_analyst_role());
create policy reviews_analyst_update_own on public.reviews for update to authenticated
using (analyst_id = (select auth.uid()) and public.has_analyst_role())
with check (analyst_id = (select auth.uid()) and public.has_analyst_role());

create policy alerts_analyst_update on public.alerts for update to authenticated
using (public.has_analyst_role()) with check (public.has_analyst_role());

create policy investigations_insert_own on public.investigations for insert to authenticated
with check (created_by = (select auth.uid()) and public.has_analyst_role());
create policy investigations_update_own on public.investigations for update to authenticated
using (created_by = (select auth.uid()) or public.has_administrator_role())
with check (created_by = (select auth.uid()) or public.has_administrator_role());

create policy investigation_entities_insert_own on public.investigation_entities for insert to authenticated
with check (
  public.has_analyst_role()
  and exists (
    select 1 from public.investigations as i
    where i.id = investigation_id
      and (i.created_by = (select auth.uid()) or public.has_administrator_role())
  )
);
create policy investigation_entities_delete_own on public.investigation_entities for delete to authenticated
using (
  exists (
    select 1 from public.investigations as i
    where i.id = investigation_id
      and (i.created_by = (select auth.uid()) or public.has_administrator_role())
  )
);
