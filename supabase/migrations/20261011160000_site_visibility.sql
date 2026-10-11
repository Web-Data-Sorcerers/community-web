-- LOCAL ONLY. Additive visibility settings; requires separate production approval.
-- No CMS/recruitment/Auth/grant/content changes. Idempotency retains 10000
-- successful requests per actor indefinitely; reject new writes at limit.
begin;
create or replace function private.site_visibility_valid(c jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog as $$
declare r jsonb := '{"home":["philosophy","what-we-do","domains","projects","recruitment-cta"],"about":["vision-mission","philosophy","ecosystem","team"],"hall-of-frames":["featured","projects","milestones"],"recruitment":["who-should-join","what-you-will-do","available-roles","timeline","faq","snippets","cta"],"partners":["partners","why-partners"],"contact":[],"hods-data":[],"hods-core":[],"hods-language":[],"hods-vision":[],"hods-product":[],"hods-growth":[],"role-data":[],"role-core":[],"role-language":[],"role-vision":[],"role-product":[],"role-growth":[],"recruitment-apply":[]}'::jsonb; p text; s text;
begin
 if jsonb_typeof(c) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(c)) <> 19 then return false; end if;
 for p in select jsonb_object_keys(r) loop
  if jsonb_typeof(c->p) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(c->p))<>2 or not (c->p ?& array['enabled','sections']) then return false; end if;
  if jsonb_typeof(c->p->'enabled') is distinct from 'boolean' or jsonb_typeof(c->p->'sections') is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(c->p->'sections')) <> jsonb_array_length(r->p) then return false; end if;
  for s in select jsonb_array_elements_text(r->p) loop
   if jsonb_typeof(c->p->'sections'->s) is distinct from 'boolean' then return false; end if;
  end loop;
 end loop;
 return c->'home'->'enabled'='true'::jsonb;
end $$;
revoke all on function private.site_visibility_valid(jsonb) from public,anon,authenticated,service_role;
create table if not exists private.site_visibility_state (
 singleton boolean primary key default true check(singleton), schema_version integer not null check(schema_version=1),
 revision uuid not null, configuration jsonb not null check(private.site_visibility_valid(configuration)), updated_at timestamptz not null default clock_timestamp()
);
create table if not exists private.site_visibility_events (
 revision uuid primary key, actor_id uuid not null, request_id uuid not null,
 payload_hash text not null, before_flags jsonb not null, after_flags jsonb not null,
 created_at timestamptz not null default clock_timestamp(), unique(actor_id,request_id)
);
create table if not exists private.site_visibility_requests (
 actor_id uuid not null, request_id uuid not null, payload_hash text not null,
 result jsonb not null, created_at timestamptz not null default clock_timestamp(), primary key(actor_id,request_id)
);
alter table private.site_visibility_state enable row level security;
revoke all on private.site_visibility_state from public,anon,authenticated,service_role;
drop policy if exists site_visibility_state_deny on private.site_visibility_state;
create policy site_visibility_state_deny on private.site_visibility_state for all using(false) with check(false);
alter table private.site_visibility_events enable row level security;
revoke all on private.site_visibility_events from public,anon,authenticated,service_role;
drop policy if exists site_visibility_events_deny on private.site_visibility_events;
create policy site_visibility_events_deny on private.site_visibility_events for all using(false) with check(false);
alter table private.site_visibility_requests enable row level security;
revoke all on private.site_visibility_requests from public,anon,authenticated,service_role;
drop policy if exists site_visibility_requests_deny on private.site_visibility_requests;
create policy site_visibility_requests_deny on private.site_visibility_requests for all using(false) with check(false);
insert into private.site_visibility_state(singleton,schema_version,revision,configuration)
values(true,1,'00000000-0000-4000-8000-000000000001','{"home":{"enabled":true,"sections":{"philosophy":true,"what-we-do":true,"domains":true,"projects":true,"recruitment-cta":true}},"about":{"enabled":false,"sections":{"vision-mission":true,"philosophy":true,"ecosystem":true,"team":true}},"hall-of-frames":{"enabled":false,"sections":{"featured":true,"projects":true,"milestones":true}},"recruitment":{"enabled":true,"sections":{"who-should-join":true,"what-you-will-do":true,"available-roles":true,"timeline":true,"faq":true,"snippets":true,"cta":true}},"partners":{"enabled":true,"sections":{"partners":true,"why-partners":true}},"contact":{"enabled":true,"sections":{}},"hods-data":{"enabled":true,"sections":{}},"hods-core":{"enabled":true,"sections":{}},"hods-language":{"enabled":true,"sections":{}},"hods-vision":{"enabled":true,"sections":{}},"hods-product":{"enabled":true,"sections":{}},"hods-growth":{"enabled":true,"sections":{}},"role-data":{"enabled":true,"sections":{}},"role-core":{"enabled":true,"sections":{}},"role-language":{"enabled":true,"sections":{}},"role-vision":{"enabled":true,"sections":{}},"role-product":{"enabled":true,"sections":{}},"role-growth":{"enabled":true,"sections":{}},"recruitment-apply":{"enabled":true,"sections":{}}}'::jsonb) on conflict(singleton) do nothing;
create or replace function public.site_visibility_load() returns jsonb
language sql security definer set search_path=pg_catalog as $$
 select jsonb_build_object('schemaVersion',schema_version,'revision',revision,'pages',configuration) from private.site_visibility_state where singleton=true;
$$;
revoke all on function public.site_visibility_load() from public,anon,authenticated;
grant execute on function public.site_visibility_load() to service_role;
create or replace function public.site_visibility_save(p_actor_id uuid,p_expected_revision uuid,p_request_id uuid,p_changes jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare row_state private.site_visibility_state%rowtype; previous private.site_visibility_requests%rowtype;
 c jsonb; updated jsonb; path text[]; target text; targets text[] := array[]::text[];
 hash text; result jsonb; next_revision uuid; before_flags jsonb := '[]'; after_flags jsonb := '[]'; old_flag jsonb;
begin
 perform 1 from private.cms_admin_permissions where auth_id=p_actor_id and active=true for share;
 if not found then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','FORBIDDEN')); end if;
 if p_request_id is null or p_expected_revision is null or jsonb_typeof(p_changes) is distinct from 'array' then
  return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
 if jsonb_array_length(p_changes) not between 1 and 64 or octet_length(p_changes::text)>32768 then
  return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
 hash:=encode(sha256(convert_to(jsonb_build_object('expectedRevision',p_expected_revision,'changes',p_changes)::text,'UTF8')),'hex');
 -- Serialize all successful request IDs per actor (also enforces bounded retention).
 perform pg_advisory_xact_lock(hashtextextended('site-visibility:'||p_actor_id::text,0));
 select * into previous from private.site_visibility_requests where actor_id=p_actor_id and request_id=p_request_id;
 if found then
  if previous.payload_hash=hash then return previous.result; end if;
  return jsonb_build_object('ok',false,'error',jsonb_build_object('code','ID_CONFLICT'));
 end if;
 select * into row_state from private.site_visibility_state where singleton=true for update;
 if not found then raise exception 'VISIBILITY_UNAVAILABLE'; end if;
 if row_state.revision<>p_expected_revision then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','CONFLICT'),'data',public.site_visibility_load()); end if;
 updated:=row_state.configuration;
 for c in select jsonb_array_elements(p_changes) loop
  if jsonb_typeof(c) is distinct from 'object' then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
  if not (c ?& array['pageId','enabled']) or (select count(*) from jsonb_object_keys(c))<>(case when c ? 'sectionId' then 3 else 2 end) or jsonb_typeof(c->'pageId') is distinct from 'string' or jsonb_typeof(c->'enabled') is distinct from 'boolean' or not (updated ? (c->>'pageId')) then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
  if c ? 'sectionId' then
   if jsonb_typeof(c->'sectionId') is distinct from 'string' or not (updated->(c->>'pageId')->'sections' ? (c->>'sectionId')) then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
   path:=array[c->>'pageId','sections',c->>'sectionId'];
  else path:=array[c->>'pageId','enabled']; end if;
  target:=array_to_string(path,'/');
  if target=any(targets) or (path=array['home','enabled'] and c->'enabled'='false'::jsonb) then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
  targets:=array_append(targets,target); old_flag:=updated#>path;
  if old_flag is distinct from c->'enabled' then
   before_flags:=before_flags||jsonb_build_array(jsonb_build_object('target',target,'enabled',old_flag));
   after_flags:=after_flags||jsonb_build_array(c); updated:=jsonb_set(updated,path,c->'enabled',false);
  end if;
 end loop;
 if not private.site_visibility_valid(updated) then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT')); end if;
 if (select count(*) from private.site_visibility_requests where actor_id=p_actor_id)>=10000 then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','LIMIT')); end if;
 if updated is distinct from row_state.configuration then
  next_revision:=gen_random_uuid();
  update private.site_visibility_state set revision=next_revision,configuration=updated,updated_at=clock_timestamp() where singleton=true;
  insert into private.site_visibility_events(revision,actor_id,request_id,payload_hash,before_flags,after_flags) values(next_revision,p_actor_id,p_request_id,hash,before_flags,after_flags);
 end if;
 result:=jsonb_build_object('ok',true,'data',public.site_visibility_load());
 insert into private.site_visibility_requests(actor_id,request_id,payload_hash,result) values(p_actor_id,p_request_id,hash,result);
 return result;
end $$;
revoke all on function public.site_visibility_save(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.site_visibility_save(uuid,uuid,uuid,jsonb) to service_role;
commit;
