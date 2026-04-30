"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const templates = [
  {
    key: "struggle",
    title: "متابعة تعثر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود إشعاركم بأن الطالب {{studentName}} يحتاج إلى متابعة إضافية في المراجعة والحفظ.\n\nنرجو تخصيص وقت يومي قصير لمتابعته، وسيبقى المشرف والمعلم قريبين من حالته بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "absence",
    title: "غياب متكرر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود التنبيه إلى تكرر غياب الطالب {{studentName}} عن الحلقة.\n\nنرجو الحرص على انتظامه في الموعد المحدد، فاستمرار الحضور يعين الطالب على الثبات والإنجاز.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "supervision",
    title: "تعميم إشرافي",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nتنبيه إشرافي من منصة الرحمة:\n{{message}}\n\nنسأل الله أن يبارك في أبنائنا ووقتكم.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "general",
    title: "رسالة عامة",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n{{message}}\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
];

function applyTemplate(template: string, values: { studentName: string; message: string }) {
  return template
    .replaceAll("{{studentName}}", values.studentName || "ابنكم")
    .replaceAll("{{message}}", values.message || "نرجو منكم متابعة الملاحظة المرسلة من الإشراف.");
}

export default function RemoteSupervisionMessagesPage() {
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0].key);
  const [message, setMessage] = useState(templates[0].body);
  const [sending, setSending] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey) || templates[0],
    [selectedTemplateKey]
  );

  const fillSelectedTemplate = (templateKey: string) => {
    const template = templates.find((item) => item.key === templateKey) || templates[0];
    setSelectedTemplateKey(template.key);
    setMessage(applyTemplate(template.body, { studentName, message: customMessage }));
  };

  const sendMessage = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message,
          channel: "REMOTE",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرسالة");
        return;
      }

      alert("تم إرسال الرسالة بنجاح");
    } catch (error) {
      console.error("SEND SUPERVISION MESSAGE ERROR =>", error);
      alert("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">رسائل أولياء الأمور</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              قوالب جاهزة تساعد المشرف على التواصل الهادئ والسريع مع ولي الأمر عند الحاجة.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <label className="block text-sm font-black text-[#1c2d31]">
              رقم ولي الأمر
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="مثال: 9665..."
                className="mt-2 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="block text-sm font-black text-[#1c2d31]">
              اسم الطالب
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="اسم الطالب"
                className="mt-2 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="block text-sm font-black text-[#1c2d31]">
              ملاحظة مختصرة
              <textarea
                value={customMessage}
                onChange={(event) => setCustomMessage(event.target.value)}
                rows={4}
                placeholder="تستخدم داخل قالب التعميم أو الرسالة العامة"
                className="mt-2 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => fillSelectedTemplate(template.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    selectedTemplate.key === template.key
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#e5d7bd]"
                  }`}
                >
                  {template.title}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm leading-7 outline-none"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => fillSelectedTemplate(selectedTemplate.key)}
                className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#173d42]"
              >
                تحديث القالب بالبيانات
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !phone.trim() || !message.trim()}
                className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {sending ? "جارٍ الإرسال..." : "إرسال واتساب"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
