-- 20260527_curriculum_units.sql
-- 교과 단원 계층(교과 → 대단원 → 중단원 → 소단원) 트리 + 소단원 콘텐츠 블록.
--
-- 배경: 정규수업 흐름 = 교과 선택 → 대/중/소단원 선택 → 그 단원의 콘텐츠(블록) 표시.
--   기존 Streamlit `_units.py`(CURRICULUM 트리)를 이 테이블로 이식한다(Phase 2 임포트).
--
-- 구조 메모:
--   - 자기참조 트리(parent_id). 대단원=parent_id null.
--   - depth = 1(대)/2(중)/3(소) — 구조상 위치(편의 컬럼).
--   - 잎(leaf) 노드는 content_blocks(jsonb, ContentBlock[]) 보유 → 기존 ActivityRenderer 재사용.
--     주의: 잎은 소단원(depth 3)뿐 아니라 중단원 위치(depth 2, 예: '대단원 평가 문제')일 수도 있다
--     → content_blocks 유무로 잎 판정(depth 와 독립).
--   - subject 는 기존 패턴대로 subjects(name) FK(ON UPDATE CASCADE).
--
-- 콘텐츠 민감도 낮음(수업 자료) → SELECT 는 로그인 사용자 전체 허용, 쓰기는 admin.
--   교과 접근 권한(class_subject_permissions 등)에 의한 노출 제한은 탐색 UI에서 처리(추후 RLS 강화 가능).
--
-- 라이브는 SQL 에디터(service_role)로 적용.

create table if not exists public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  subject text not null
    references public.subjects(name) on update cascade on delete restrict,
  parent_id uuid references public.curriculum_units(id) on delete cascade,
  unit_key text not null,          -- Streamlit key: "1", "1-1", "1-1-1", "X-1" 등
  label text not null,
  depth integer not null,          -- 1=대단원, 2=중단원, 3=소단원
  order_index integer not null default 0,
  content_blocks jsonb,            -- 잎 노드(items 보유)만; 컨테이너는 null
  created_at timestamptz not null default now(),
  unique (subject, unit_key)
);

create index if not exists idx_curriculum_units_subject on public.curriculum_units(subject);
create index if not exists idx_curriculum_units_parent on public.curriculum_units(parent_id);

alter table public.curriculum_units enable row level security;

-- 관리자: 전체(임포트/편집/삭제)
drop policy if exists "admin all curriculum_units" on public.curriculum_units;
create policy "admin all curriculum_units"
  on public.curriculum_units for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- 로그인 사용자: 읽기(탐색). 교과 접근 제한은 UI 단계(추후 RLS 강화 가능).
drop policy if exists "authenticated read curriculum_units" on public.curriculum_units;
create policy "authenticated read curriculum_units"
  on public.curriculum_units for select to authenticated
  using ( true );

-- ── 검증 (적용 후) ──
-- select table_name from information_schema.tables where table_schema='public' and table_name='curriculum_units';
-- select tablename, policyname, cmd from pg_policies where tablename='curriculum_units' order by policyname;

-- ── ROLLBACK ──
-- drop table if exists public.curriculum_units;
