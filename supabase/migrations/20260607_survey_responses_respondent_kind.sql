-- 20260607_survey_responses_respondent_kind.sql
-- survey_responses 에 응답자 역할(respondent_kind) 비정규화 + 트리거 자동 채움.
--
-- 배경:
--   설문 분석 시 "학생 응답 vs 일반인 응답" 구분 통계가 필요.
--   매 쿼리마다 profiles join 하면 쿼리 길어지고, 사후 role 변경 시 옛 응답 통계가
--   시점과 어긋남(예: 학생→일반인 변환 시 옛 응답은 학생 시점 그대로 보존해야).
--   → 응답 INSERT 시점의 role 을 행에 비정규화 저장.
--
-- 변경:
--   1) respondent_kind text 컬럼 추가
--   2) BEFORE INSERT 트리거: profile.role 을 자동 복사 (앱 코드 변경 없이 채움)
--      UPDATE 에는 적용 안 함(역할 변경되어도 옛 응답 시점은 보존).
--
-- 적용:  Supabase SQL editor 에서 BEGIN~COMMIT 실행 + 검증.

begin;

-- 1) 컬럼 추가 (nullable — 옛 데이터 이식 시 일괄 채움)
alter table public.survey_responses
  add column if not exists respondent_kind text;

-- (선택) 빠른 group by 통계용 인덱스
create index if not exists survey_responses_kind_idx
  on public.survey_responses (respondent_kind);

-- 2) 트리거 함수 — INSERT 시 profile.role 복사
create or replace function public.set_survey_response_kind()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.respondent_kind is null then
    select p.role into new.respondent_kind
    from public.profiles p
    where p.id = new.profile_id;
  end if;
  return new;
end;
$$;

-- 트리거 연결 (재실행 안전)
drop trigger if exists survey_responses_set_kind on public.survey_responses;
create trigger survey_responses_set_kind
  before insert on public.survey_responses
  for each row execute function public.set_survey_response_kind();

-- 3) 검증
select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema='public' and table_name='survey_responses'
    and column_name = 'respondent_kind';

select tgname, tgenabled
  from pg_trigger
  where tgrelid = 'public.survey_responses'::regclass
    and tgname = 'survey_responses_set_kind';

-- 기대값:
--   respondent_kind: text, nullable=YES
--   trigger: survey_responses_set_kind / tgenabled='O' (origin = enabled)

commit;
