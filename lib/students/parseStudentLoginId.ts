export type ParsedStudentLoginId = {
  schoolYear: number | null;
  studentCode: string;
  studentLoginId: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

export type ParseStudentLoginIdResult =
  | {
      ok: true;
      data: ParsedStudentLoginId;
    }
  | {
      ok: false;
      error: string;
    };

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseFiveDigitStudentCode(studentCode: string) {
  if (!/^\d{5}$/.test(studentCode)) {
    return null;
  }

  const grade = Number(studentCode.slice(0, 1));
  const classNumber = Number(studentCode.slice(1, 3));
  const studentNumber = Number(studentCode.slice(3, 5));

  if (grade < 1 || grade > 3) {
    return null;
  }

  if (classNumber < 1 || classNumber > 99) {
    return null;
  }

  if (studentNumber < 1 || studentNumber > 99) {
    return null;
  }

  return {
    grade,
    classNumber,
    studentNumber,
  };
}

export function parseStudentLoginId(
  rawValue: string,
  defaultSchoolYear?: number
): ParseStudentLoginIdResult {
  const normalized = onlyDigits(rawValue.trim());

  if (!normalized) {
    return {
      ok: false,
      error: "학생 로그인 ID를 입력해 주세요.",
    };
  }

  // 예: 20202
  if (normalized.length === 5) {
    const parsed = parseFiveDigitStudentCode(normalized);

    if (!parsed) {
      return {
        ok: false,
        error:
          "학번 형식이 올바르지 않습니다. 예: 20202는 2학년 2반 2번입니다.",
      };
    }

    const schoolYear = defaultSchoolYear ?? null;

    return {
      ok: true,
      data: {
        schoolYear,
        studentCode: normalized,
        studentLoginId: schoolYear ? `${schoolYear}${normalized}` : normalized,
        grade: parsed.grade,
        classNumber: parsed.classNumber,
        studentNumber: parsed.studentNumber,
      },
    };
  }

  // 예: 202620202
  if (normalized.length === 9) {
    const schoolYear = Number(normalized.slice(0, 4));
    const studentCode = normalized.slice(4);

    const parsed = parseFiveDigitStudentCode(studentCode);

    if (!parsed) {
      return {
        ok: false,
        error: "학생 로그인 ID 형식이 올바르지 않습니다. 예: 202620202",
      };
    }

    if (schoolYear < 2000 || schoolYear > 2100) {
      return {
        ok: false,
        error: "앞의 4자리는 학년도 형식이어야 합니다. 예: 2026",
      };
    }

    return {
      ok: true,
      data: {
        schoolYear,
        studentCode,
        studentLoginId: normalized,
        grade: parsed.grade,
        classNumber: parsed.classNumber,
        studentNumber: parsed.studentNumber,
      },
    };
  }

  return {
    ok: false,
    error:
      "학생 로그인 ID는 5자리 학번 또는 9자리 로그인 ID여야 합니다. 예: 20202 또는 202620202",
  };
}

export function formatStudentLabel(parsed: ParsedStudentLoginId) {
  return `${parsed.grade}학년 ${parsed.classNumber}반 ${parsed.studentNumber}번`;
}