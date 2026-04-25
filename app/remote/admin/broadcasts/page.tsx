"use client";

import { useState } from "react";
import Link from "next/link";

type BroadcastResult = {
  success: boolean;
  sentCount: number;
  failedCount: number;
  recipientsCount: number;
  failed: Array<{
    phone: string;
    studentName: string;
    error: string;
  }>;
};

const templateMessages = [
  {
    title: "دعوة للمشاركة",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nيسرنا دعوتكم لمشاركة منشورات منصة الرحمة عبر وسائل التواصل الاجتماعي، دعمًا لنشر الخير والدلالة على القرآن الكريم.\n\nجزاكم الله خيرًا وبارك فيكم.",
  },
  {
    title: "تذكير عام",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنذكركم بمتابعة رسائل المنصة بشكل يومي، والحرص على حضور الطالب في وقته المحدد، ومراجعة الواجب اليومي أولًا بأول.\n\nشكرًا لتعاونكم.",
  },
  {
    title: "إعلان إداري",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود إبلاغكم بوجود إعلان جديد من إدارة منصة الرحمة. نرجو متابعة الرسائل القادمة والتقيد بالتعليمات المطلوبة.\n\nمع الشكر والتقدير.",
  },
];

export default function RemoteAdminBroadcastsPage() {
  const [target, setTarget] = useState<"ALL" | "REMOTE" | "ONSITE">("ALL");
  const [message, setMessage] = useState(templateMessages[0].body);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      alert("اكتب نص الرسالة أولًا");
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد من إرسال هذه الرسالة الجماعية إلى أولياء الأمور في الفئة المحددة؟"
    );

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
          target,
          message,
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
            <p className="text-sm font-black text-[#9b7039]">التواصل الجماعي</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">رسائل أولياء الأمور</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              اختر الفئة المستهدفة، ثم اكتب الرسالة التي تريد إرسالها دفعة واحدة لأولياء الأمور.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
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
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  الفئة المستهدفة
                </label>
                <select
                  value={target}
                  onChange={(event) =>
                    setTarget(event.target.value as "ALL" | "REMOTE" | "ONSITE")
                  }
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
                >
                  <option value="ALL">جميع أولياء الأمور</option>
                  <option value="REMOTE">أولياء أمور الأونلاين فقط</option>
                  <option value="ONSITE">أولياء أمور الحضوري فقط</option>
                </select>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/65">
                سيتم الإرسال إلى الأرقام الصالحة فقط، مع حذف التكرار تلقائيًا إذا كان هناك إخوة بنفس الرقم.
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                نص الرسالة
              </label>
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
                  تم الإرسال إلى {result.sentCount} من أصل {result.recipientsCount} رقم.
                  {result.failedCount > 0 ? ` وتعذر الإرسال إلى ${result.failedCount} رقم.` : ""}
                </div>

                {result.failed.length > 0 ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-black">الأرقام التي تعذر الإرسال إليها:</p>
                    <div className="mt-3 space-y-2">
                      {result.failed.slice(0, 10).map((item) => (
                        <p key={`${item.phone}-${item.studentName}`}>
                          {item.studentName} - {item.phone} - {item.error}
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
