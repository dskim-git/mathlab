// 교과별 OT(오리엔테이션) 자료 URL.
// 관리자(admin) 만 /learn 페이지에서 OT 자료 토글 버튼을 볼 수 있다.
// 원본 Streamlit home.py 의 _OT_CANVA 를 그대로 옮긴 것.
// 빈 값(대수/미적분1·2/경제수학)은 원본도 TODO 상태라서 매핑에서 제외했다.

export const OT_MATERIALS: Record<string, string> = {
  공통수학1:
    "https://www.canva.com/design/DAHC4prloOs/iLjYVxFI-b-VKCWRB3rE9A/view?embed",
  공통수학2:
    "https://www.canva.com/design/DAHC4prloOs/iLjYVxFI-b-VKCWRB3rE9A/view?embed",
  확률과통계:
    "https://www.canva.com/design/DAHC5FC0x7g/wVBeRL2qrRPuWLC9BszvjQ/view?embed",
};

export function getOtUrl(subjectName: string): string | undefined {
  return OT_MATERIALS[subjectName];
}
