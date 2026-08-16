-- 20260816_academic_term_scope.sql
-- 학생 기록을 (학년도 · 학기 · 교과) 축으로 구분한다.
--
-- 배경:
--   students.profile_id 가 unique — 학생당 행이 하나뿐이라 학년이 올라가도 student_id 가 그대로다.
--   그래서 activity_responses 는 한 학생 밑에 해가 바뀌어도 계속 쌓인다.
--   지금 AI 세특은 student_id 하나로만 응답을 긁어오므로
--   "1학기 공통수학1 성찰이 2학기 공통수학2 세특에 섞이는" 문제가 구조적으로 발생한다.
--   같은 학생이 정규 수업과 선택 수업(경제수학)을 함께 들으면 더 심해진다.
--
--   activity_responses 에는 이미 school_year / subject 가 있다. 없는 것은 semester 뿐이고,
--   기록을 소비하는 3개 테이블(legacy_reflections / survey_responses / sebteuk_drafts)에는
--   학년도·학기·교과 축이 아예 없다. 이 파일에서 축을 채운다.
--
-- 변경 요약:
--   1) app_settings.current_semester          — 현재 학기(1|2) 전역 설정
--   2) activity_responses.semester            — + created_at 기준 백필 + 자동 기록 트리거
--   3) legacy_reflections.{school_year, semester, subject}  — + 백필
--   4) survey_responses.{school_year, semester, subject}    — + 백필
--   5) sebteuk_drafts.{semester, subject}                   — + 백필
--
-- 백필 규칙(사용자 확정):
--   - activity_responses.semester : created_at(Asia/Seoul) 월이 3~8 이면 1학기, 그 외 2학기.
--   - 옛 성찰·설문·세특 초안       : 2026학년도 1학기. 교과는 학생 학년으로 —
--                                    1학년 → '공통수학1', 2학년 → '확률과통계'.
--                                    그 외 학년은 NULL(교과 무관) 로 남긴다.
--
-- subject NULL 의 의미(앱 규약):
--   "교과 무관 자료" — 어떤 교과의 세특/기록 화면에서도 보이되 기본 선택은 되지 않는다.
--   설문을 모든 교과에서 쓰고 싶어지면 survey_responses.subject 를 NULL 로 되돌리면 된다.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행 (BEGIN~COMMIT 한 번에).
-- 검증:  파일 맨 아래 검증 쿼리.

begin;

-- ═════════════════════════════════════════════════════════════
-- 1) app_settings.current_semester
-- ═════════════════════════════════════════════════════════════
-- 초기값은 백필 규칙과 같은 월 기준으로 계산 — 이후 관리자 설정에서 바꾼다.
-- (2학기 시작하면 /admin/settings 에서 2 로 변경할 것.)
insert into public.app_settings (key, value)
values (
  'current_semester',
  case
    when extract(month from (now() at time zone 'Asia/Seoul')) between 3 and 8 then '1'
    else '2'
  end
)
on conflict (key) do nothing;

-- ═════════════════════════════════════════════════════════════
-- 2) activity_responses.semester
-- ═════════════════════════════════════════════════════════════
alter table public.activity_responses
  add column if not exists semester smallint;

-- 백필 — 3~8월 = 1학기, 9~2월 = 2학기
update public.activity_responses
set semester = case
  when extract(month from (created_at at time zone 'Asia/Seoul')) between 3 and 8 then 1
  else 2
end
where semester is null;

alter table public.activity_responses
  drop constraint if exists activity_responses_semester_check;
alter table public.activity_responses
  add constraint activity_responses_semester_check check (semester in (1, 2));

-- 자동 기록 트리거 — 클라이언트가 semester/school_year 를 안 보내도 서버가 채운다.
-- 응답 INSERT 경로가 둘(submitReflection / ProbabilitySimulator) 이라 DB 에서 보장하는 편이 안전하다.
-- 우선순위: 클라이언트 값 > app_settings 현재값 > 월 규칙.
create or replace function public.set_activity_response_term()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setting text;
begin
  if new.school_year is null then
    select value into v_setting from public.app_settings where key = 'current_school_year';
    new.school_year := coalesce(
      nullif(v_setting, '')::integer,
      extract(year from (now() at time zone 'Asia/Seoul'))::integer
    );
  end if;

  if new.semester is null then
    select value into v_setting from public.app_settings where key = 'current_semester';
    new.semester := coalesce(
      nullif(v_setting, '')::smallint,
      case
        when extract(month from (now() at time zone 'Asia/Seoul')) between 3 and 8 then 1
        else 2
      end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists activity_responses_set_term on public.activity_responses;
create trigger activity_responses_set_term
  before insert on public.activity_responses
  for each row execute function public.set_activity_response_term();

create index if not exists activity_responses_student_term_idx
  on public.activity_responses (student_id, school_year, semester, subject);

-- ═════════════════════════════════════════════════════════════
-- 3) legacy_reflections — 옛 앱(Streamlit) 이식 성찰
-- ═════════════════════════════════════════════════════════════
-- source_subject(옛 자유 텍스트)는 원본 보존용으로 그대로 두고,
-- 정규 교과 마스터에 붙는 subject 컬럼을 새로 둔다.
alter table public.legacy_reflections
  add column if not exists school_year integer;
alter table public.legacy_reflections
  add column if not exists semester smallint;
alter table public.legacy_reflections
  add column if not exists subject text
    references public.subjects(name) on update cascade on delete restrict;

update public.legacy_reflections lr
set school_year = 2026,
    semester    = 1,
    subject     = case s.grade
                    when 1 then '공통수학1'
                    when 2 then '확률과통계'
                    else null
                  end
from public.students s
where s.id = lr.student_id
  and lr.school_year is null;

alter table public.legacy_reflections
  drop constraint if exists legacy_reflections_semester_check;
alter table public.legacy_reflections
  add constraint legacy_reflections_semester_check
    check (semester is null or semester in (1, 2));

create index if not exists legacy_reflections_term_idx
  on public.legacy_reflections (student_id, school_year, semester, subject);

-- ═════════════════════════════════════════════════════════════
-- 4) survey_responses — 사전/사후 설문
-- ═════════════════════════════════════════════════════════════
alter table public.survey_responses
  add column if not exists school_year integer;
alter table public.survey_responses
  add column if not exists semester smallint;
alter table public.survey_responses
  add column if not exists subject text
    references public.subjects(name) on update cascade on delete restrict;

update public.survey_responses sr
set school_year = 2026,
    semester    = 1,
    subject     = case s.grade
                    when 1 then '공통수학1'
                    when 2 then '확률과통계'
                    else null
                  end
from public.students s
where s.id = sr.student_id
  and sr.school_year is null;

alter table public.survey_responses
  drop constraint if exists survey_responses_semester_check;
alter table public.survey_responses
  add constraint survey_responses_semester_check
    check (semester is null or semester in (1, 2));

create index if not exists survey_responses_term_idx
  on public.survey_responses (student_id, school_year, semester, subject);

-- ═════════════════════════════════════════════════════════════
-- 5) sebteuk_drafts — AI 세특 초안
-- ═════════════════════════════════════════════════════════════
-- 지금까지 (teacher_id, student_id, school_year) 뿐이라 한 학생의 교과별 초안이 섞였다.
alter table public.sebteuk_drafts
  add column if not exists semester smallint;
alter table public.sebteuk_drafts
  add column if not exists subject text
    references public.subjects(name) on update cascade on delete restrict;

update public.sebteuk_drafts sd
set semester = 1,
    subject  = case s.grade
                 when 1 then '공통수학1'
                 when 2 then '확률과통계'
                 else null
               end
from public.students s
where s.id = sd.student_id
  and sd.semester is null;

-- 기존 초안은 모두 2026학년도로 (혹시 다른 값이 있으면 맞춰둔다)
update public.sebteuk_drafts
set school_year = 2026
where school_year is distinct from 2026;

alter table public.sebteuk_drafts
  drop constraint if exists sebteuk_drafts_semester_check;
alter table public.sebteuk_drafts
  add constraint sebteuk_drafts_semester_check
    check (semester is null or semester in (1, 2));

create index if not exists sebteuk_drafts_term_idx
  on public.sebteuk_drafts (teacher_id, school_year, semester, subject);

commit;

-- ═════════════════════════════════════════════════════════════
-- 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 현재 학기 설정
-- select key, value from public.app_settings where key in ('current_school_year','current_semester');

-- (b) 응답의 학년도·학기 분포 (semester NULL 이 0 이어야 함)
-- select school_year, semester, count(*) from public.activity_responses
--  group by 1,2 order by 1,2;

-- (c) 교과별 분포 — 교과가 제대로 나뉘어 있는지
-- select school_year, semester, subject, count(*) from public.activity_responses
--  group by 1,2,3 order by 1,2,3;

-- (d) 옛 성찰·설문·초안 백필 결과 (subject NULL = 1·2학년 외 학생)
-- select '옛성찰' as t, school_year, semester, subject, count(*) from public.legacy_reflections group by 1,2,3,4
-- union all
-- select '설문',   school_year, semester, subject, count(*) from public.survey_responses   group by 1,2,3,4
-- union all
-- select '세특초안', school_year, semester, subject, count(*) from public.sebteuk_drafts     group by 1,2,3,4
-- order by 1,2,3,4;

-- (e) 트리거 동작 확인 — 학생 계정으로 활동 제출 후
-- select id, school_year, semester, subject, created_at from public.activity_responses
--  order by created_at desc limit 5;

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK (컬럼째 되돌리기 — 백필 값도 함께 사라진다)
-- ═════════════════════════════════════════════════════════════
-- drop trigger if exists activity_responses_set_term on public.activity_responses;
-- drop function if exists public.set_activity_response_term();
-- alter table public.activity_responses drop column if exists semester;
-- alter table public.legacy_reflections drop column if exists subject;
-- alter table public.legacy_reflections drop column if exists semester;
-- alter table public.legacy_reflections drop column if exists school_year;
-- alter table public.survey_responses  drop column if exists subject;
-- alter table public.survey_responses  drop column if exists semester;
-- alter table public.survey_responses  drop column if exists school_year;
-- alter table public.sebteuk_drafts    drop column if exists subject;
-- alter table public.sebteuk_drafts    drop column if exists semester;
-- delete from public.app_settings where key = 'current_semester';
