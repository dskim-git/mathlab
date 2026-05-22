"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ActivityBlocksJsonEditorProps = {
    activityId: string;
    initialContentBlocks: unknown;
};

function formatInitialJson(value: unknown) {
    if (!value) {
        return "[]";
    }

    return JSON.stringify(value, null, 2);
}

export default function ActivityBlocksJsonEditor({
    activityId,
    initialContentBlocks,
}: ActivityBlocksJsonEditorProps) {
    const router = useRouter();

    const initialJsonText = useMemo(() => {
        return formatInitialJson(initialContentBlocks);
    }, [initialContentBlocks]);

    const [jsonText, setJsonText] = useState(initialJsonText);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    function handleFormatJson() {
        setMessage("");
        setErrorMessage("");

        try {
            const parsed = JSON.parse(jsonText);

            setJsonText(JSON.stringify(parsed, null, 2));
            setMessage("JSON 형식을 정리했습니다.");
        } catch {
            setErrorMessage("JSON 문법이 올바르지 않습니다. 쉼표, 따옴표, 중괄호를 확인해 주세요.");
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setMessage("");
        setErrorMessage("");

        let parsed: unknown;

        try {
            parsed = JSON.parse(jsonText);
        } catch {
            setIsSaving(false);
            setErrorMessage("JSON 문법이 올바르지 않아 저장할 수 없습니다.");
            return;
        }

        if (!Array.isArray(parsed)) {
            setIsSaving(false);
            setErrorMessage("content_blocks는 반드시 배열 [] 형태여야 합니다.");
            return;
        }

        const { error } = await supabase
            .from("activities")
            .update({
                content_blocks: parsed,
            })
            .eq("id", activityId);

        setIsSaving(false);

        if (error) {
            setErrorMessage(error.message);
            return;
        }

        setJsonText(JSON.stringify(parsed, null, 2));
        setMessage("저장했습니다. 학생 활동 화면에 반영됩니다.");
        router.refresh();
    }

    return (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">content_blocks JSON 편집</h2>
                    <p className="mt-2 leading-7 text-slate-300">
                        활동 화면에 표시할 Canva, YouTube, PDF, 외부 사이트, 미니활동 블록을
                        JSON 배열로 관리합니다.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleFormatJson}
                        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                    >
                        JSON 정리
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? "저장 중..." : "저장"}
                    </button>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-950/20 p-4 text-sm leading-6 text-yellow-100">
                <p className="font-semibold">주의</p>
                <p className="mt-1">
                    JSON 문법이 틀리면 학생 화면이 제대로 표시되지 않을 수 있습니다.
                    저장 전에는 반드시 JSON 정리 버튼을 눌러 확인하세요.
                </p>
            </div>

            <label
                htmlFor="content-blocks-json-editor"
                className="mt-5 block text-sm font-semibold text-slate-300"
            >
                콘텐츠 블록 JSON
            </label>

            <textarea
                id="content-blocks-json-editor"
                value={jsonText}
                onChange={(event) => {
                    setJsonText(event.target.value);
                    setMessage("");
                    setErrorMessage("");
                }}
                placeholder="content_blocks JSON 배열을 입력하세요."
                spellCheck={false}
                className="mt-3 min-h-[520px] w-full rounded-2xl border border-white/10 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
            />

            {message ? (
                <div className="mt-4 rounded-xl border border-green-300/30 bg-green-950/30 p-4 text-sm text-green-100">
                    {message}
                </div>
            ) : null}

            {errorMessage ? (
                <div className="mt-4 rounded-xl border border-red-300/30 bg-red-950/30 p-4 text-sm text-red-100">
                    {errorMessage}
                </div>
            ) : null}
        </section>
    );
}