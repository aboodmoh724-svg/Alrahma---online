"use client";

import { useState } from "react";
import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import BrandLockup from "@/components/brand/BrandLockup";

const inputClass =
  "w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10";

const supportPhone = "963930181269";

export default function SyriaRegistrationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState("");
  const [formData, setFormData] = useState({
    studentName: "",
    age: "",
    grade: "",
    schoolName: "",
    parentWhatsapp: "",
    previousStudent: "لا",
    memorizedAmount: "",
    tajweedLevel: "",
    goals: "",
    notes: "",
    readGuidelines: "false",
  });

  const setField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setWarning("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));

      const response = await fetch("/api/syria/registration-requests", {
        method: "POST",
        body: payload,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || "تعذر إرسال طلب التسجيل");
        return;
      }

      setWarning(data.whatsappWarning || "");
      setSubmitted(true);
    } catch (error) {
      console.error("SYRIA REGISTRATION SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إرسال طلب التسجيل");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="rahma-shell flex min-h-screen items-center justify-center px-4 py-8" dir="rtl">
        <section className="max-w-xl rounded-[2.5rem] bg-[#0a3f2a] p-8 text-center text-white shadow-xl">
          <p className="text-5xl">✓</p>
          <h1 className="mt-5 text-3xl font-black">تم استلام طلب التسجيل</h1>
          <p className="mt-4 leading-8 text-white/75">
            ستراجع الإدارة بيانات الطالب ثم تتواصل معكم عبر رقم ولي الأمر.
          </p>
          {warning ? (
            <p className="mt-4 rounded-2xl bg-[#f2d18a]/15 p-4 text-sm leading-7 text-[#f2d18a]">
              {warning}
            </p>
          ) : null}
          <Link
            href="/syria"
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0a3f2a]"
          >
            العودة لصفحة سوريا
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="rahma-shell min-h-screen px-3 py-4 sm:px-4 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#0a3f2a] p-5 text-white shadow-xl sm:rounded-[2.5rem] sm:p-7">
          <BrandHeroMedia src="/images/syria-login-hero.png" opacity="opacity-20 blur-[1px]" />
          <div className="absolute inset-0 bg-[#0a3f2a]/34" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BrandLockup light showLegacy={false} />
              <Link
                href="/syria"
                className="rounded-full bg-white/16 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/24"
              >
                رجوع
              </Link>
            </div>
            <h1 className="mt-7 text-3xl font-black sm:text-5xl">تسجيل طالب - فرع سوريا</h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-white/76 sm:text-base">
              التسجيل الحالي خاص بالطلاب الذكور، والتعليم في فرع سوريا تعليم حضوري داخل الحلقة.
            </p>
          </div>
        </section>

        <form onSubmit={submit} className="space-y-4">
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-black text-[#8a661f]">المسجد</p>
              <p className="mt-2 text-lg font-black text-[#1c2d31]">مسجد بدر</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-black text-[#8a661f]">العنوان</p>
              <p className="mt-2 text-lg font-black text-[#1c2d31]">سوريا - حماة - طيبة الإمام</p>
            </div>
            <a
              href={`https://wa.me/${supportPhone}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.5rem] bg-[#0f5a35] p-4 text-white shadow-sm transition hover:bg-[#0a3f2a]"
            >
              <p className="text-sm font-black text-[#f2d18a]">الدعم والاستفسار</p>
              <p className="mt-2 text-lg font-black" dir="ltr">+963 930 181 269</p>
            </a>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[#0f5a35] p-4 text-white shadow-sm">
              <p className="text-sm font-black text-[#f2d18a]">نوع التسجيل</p>
              <p className="mt-2 text-lg font-black">خاص بالطلاب الذكور فقط</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#fffaf4] p-4 text-[#1c2d31] shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-black text-[#8a661f]">نوع التعليم</p>
              <p className="mt-2 text-lg font-black">تعليم حضوري في فرع سوريا</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">بيانات الطالب</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">الاسم الثلاثي *</span>
                <input value={formData.studentName} onChange={(e) => setField("studentName", e.target.value)} className={inputClass} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">العمر رقما</span>
                <input value={formData.age} onChange={(e) => setField("age", e.target.value)} className={inputClass} inputMode="numeric" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">الصف الدراسي</span>
                <input value={formData.grade} onChange={(e) => setField("grade", e.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">اسم المدرسة</span>
                <input value={formData.schoolName} onChange={(e) => setField("schoolName", e.target.value)} className={inputClass} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">رقم هاتف ولي الأمر واتساب *</span>
                <input value={formData.parentWhatsapp} onChange={(e) => setField("parentWhatsapp", e.target.value)} className={inputClass} required />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">المستوى والهدف</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">هل سبق الالتحاق بتحفيظ الرحمة؟</span>
                <select value={formData.previousStudent} onChange={(e) => setField("previousStudent", e.target.value)} className={inputClass}>
                  <option>لا</option>
                  <option>نعم</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">مستوى التجويد</span>
                <select value={formData.tajweedLevel} onChange={(e) => setField("tajweedLevel", e.target.value)} className={inputClass}>
                  <option value="">اختر المستوى</option>
                  <option>ممتاز</option>
                  <option>جيد جدا</option>
                  <option>جيد</option>
                  <option>ضعيف</option>
                  <option>مبتدئ</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">إلى أي جزء وصلت في حفظك؟</span>
                <textarea value={formData.memorizedAmount} onChange={(e) => setField("memorizedAmount", e.target.value)} className={inputClass} rows={3} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">الأهداف التي تود تحقيقها بالانضمام إلى التحفيظ</span>
                <textarea value={formData.goals} onChange={(e) => setField("goals", e.target.value)} className={inputClass} rows={3} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">ملاحظات تود ذكرها</span>
                <textarea value={formData.notes} onChange={(e) => setField("notes", e.target.value)} className={inputClass} rows={3} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <label className="flex items-center gap-3 rounded-2xl bg-[#f6eee7] p-4 text-sm font-black text-[#1c2d31]">
              <input
                type="checkbox"
                checked={formData.readGuidelines === "true"}
                onChange={(e) => setField("readGuidelines", e.target.checked ? "true" : "false")}
                required
              />
              أؤكد صحة البيانات، وأتعهد بالالتزام بتعليمات الحلقة.
            </label>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#0f5a35] px-5 py-4 text-base font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "جاري إرسال الطلب..." : "إرسال طلب التسجيل"}
          </button>
        </form>
      </div>
    </main>
  );
}
