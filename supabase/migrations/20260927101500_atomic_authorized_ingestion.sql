create unique index if not exists actors_canonical_name_case_insensitive_unique_idx
  on public.actors (lower(canonical_name));
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.sources'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (name, type)'
  ) then
    execute 'create unique index if not exists sources_name_type_unique_idx on public.sources (name, type)';
  end if;
end;
$$;

drop policy if exists sources_analyst_insert on public.sources;
create policy sources_analyst_insert on public.sources for insert to authenticated
with check (public.has_analyst_role());

create table if not exists public.ingestion_batches (
  id uuid primary key default gen_random_uuid(),
  analyst_id uuid not null references public.profiles(id) on delete restrict,
  source_filename text not null check (length(source_filename) between 1 and 200),
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  actors_created integer not null default 0 check (actors_created >= 0),
  observations_created integer not null default 0 check (observations_created >= 0),
  observations_skipped integer not null default 0 check (observations_skipped >= 0),
  evidence_created integer not null default 0 check (evidence_created >= 0),
  imported_at timestamptz not null default now()
);

alter table public.ingestion_batches enable row level security;
grant select, insert on public.ingestion_batches to authenticated;
create policy ingestion_batches_read_own_or_admin on public.ingestion_batches
  for select to authenticated
  using (analyst_id = (select auth.uid()) or public.has_administrator_role());
create policy ingestion_batches_insert_own on public.ingestion_batches
  for insert to authenticated
  with check (analyst_id = (select auth.uid()) and public.has_analyst_role());
create index ingestion_batches_analyst_imported_idx
  on public.ingestion_batches (analyst_id, imported_at desc);

create or replace function public.ingest_authorized_records(
  p_payload jsonb,
  p_source_filename text,
  p_source_file_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor jsonb;
  v_observation jsonb;
  v_source jsonb;
  v_actor_id uuid;
  v_source_id uuid;
  v_observation_id uuid;
  v_actor_name text;
  v_source_name text;
  v_source_type text;
  v_title text;
  v_content text;
  v_content_hash text;
  v_source_url text;
  v_existing_evidence boolean;
  v_rows integer;
  v_actors_created integer := 0;
  v_observations_created integer := 0;
  v_observations_skipped integer := 0;
  v_evidence_created integer := 0;
  v_batch_id uuid;
begin
  if not public.has_analyst_role() then
    raise exception 'Analyst role required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or jsonb_typeof(coalesce(p_payload -> 'actors', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload -> 'observations', '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid ingestion payload' using errcode = '22023';
  end if;

  if jsonb_array_length(coalesce(p_payload -> 'actors', '[]'::jsonb))
     + jsonb_array_length(coalesce(p_payload -> 'observations', '[]'::jsonb)) > 200 then
    raise exception 'Ingestion limit exceeded' using errcode = '22023';
  end if;

  if p_source_filename is null or length(p_source_filename) < 1 or length(p_source_filename) > 200
     or p_source_filename !~ '^[A-Za-z0-9_.-]+$'
     or p_source_file_hash is null or p_source_file_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid ingestion metadata' using errcode = '22023';
  end if;

  for v_actor in select value from jsonb_array_elements(coalesce(p_payload -> 'actors', '[]'::jsonb)) loop
    v_actor_name := trim(coalesce(v_actor ->> 'canonical_name', ''));
    if v_actor_name = '' then
      raise exception 'Actor name is required' using errcode = '22023';
    end if;

    insert into public.actors (canonical_name, category, description, status, confidence)
    values (
      v_actor_name,
      coalesce(nullif(v_actor ->> 'category', ''), 'unknown'),
      coalesce(v_actor ->> 'description', ''),
      coalesce(nullif(v_actor ->> 'status', ''), 'monitoring'),
      coalesce(nullif(v_actor ->> 'confidence', ''), 'low')
    )
    on conflict (lower(canonical_name)) do nothing;
    get diagnostics v_rows = row_count;
    v_actors_created := v_actors_created + v_rows;
  end loop;

  for v_observation in select value from jsonb_array_elements(coalesce(p_payload -> 'observations', '[]'::jsonb)) loop
    v_title := trim(coalesce(v_observation ->> 'title', ''));
    if v_title = '' or length(v_title) > 240 then
      raise exception 'Observation title is invalid' using errcode = '22023';
    end if;

    v_content := coalesce(v_observation ->> 'content', '');
    if length(v_content) > 100000 then
      raise exception 'Observation content is too large' using errcode = '22023';
    end if;
    v_content_hash := encode(extensions.digest(convert_to(v_content, 'UTF8'), 'sha256'), 'hex');

    v_source := coalesce(v_observation -> 'source', '{}'::jsonb);
    v_source_name := trim(coalesce(v_source ->> 'name', 'Authorized analyst import'));
    v_source_type := coalesce(nullif(v_source ->> 'type', ''), 'analyst_input');
    v_source_url := nullif(v_source ->> 'url', '');
    if v_source_name = '' or length(v_source_name) > 160 then
      raise exception 'Source name is invalid' using errcode = '22023';
    end if;
    if v_source_url is not null and v_source_url !~ '^https?://' then
      raise exception 'Source URL must use HTTP or HTTPS' using errcode = '22023';
    end if;

    v_source_id := null;
    insert into public.sources (name, type, url, description, trust_level)
    values (
      v_source_name,
      v_source_type,
      v_source_url,
      'Added through authorized analyst file import.',
      coalesce(nullif(v_source ->> 'trust_level', ''), 'medium')
    )
    on conflict (name, type) do nothing
    returning id into v_source_id;
    if v_source_id is null then
      select id into v_source_id
      from public.sources
      where name = v_source_name and type = v_source_type
      limit 1;
    end if;

    v_actor_id := null;
    v_actor_name := trim(coalesce(v_observation ->> 'actor_name', ''));
    if v_actor_name <> '' then
      select id into v_actor_id
      from public.actors
      where lower(canonical_name) = lower(v_actor_name)
      limit 1;

      if v_actor_id is null then
        insert into public.actors (canonical_name, category, description, status, confidence)
        values (v_actor_name, 'unknown', 'Created from an authorized observation import.', 'monitoring', 'low')
        on conflict (lower(canonical_name)) do nothing;
        get diagnostics v_rows = row_count;
        v_actors_created := v_actors_created + v_rows;
        select id into v_actor_id
        from public.actors
        where lower(canonical_name) = lower(v_actor_name)
        limit 1;
      end if;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
      coalesce(v_actor_id::text, '') || chr(31) || v_source_id::text || chr(31) || v_title || chr(31) || v_content_hash,
      0
    ));

    select id into v_observation_id
    from public.observations
    where actor_id is not distinct from v_actor_id
      and source_id = v_source_id
      and title = v_title
      and content_hash = v_content_hash
    limit 1;

    if v_observation_id is not null then
      select exists (
        select 1 from public.evidence where observation_id = v_observation_id
      ) into v_existing_evidence;
      if not v_existing_evidence then
        insert into public.evidence (
          observation_id, evidence_type, description, content, content_hash,
          captured_at, source_url, metadata
        ) values (
          v_observation_id, 'text', 'Authorized import from ' || p_source_filename,
          v_content, v_content_hash,
          coalesce(nullif(v_observation ->> 'observed_at', '')::timestamptz, now()),
          v_source_url,
          jsonb_build_object('ingestion_method', 'authorized_file_upload', 'source_name', v_source_name)
        );
        v_evidence_created := v_evidence_created + 1;
      end if;
      v_observations_skipped := v_observations_skipped + 1;
      continue;
    end if;

    insert into public.observations (
      actor_id, source_id, observed_at, title, content, content_hash,
      observation_type, metadata
    ) values (
      v_actor_id,
      v_source_id,
      coalesce(nullif(v_observation ->> 'observed_at', '')::timestamptz, now()),
      v_title,
      v_content,
      v_content_hash,
      coalesce(nullif(v_observation ->> 'observation_type', ''), 'analyst_note'),
      jsonb_build_object(
        'ingestion_method', 'authorized_file_upload',
        'original_filename', p_source_filename,
        'source_reference', v_source_url
      )
    ) returning id into v_observation_id;
    v_observations_created := v_observations_created + 1;

    insert into public.evidence (
      observation_id, evidence_type, description, content, content_hash,
      captured_at, source_url, metadata
    ) values (
      v_observation_id, 'text', 'Authorized import from ' || p_source_filename,
      v_content, v_content_hash,
      coalesce(nullif(v_observation ->> 'observed_at', '')::timestamptz, now()),
      v_source_url,
      jsonb_build_object('ingestion_method', 'authorized_file_upload', 'source_name', v_source_name)
    );
    v_evidence_created := v_evidence_created + 1;
  end loop;

  insert into public.ingestion_batches (
    analyst_id, source_filename, file_sha256, actors_created,
    observations_created, observations_skipped, evidence_created
  ) values (
    auth.uid(), p_source_filename, p_source_file_hash, v_actors_created,
    v_observations_created, v_observations_skipped, v_evidence_created
  ) returning id into v_batch_id;

  return jsonb_build_object(
    'batch_id', v_batch_id,
    'actors_created', v_actors_created,
    'observations_created', v_observations_created,
    'observations_skipped', v_observations_skipped,
    'evidence_created', v_evidence_created
  );
end;
$$;

revoke all on function public.ingest_authorized_records(jsonb, text, text) from public, anon;
grant execute on function public.ingest_authorized_records(jsonb, text, text) to authenticated;
