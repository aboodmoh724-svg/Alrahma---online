"use client";

import { useState } from "react";
import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import BrandLockup from "@/components/brand/BrandLockup";

const inputClass =
  "w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-right text-sm text-[#1c2d31] outline-none transition placeholder:text-[#7b8a8d] focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10";

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
    previousStudent: "",
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
        <section className="max-w-xl rounded-[2rem] bg-[#0a3f2a] p-8 text-center text-white shadow-xl">
          <p className="text-5xl">✓</p>
          <h1 className="mt-5 text-3xl font-black">تم استلام طلب التسجيل</h1>
          <p className="mt-4 leading-8 text-white/75">
            ستراجع الإدارة بيانات الطالب، ثم تتواصل معكم عبر رقم ولي الأمر المسجل في الطلب.
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
      <div className="mx-auto max-w-5xl">
        <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#0a3f2a] p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-7">
          <BrandHeroMedia src="/images/syria-login-hero.png" opacity="opacity-20 blur-[1px]" />
          <div className="absolute inset-0 bg-[#0a3f2a]/40" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BrandLockup light showLegacy={false} />
              <Link
                href="/syria"
                className="rounded-full bg-white/16 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/24"
              >
                الرئيسية
              </Link>
            </div>
            <h1 className="mt-7 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              استبيان تسجيل الطلاب بتحفيظ الرحمة للقرآن الكريم
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-white/78 sm:text-base">
              التسجيل الحالي خاص بالطلاب الذكور، والتعليم حضوري في مسجد بدر. نرجو إدخال البيانات بدقة حتى تتم مراجعة الطلب والتواصل مع ولي الأمر.
            </p>
          </div>
        </section>

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white/95 p-4 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-black text-[#8a661f]">المكان</p>
            <p className="mt-2 text-lg font-black text-[#1c2d31]">مسجد بدر</p>
          </div>
          <div className="rounded-[1.5rem] bg-white/95 p-4 shadow-sm ring-1 ring-[#d8bf83]">
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
            <p className="mt-2 text-lg font-black" dir="ltr">
              +963 930 181 269
            </p>
          </a>
        </section>

        <form onSubmit={submit} className="space-y-4">
          <section className="rounded-[1.5rem] bg-white/95 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-black text-[#1c2d31]">بيانات الطالب</h2>
              <p className="mt-1 text-xs font-bold text-[#66777a]">جميع البيانات الأساسية مطلوبة لإتمام التسجيل.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">الاسم الثلاثي</span>
                <input
                  value={formData.studentName}
                  onChange={(e) => setField("studentName", e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">العمر رقما</span>
                <input
                  value={formData.age}
                  onChange={(e) => setField("age", e.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">الصف الدراسي</span>
                <input
                  value={formData.grade}
                  onChange={(e) => setField("grade", e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">اسم المدرسة</span>
                <input
                  value={formData.schoolName}
                  onChange={(e) => setField("schoolName", e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">رقم هاتف ولي الأمر واتساب</span>
                <input
                  value={formData.parentWhatsapp}
                  onChange={(e) => setField("parentWhatsapp", e.target.value)}
                  className={inputClass}
                  inputMode="tel"
                  placeholder="مثال: 0930181269"
                  required
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/95 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-black text-[#1c2d31]">المستوى والهدف</h2>
              <p className="mt-1 text-xs font-bold text-[#66777a]">هذه البيانات تساعد الإدارة على اختيار الحلقة المناسبة للطالب.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">هل سبق الالتحاق بتحفيظ الرحمة؟</span>
                <select
                  value={formData.previousStudent}
                  onChange={(e) => setField("previousStudent", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">اختر الإجابة</option>
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
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">ما الهدف الذي ترغب بتحقيقه في التحفيظ؟</span>
                <textarea value={formData.goals} onChange={(e) => setField("goals", e.target.value)} className={inputClass} rows={3} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#1c2d31]">ملاحظات إضافية</span>
                <textarea value={formData.notes} onChange={(e) => setField("notes", e.target.value)} className={inputClass} rows={3} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/95 p-4 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2rem] sm:p-5">
            <label className="flex items-start gap-3 rounded-2xl bg-[#f6eee7] p-4 text-sm font-black leading-7 text-[#1c2d31]">
              <input
                type="checkbox"
                checked={formData.readGuidelines === "true"}
                onChange={(e) => setField("readGuidelines", e.target.checked ? "true" : "false")}
                required
                className="mt-1"
              />
              <span>أؤكد صحة البيانات، وأتعهد بالالتزام بتعليمات الحلقة ومواعيدها.</span>
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
