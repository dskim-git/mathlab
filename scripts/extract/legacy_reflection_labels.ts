/**
 * 옛 스트림릿 앱 활동 파일에서 reflection 질문 매핑 추출.
 *
 * 활동 파일 패턴:
 *   _SHEET_NAME = "다항식의정리"   ← 시트 탭명(legacy_reflections.activity_label)
 *   _QUESTIONS = [
 *     {"key": "어떻게유도", "label": "다항식의 정리는 어떻게 유도하나요?", ...},
 *     ...
 *   ]
 *
 * 결과: lib/legacy/reflectionLabels.ts 생성 (자동 반영).
 *   export const REFLECTION_LABELS = {
 *     "다항식의정리": { "어떻게유도": "다항식의 정리는 어떻게 유도하나요?", ... },
 *     ...
 *   };
 *
 * 실행: npx tsx scripts/extract/legacy_reflection_labels.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";

const ACTIVITIES_DIR = "C:/git-math/math/activities";
const OUTPUT_PATH = resolve(process.cwd(), "lib/legacy/reflectionLabels.ts");

function listPyFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (name === "__pycache__" || name.startsWith(".")) continue;
      out.push(...listPyFiles(full));
    } else if (name.endsWith(".py")) {
      out.push(full);
    }
  }
  return out;
}

/** 파이썬 문자열 리터럴 디코드 — 단순 케이스만. */
function unescapePyString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

/** 파일 안의 _SHEET_NAME 값 추출 (단일/이중 따옴표 모두). */
function extractSheetName(content: string): string | null {
  const m =
    content.match(/_SHEET_NAME\s*=\s*"([^"]+)"/) ||
    content.match(/_SHEET_NAME\s*=\s*'([^']+)'/);
  return m ? unescapePyString(m[1]) : null;
}

/**
 * 파일 안의 _QUESTIONS 리스트에서 {"key": "X", "label": "Y", ...} 항목 모두 추출.
 * key/label 순서가 dict 안에서 바뀌어 있어도 처리.
 * label 안의 따옴표·줄바꿈은 단순 케이스만 (대부분 OK).
 */
function extractQuestionLabels(content: string): Map<string, string> {
  const result = new Map<string, string>();
  // _QUESTIONS 블록 안만 탐색하지 말고 전체에서 dict 패턴 찾음.
  // dict pattern: { ... "key": "K" ... "label": "L" ... } 또는 label/key 순서 바뀜.
  // 가장 단순: 각 dict 블록을 분리 (중괄호 매칭).
  const len = content.length;
  let depth = 0;
  let blockStart = -1;
  const blocks: string[] = [];
  for (let i = 0; i < len; i++) {
    const c = content[i];
    if (c === "{") {
      if (depth === 0) blockStart = i + 1;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && blockStart >= 0) {
        blocks.push(content.slice(blockStart, i));
        blockStart = -1;
      }
    }
  }
  for (const b of blocks) {
    const keyM = b.match(/["']key["']\s*:\s*["']([^"']+)["']/);
    // label 은 한국어 + 특수문자 다수 — 따옴표 안의 모든 문자(\는 따옴표 자체 제외).
    const labelM =
      b.match(/["']label["']\s*:\s*"([^"]*)"/) ||
      b.match(/["']label["']\s*:\s*'([^']*)'/);
    if (keyM && labelM) {
      result.set(keyM[1], unescapePyString(labelM[1]));
    }
  }
  return result;
}

async function main() {
  console.log(`스캔 디렉토리: ${ACTIVITIES_DIR}`);
  const files = listPyFiles(ACTIVITIES_DIR);
  console.log(`Python 파일 ${files.length}개 발견`);

  const mapping: Record<string, Record<string, string>> = {};
  let okFiles = 0;
  let skipNoSheet = 0;
  let skipNoQuestions = 0;

  for (const f of files) {
    let content: string;
    try {
      content = readFileSync(f, "utf-8");
    } catch {
      continue;
    }
    const sheetName = extractSheetName(content);
    if (!sheetName) {
      skipNoSheet++;
      continue;
    }
    const labels = extractQuestionLabels(content);
    if (labels.size === 0) {
      skipNoQuestions++;
      continue;
    }
    // 같은 sheetName 이 여러 파일에 있으면 첫 번째 우선 (보통 안 겹침)
    if (mapping[sheetName]) {
      console.log(`  ⚠ 중복 sheetName: ${sheetName} (${f})`);
      continue;
    }
    mapping[sheetName] = Object.fromEntries(labels);
    okFiles++;
  }

  console.log(`\n매핑 추출 완료:`);
  console.log(`  활동 ${okFiles}개`);
  console.log(`  skip(SHEET_NAME 없음): ${skipNoSheet}`);
  console.log(`  skip(질문 없음): ${skipNoQuestions}`);

  // 출력 파일 작성
  mkdirSync(resolve(process.cwd(), "lib/legacy"), { recursive: true });
  const header = `// 자동 생성 — scripts/extract/legacy_reflection_labels.ts 가 옛 스트림릿 활동 파일에서 추출.
// 시트 탭명(activity_label) → 시트 컬럼명(payload key) → 진짜 질문 텍스트.
// LegacyReflectionsSection / SebteukWorkflow 등에서 옛 성찰 표시 시 매핑 적용.

export const REFLECTION_LABELS: Record<string, Record<string, string>> =
`;
  const body = JSON.stringify(mapping, null, 2);
  writeFileSync(OUTPUT_PATH, header + body + ";\n", "utf-8");
  console.log(`\n✅ ${OUTPUT_PATH} 생성 (${okFiles} 활동, ${Object.values(mapping).reduce((s, m) => s + Object.keys(m).length, 0)} 질문)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
