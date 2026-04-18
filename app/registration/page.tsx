"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-2.5 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10 sm:py-3";

const periods = [
  "الفترة الصباحية 9:00 - 12:00",
  "الفترة المسائية الأولى 11:00 - 2:00",
  "الفترة المسائية الثانية 2:00 - 5:00",
  "الفترة المسائية الثالثة 3:00 - 6:00",
  "الفترة المسائية الرابعة 7:00 - 10:00",
];

const tracks = [
  { value: "HIJAA", label: "مسار الهجاء" },
  { value: "TILAWA", label: "مسار التلاوة" },
  { value: "RUBAI", label: "المسار الرباعي" },
  { value: "FARDI", label: "المسار الفردي" },
];

const previousBooks = [
  "نور البيان",
  "فتح الرحمن في تعليم كلمات القرآن",
  "الجزء الرشيدي",
  "القاعدة النورانية",
];

const levelOptions = ["ممتاز", "جيد جدا", "جيد", "متوسط", "ضعيف", "مبتدئ"];

const livingWithOptions = ["والديه", "والده فقط", "والدته فقط", "أقاربه", "غير ذلك"];

const educationLevels = ["ابتدائي", "متوسط", "ثانوي", "جامعي فأعلى", "غير ذلك"];

const trackFiles = [
  { href: "/uploads/track-resources/students-parents-guidelines.pdf", label: "التعليمات والتوجيهات للطلاب وأولياء الأمور" },
];

export default function RegistrationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    studentName: "",
    previousStudent: "false",
    birthDate: "",
    grade: "",
    nationality: "",
    country: "",
    fatherAlive: "true",
    motherAlive: "true",
    livingWith: "",
    fatherEducation: "",
    motherEducation: "",
    preferredPeriod: "",
    parentWhatsapp: "",
    parentEmail: "",
    memorizedAmount: "",
    readingLevel: "",
    tajweedLevel: "",
    hasLearningIssues: "false",
    learningIssuesNote: "",
    hasDevice: "false",
    readGuidelines: "false",
    notes: "",
  });

  const setField = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTrack = (track: string) => {
    setSelectedTracks((prev) =>
      prev.includes(track)
        ? prev.filter((item) => item !== track)
        : [...prev, track]
    );
  };

  const toggleBook = (book: string) => {
    setSelectedBooks((prev) =>
      prev.includes(book)
        ? prev.filter((item) => item !== book)
        : [...prev, book]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const payload = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        payload.append(key, value);
      }

      for (const track of selectedTracks) {
        payload.append("requestedTracks", track);
      }

      for (const book of selectedBooks) {
        payload.append("previousStudy", book);
      }

      if (audioFile) {
        payload.append("audio", audioFile);
      }

      if (idImageFile) {
        payload.append("idImage", idImageFile);
      }

      const response = await fetch("/api/registration-requests", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال طلب التسجيل");
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error("REGISTRATION SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إرسال طلب التسجيل");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="rahma-shell flex min-h-screen items-center justify-center px-4 py-8" dir="rtl">
        <section className="max-w-xl rounded-[2.5rem] bg-[#173d42] p-8 text-center text-white shadow-xl">
          <p className="text-5xl">✓</p>
          <h1 className="mt-5 text-3xl font-black">شكرا لكم</h1>
          <p className="mt-4 leading-8 text-white/75">
            تم إرسال طلب التسجيل بنجاح. ستراجع الإدارة البيانات ثم تتواصل معكم عبر رقم ولي الأمر.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="rahma-shell min-h-screen px-3 py-4 sm:px-4 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <section className="mb-4 rounded-[1.75rem] bg-[#173d42] p-5 text-white shadow-xl sm:mb-6 sm:rounded-[2.5rem] sm:p-7">
          <p className="text-sm font-bold text-[#f1d39d]">منصة الرحمة لتعليم القرآن الكريم</p>
          <h1 className="mt-2 text-3xl font-black sm:mt-3 sm:text-4xl">استمارة تسجيل الطالب</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:mt-4 sm:leading-8">
            فضلا أدخل بيانات الطالب وولي الأمر بدقة، وستراجع الإدارة الطلب قبل اعتماد الطالب في إحدى الحلقات.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d9c8ad] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-3 text-lg font-black text-[#1c2d31] sm:mb-4 sm:text-xl">بيانات الطالب</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">اسم الطالب كاملا *</label>
                <input value={formData.studentName} onChange={(e) => setField("studentName", e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل سبق للطالب التسجيل بتحفيظ الرحمة حضوريًا؟</label>
                <select value={formData.previousStudent} onChange={(e) => setField("previousStudent", e.target.value)} className={inputClass}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">تاريخ الميلاد</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setField("birthDate", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">الصف الدراسي</label>
                <input value={formData.grade} onChange={(e) => setField("grade", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل الأب على قيد الحياة؟</label>
                <select value={formData.fatherAlive} onChange={(e) => setField("fatherAlive", e.target.value)} className={inputClass}>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل الأم على قيد الحياة؟</label>
                <select value={formData.motherAlive} onChange={(e) => setField("motherAlive", e.target.value)} className={inputClass}>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">صورة الإقامة أو هوية الطالب</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-dashed border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">
                الصيغ المسموحة: صورة أو PDF، والحجم لا يتجاوز 10MB.
              </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">فئة التسجيل</label>
                <div className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-black text-[#1c2d31]">
                  التسجيل متاح للطلاب الذكور فقط
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">بلد الإقامة</label>
                <input value={formData.country} onChange={(e) => setField("country", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">جنسية الطالب</label>
                <input value={formData.nationality} onChange={(e) => setField("nationality", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">مع من يسكن الطالب؟</label>
                <select value={formData.livingWith} onChange={(e) => setField("livingWith", e.target.value)} className={inputClass}>
                  <option value="">اختر</option>
                  {livingWithOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">مستوى تعليم الأب</label>
                <select value={formData.fatherEducation} onChange={(e) => setField("fatherEducation", e.target.value)} className={inputClass}>
                  <option value="">اختر المستوى</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">مستوى تعليم الأم</label>
                <select value={formData.motherEducation} onChange={(e) => setField("motherEducation", e.target.value)} className={inputClass}>
                  <option value="">اختر المستوى</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d9c8ad] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-3 text-lg font-black text-[#1c2d31] sm:mb-4 sm:text-xl">بيانات ولي الأمر والفترة</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">رقم هاتف ولي الأمر *</label>
                <input value={formData.parentWhatsapp} onChange={(e) => setField("parentWhatsapp", e.target.value)} placeholder="+90..." className={inputClass} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">الإيميل الخاص بولي الأمر</label>
                <input type="email" value={formData.parentEmail} onChange={(e) => setField("parentEmail", e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">حدد الفترة المرغوبة</label>
              <select value={formData.preferredPeriod} onChange={(e) => setField("preferredPeriod", e.target.value)} className={inputClass}>
                <option value="">اختر الفترة</option>
                {periods.map((period) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d9c8ad] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-3 text-lg font-black text-[#1c2d31] sm:mb-4 sm:text-xl">التعليمات والتوجيهات</h2>
            <p className="mb-4 text-sm leading-7 text-[#1c2d31]/60">
              فضلا اقرأ ملف التعليمات والتوجيهات جيدا قبل إرسال طلب التسجيل، فهو يحتوي على ما يحتاجه الطالب وولي الأمر.
            </p>
            <div className="grid gap-3">
              {trackFiles.map((file) => (
                <a
                  key={file.href}
                  href={file.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31] transition hover:bg-white"
                >
                  {file.label}
                </a>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f7f0e6] p-4 text-sm font-black text-[#1c2d31]">
              <input
                type="checkbox"
                checked={formData.readGuidelines === "true"}
                onChange={(e) => setField("readGuidelines", e.target.checked ? "true" : "false")}
                required
              />
              لقد قرأت التعليمات والتوجيهات بشكل جيد
            </label>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d9c8ad] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-3 text-lg font-black text-[#1c2d31] sm:mb-4 sm:text-xl">مستوى الطالب والمسار</h2>
            <div>
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل سبق للطالب دراسة أحد هذه الكتب؟</label>
              <div className="grid gap-3 md:grid-cols-2">
                {previousBooks.map((book) => (
                  <label key={book} className="flex items-center gap-2 rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31]">
                    <input type="checkbox" checked={selectedBooks.includes(book)} onChange={() => toggleBook(book)} />
                    {book}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">كم يحفظ الطالب من القرآن؟</label>
                <textarea value={formData.memorizedAmount} onChange={(e) => setField("memorizedAmount", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">كيف تقيم مستوى القراءة؟</label>
                <select value={formData.readingLevel} onChange={(e) => setField("readingLevel", e.target.value)} className={inputClass}>
                  <option value="">اختر المستوى</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">كيف تقيم مستوى التجويد؟</label>
                <select value={formData.tajweedLevel} onChange={(e) => setField("tajweedLevel", e.target.value)} className={inputClass}>
                  <option value="">اختر المستوى</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="mt-6 text-base font-black text-[#1c2d31]">المسارات المرغوبة</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {tracks.map((track) => (
                <label key={track.value} className="flex items-center gap-2 rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31]">
                  <input type="checkbox" checked={selectedTracks.includes(track.value)} onChange={() => toggleTrack(track.value)} />
                  {track.label}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white/92 p-4 shadow-sm ring-1 ring-[#d9c8ad] sm:rounded-[2rem] sm:p-5">
            <h2 className="mb-3 text-lg font-black text-[#1c2d31] sm:mb-4 sm:text-xl">التسجيل الصوتي والملاحظات</h2>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                تسجيل الطالب بصوته لآية الكرسي *
              </label>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-dashed border-[#d9c8ad] bg-[#fffaf2] px-4 py-5 text-sm"
                required
              />
              <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">
                يمكن رفع تسجيل صوتي أو فيديو قصير للطالب وهو يقرأ آية الكرسي، والحجم لا يتجاوز 20MB.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل يعاني الطالب من أي مشاكل في التعلم أو النطق؟</label>
                <select value={formData.hasLearningIssues} onChange={(e) => setField("hasLearningIssues", e.target.value)} className={inputClass}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">هل توفر للطالب إنترنت وجهاز وكاميرا؟</label>
                <select value={formData.hasDevice} onChange={(e) => setField("hasDevice", e.target.value)} className={inputClass}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                ملاحظات تودون إيصالها للإدارة
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={4}
                className={inputClass}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#1f6358] px-5 py-4 text-base font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "جاري إرسال الطلب..." : "إرسال طلب التسجيل"}
          </button>
        </form>
      </div>
    </main>
  );
}
