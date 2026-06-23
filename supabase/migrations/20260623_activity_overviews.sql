-- 20260623_activity_overviews.sql
-- 미니활동 슬러그별 "활동 개요" — 교사·AI 세특이 참고하는 1~3문장 활동 설명.
-- 목적: 학생 성찰이 부실할 때 AI 세특이 활동의 실제 내용을 근거로 보완하도록.
--
-- 모델:
--   PK = slug (registry/activityCatalog 의 활동 슬러그, 예: "probability_new/mini/rep_perm_password").
--   제목·교과·단원은 코드(activityTitles.ts / activityCatalog.ts)가 단일 출처라 여기 두지 않는다.
--   overview = 활동이 무엇을 시키고 어떤 개념을 다루는지 한국어 1~3문장.
--
-- 접근:
--   읽기 = 인증 사용자 전체(개요는 비민감 활동 설명. 교사 세특 생성·관리자 편집 모두 필요).
--   쓰기 = 관리자만(신규 활동 개요 기록·수정은 운영자 작업).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='activity_overviews' order by ordinal_position;
--   select policyname, cmd from pg_policies
--     where tablename='activity_overviews' order by policyname;

create table if not exists public.activity_overviews (
  slug        text primary key,
  overview    text not null default '',
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.activity_overviews enable row level security;

-- 읽기: 인증 사용자 전체(활동 설명이라 비민감).
drop policy if exists activity_overviews_read on public.activity_overviews;
create policy activity_overviews_read on public.activity_overviews
  for select to authenticated
  using (true);

-- 쓰기(INSERT/UPDATE/DELETE): 관리자만.
drop policy if exists activity_overviews_admin_all on public.activity_overviews;
create policy activity_overviews_admin_all on public.activity_overviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_activity_overviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists activity_overviews_set_updated_at on public.activity_overviews;
create trigger activity_overviews_set_updated_at
  before update on public.activity_overviews
  for each row execute function public.set_activity_overviews_updated_at();

-- 빠른 audit
-- select count(*) from public.activity_overviews;
-- select slug, length(overview) as len, updated_at
--   from public.activity_overviews order by updated_at desc limit 20;
