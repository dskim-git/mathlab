"use client";

// 교과·수업 권한 허브.
//
// 권한 관련 화면이 여기저기 흩어져 "반 세팅을 어디서 하나" 가 헷갈렸다.
// 이 화면을 단일 진입점으로 삼고, 각 화면의 역할을 한 줄로 못박는다.
//
//   수업        = 담당 교사 + 수강생 (지금의 정본)
//   교과 열람권  = 수업 없이 콘텐츠만 볼 사람 (학급 단위 학생 / 일반인 / 교사 개인)
//   활동 그룹    = 빙고 방 등 활동용 묶음 (수업 편성이 아님)
//   AI 세특 권한 = 사용 승인 + 모델 허용 (이 화면에 인라인)

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AiSebteukToggleList } from "@/components/admin/AiSebteukToggleList";
import { AiModelAllowList } from "@/components/admin/AiModelAllowList";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function AdminAccessPage() {
  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          교과·수업 권한
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          누가 무엇에 접근하는가
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          권한을 정하는 곳은 아래 네 군데뿐입니다. 각각 역할이 다르니 헷갈리면 이
          화면으로 돌아오세요.
        </p>
      </div>

      {/* 1) 주력 — 수업 */}
      <section className="mb-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.06] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold ${theme.accentText}`}>
              대부분의 세팅은 여기서
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">수업 관리</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              학년도 · 학기 · 교과 · 수강생을 한 묶음으로 관리합니다. 정규 수업과
              경제수학 같은 선택 수업이 같은 방식입니다. 여기서 담당 교사를 배정하면
              그 교사가 <b>기록 조회 · AI 세특 · 진도표</b>를 쓸 수 있고, 수강생으로
              편성된 학생은 <b>그 교과 콘텐츠에 자동으로 접근</b>합니다.
            </p>
          </div>
          <Link
            href="/admin/courses"
            className={`shrink-0 rounded-full border ${theme.accentBorder} ${theme.accentText} px-4 py-2 text-sm font-semibold hover:bg-white/5`}
          >
            🏫 수업 관리 열기
          </Link>
        </div>
      </section>

      {/* 2) 보조 화면 3개 */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <DashboardCard
          icon="🎓"
          title="교과 열람권"
          description="수업 없이 콘텐츠만 열어줄 때"
          href="/admin/subjects"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👨‍👩‍👧"
          title="활동 그룹"
          description="빙고 방 등 활동용 묶음"
          href="/admin/groups"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🧑‍🏫"
          title="교사별 담당 현황"
          description="읽기 전용 · 누가 뭘 맡았나"
          href="/admin/teachers"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 역할 구분 안내 — 중복처럼 보이는 지점을 명시적으로 갈라준다 */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <h2 className="text-sm font-bold text-slate-200">어디서 해야 하나</h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-cyan-200">
              반 학생들에게 수업을 열어주고 싶다
            </dt>
            <dd className="text-slate-400">→ 수업 관리에서 수업을 만들고 학급 통째 편성</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-cyan-200">
              선택 과목 수강생만 묶고 싶다
            </dt>
            <dd className="text-slate-400">
              → 수업 관리 (학번으로 편성 · 미가입 학생도 미리 가능)
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-cyan-200">
              교사에게 담당을 주고 싶다
            </dt>
            <dd className="text-slate-400">→ 수업 관리 › 담당 교사</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-amber-200">
              수업은 없는데 콘텐츠만 보여주고 싶다
            </dt>
            <dd className="text-slate-400">
              → 교과 열람권 (일반인, 참관 교사, 특정 학급)
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-violet-200">빙고 방을 열고 싶다</dt>
            <dd className="text-slate-400">→ 활동 그룹</dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-500">
          과목·학급 목록과 현재 학년도·학기는{" "}
          <Link href="/admin/settings" className="underline hover:text-slate-300">
            설정
          </Link>
          에서, 학생 명단은{" "}
          <Link href="/admin/roster" className="underline hover:text-slate-300">
            명렬표
          </Link>
          에서 관리합니다.
        </p>
      </section>

      {/* 3) AI 세특 권한 — 이 화면에 인라인 */}
      <div className="mb-6">
        <AiSebteukToggleList accentText={theme.accentText} />
      </div>

      <div className="mb-6">
        <AiModelAllowList accentText={theme.accentText} />
      </div>
    </>
  );
}
