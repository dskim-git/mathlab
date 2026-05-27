// 삼색기 활동 데이터 — 원본(나무위키 「삼색기」 기준, 문장·별·국장 없는 순수 삼색기)을 그대로 옮김.

export type ColorKey = "b" | "w" | "r" | "y" | "g" | "k" | "o" | "lb";

export const COLORS: Record<ColorKey, { hex: string; name: string; short: string }> = {
  b: { hex: "#0047AB", name: "파란색", short: "파" },
  w: { hex: "#FFFFFF", name: "흰색", short: "흰" },
  r: { hex: "#CF142B", name: "빨간색", short: "빨" },
  y: { hex: "#FFCD00", name: "노란색", short: "노" },
  g: { hex: "#009A44", name: "초록색", short: "초" },
  k: { hex: "#000000", name: "검정색", short: "검" },
  o: { hex: "#FF8200", name: "주황색", short: "주" },
  lb: { hex: "#00A3E0", name: "하늘색", short: "하" },
};

// 인라인 style 대신 쓰는 정적 Tailwind 배경 클래스(고정 팔레트라 가능 — JIT가 리터럴로 인식).
export const BG_CLASS: Record<ColorKey, string> = {
  b: "bg-[#0047AB]",
  w: "bg-[#FFFFFF]",
  r: "bg-[#CF142B]",
  y: "bg-[#FFCD00]",
  g: "bg-[#009A44]",
  k: "bg-[#000000]",
  o: "bg-[#FF8200]",
  lb: "bg-[#00A3E0]",
};

export type FlagDef = {
  name: string;
  code: string;
  c: ColorKey[];
  o: "v" | "h"; // 세로 / 가로 줄무늬
  lat: number;
  lng: number;
};

// orientation: 'v'(세로 줄무늬) / 'h'(가로 줄무늬), c: 왼→오 또는 위→아래 색 순서
export const FLAGS: FlagDef[] = [
  // 세로 줄무늬
  { name: "프랑스", code: "fr", c: ["b", "w", "r"], o: "v", lat: 46.2, lng: 2.2 },
  { name: "이탈리아", code: "it", c: ["g", "w", "r"], o: "v", lat: 41.9, lng: 12.5 },
  { name: "아일랜드", code: "ie", c: ["g", "w", "o"], o: "v", lat: 53.3, lng: -7.9 },
  { name: "코트디부아르", code: "ci", c: ["o", "w", "g"], o: "v", lat: 7.5, lng: -5.5 },
  { name: "벨기에", code: "be", c: ["k", "y", "r"], o: "v", lat: 50.8, lng: 4.4 },
  { name: "루마니아", code: "ro", c: ["b", "y", "r"], o: "v", lat: 44.4, lng: 26.1 },
  { name: "차드", code: "td", c: ["b", "y", "r"], o: "v", lat: 15.5, lng: 18.6 },
  { name: "말리", code: "ml", c: ["g", "y", "r"], o: "v", lat: 17.6, lng: -4.0 },
  { name: "기니", code: "gn", c: ["r", "y", "g"], o: "v", lat: 11.0, lng: -10.9 },
  // 가로 줄무늬
  { name: "독일", code: "de", c: ["k", "r", "y"], o: "h", lat: 51.2, lng: 10.5 },
  { name: "룩셈부르크", code: "lu", c: ["r", "w", "lb"], o: "h", lat: 49.8, lng: 6.1 },
  { name: "네덜란드", code: "nl", c: ["r", "w", "b"], o: "h", lat: 52.1, lng: 5.3 },
  { name: "러시아", code: "ru", c: ["w", "b", "r"], o: "h", lat: 61.5, lng: 90.0 },
  { name: "헝가리", code: "hu", c: ["r", "w", "g"], o: "h", lat: 47.2, lng: 19.5 },
  { name: "불가리아", code: "bg", c: ["w", "g", "r"], o: "h", lat: 42.7, lng: 25.5 },
  { name: "리투아니아", code: "lt", c: ["y", "g", "r"], o: "h", lat: 55.2, lng: 23.9 },
  { name: "에스토니아", code: "ee", c: ["b", "k", "w"], o: "h", lat: 58.6, lng: 25.0 },
  { name: "아르메니아", code: "am", c: ["r", "b", "o"], o: "h", lat: 40.2, lng: 44.5 },
  { name: "예멘", code: "ye", c: ["r", "w", "k"], o: "h", lat: 15.6, lng: 48.5 },
  { name: "볼리비아", code: "bo", c: ["r", "y", "g"], o: "h", lat: -16.5, lng: -64.0 },
  { name: "콜롬비아", code: "co", c: ["y", "b", "r"], o: "h", lat: 4.6, lng: -74.1 },
  { name: "시에라리온", code: "sl", c: ["g", "w", "b"], o: "h", lat: 8.5, lng: -11.8 },
  { name: "가봉", code: "ga", c: ["g", "y", "b"], o: "h", lat: -0.8, lng: 11.6 },
];
