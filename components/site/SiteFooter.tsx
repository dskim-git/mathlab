"use client";

import { useEffect, useState } from "react";

// 기존 Streamlit 앱(home.py _render_footer / _privacy_policy_dialog)에서 옮긴
// 전역 푸터 + 개인정보처리방침 팝업. 모든 화면 하단에 표시된다.
export default function SiteFooter() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <footer className="mt-10 border-t border-indigo-400/15 px-4 py-5 text-center text-xs leading-7 text-slate-400">
      <p>
        © 2026 MathLab. All rights reserved. &nbsp;|&nbsp; 개인정보책임자: 김대섭 교사 (휘문고등학교) &nbsp;|&nbsp; 문의: 02-500-9513
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
      >
        📋 개인정보처리방침
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="개인정보처리방침"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-slate-900 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <h2 className="text-lg font-bold text-slate-100">📜 개인정보처리방침</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 text-sm leading-7 text-slate-300">
              <PrivacyPolicyBody />
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-sm font-bold text-cyan-300">{title}</h3>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </section>
  );
}

function PrivacyPolicyBody() {
  return (
    <div>
      <p>
        <b className="text-slate-100">MathLab</b>은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
      </p>

      <Section title="제1조 (개인정보의 처리 목적)">
        <p>본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
        <p>① <b>회원 가입 및 이용자 인증</b>: 학생 및 일반인 회원가입 신청 접수, 교사(관리자)의 승인 후 서비스 이용 활성화, 아이디·비밀번호를 통한 로그인 인증 및 이용자 식별</p>
        <p>② <b>교과별 접근 권한 관리</b>: 로그인 계정의 학년 또는 그룹에 따라 허용된 교과 자료의 접근 범위 제한 및 제공</p>
        <p>③ <b>수업 자료 및 학습 활동 제공</b>: 교과별 강의 자료(슬라이드·PDF·영상) 및 인터랙티브 시뮬레이션 활동 제공</p>
        <p>④ <b>학습 활동 결과 기록 및 관리</b>: 학생이 활동 후 성찰 기록 제출 시 학번·이름·활동 내용을 수집하여 데이터베이스(Supabase)에 저장하며, 교사의 학습 확인 및 피드백 제공에 활용. 학생은 자신의 과거 성찰 제출 이력을 서비스 내에서 직접 조회할 수 있습니다.</p>
        <p>⑤ <b>방문 기록 관리</b>: 서비스 개선을 위해 방문 시각·과목 필터·사용자 ID를 기록합니다. 해당 데이터는 관리자(교사)만 열람 가능합니다.</p>
        <p>⑥ <b>교사의 진도 관리 및 상담 지원</b>: 날짜·반별 수업 진도 기록 관리로 체계적인 수업 운영을 지원</p>
        <p>⑦ <b>관리자(교사) 인증 및 서비스 운영</b>: 관리자 계정을 통한 접근 권한 확인, 회원 승인·거부·그룹 관리 등 관리자 전용 기능 제공</p>
      </Section>

      <Section title="제2조 (개인정보의 처리 및 보유기간)">
        <p>① 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
        <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
        <ul className="ml-4 list-disc">
          <li><b>보유 기간</b>: 해당 학년도 종료 시(익년 2월 말) 또는 학생의 졸업·진급 시까지</li>
          <li><b>파기 시점</b>: 보유 기간 종료 후 지체 없이(5일 이내) 파기</li>
        </ul>
      </Section>

      <Section title="제3조 (처리하는 개인정보 항목)">
        <p>본 서비스는 학습 지원을 위해 필요한 최소한의 개인정보만을 수집합니다.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="border border-white/10 px-2 py-1.5 text-left">구분</th>
                <th className="border border-white/10 px-2 py-1.5 text-left">수집 항목</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-white/10 px-2 py-1.5 font-semibold text-slate-200">학생 회원</td><td className="border border-white/10 px-2 py-1.5">학번, 이름, 아이디(연도+학번 자동생성), 비밀번호(암호화 저장), 학년, 가입일, 마지막 로그인 일시</td></tr>
              <tr><td className="border border-white/10 px-2 py-1.5 font-semibold text-slate-200">일반 회원</td><td className="border border-white/10 px-2 py-1.5">이름, 아이디, 비밀번호(암호화 저장), 사용목적, 소속그룹, 가입일, 마지막 로그인 일시</td></tr>
              <tr><td className="border border-white/10 px-2 py-1.5 font-semibold text-slate-200">성찰 기록</td><td className="border border-white/10 px-2 py-1.5">학번, 이름, 활동명, 제출 시각, 활동별 답변 내용</td></tr>
              <tr><td className="border border-white/10 px-2 py-1.5 font-semibold text-slate-200">방문 기록</td><td className="border border-white/10 px-2 py-1.5">방문 시각, 과목 필터, 사용자 ID</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2"><b>수집하지 않는 항목</b>: 주민등록번호, 주소, 전화번호, 이메일 등 불필요한 민감 정보</p>
      </Section>

      <Section title="제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)">
        <p>① 본 서비스는 만 14세 미만 아동의 개인정보를 처리하기 위하여 회원가입 화면의 보호자 동의 확인란 체크 및 학기 초 학교 가정통신문(개인정보 수집·이용 동의서)을 통하여 법정대리인의 동의를 받습니다.</p>
        <p>② 법정대리인이 동의하지 않는 경우, 해당 아동은 서비스 가입 및 이용이 제한될 수 있습니다.</p>
      </Section>

      <Section title="제5조 (개인정보의 파기 절차 및 방법)">
        <p>① 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
        <p>② <b>파기 방법</b>: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 영구 삭제(데이터베이스 레코드 삭제)하며, 별도의 종이 문서는 존재하지 않습니다.</p>
      </Section>

      <Section title="제6조 (개인정보의 안전성 확보조치)">
        <p>본 서비스는 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적 조치를 하고 있습니다.</p>
        <p>① <b>비밀번호 암호화</b>: 이용자의 비밀번호는 일방향 암호화(Hash)로 저장·관리됩니다. 원문 비밀번호는 저장되지 않으며 개발자(관리자)도 확인할 수 없습니다.</p>
        <p>② <b>로그인 시도 제한</b>: 동일 세션 내 로그인 실패가 일정 횟수 이상 발생하면 추가 시도가 차단됩니다.</p>
        <p>③ <b>관리자 승인을 통한 접근 통제</b>: 회원가입 후 교사(관리자)의 승인을 거쳐야 서비스를 이용할 수 있으며, 학년 및 그룹 단위로 접근 가능한 교과를 제한합니다.</p>
        <p>④ <b>해킹 등에 대비한 기술적 대책</b>: 보안 인증을 획득한 전문 클라우드 플랫폼(Vercel·Supabase)을 기반으로 운영되며, 전 구간 보안 통신(HTTPS)을 사용하여 데이터를 암호화 전송합니다. 데이터 접근은 행 수준 보안(RLS) 정책으로 통제됩니다.</p>
        <p>⑤ <b>접근 권한 최소화</b>: 데이터베이스·인증 키 등 비밀 설정값은 서버 환경 변수(보안 저장소)에만 보관되며, 소스코드(GitHub)에는 일절 포함되지 않습니다.</p>
        <p>⑥ <b>개인정보 취급 직원의 최소화</b>: 개인정보를 처리하는 담당자를 개발 교사 1인으로 지정하여 관리자 계정 접근 권한을 운영합니다.</p>
      </Section>

      <Section title="제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)">
        <p>① 정보주체(학생) 및 법정대리인은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</p>
        <p>② 학생 회원은 서비스 내 <b>[학생 홈]</b>에서 자신의 활동·제출 이력을 직접 열람할 수 있으며, 비밀번호는 본인이 대시보드에서 직접 변경하거나 분실 시 관리자(교사)에게 문의하여 재설정할 수 있습니다.</p>
        <p>③ 계정 삭제(탈퇴) 및 그 밖의 개인정보 삭제 요청은 개발 교사에게 구두나 서면으로 요청하면 지체 없이 조치하겠습니다.</p>
      </Section>

      <Section title="제8조 (개인정보 보호책임자)">
        <p>본 서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <ul className="ml-4 list-disc">
          <li><b>성명</b>: 김대섭 (개발자)</li>
          <li><b>소속</b>: 휘문고등학교</li>
          <li><b>직위</b>: 교사</li>
          <li>
            <b>연락처</b>: 02-500-9513 (학교 교무실)
            <br />
            <span className="text-slate-500">※ 개인정보 보호를 위해 교사의 개인 휴대전화 번호는 기재하지 않습니다.</span>
          </li>
        </ul>
      </Section>

      <Section title="제9조 (개인정보 처리방침 변경)">
        <p>이 개인정보 처리방침은 <b>2026년 3월 10일</b>부터 적용됩니다.</p>
      </Section>
    </div>
  );
}
