"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MemoryStatus = "ALL" | "PENDING" | "APPROVED" | "NEEDS_EDIT" | "IGNORED";

type ReplyMemoryItem = {
  id: string;
  incomingMessageId: string;
  outgoingMessageId: string;
  question: string;
  answer: string;
  editedAnswer: string;
  category: string;
  status: Exclude<MemoryStatus, "ALL">;
  notes: string;
  contactName: string;
  incomingCreatedAt: string;
  outgoingCreatedAt: string;
  persisted: boolean;
};

const statusTabs: Array<{ key: MemoryStatus; label: string }> = [
  { key: "ALL", label: "الكل" },
  { key: "PENDING", label: "بانتظار المراجعة" },
  { key: "APPROVED", label: "معتمد" },
  { key: "NEEDS_EDIT", label: "يحتاج تعديل" },
  { key: "IGNORED", label: "متجاهل" },
];

const statusLabels: Record<ReplyMemoryItem["status"], string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "معتمد كنموذج",
  NEEDS_EDIT: "يحتاج تعديل",
  IGNORED: "متجاهل",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function RemoteAdminReplyMemoryPage() {
  const [items, setItems] = useState<ReplyMemoryItem[]>([]);
  const [status, setStatus] = useState<MemoryStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { editedAnswer: string; notes: string }>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const counters = useMemo(
    () =>
      items.reduce<Record<string, number>>(
        (acc, item) => {
          acc.ALL += 1;
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { ALL: 0, PENDING: 0, APPROVED: 0, NEEDS_EDIT: 0, IGNORED: 0 }
      ),
    [items]
  );

  const loadItems = async (selectedStatus = status) => {
    try {
      setLoading(true);
      setFeedback(null);

      const response = await fetch(`/api/admin/reply-memory?status=${selectedStatus}&limit=120`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل ذاكرة الردود");
      }

      const loadedItems = Array.isArray(data.items) ? data.items : [];
      setItems(loadedItems);
      setDrafts(
        Object.fromEntries(
          loadedItems.map((item: ReplyMemoryItem) => [
            item.id,
            {
              editedAnswer: item.editedAnswer || item.answer,
              notes: item.notes || "",
            },
          ])
        )
      );
    } catch (error) {
      setItems([]);
      setFeedback(error instanceof Error ? error.message : "تعذر تحميل ذاكرة الردود");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const updateDraft = (itemId: string, field: "editedAnswer" | "notes", value: string) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        editedAnswer: current[itemId]?.editedAnswer || "",
        notes: current[itemId]?.notes || "",
        [field]: value,
      },
    }));
  };

  const saveStatus = async (item: ReplyMemoryItem, nextStatus: ReplyMemoryItem["status"]) => {
    try {
      setSavingId(item.id);
      setFeedback(null);

      const draft = drafts[item.id] || { editedAnswer: item.answer, notes: "" };
      const response = await fetch("/api/admin/reply-memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomingMessageId: item.incomingMessageId,
          outgoingMessageId: item.outgoingMessageId,
          status: nextStatus,
          editedAnswer: draft.editedAnswer,
          notes: draft.notes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حفظ حالة الرد");
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: nextStatus,
                editedAnswer: draft.editedAnswer,
                notes: draft.notes,
                persisted: true,
              }
            : entry
        )
      );
      setFeedback(`تم تحديث الرد إلى: ${statusLabels[nextStatus]}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذر حفظ حالة الرد");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8a661f]">إدارة الرسائل</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">ذاكرة الردود</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1c2d31]/60">
              راجع الردود البشرية السابقة واعتمد النماذج المناسبة ليتم استخدامها لاحقا في تدريب مساعد الردود الذكي.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/remote/admin/messages"
              className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
            >
              قوالب الرسائل
            </Link>
            <Link
              href="/remote/admin/dashboard"
              className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-center text-sm font-black text-white"
            >
              لوحة الإدارة
            </Link>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  status === tab.key
                    ? "bg-[#0f5a35] text-white"
                    : "bg-[#fffaf4] text-[#1c2d31] ring-1 ring-[#e7d7b4]"
                }`}
              >
                {tab.label}
                <span className="ms-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {counters[tab.key] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-[#f4fbf8] px-4 py-3 text-sm leading-7 text-[#1c2d31]/70 ring-1 ring-[#cfe3d9]">
            الاعتماد هنا لا يرسل أي رد تلقائي ولا يغير الرسائل الأصلية. هو فقط يجهز مادة نظيفة للذكاء الاصطناعي مستقبلًا.
          </div>
        </section>

        {feedback ? (
          <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#1c2d31] ring-1 ring-[#d8bf83]">
            {feedback}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-[#d8bf83] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل ذاكرة الردود...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d8bf83] bg-white/70 p-8 text-center text-sm leading-7 text-[#1c2d31]/60">
            لا توجد ردود بشرية مباشرة في هذه الحالة بعد. ستبدأ القائمة بالظهور عندما يرد المشرف على رسائل واتساب من صفحة المتابعة.
          </div>
        ) : (
          <section className="grid gap-4">
            {items.map((item) => {
              const draft = drafts[item.id] || { editedAnswer: item.answer, notes: "" };
              const busy = savingId === item.id;

              return (
                <article key={item.id} className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                        <span className="rounded-full bg-[#f4fbf8] px-3 py-1 text-[#0f5a35] ring-1 ring-[#cfe3d9]">
                          {statusLabels[item.status]}
                        </span>
                        <span className="rounded-full bg-[#fffaf4] px-3 py-1 text-[#8a661f] ring-1 ring-[#e7d7b4]">
                          {item.category || "GENERAL"}
                        </span>
                        {item.contactName ? (
                          <span className="rounded-full bg-white px-3 py-1 text-[#1c2d31] ring-1 ring-[#d8bf83]">
                            {item.contactName}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs font-bold text-[#1c2d31]/50">
                        السؤال: {formatDate(item.incomingCreatedAt)} - الرد: {formatDate(item.outgoingCreatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveStatus(item, "APPROVED")}
                        className="rounded-xl bg-[#0f5a35] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        اعتماد كنموذج
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveStatus(item, "NEEDS_EDIT")}
                        className="rounded-xl bg-[#fffaf4] px-4 py-3 text-sm font-black text-[#8a661f] ring-1 ring-[#d8bf83] disabled:opacity-60"
                      >
                        يحتاج تعديل
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveStatus(item, "IGNORED")}
                        className="rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-200 disabled:opacity-60"
                      >
                        تجاهل
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                      <p className="text-sm font-black text-[#8a661f]">سؤال ولي الأمر</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[#1c2d31]">{item.question}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-[#f4fbf8] p-4 ring-1 ring-[#cfe3d9]">
                      <p className="text-sm font-black text-[#0f5a35]">الرد البشري الأصلي</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[#1c2d31]">{item.answer}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                    <label className="block text-sm font-black text-[#1c2d31]">
                      النص المعتمد للتدريب
                      <textarea
                        value={draft.editedAnswer}
                        onChange={(event) => updateDraft(item.id, "editedAnswer", event.target.value)}
                        rows={6}
                        className="mt-2 w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#0f5a35]"
                      />
                    </label>
                    <label className="block text-sm font-black text-[#1c2d31]">
                      ملاحظة للمراجعة
                      <textarea
                        value={draft.notes}
                        onChange={(event) => updateDraft(item.id, "notes", event.target.value)}
                        rows={6}
                        placeholder="مثلا: رد جيد، لكن يحتاج اختصار أو إضافة رابط التسجيل."
                        className="mt-2 w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#0f5a35]"
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
