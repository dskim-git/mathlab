-- bingo_rooms 에 group_id 추가 (영재 등 수업 그룹용 방).
--
-- 모델 변경:
--   기존: 학급별(grade + class_number) 방 1종.
--   변경: 학급별 OR 그룹별 — bingo_rooms.group_id 가 nullable.
--     - grade/class_number 설정된 행 = 학급별 방
--     - group_id 설정된 행      = 그룹별 방
--     - 둘 다 NULL 도 허용 (방 코드 공유 전용 — 이번 라운드에선 사용 X)
--
-- 학생 자동 입장:
--   본인이 멤버인 그룹의 활성 방 + 본인 학급의 활성 방을 합쳐 표시.
--   여러 개면 사용자가 선택.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  \d public.bingo_rooms;  -- group_id 컬럼이 추가되어 있어야 함.

alter table public.bingo_rooms
  add column if not exists group_id uuid references public.study_groups(id) on delete cascade;

create index if not exists bingo_rooms_group_active_idx
  on public.bingo_rooms (group_id, status);
