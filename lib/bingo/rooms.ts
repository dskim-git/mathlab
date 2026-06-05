// 영재 단원 4 작도 빙고: 방 관리 헬퍼.
// - 모델: 학급별 활성 방 1개 + 방 코드(6자 영숫자)로 다른 학급에서도 접속 가능.
// - 호출은 모두 클라이언트 supabase 인스턴스 기준 (RLS 적용).
// - 마이그레이션: supabase/migrations/20260605_bingo_rooms.sql

import type { SupabaseClient } from "@supabase/supabase-js";

export type BingoRoom = {
  id: string;
  room_code: string;
  created_by: string;
  grade: number | null;
  class_number: number | null;
  status: "active" | "ended";
  state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// 6자 영숫자 코드 — 가독성 위해 0/1/I/L/O 제외.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateRoomCode(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

// 학급의 활성 방 1개 조회 (없으면 null).
export async function findActiveClassRoom(
  supabase: SupabaseClient,
  grade: number,
  classNumber: number,
): Promise<BingoRoom | null> {
  const { data, error } = await supabase
    .from("bingo_rooms")
    .select("*")
    .eq("grade", grade)
    .eq("class_number", classNumber)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as BingoRoom | null) ?? null;
}

// 방 코드로 방 1개 조회 (대소문자 구분 없음). 없거나 ended 면 null.
export async function findRoomByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<BingoRoom | null> {
  const norm = code.trim().toUpperCase();
  if (!norm) return null;
  const { data, error } = await supabase
    .from("bingo_rooms")
    .select("*")
    .eq("room_code", norm)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const room = data as BingoRoom;
  return room.status === "active" ? room : null;
}

// 교사가 자기 학급용 방 생성.
//  - 기존에 같은 학급의 활성 방이 있으면 'ended' 로 정리하고 새 방 생성.
//  - 코드 충돌 시 최대 5회 재시도.
export async function createClassRoom(
  supabase: SupabaseClient,
  opts: { teacherProfileId: string; grade: number; classNumber: number },
): Promise<BingoRoom> {
  // 기존 활성 방 ended 로 마감
  const prev = await findActiveClassRoom(supabase, opts.grade, opts.classNumber);
  if (prev) {
    const { error: endErr } = await supabase
      .from("bingo_rooms")
      .update({ status: "ended" })
      .eq("id", prev.id);
    if (endErr) throw endErr;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("bingo_rooms")
      .insert({
        room_code: code,
        created_by: opts.teacherProfileId,
        grade: opts.grade,
        class_number: opts.classNumber,
        status: "active",
        state: { probs: {} },
      })
      .select("*")
      .single();
    if (!error && data) return data as BingoRoom;
    // unique 충돌이면 다음 코드로 재시도 (23505)
    if (error && (error as { code?: string }).code !== "23505") throw error;
  }
  throw new Error("방 코드 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.");
}

// 방 종료 (교사·관리자).
export async function endRoom(supabase: SupabaseClient, roomId: string): Promise<void> {
  const { error } = await supabase
    .from("bingo_rooms")
    .update({ status: "ended" })
    .eq("id", roomId);
  if (error) throw error;
}

// 방 state 패치 — 방장만 (RLS 보장). 부분 갱신 위해 클라이언트에서 합성 후 전체 state 갱신.
export async function updateRoomState(
  supabase: SupabaseClient,
  roomId: string,
  state: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("bingo_rooms")
    .update({ state })
    .eq("id", roomId);
  if (error) throw error;
}
