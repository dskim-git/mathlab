// 현명하게 환전하기 미니활동 — Frankfurter(ECB) 환율 스냅샷. 기준일 2026-08-20.
// CURRENT_KRW = 통화 1단위 = ? 원(매매기준율). spread = 은행 현찰 환전 수수료율(편도, 근사).
// 살 때(고객이 외화 살 때)=기준*(1+spread), 팔 때=기준*(1-spread).
export type Cur = { code: string; ko: string; unit: number; spread: number };
export const AS_OF = "2026-08-20";
export const CURRENCIES: Cur[] = [{"code":"USD","ko":"미국 달러","unit":1,"spread":0.0175},{"code":"JPY","ko":"일본 엔","unit":100,"spread":0.0175},{"code":"EUR","ko":"유로","unit":1,"spread":0.0199},{"code":"CNY","ko":"중국 위안","unit":1,"spread":0.05},{"code":"GBP","ko":"영국 파운드","unit":1,"spread":0.0199},{"code":"AUD","ko":"호주 달러","unit":1,"spread":0.0199},{"code":"CAD","ko":"캐나다 달러","unit":1,"spread":0.0199},{"code":"CHF","ko":"스위스 프랑","unit":1,"spread":0.0199},{"code":"HKD","ko":"홍콩 달러","unit":1,"spread":0.0199},{"code":"SGD","ko":"싱가포르 달러","unit":1,"spread":0.0199}];
export const CURRENT_KRW: Record<string, number> = {"USD":1396.35,"JPY":8.8,"EUR":1631.08,"CNY":207.68,"GBP":1902.69,"AUD":992.26,"CAD":1014.04,"CHF":1747.65,"HKD":178.02,"SGD":1097.63};
