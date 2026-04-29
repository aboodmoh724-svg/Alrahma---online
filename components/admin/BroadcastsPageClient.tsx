"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RecipientOption = {
  id: string;
  name: string;
  phone: string;
};

type BroadcastResult = {
  success: boolean;
  sentCount: number;
  failedCount: number;
  recipientsCount: number;
  failed: Array<{
    phone: string;
    recipientName: string;
    error: string;
  }>;
};

type RecipientType = "ALL_PARENTS" | "ALL_TEACHERS" | "SELECTED_PARENTS";

type BroadcastsPageClientProps = {
  scope: "REMOTE" | "ONSITE";
  sectionTitle: string;
  dashboardHref: string;
  parentOptions: RecipientOption[];
  teacherOptions: RecipientOption[];
};

const templateMessages = [
  {
    title: "تذكير عام",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنذكركم بمتابعة الرسائل اليومية والحرص على الانتظام في الحضور والالتزام بمتابعة الطالب أولاً بأول.\n\nجزاكم الله خيراً.",
  },
  {
    title: "إعلان إداري",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود إبلاغكم بوجود إعلان جديد، ونرجو متابعة الرسائل القادمة والالتزام بالتعليمات المطلوبة.\n\nمع الشكر والتقدير.",
  },
  {
    title: "دعوة للتعاون",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنأمل منكم مواصلة التعاون والمتابعة لما فيه مصلحة الطلاب ورفع مستواهم العلمي والتربوي.\n\nبارك الله فيكم.",
  },
];

export default function BroadcastsPageClient({
  scope,
  sectionTitle,
  dashboardHref,
  parentOptions,
  teacherOptions,
}: BroadcastsPageClientProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>("ALL_PARENTS");
  const [message, setMessage] = useState(templateMessages[0].body);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [search, setSearch] = useState("");
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  const filteredParents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return parentOptions;
    }

    return parentOptions.filter((parent) => {
      return (
        parent.name.toLowerCase().includes(keyword) ||
        parent.phone.toLowerCase().includes(keyword)
      );
    });
  }, [parentOptions, search]);

  const selectedCount = selectedParentIds.length;

  const toggleParent = (parentId: string) => {
    setSelectedParentIds((current) =>
      current.includes(parentId)
        ? current.filter((id) => id !== parentId)
        : [...current, parentId]
    );
  };

  const handleSelectFiltered = () => {
    const filteredIds = filteredParents.map((parent) => parent.id);
    setSelectedParentIds((current) => {
      const next = new Set(current);
      filteredIds.forEach((id) => next.add(id));
      return [...next];
    });
  };

  const handleClearSelected = () => {
    setSelectedParentIds([]);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert("اكتب نص الرسالة أولاً");
      return;
    }

    if (recipientType === "SELECTED_PARENTS" && selectedParentIds.length === 0) {
      alert("اختر ولي أمر واحدًا على الأقل");
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من إرسال هذه الرسالة الآن؟");
    if (!confirmed) {
      return;
    }

    try {
      setSending(true);
      setResult(null);

      const response = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          recipientType,
          message,
          selectedParentIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرسالة الجماعية");
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("WHATSAPP BROADCAST SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إرسال الرسالة الجماعية");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">قوالب الرسائل الجماعية</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">رسائل {sectionTitle}</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              اختر الفئة المستهدفة ثم أرسل الرسالة مرة واحدة مع ملخص مباشر بعدد الرسائل التي
              أُرسلت والتي تعذر إرسالها.
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="text-xl font-black text-[#1c2d31]">قوالب جاهزة</h2>
            <div className="mt-4 space-y-3">
              {templateMessages.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => setMessage(template.body)}
                  className="block w-full rounded-2xl bg-[#fffaf2] p-4 text-right transition hover:bg-white"
                >
                  <span className="block text-sm font-black text-[#1c2d31]">{template.title}</span>
                  <span className="mt-2 block text-xs leading-6 text-[#1c2d31]/60">
                    {template.body}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">الفئة المستهدفة</label>
                <select
                  value={recipientType}
                  onChange={(event) => setRecipientType(event.target.value as RecipientType)}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
                >
                  <option value="ALL_PARENTS">جميع أولياء الأمور</option>
                  <option value="ALL_TEACHERS">جميع المعلمين</option>
                  <option value="SELECTED_PARENTS">أولياء أمور محددون</option>
                </select>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/65">
                {recipientType === "ALL_PARENTS" && `سيتم الإرسال إلى ${parentOptions.length} من أولياء الأمور في هذا القسم.`}
                {recipientType === "ALL_TEACHERS" && `سيتم الإرسال إلى ${teacherOptions.length} من المعلمين في هذا القسم.`}
                {recipientType === "SELECTED_PARENTS" && `تم تحديد ${selectedCount} من أولياء الأمور حتى الآن.`}
              </div>
            </div>

            {recipientType === "SELECTED_PARENTS" ? (
              <div className="mt-4 rounded-[1.5rem] border border-[#d9c8ad] bg-[#fffaf2] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث باسم الطالب أو رقم ولي الأمر"
                    className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358] md:max-w-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSelectFiltered}
                      className="rounded-xl bg-[#1f6358] px-4 py-2 text-sm font-black text-white"
                    >
                      تحديد الظاهرين
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#1c2d31] ring-1 ring-[#d9c8ad]"
                    >
                      مسح التحديد
                    </button>
                  </div>
                </div>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {filteredParents.map((parent) => {
                    const checked = selectedParentIds.includes(parent.id);
                    return (
                      <label
                        key={parent.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-black text-[#1c2d31]">{parent.name}</p>
                          <p className="text-xs text-[#1c2d31]/55">{parent.phone}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParent(parent.id)}
                          className="h-5 w-5"
                        />
                      </label>
                    );
                  })}
                  {filteredParents.length === 0 ? (
                    <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-[#1c2d31]/55">
                      لا توجد نتائج مطابقة.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">نص الرسالة</label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={12}
                className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#1f6358]"
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="mt-4 rounded-2xl bg-[#1f6358] px-6 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
            >
              {sending ? "جارٍ إرسال الرسائل..." : "إرسال الرسالة الجماعية"}
            </button>

            {result ? (
              <div className="mt-4 space-y-3">
                <div
                  className={`rounded-2xl p-4 text-sm font-black ${
                    result.failedCount === 0
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  تم إرسال {result.sentCount} رسالة من أصل {result.recipientsCount}.
                  {result.failedCount > 0 ? ` وتعذر إرسال ${result.failedCount} رسالة.` : ""}
                </div>

                {result.failed.length > 0 ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-black">الحالات التي تعذر إرسالها:</p>
                    <div className="mt-3 space-y-2">
                      {result.failed.slice(0, 12).map((item) => (
                        <p key={`${item.phone}-${item.recipientName}`}>
                          {item.recipientName} - {item.phone} - {item.error}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
