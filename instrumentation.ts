// Next.js 16 instrumentation 훅. 서버(Node 런타임) 콜드 스타트 시 1회 실행.
// progressDates.ts 같은 서버 사이드 날짜 헬퍼가 getDay()/setHours() 등 로컬 TZ
// 메서드를 쓰는데, Vercel 함수의 기본 TZ가 UTC라 한국 새벽 0~9시 사이에
// "오늘"이 어제로 잡히는 문제가 있었다. Vercel 대시보드는 TZ를 예약어로
// 막아서 환경변수로 설정 불가 → 런타임 시작 시점에 직접 주입한다.
// Node 22+ 는 process.env.TZ 변경을 이후 모든 Date 객체가 반영한다.
export function register() {
  process.env.TZ = "Asia/Seoul";
}
