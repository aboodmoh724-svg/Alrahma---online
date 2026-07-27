"use client";

import { useState } from "react";

type AdminTransferStudentModalProps = {
  isOpen: boolean;
  student: {
    id: string;
    fullName: string;
    circleName?: string;
    teacherName?: string;
    circleId?: string | null;
    teacherId: string;
  } | null;
  circles: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; fullName: string }>;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminTransferStudentModal({
  isOpen,
  student,
  circles,
  teachers,
  onClose,
  onSuccess,
}: AdminTransferStudentModalProps) {
  const [targetTeacherId, setTargetTeacherId] = useState(student?.teacherId || "");
  const [targetCircleId, setTargetCircleId] = useState(student?.circleId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/summer/admin/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          id: student.id,
          fullName: student.fullName,
          teacherId: targetTeacherId || student.teacherId,
          circleId: targetCircleId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء نقل الطالب");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاتصال");
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
        className="relative w-full max-w-lg rounded-3xl bg-[#faf8f4] border-2 border-[#bd8f2d] shadow-2xl overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c5c5e] via-[#117073] to-[#0c5c5e] px-6 py-4 text-white border-b-4 border-[#bd8f2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔁</span>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#fbf6ef]">
                نقل وتوزيع الطالب
              </h3>
              <p className="text-xs text-cyan-100 font-semibold">{student.fullName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Transfer Form Body */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4 text-xs font-bold text-[#0c5c5e]">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {/* Current Assignment Badge */}
          <div className="rounded-2xl border border-[#bd8f2d]/40 bg-[#fffdf9] p-3.5 space-y-1">
            <span className="text-[11px] font-black text-[#bd8f2d]">📌 التخصيص الحالي للطالب:</span>
            <div className="flex flex-wrap gap-3 text-gray-700 font-semibold text-xs pt-0.5">
              <span>المعلم الحالي: <b>{student.teacherName || "غير محدد"}</b></span>
              <span>الحلقة الحالية: <b>{student.circleName || "بدون حلقة"}</b></span>
            </div>
          </div>

          {/* New Teacher Selection */}
          <div>
            <label className="block mb-1 font-serif">اختيار المعلم الجديد *</label>
            <select
              value={targetTeacherId || student.teacherId}
              onChange={(e) => setTargetTeacherId(e.target.value)}
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  أستاذ: {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* New Circle Selection */}
          <div>
            <label className="block mb-1 font-serif">اختيار الحلقة الجديدة *</label>
            <select
              value={targetCircleId || student.circleId || ""}
              onChange={(e) => setTargetCircleId(e.target.value)}
              className="w-full rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none"
            >
              <option value="">-- بدون حلقة محددة --</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  حلقة: {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Footer */}
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
              {loading ? "جاري النقل... ⏳" : "تأكيد نقل وتوزيع الطالب 🔁"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
