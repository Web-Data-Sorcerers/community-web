-- LOCAL proposal: additive recruitment review. Never reapply existing migrations.
-- Old RPC/auth/intake contracts remain intact. Apply requires separate approval.
begin;
create table private.recruitment_application_reviews (
 receipt uuid primary key references private.recruitment_applications(receipt) on delete restrict,
 status text not null check(status in ('new','reviewing','shortlisted','interview','waitlisted','accepted','rejected','withdrawn')),
 version bigint not null check(version>=0 and version<=9007199254740991),
 updated_at timestamptz not null, updated_by text not null, reviewer_label text not null
);
create table private.recruitment_review_notes (
 id uuid primary key default pg_catalog.gen_random_uuid(),
 receipt uuid not null references private.recruitment_applications(receipt) on delete restrict,
 body text not null check(char_length(body) between 1 and 4000 and octet_length(body)<=16384),
 created_by text not null, author_label text not null, created_at timestamptz not null default clock_timestamp()
);
create table private.recruitment_review_events (
 id uuid primary key default pg_catalog.gen_random_uuid(),
 receipt uuid not null references private.recruitment_applications(receipt) on delete restrict,
 action text not null check(action in ('status_changed','note_added')),
 from_status text not null, to_status text not null, reason text not null check(char_length(reason)<=500),
 note_id uuid references private.recruitment_review_notes(id) on delete restrict,
 actor_id text not null, actor_label text not null, created_at timestamptz not null default clock_timestamp(),
 before_version bigint not null, after_version bigint not null,
 request_id uuid not null, request_hash text not null, result jsonb not null,
 unique(actor_id,request_id), check(after_version=before_version+1)
);
create index recruitment_reviews_status_idx on private.recruitment_application_reviews(status,receipt);
create index recruitment_notes_page_idx on private.recruitment_review_notes(receipt,created_at,id);
create index recruitment_events_page_idx on private.recruitment_review_events(receipt,created_at,id);
create index recruitment_apps_review_page_idx on private.recruitment_applications(received_at,receipt);
alter table private.recruitment_application_reviews enable row level security;
revoke all on private.recruitment_application_reviews from public,anon,authenticated,service_role;
create policy recruitment_application_reviews_deny on private.recruitment_application_reviews for all using(false) with check(false);
alter table private.recruitment_review_notes enable row level security;
revoke all on private.recruitment_review_notes from public,anon,authenticated,service_role;
create policy recruitment_review_notes_deny on private.recruitment_review_notes for all using(false) with check(false);
alter table private.recruitment_review_events enable row level security;
revoke all on private.recruitment_review_events from public,anon,authenticated,service_role;
create policy recruitment_review_events_deny on private.recruitment_review_events for all using(false) with check(false);

-- Match ECMAScript trim and LF normalization at the SQL boundary as well.
create function private.recruitment_review_text(p_text text,p_min integer,p_max integer) returns text
language plpgsql immutable security definer set search_path=pg_catalog as $$
declare v text;
begin
 if p_text is null or p_text~E'[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]' then raise exception 'INVALID_INPUT'; end if;
 v:=btrim(replace(replace(p_text,E'\r\n',E'\n'),E'\r',E'\n'),
 E' \t\n'||chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279));
 if char_length(v) not between p_min and p_max or octet_length(v)>16384 then raise exception 'INVALID_INPUT'; end if;
 return v;
end $$;
-- Both permissions are locked in a fixed order, serializing with revocation.
create function private.recruitment_review_actor(p_actor_id text) returns text
language plpgsql security definer set search_path=pg_catalog as $$
declare label text;
begin
 if p_actor_id is null or p_actor_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then raise exception 'FORBIDDEN'; end if;
 perform 1 from private.cms_admin_permissions where auth_id=p_actor_id::uuid and active for share;
 if not found then raise exception 'FORBIDDEN'; end if;
 select email into label from private.cms_admin_users where auth_id=p_actor_id and active for share;
 if not found then raise exception 'FORBIDDEN'; end if;
 return label;
end $$;
create function private.recruitment_review_filters(p jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare k text; v text; f jsonb:=p; lim integer; off integer; stamp timestamptz;
begin
 if p is null or jsonb_typeof(p)<>'object' then raise exception 'INVALID_INPUT'; end if;
 for k,v in select key,value::text from jsonb_each(p) loop
  if k not in ('search','primary_hods','status','since','until','sort','limit','offset','as_of') then raise exception 'INVALID_INPUT'; end if;
  if k in ('limit','offset') then
   if jsonb_typeof(p->k)<>'number' or (p->>k)!~ '^[0-9]+$' then raise exception 'INVALID_INPUT'; end if;
  elsif jsonb_typeof(p->k)<>'string' then raise exception 'INVALID_INPUT'; end if;
 end loop;
 lim:=coalesce((p->>'limit')::integer,50); off:=coalesce((p->>'offset')::integer,0);
 if lim not between 1 and 100 or off not between 0 and 100000 then raise exception 'INVALID_INPUT'; end if;
 perform private.recruitment_review_text(coalesce(p->>'search',''),0,200);
 if coalesce(p->>'primary_hods','') not in ('','data','core','language','vision','product','growth') or coalesce(p->>'status','') not in ('','new','reviewing','shortlisted','interview','waitlisted','accepted','rejected','withdrawn') or coalesce(p->>'sort','received_at_desc') not in ('received_at_desc','received_at_asc') then raise exception 'INVALID_INPUT'; end if;
 for k in select unnest(array['since','until']) loop
  v:=nullif(p->>k,'');
  if v is not null then
   if v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char(v::date,'YYYY-MM-DD')<>v then raise exception 'INVALID_INPUT'; end if;
  end if;
 end loop;
 if nullif(p->>'since','')::date>nullif(p->>'until','')::date then raise exception 'INVALID_INPUT'; end if;
 if p?'as_of' and (p->>'as_of')!~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'INVALID_INPUT'; end if;
 stamp:=coalesce((p->>'as_of')::timestamptz,clock_timestamp());
 if not isfinite(stamp) or stamp>clock_timestamp() then raise exception 'INVALID_INPUT'; end if;
 return f || jsonb_build_object('search',private.recruitment_review_text(coalesce(p->>'search',''),0,200),'limit',lim,'offset',off,'sort',coalesce(p->>'sort','received_at_desc'),'as_of',stamp);
exception when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then raise exception 'INVALID_INPUT';
end $$;
-- strpos rather than LIKE: %, _ and backslash are always literal.
create function private.recruitment_review_list(p_actor_id text,p_filters jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare f jsonb; items jsonb; filtered bigint; total bigint;
begin
 perform private.recruitment_review_actor(p_actor_id); f:=private.recruitment_review_filters(p_filters);
 select count(*) into total from private.recruitment_applications;
 select count(*) into filtered from (select a.receipt,a.full_name,a.email,a.primary_hods,a.received_at,a.schema_version::integer as schema_version,coalesce(r.status,'new') as status,coalesce(r.version,0) as version,r.updated_at,r.updated_by,r.reviewer_label
 from private.recruitment_applications a left join private.recruitment_application_reviews r using(receipt)
 where a.received_at<=(f->>'as_of')::timestamptz
 and ((f->>'search')='' or strpos(lower(coalesce(a.full_name,'')),lower(f->>'search'))>0 or strpos(lower(coalesce(a.email,'')),lower(f->>'search'))>0)
 and (coalesce(f->>'primary_hods','')='' or a.primary_hods=f->>'primary_hods')
 and (coalesce(f->>'status','')='' or coalesce(r.status,'new')=f->>'status')
 and (nullif(f->>'since','') is null or a.received_at>=((f->>'since')::date::timestamp at time zone 'Asia/Jakarta'))
 and (nullif(f->>'until','') is null or a.received_at<(((f->>'until')::date+1)::timestamp at time zone 'Asia/Jakarta'))) matching;
 with paged as (
 select * from (select a.receipt,a.full_name,a.email,a.primary_hods,a.received_at,a.schema_version::integer as schema_version,coalesce(r.status,'new') as status,coalesce(r.version,0) as version,r.updated_at,r.updated_by,r.reviewer_label
 from private.recruitment_applications a left join private.recruitment_application_reviews r using(receipt)
 where a.received_at<=(f->>'as_of')::timestamptz
 and ((f->>'search')='' or strpos(lower(coalesce(a.full_name,'')),lower(f->>'search'))>0 or strpos(lower(coalesce(a.email,'')),lower(f->>'search'))>0)
 and (coalesce(f->>'primary_hods','')='' or a.primary_hods=f->>'primary_hods')
 and (coalesce(f->>'status','')='' or coalesce(r.status,'new')=f->>'status')
 and (nullif(f->>'since','') is null or a.received_at>=((f->>'since')::date::timestamp at time zone 'Asia/Jakarta'))
 and (nullif(f->>'until','') is null or a.received_at<(((f->>'until')::date+1)::timestamp at time zone 'Asia/Jakarta'))) matching
 order by case when f->>'sort'='received_at_desc' then received_at end desc,
 case when f->>'sort'='received_at_asc' then received_at end asc,receipt
 limit (f->>'limit')::integer offset (f->>'offset')::integer
 ) select coalesce(jsonb_agg(jsonb_build_object('receipt',p.receipt,'full_name',p.full_name,'email',p.email,'primary_hods',p.primary_hods,'received_at',p.received_at,'schema_version',p.schema_version,
 'review',jsonb_build_object('status',p.status,'version',p.version,'updated_at',p.updated_at,'updated_by',p.updated_by,'reviewer_label',p.reviewer_label,'note_count',(select count(*) from private.recruitment_review_notes n where n.receipt=p.receipt))) order by case when f->>'sort'='received_at_desc' then p.received_at end desc,case when f->>'sort'='received_at_asc' then p.received_at end asc,p.receipt),'[]') into items from paged p;
 return jsonb_build_object('applications',items,'total_global',total,'filtered',filtered,'limit',f->'limit','offset',f->'offset','has_more',(f->>'offset')::integer+jsonb_array_length(items)<filtered,'as_of',f->'as_of');
end $$;
create function private.recruitment_review_stats(p_actor_id text,p_filters jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare f jsonb; statuses jsonb; hods jsonb; filtered bigint;
begin
 perform private.recruitment_review_actor(p_actor_id); f:=private.recruitment_review_filters(p_filters);
 with matches as materialized (select * from (select a.receipt,a.full_name,a.email,a.primary_hods,a.received_at,a.schema_version::integer as schema_version,coalesce(r.status,'new') as status,coalesce(r.version,0) as version,r.updated_at,r.updated_by,r.reviewer_label
 from private.recruitment_applications a left join private.recruitment_application_reviews r using(receipt)
 where a.received_at<=(f->>'as_of')::timestamptz
 and ((f->>'search')='' or strpos(lower(coalesce(a.full_name,'')),lower(f->>'search'))>0 or strpos(lower(coalesce(a.email,'')),lower(f->>'search'))>0)
 and (coalesce(f->>'primary_hods','')='' or a.primary_hods=f->>'primary_hods')
 and (coalesce(f->>'status','')='' or coalesce(r.status,'new')=f->>'status')
 and (nullif(f->>'since','') is null or a.received_at>=((f->>'since')::date::timestamp at time zone 'Asia/Jakarta'))
 and (nullif(f->>'until','') is null or a.received_at<(((f->>'until')::date+1)::timestamp at time zone 'Asia/Jakarta'))) matching)
 select (select count(*) from matches),
 (select jsonb_agg(jsonb_build_object('status',s,'count',(select count(*) from matches where status=s))) from unnest(array['new','reviewing','shortlisted','interview','waitlisted','accepted','rejected','withdrawn']) s),
 (select jsonb_agg(jsonb_build_object('hods',h,'count',(select count(*) from matches where primary_hods=h))) from unnest(array['data','core','language','vision','product','growth']) h)
 into filtered,statuses,hods;
 return jsonb_build_object('total_global',(select count(*) from private.recruitment_applications),'filtered',filtered,'by_status',statuses,'by_hods',hods,'as_of',f->'as_of','filters_applied',(p_filters-'limit'-'offset'-'as_of'-'sort')<>'{}'::jsonb);
end $$;
create function private.recruitment_review_detail(p_actor_id text,p_receipt uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare result jsonb;
begin
 perform private.recruitment_review_actor(p_actor_id);
 select jsonb_build_object('found',true,'receipt',a.receipt,'fields',a.fields,'received_at',a.received_at,'schema_version',a.schema_version,'full_name',a.full_name,'email',a.email,'primary_hods',a.primary_hods,
 'review',jsonb_build_object('status',coalesce(r.status,'new'),'version',coalesce(r.version,0),'updated_at',r.updated_at,'updated_by',r.updated_by,'reviewer_label',r.reviewer_label,'note_count',(select count(*) from private.recruitment_review_notes n where n.receipt=a.receipt))) into result from private.recruitment_applications a left join private.recruitment_application_reviews r using(receipt) where a.receipt=p_receipt;
 return coalesce(result,jsonb_build_object('found',false));
end $$;
create function private.recruitment_review_history(p_actor_id text,p_receipt uuid,p_page jsonb,p_notes boolean) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare lim integer:=20; off integer:=0; items jsonb; total bigint;
begin
 perform private.recruitment_review_actor(p_actor_id);
 if p_page is null or jsonb_typeof(p_page)<>'object' or exists(select 1 from jsonb_object_keys(p_page) k where k not in ('limit','offset')) then raise exception 'INVALID_INPUT'; end if;
 if (p_page?'limit' and (jsonb_typeof(p_page->'limit')<>'number' or (p_page->>'limit')!~'^[0-9]+$')) or (p_page?'offset' and (jsonb_typeof(p_page->'offset')<>'number' or (p_page->>'offset')!~'^[0-9]+$')) then raise exception 'INVALID_INPUT'; end if;
 lim:=coalesce((p_page->>'limit')::integer,20); off:=coalesce((p_page->>'offset')::integer,0);
 if lim not between 1 and 20 or off not between 0 and 100000 then raise exception 'INVALID_INPUT'; end if;
 if not exists(select 1 from private.recruitment_applications where receipt=p_receipt) then raise exception 'NOT_FOUND'; end if;
 if p_notes then
 select count(*) into total from private.recruitment_review_notes where receipt=p_receipt;
 select coalesce(jsonb_agg(to_jsonb(t) order by created_at,id),'[]') into items from (select id,body,created_by,author_label,created_at from private.recruitment_review_notes where receipt=p_receipt order by created_at,id limit lim offset off) t;
 else
 select count(*) into total from private.recruitment_review_events where receipt=p_receipt;
 select coalesce(jsonb_agg(to_jsonb(t) order by created_at,id),'[]') into items from (select id,action,from_status,to_status,reason,note_id,actor_id,actor_label,created_at,before_version,after_version from private.recruitment_review_events where receipt=p_receipt order by created_at,id limit lim offset off) t;
 end if;
 return jsonb_build_object('items',items,'total',total,'limit',lim,'offset',off,'has_more',off+jsonb_array_length(items)<total);
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'INVALID_INPUT';
end $$;
create function private.recruitment_review_mutate(p_actor_id text,p_request jsonb,p_notes boolean) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare actor_label text; rid uuid; reqid uuid; expected bigint; current_status text; next_status text; reason text; body text; current_version bigint; hash text; existing private.recruitment_review_events%rowtype; nid uuid; eid uuid:=gen_random_uuid(); result jsonb; normalized jsonb;
begin
 actor_label:=private.recruitment_review_actor(p_actor_id);
 if p_request is null or jsonb_typeof(p_request)<>'object' or exists(select 1 from jsonb_object_keys(p_request) k where k not in ('request_id','receipt','expected_version',case when p_notes then 'body' else 'status' end,case when p_notes then 'body' else 'reason' end)) then raise exception 'INVALID_INPUT'; end if;
 if jsonb_typeof(p_request->'receipt') is distinct from 'string' or jsonb_typeof(p_request->'request_id') is distinct from 'string' or jsonb_typeof(p_request->'expected_version') is distinct from 'number' or (p_request->>'expected_version')!~'^[0-9]+$' then raise exception 'INVALID_INPUT'; end if;
 if (p_request->>'receipt') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or (p_request->>'request_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'INVALID_INPUT'; end if;
 rid:=(p_request->>'receipt')::uuid; reqid:=(p_request->>'request_id')::uuid; expected:=(p_request->>'expected_version')::bigint;
 if expected not between 0 and 9007199254740991 then raise exception 'INVALID_INPUT'; end if;
 if p_notes then
 if jsonb_typeof(p_request->'body') is distinct from 'string' then raise exception 'INVALID_INPUT'; end if;
 body:=private.recruitment_review_text(p_request->>'body',1,4000);
 else
 if jsonb_typeof(p_request->'status') is distinct from 'string' or (p_request?'reason' and jsonb_typeof(p_request->'reason')<>'string') then raise exception 'INVALID_INPUT'; end if;
 next_status:=p_request->>'status'; reason:=private.recruitment_review_text(coalesce(p_request->>'reason',''),0,500);
 if next_status not in ('new','reviewing','shortlisted','interview','waitlisted','accepted','rejected','withdrawn') then raise exception 'INVALID_INPUT'; end if;
 end if;
 normalized:=jsonb_build_object('action',case when p_notes then 'note_added' else 'status_changed' end,'receipt',rid,'expected_version',expected,'status',next_status,'reason',reason,'body',body);
 hash:=encode(sha256(convert_to(normalized::text,'UTF8')),'hex');
 -- Cross-receipt/action UUID reuse serialized before applicant lock.
 perform pg_advisory_xact_lock(hashtextextended(p_actor_id||':'||reqid::text,0));
 perform 1 from private.recruitment_applications where receipt=rid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into existing from private.recruitment_review_events where actor_id=p_actor_id and request_id=reqid;
 if found then
 if existing.request_hash<>hash then raise exception 'ID_CONFLICT'; end if;
 return existing.result||jsonb_build_object('replayed',true);
 end if;
 select status,version into current_status,current_version from private.recruitment_application_reviews where receipt=rid;
 current_status:=coalesce(current_status,'new'); current_version:=coalesce(current_version,0);
 if current_version<>expected then raise exception 'CONFLICT'; end if;
 if current_version>=9007199254740991 then raise exception 'INVALID_INPUT'; end if;
 if not p_notes then
 if not (case current_status
 when 'new' then next_status in ('reviewing','rejected','withdrawn')
 when 'reviewing' then next_status in ('shortlisted','waitlisted','rejected','withdrawn')
 when 'shortlisted' then next_status in ('interview','accepted','waitlisted','rejected','withdrawn')
 when 'interview' then next_status in ('accepted','waitlisted','rejected','withdrawn')
 when 'waitlisted' then next_status in ('reviewing','shortlisted','interview','accepted','rejected','withdrawn')
 else next_status='reviewing' end) then raise exception 'INVALID_TRANSITION'; end if;
 if (next_status in ('accepted','rejected','withdrawn') or current_status in ('accepted','rejected','withdrawn')) and char_length(reason)<10 then raise exception 'INVALID_INPUT'; end if;
 else next_status:=current_status; reason:=''; end if;
 insert into private.recruitment_application_reviews(receipt,status,version,updated_at,updated_by,reviewer_label) values(rid,next_status,current_version+1,clock_timestamp(),p_actor_id,actor_label)
 on conflict(receipt) do update set status=excluded.status,version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by,reviewer_label=excluded.reviewer_label;
 if p_notes then
 insert into private.recruitment_review_notes(receipt,body,created_by,author_label) values(rid,body,p_actor_id,actor_label) returning id into nid;
 end if;
 result:=jsonb_build_object('ok',true,'receipt',rid,'status',next_status,'version',current_version+1,'event_id',eid,'note_id',nid,'replayed',false);
 insert into private.recruitment_review_events(id,receipt,action,from_status,to_status,reason,note_id,actor_id,actor_label,before_version,after_version,request_id,request_hash,result)
 values(eid,rid,case when p_notes then 'note_added' else 'status_changed' end,current_status,next_status,reason,nid,p_actor_id,actor_label,current_version,current_version+1,reqid,hash,result);
 return result;
exception when raise_exception then
 if sqlerrm in ('FORBIDDEN','NOT_FOUND','CONFLICT','ID_CONFLICT','INVALID_TRANSITION','INVALID_INPUT') then return jsonb_build_object('ok',false,'error',jsonb_build_object('code',sqlerrm)); end if;
 raise;
when invalid_text_representation or numeric_value_out_of_range or not_null_violation then return jsonb_build_object('ok',false,'error',jsonb_build_object('code','INVALID_INPUT'));
end $$;
create function public.admin_list_applications_v2(p_actor_id text,p_filters jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_list(p_actor_id,p_filters) $$;
revoke all on function public.admin_list_applications_v2(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_list_applications_v2(text,jsonb) to service_role;
create function public.admin_get_stats_v2(p_actor_id text,p_filters jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_stats(p_actor_id,p_filters) $$;
revoke all on function public.admin_get_stats_v2(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_get_stats_v2(text,jsonb) to service_role;
create function public.admin_get_application_v2(p_actor_id text,p_receipt uuid) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_detail(p_actor_id,p_receipt) $$;
revoke all on function public.admin_get_application_v2(text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.admin_get_application_v2(text,uuid) to service_role;
create function public.admin_list_review_notes(p_actor_id text,p_receipt uuid,p_page jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_history(p_actor_id,p_receipt,p_page,true) $$;
revoke all on function public.admin_list_review_notes(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_list_review_notes(text,uuid,jsonb) to service_role;
create function public.admin_list_review_events(p_actor_id text,p_receipt uuid,p_page jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_history(p_actor_id,p_receipt,p_page,false) $$;
revoke all on function public.admin_list_review_events(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_list_review_events(text,uuid,jsonb) to service_role;
create function public.admin_update_application_status(p_actor_id text,p_request jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_mutate(p_actor_id,p_request,false) $$;
revoke all on function public.admin_update_application_status(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_update_application_status(text,jsonb) to service_role;
create function public.admin_add_review_note(p_actor_id text,p_request jsonb) returns jsonb language sql security definer set search_path=pg_catalog as $$ select private.recruitment_review_mutate(p_actor_id,p_request,true) $$;
revoke all on function public.admin_add_review_note(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_add_review_note(text,jsonb) to service_role;
revoke all on function private.recruitment_review_actor(text) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_filters(jsonb) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_list(text,jsonb) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_stats(text,jsonb) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_detail(text,uuid) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_history(text,uuid,jsonb,boolean) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_mutate(text,jsonb,boolean) from public,anon,authenticated,service_role;
revoke all on function private.recruitment_review_text(text,integer,integer) from public,anon,authenticated,service_role;
commit;
