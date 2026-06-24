"use client";

import { useState } from "react";
import Link from "next/link";

type TemplateItem = {
  key: string;
  title: string;
  description: string;
  body: string;
};

const SYRIA_TEMPLATES: TemplateItem[] = [
  {
    key: "SYRIA_DAILY_REPORT",
    title: "قالب تقرير سوريا اليومي (الموحد)",
    description: "التقرير اليومي المرسل لأولياء أمور طلاب سوريا عند رصد الدروس والمراجعة والواجب والتقييم.",
    body:
      `السلام عليكم ورحمة الله وبركاته\n\n` +
      `تقرير الطالب اليومي\n\n` +
      `*الطالب:* [اسم الطالب]\n` +
      `*الحلقة:* [اسم الحلقة]\n` +
      `*المعلم:* [اسم المعلم]\n` +
      `*التاريخ:* [التاريخ]\n\n` +
      `*الدرس:* [الدرس الجديد]\n` +
      `*المراجعة:* [المراجعة]\n` +
      `*الواجب:* \n` +
      `- الدرس الجديد: [واجب الدرس الجديد]\n` +
      `- المراجعة: [واجب المراجعة]\n\n` +
      `*نتيجة التقييم:*\n` +
      `- *الدرس الجديد:* *حافظ*\n` +
      `- *المراجعة:* *حافظ*\n\n` +
      `*الملاحظات:* [الملاحظات]\n\n` +
      `جزاكم الله خيرًا على المتابعة والحرص.\n\n` +
      `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`,
  },
  {
    key: "SYRIA_ABSENCE",
    title: "قالب غياب سوريا (الموحد)",
    description: "الرسالة التلقائية المرسلة لأولياء أمور طلاب سوريا عند تسجيل غياب الطالب بدون عذر.",
    body:
      `السلام عليكم ورحمة الله وبركاته\n\n` +
      `نفيدكم أن ابنكم الكريم / *[اسم الطالب]*\n` +
      `غائب عن التحفيظ اليوم بتاريخ [التاريخ] بدون عذر.\n\n` +
      `nرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\n` +
      `نشكر لكم حسن تعاونكم.\n\n` +
      `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`,
  },
];

export default function SyriaAdminMessagesPage() {
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sendTestMessage = async (templateKey: string) => {
    try {
      setSendingKey(templateKey);
      setFeedback(null);

      const res = await fetch("/api/admin/send-test-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`تم إرسال رسالة تجريبية بنجاح إلى الأرقام التجريبية`);
        setFeedback(`تم الإرسال بنجاح للأرقام التجريبية`);
      } else {
        alert(`فشل الإرسال: ${data.error || "خطأ غير معروف"}`);
        setFeedback(`فشل إرسال التجربة: ${data.error || "خطأ غير معروف"}`);
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء محاولة الإرسال التجريبي");
      setFeedback("حدث خطأ في النظام أثناء محاولة الإرسال.");
    } finally {
      setSendingKey(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              قوالب الرسائل وتجربتها (قسم سوريا)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              معاينة القوالب الرسمية الموحدة المعتمدة في قسم سوريا وتجربة إرسالها على رقمك الخاص.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/syria/admin/dashboard"
              className="rounded-2xl bg-[#0a3f2a] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#0f5a35]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </div>

        {feedback && (
          <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#8a661f] ring-1 ring-[#d8bf83]">
            {feedback}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {SYRIA_TEMPLATES.map((template) => (
            <section
              key={template.key}
              className="flex flex-col rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]"
            >
              <div className="mb-4">
                <h2 className="text-xl font-black text-[#1c2d31]">{template.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#1c2d31]/55">
                  {template.description}
                </p>
              </div>

              <div className="flex-1">
                <textarea
                  value={template.body}
                  readOnly
                  rows={16}
                  className="w-full rounded-2xl border border-[#d8bf83] bg-gray-50/50 p-4 font-mono text-sm leading-7 text-[#1c2d31] outline-none cursor-default resize-none"
                />
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => void sendTestMessage(template.key)}
                  disabled={sendingKey === template.key}
                  className="w-full rounded-2xl border border-[#0f5a35]/25 bg-white px-5 py-3 text-sm font-black text-[#0f5a35] transition hover:bg-[#edf6ee] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingKey === template.key ? "جاري الإرسال للتجريب..." : "إرسال تجربة للرقم (+963930181269) 📲"}
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
