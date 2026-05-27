import type { ComponentType } from "react";
import RepPermPassword from "./rep-perm-password/RepPermPassword";
import RepPermMorse from "./rep-perm-morse/RepPermMorse";
import RepPermTiles from "./rep-perm-tiles/RepPermTiles";
import RepPermDice from "./rep-perm-dice/RepPermDice";

// 이식 완료된 미니활동: activitySlug(임포트된 "<folder>/<slug>") → React 컴포넌트.
// 자체 렌더(추가 props 불필요). 등록되지 않은 슬러그는 ActivityRenderer 가 '준비 중'으로 표시.
// (probability-simulator 는 제출 props 가 많아 ActivityRenderer 에서 별도 처리한다.)
export const ACTIVITY_REGISTRY: Record<string, ComponentType> = {
  "probability_new/mini/rep_perm_password": RepPermPassword,
  "probability_new/mini/rep_perm_morse": RepPermMorse,
  "probability_new/mini/rep_perm_tiles": RepPermTiles,
  "probability_new/mini/rep_perm_dice": RepPermDice,
};
