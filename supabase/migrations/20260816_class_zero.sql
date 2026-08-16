-- 20260816_class_zero.sql
-- 학년별 "0반" 을 학급 마스터에 추가한다.
--
-- 용도: 수업 시연·테스트용 계정(202610000 등)을 담는 반. 실제 학급이 아니라
--       담당 교사가 각 학년 0반에 테스트 계정을 두고 수업 화면을 확인하는 데 쓴다.
--       school_classes 에 있어야 관리자 화면의 학년·반 드롭다운(수업 만들기,
--       학급 통째 편성, 교사 담당 학급)에 선택지로 뜬다.
--
-- 멱등: unique (grade, class_number) 로 중복 방지.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select grade, class_number from public.school_classes
--          where class_number = 0 order by grade;   -- 1,2,3학년 0반

insert into public.school_classes (grade, class_number)
values (1, 0), (2, 0), (3, 0)
on conflict (grade, class_number) do nothing;

-- ── ROLLBACK ──
-- delete from public.school_classes where class_number = 0;
--   (0반을 참조하는 수업·담당 학급이 있으면 그쪽을 먼저 정리할 것)
