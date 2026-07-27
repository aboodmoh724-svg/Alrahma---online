"use client";

import { useState, useEffect } from "react";

type AdminCircleModalProps = {
  isOpen: boolean;
  teachers: Array<{ id: string; fullName: string }>;
  circleToEdit?: any | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminCircleModal({
  isOpen,
  teachers,
  circleToEdit,
  onClose,
  onSuccess,
}: AdminCircleModalProps) {
  const isEditing = Boolean(circleToEdit);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (circleToEdit) {
      setName(circleToEdit.name || "");
      setTeacherId(circleToEdit.teacherId || circleToEdit.teacher?.id || "");
    } else {
      setName("");
      setTeacherId(teachers[0]?.id || "");
    }
  }, [circleToEdit, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("اسم الحلقة مطلوب");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/summer/admin/circles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: circleToEdit?.id,
          name: name.trim(),
          teacherId: teacherId || null,
          studyMode: "ONSITE_SUMMER",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء إنشاء الحلقة");

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
            <span className="text-xl">{isEditing ? "✏️" : "🕌"}</span>
            <h3 className="text-lg font-bold font-serif text-[#fbf6ef]">
              {isEditing ? "تعديل الحلقة" : "إنشاء حلقة جديدة"}
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
            <label className="block mb-1 font-serif">اسم الحلقة *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حلقة الإيمان، حلقة الفجر"
              required
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0c5c5e]"
            />
          </div>

          <div>
            <label className="block mb-1 font-serif">المعلم المسؤول عن الحلقة (اختياري)</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
            >
              <option value="">-- بدون معلم محدد --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  أستاذ: {t.fullName}
                </option>
              ))}
            </select>
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
              {loading ? "جاري الحفظ... ⏳" : isEditing ? "حفظ التعديلات 💾" : "إنشاء الحلقة ➕"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
