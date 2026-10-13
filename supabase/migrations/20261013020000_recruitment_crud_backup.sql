-- Recruitment admin CRUD & safety backup migration.
-- Scope:
--   1. Archive table for deleted applications (automatic backup).
--   2. Delete application RPC with automatic archiving of snapshot, reviews, and notes.
--   3. Edit application RPC for updating applicant identity, domain, and portfolio fields.
--   4. Export applications RPC for manual full database backup.
-- Security:
--   - Schema objects in private.
--   - Public wrappers granted to service_role only. Anon/authenticated denied.

begin;

-- ========================================================
-- 1. Archive Table for Deleted Applications (Auto-Backup)
-- ========================================================
create table if not exists private.recruitment_applications_archive (
  id                   uuid primary key default gen_random_uuid(),
  receipt              uuid not null,
  deleted_at           timestamptz not null default clock_timestamp(),
  deleted_by           text not null,
  deleter_email        text not null,
  reason               text not null default '',
  application_snapshot jsonb not null check (jsonb_typeof(application_snapshot) = 'object')
);

comment on table private.recruitment_applications_archive is
  'Permanent archive backup for deleted applications. Holds complete snapshot before deletion.';

create index if not exists recruitment_archive_receipt_idx
  on private.recruitment_applications_archive (receipt);
create index if not exists recruitment_archive_deleted_at_idx
  on private.recruitment_applications_archive (deleted_at desc);

alter table private.recruitment_applications_archive enable row level security;
revoke all on private.recruitment_applications_archive from public, anon, authenticated, service_role;
drop policy if exists recruitment_archive_deny on private.recruitment_applications_archive;
create policy recruitment_archive_deny on private.recruitment_applications_archive for all using (false) with check (false);

-- Update audit log check constraint if exists
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'recruitment_audit_log_action_check'
  ) then
    alter table private.recruitment_audit_log drop constraint recruitment_audit_log_action_check;
    alter table private.recruitment_audit_log add constraint recruitment_audit_log_action_check check (
      action in (
        'admin_read_list', 'admin_read_detail', 'admin_export', 'admin_stats',
        'admin_delete', 'admin_edit'
      )
    );
  end if;
end $$;

-- ========================================================
-- 2. Delete Application Function (with Auto-Backup)
-- ========================================================
create or replace function private.recruitment_admin_delete(
  p_actor_id text,
  p_request  jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_label text;
  rid         uuid;
  reqid       uuid;
  reason_text text;
  app_row     private.recruitment_applications%rowtype;
  rev_row     private.recruitment_application_reviews%rowtype;
  notes_json  jsonb;
  events_json jsonb;
  snapshot    jsonb;
begin
  actor_label := private.recruitment_review_actor(p_actor_id);

  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception 'INVALID_INPUT';
  end if;

  if (p_request->>'receipt') is null or (p_request->>'receipt') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_INPUT';
  end if;
  rid := (p_request->>'receipt')::uuid;

  if p_request ? 'request_id' and (p_request->>'request_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_INPUT';
  end if;

  reason_text := private.recruitment_review_text(coalesce(p_request->>'reason', ''), 0, 500);

  -- Lock row for deletion
  select * into app_row
    from private.recruitment_applications
   where receipt = rid
     for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  -- Gather review state
  select * into rev_row
    from private.recruitment_application_reviews
   where receipt = rid;

  -- Gather notes
  select coalesce(jsonb_agg(row_to_json(n)), '[]'::jsonb)
    into notes_json
    from private.recruitment_review_notes n
   where receipt = rid;

  -- Gather events
  select coalesce(jsonb_agg(row_to_json(e)), '[]'::jsonb)
    into events_json
    from private.recruitment_review_events e
   where receipt = rid;

  -- Create full backup snapshot
  snapshot := jsonb_build_object(
    'receipt',        app_row.receipt,
    'received_at',    app_row.received_at,
    'content_hash',   app_row.content_hash,
    'schema_version', app_row.schema_version,
    'fields',         app_row.fields,
    'review',         case when rev_row.receipt is not null then row_to_json(rev_row)::jsonb else null end,
    'notes',          notes_json,
    'events',         events_json
  );

  -- Auto-archive snapshot
  insert into private.recruitment_applications_archive (
    receipt, deleted_at, deleted_by, deleter_email, reason, application_snapshot
  ) values (
    rid, clock_timestamp(), p_actor_id, actor_label, reason_text, snapshot
  );

  -- Delete child tables first (foreign keys)
  delete from private.recruitment_review_events where receipt = rid;
  delete from private.recruitment_review_notes where receipt = rid;
  delete from private.recruitment_application_reviews where receipt = rid;

  -- Delete primary row
  delete from private.recruitment_applications where receipt = rid;

  return jsonb_build_object(
    'ok',           true,
    'receipt',      rid,
    'deleted_at',   clock_timestamp(),
    'deleted_by',   actor_label,
    'backup_saved', true
  );
exception when raise_exception then
  if sqlerrm in ('FORBIDDEN', 'NOT_FOUND', 'INVALID_INPUT') then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', sqlerrm));
  end if;
  raise;
end;
$$;

-- ========================================================
-- 3. Edit Application Function
-- ========================================================
create or replace function private.recruitment_admin_edit(
  p_actor_id text,
  p_request  jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_label text;
  rid         uuid;
  app_row     private.recruitment_applications%rowtype;
  new_fields  jsonb;
  edit_fields jsonb;
  k           text;
  v           text;
  note_text   text;
begin
  actor_label := private.recruitment_review_actor(p_actor_id);

  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception 'INVALID_INPUT';
  end if;

  if (p_request->>'receipt') is null or (p_request->>'receipt') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_INPUT';
  end if;
  rid := (p_request->>'receipt')::uuid;

  edit_fields := p_request->'fields';
  if edit_fields is null or jsonb_typeof(edit_fields) <> 'object' then
    raise exception 'INVALID_INPUT';
  end if;

  -- Validate editable fields
  for k, v in select key, value::text from jsonb_each_text(edit_fields) loop
    if k not in (
      'full_name', 'preferred_name', 'email', 'whatsapp', 'institution', 'city_region',
      'primary_hods', 'specific_area', 'portfolio_link', 'project_experience',
      'currently_exploring', 'current_status', 'current_level', 'best_description'
    ) then
      raise exception 'INVALID_INPUT';
    end if;
    if k = 'email' and v !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
      raise exception 'INVALID_INPUT';
    end if;
    if k = 'primary_hods' and v not in ('data', 'core', 'language', 'vision', 'product', 'growth') then
      raise exception 'INVALID_INPUT';
    end if;
    if char_length(v) > 2000 then
      raise exception 'INVALID_INPUT';
    end if;
  end loop;

  -- Lock row for update
  select * into app_row
    from private.recruitment_applications
   where receipt = rid
     for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  -- Merge new fields
  new_fields := app_row.fields || edit_fields;

  -- Update applications table (PostgreSQL recalculates stored generated columns automatically)
  update private.recruitment_applications
     set fields = new_fields
   where receipt = rid;

  -- Add audit note to review history
  note_text := 'Data pendaftar diperbarui oleh ' || actor_label || '. Field: ' ||
               (select string_agg(key, ', ') from jsonb_object_keys(edit_fields) key);

  insert into private.recruitment_review_notes (
    receipt, body, created_by, author_label
  ) values (
    rid, private.recruitment_review_text(note_text, 1, 4000), p_actor_id, actor_label
  );

  return jsonb_build_object(
    'ok',         true,
    'receipt',    rid,
    'updated_at', clock_timestamp(),
    'fields',     new_fields
  );
exception when raise_exception then
  if sqlerrm in ('FORBIDDEN', 'NOT_FOUND', 'INVALID_INPUT') then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', sqlerrm));
  end if;
  raise;
end;
$$;

-- ========================================================
-- 4. Export / Full Backup Function
-- ========================================================
drop function if exists private.recruitment_admin_export(text);
drop function if exists private.recruitment_admin_export(text, jsonb);
create or replace function private.recruitment_admin_export(
  p_actor_id text,
  p_request  jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_label text;
  apps_json   jsonb;
  total_count bigint;
begin
  actor_label := private.recruitment_review_actor(p_actor_id);

  select count(*) into total_count from private.recruitment_applications;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'receipt',        a.receipt,
        'received_at',    a.received_at,
        'schema_version', a.schema_version,
        'fields',         a.fields,
        'review',         jsonb_build_object(
          'status',         coalesce(r.status, 'new'),
          'version',        coalesce(r.version, 0),
          'updated_at',     r.updated_at,
          'reviewer_label', r.reviewer_label
        )
      ) order by a.received_at desc
    ),
    '[]'::jsonb
  ) into apps_json
  from private.recruitment_applications a
  left join private.recruitment_application_reviews r using (receipt);

  return jsonb_build_object(
    'ok',           true,
    'exported_at',  clock_timestamp(),
    'exported_by',  actor_label,
    'total',        total_count,
    'applications', apps_json
  );
exception when raise_exception then
  if sqlerrm in ('FORBIDDEN') then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', sqlerrm));
  end if;
  raise;
end;
$$;

-- ========================================================
-- 5. Public Wrappers (EXECUTE granted to service_role only)
-- ========================================================
create or replace function public.admin_delete_application(
  p_actor_id text,
  p_request  jsonb
) returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.recruitment_admin_delete(p_actor_id, p_request);
$$;

revoke all on function public.admin_delete_application(text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_delete_application(text, jsonb) to service_role;

create or replace function public.admin_edit_application(
  p_actor_id text,
  p_request  jsonb
) returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.recruitment_admin_edit(p_actor_id, p_request);
$$;

revoke all on function public.admin_edit_application(text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_edit_application(text, jsonb) to service_role;

drop function if exists public.admin_export_applications(text);
drop function if exists public.admin_export_applications(text, jsonb);
create or replace function public.admin_export_applications(
  p_actor_id text,
  p_request  jsonb default '{}'::jsonb
) returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.recruitment_admin_export(p_actor_id, p_request);
$$;

revoke all on function public.admin_export_applications(text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_export_applications(text, jsonb) to service_role;

notify pgrst, 'reload schema';

commit;
