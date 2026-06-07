import { requireUser } from "@/lib/auth/requireUser";
import { ChangePasswordForm } from "./ChangePasswordForm";

// 비밀번호 변경 페이지 — 임시 비번 발급 후 첫 로그인 시 강제 진입(proxy.ts 가드),
// 또는 본인이 일반 변경 시에도 사용.
// proxy.ts 가 must_change_password=true 인 사용자를 이 페이지로 강제 redirect 한다.
// 이 페이지 자체는 그 가드의 예외 경로 — 본인의 임시 비번을 새 비번으로 갱신 후
// must_change_password=false 로 풀어주면 정상 동선으로 복귀.
export default async function ChangePasswordPage() {
  const { profile } = await requireUser();

  const forced = profile.must_change_password === true;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold text-cyan-300">계정 보안</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">비밀번호 변경</h1>
          {forced ? (
            <p className="mt-2 rounded-xl border border-amber-300/40 bg-amber-300/5 p-3 text-sm text-amber-200">
              임시 비밀번호로 로그인되었습니다. 새 비밀번호를 설정한 뒤 학습을
              시작해 주세요.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              새 비밀번호를 입력해 주세요.
            </p>
          )}
        </div>
        <ChangePasswordForm forced={forced} role={profile.role} />
      </div>
    </main>
  );
}
