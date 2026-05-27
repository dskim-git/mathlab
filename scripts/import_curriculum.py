#!/usr/bin/env python3
# scripts/import_curriculum.py
#
# 기존 Streamlit 앱의 activities/<folder>/lessons/_units.py(CURRICULUM 트리)를
# 새 앱의 public.curriculum_units 테이블용 INSERT SQL 로 변환한다.
#
# 사용:
#   python scripts/import_curriculum.py <units_py_path> <subject_name> <out_sql_path>
# 예:
#   python scripts/import_curriculum.py \
#     C:/git-math/math/activities/probability_new/lessons/_units.py \
#     확률과통계 \
#     supabase/migrations/20260527_import_prob_curriculum.sql
#
# 매핑(Streamlit item.type → 새 앱 ContentBlock.type):
#   canva→canva_embed / youtube→youtube_embed / pdf→google_drive_file
#   gsheet,gslides,iframe,tongrami,url→external_embed
#   activity→interactive_activity(activitySlug="<subject_folder>/<slug>", 미구현 슬러그는 화면에서 '준비 중')
#
# 멱등: 생성 SQL 은 begin; delete(해당 subject) → insert; commit; 이라 재적용해도 깨끗이 재임포트.

import io
import json
import sys
import uuid


def map_item(item, block_id):
    t = item.get("type")
    title = item.get("title", "")
    src = item.get("src", "")
    height = item.get("height")
    base = {"id": block_id, "title": title}

    if t == "canva":
        content = {"embedUrl": src}
        if height:
            content["height"] = height
        return {**base, "type": "canva_embed", "content": content}

    if t == "youtube":
        content = {"videoUrl": src}
        if height:
            content["height"] = height
        return {**base, "type": "youtube_embed", "content": content}

    if t == "pdf":
        content = {"embedUrl": src, "fileUrl": item.get("download") or src}
        if height:
            content["height"] = height
        return {**base, "type": "google_drive_file", "content": content}

    if t in ("gsheet", "gslides", "iframe", "tongrami", "url"):
        content = {"url": src}
        if height:
            content["height"] = height
        return {**base, "type": "external_embed", "content": content}

    if t == "activity":
        subj = item.get("subject", "")
        slug = item.get("slug", "")
        return {
            **base,
            "type": "interactive_activity",
            # 새 앱 미니활동 슬러그 = "<streamlit_subject_folder>/<slug>" (이식 전엔 '준비 중')
            "content": {"activitySlug": f"{subj}/{slug}", "reflectionType": "simple"},
        }

    # 알 수 없는 타입 → 외부 임베드로 보존(나중에 수동 보정)
    content = {"url": src}
    if height:
        content["height"] = height
    return {**base, "type": "external_embed", "content": content}


def walk(node, parent_id, depth, order_index, rows):
    nid = str(uuid.uuid4())
    items = node.get("items")
    blocks = None
    if items:
        blocks = [map_item(it, f"{node['key']}-{i}") for i, it in enumerate(items)]
    rows.append(
        {
            "id": nid,
            "parent": parent_id,
            "key": node["key"],
            "label": node["label"],
            "depth": depth,
            "order": order_index,
            "blocks": blocks,
        }
    )
    for i, child in enumerate(node.get("children") or []):
        walk(child, nid, depth + 1, i, rows)


def dq(text, tag):
    # 달러 인용(Postgres) — 작은따옴표/이모지 escape 불필요
    return f"${tag}${text}${tag}$"


def main():
    units_path, subject, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

    ns = {}
    exec(io.open(units_path, encoding="utf-8").read(), ns)
    curriculum = ns["CURRICULUM"]

    rows = []
    for i, top in enumerate(curriculum):
        walk(top, None, 1, i, rows)

    leaves = sum(1 for r in rows if r["blocks"])
    blocks_total = sum(len(r["blocks"]) for r in rows if r["blocks"])

    lines = [
        f"-- generated: curriculum import for {subject}",
        f"-- nodes={len(rows)} leaves={leaves} blocks={blocks_total}",
        f"-- source: {units_path}",
        "begin;",
        f"delete from public.curriculum_units where subject = {dq(subject, 's')};",
    ]
    for r in rows:
        id_sql = f"'{r['id']}'"
        parent_sql = "null" if r["parent"] is None else f"'{r['parent']}'"
        label_sql = dq(r["label"], "l")
        key_sql = dq(r["key"], "k")
        cb_sql = (
            "null"
            if r["blocks"] is None
            else dq(json.dumps(r["blocks"], ensure_ascii=False), "cb") + "::jsonb"
        )
        lines.append(
            "insert into public.curriculum_units "
            "(id, subject, parent_id, unit_key, label, depth, order_index, content_blocks) values "
            f"({id_sql}, {dq(subject, 's')}, {parent_sql}, {key_sql}, {label_sql}, "
            f"{r['depth']}, {r['order']}, {cb_sql});"
        )
    lines.append("commit;")

    io.open(out_path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"OK nodes={len(rows)} leaves={leaves} blocks={blocks_total} -> {out_path}")


if __name__ == "__main__":
    main()
