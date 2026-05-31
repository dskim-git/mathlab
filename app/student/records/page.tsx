import { redirect } from "next/navigation";

// (구) /student/records 는 "내 성찰" 통합 페이지(/student/reflections) 로 흡수됨.
// 메뉴/검색 결과/북마크 깨지지 않게 영구 리다이렉트.
export default function StudentRecordsRedirect() {
  redirect("/student/reflections");
}
