"use client";

import { useState } from "react";

type AdminTeacherModalProps = {
  isOpen: boolean;
  teacherToEdit?: {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminTeacherModal({
  isOpen,
  teacherToEdit,
  onClose,
  onSuccess,
}: AdminTeacherModalProps) {
  const isEditing = Boolean(teacherToEdit);
  const [fullName, setFullName] = useState(teacherToEdit?.fullName || "");
  const [email, setEmail] = useState(teacherToEdit?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("اسم المعلم مطلوب");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/summer/admin/teachers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: teacherToEdit?.id,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          password: password || undefined,
          role: "TEACHER",
          studyMode: "ONSITE_SUMMER",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء حفظ بيانات المعلم");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 dir-rtl"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#faf6ef] border-2 border-[#bd8f2d] shadow-2xl overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c5c5e] via-[#117073] to-[#0c5c5e] px-6 py-4 text-white border-b-4 border-[#bd8f2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isEditing ? "✏️" : "🎓"}</span>
            <h3 className="text-lg font-bold font-serif text-[#fbf6ef]">
              {isEditing ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-[#0c5c5e]">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-1 font-serif">اسم المعلم الكامل *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: الأستاذ محمد علي"
              required
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0c5c5e]"
            />
          </div>

          <div>
            <label className="block mb-1 font-serif">اسم المستخدم / البريد الإلكتروني (لتسجيل الدخول)</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="مثال: teacher1"
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 font-serif">
              {isEditing ? "كلمة المرور الجديدة (أتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required={!isEditing}
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#bd8f2d]/30">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0c5c5e] px-5 py-2 text-xs font-bold text-white hover:bg-[#084547] shadow-sm font-serif"
            >
              {loading ? "جاري الحفظ... ⏳" : isEditing ? "حفظ التعديلات 💾" : "إضافة المعلم ➕"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
