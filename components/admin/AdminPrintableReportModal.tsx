"use client";

import { useEffect, useState } from "react";

type AdminPrintableReportModalProps = {
  isOpen: boolean;
  studentId: string | null;
  studentName?: string;
  onClose: () => void;
};

export default function AdminPrintableReportModal({
  isOpen,
  studentId,
  studentName,
  onClose,
}: AdminPrintableReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/summer/teacher/students/${studentId}/history`)
      .then((res) => {
        if (!res.ok) throw new Error("تعذر جلب التقرير التفصيلي للطالب");
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "حدث خطأ في الاتصال");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  if (!isOpen || !studentId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 dir-rtl"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border-2 border-[#bd8f2d] shadow-2xl overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Header Bar - Hidden in print */}
        <div className="bg-[#0c5c5e] px-6 py-4 text-white border-b-4 border-[#bd8f2d] flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#fbf6ef]">
                التقرير الشامل والتفصيلي للطالب (جاهز للطباعة)
              </h3>
              <p className="text-xs text-cyan-100 font-semibold">{studentName || data?.student?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-xl bg-[#bd8f2d] hover:bg-[#a6781d] px-4 py-1.5 text-xs font-bold text-[#0c5c5e] transition font-serif shadow-sm"
            >
              🖨️ طباعة التقرير الفورية
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#0c5c5e] border-t-transparent" />
              <p className="text-sm font-bold text-[#0c5c5e] font-serif">
                جاري إعداد التقرير التفصيلي... ⏳
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center text-xs font-bold text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-6 print:space-y-4">
              {/* Official Institutional Header for Print */}
              <div className="border-b-2 border-[#0c5c5e] pb-4 flex items-center justify-between text-[#0c5c5e]">
                <div>
                  <h1 className="text-xl font-bold font-ruqaa text-[#bd8f2d]">
                    إدارة الدورة الصيفية لتعليم القرآن الكريم
                  </h1>
                  <h2 className="text-sm font-bold font-serif">
                    التقرير التراكمي الشامل لأداء الطالب
                  </h2>
                </div>
                <div className="text-left text-xs font-mono font-bold text-gray-600">
                  تاريخ التصدير: {new Date().toISOString().split("T")[0]}
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-[#fcfaf5] p-4 border border-[#bd8f2d]/40 text-xs font-bold text-[#0c5c5e]">
                <div>
                  <span className="text-gray-500 block mb-0.5 font-serif">اسم الطالب:</span>
                  <span className="text-base text-gray-900 font-serif">{data?.student?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 font-serif">مسار الدراسة:</span>
                  <span>{data?.student?.summerGroup === "NOOR_AL_BAYAN" ? "📘 نور البيان" : "📖 قرآن كريم"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 font-serif">الحلقة:</span>
                  <span>{data?.student?.circleName || "عامة"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5 font-serif">إجمالي الحضور:</span>
                  <span className="text-emerald-700 font-mono font-bold text-sm">{data?.stats?.presentCount} أيام</span>
                </div>
              </div>

              {/* Reports History Table */}
              <div>
                <h3 className="text-sm font-bold text-[#0c5c5e] font-serif mb-3">
                  📋 السجل التفصيلي اليومي للتسميع والدروس:
                </h3>
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0c5c5e] text-white font-serif">
                      <th className="p-2.5 border border-gray-300">التاريخ</th>
                      <th className="p-2.5 border border-gray-300">الحالة</th>
                      <th className="p-2.5 border border-gray-300">الحفظ / الدرس</th>
                      <th className="p-2.5 border border-gray-300">المراجعة والتلقين</th>
                      <th className="p-2.5 border border-gray-300">التقييم والسلوك</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.reports?.map((r: any, idx: number) => (
                      <tr
                        key={r.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
                      >
                        <td className="p-2.5 border border-gray-200 font-mono font-bold text-[#0c5c5e]">
                          {r.dateKey}
                        </td>
                        <td className="p-2.5 border border-gray-200 font-bold">
                          {r.status === "PRESENT" ? (
                            <span className="text-emerald-700">حاضر ✅</span>
                          ) : (
                            <span className="text-red-600">غائب ❌</span>
                          )}
                        </td>
                        <td className="p-2.5 border border-gray-200">
                          {r.quranNew || r.noorLearned || "—"}
                        </td>
                        <td className="p-2.5 border border-gray-200">
                          {r.quranRevision && <div>🔄 م: {r.quranRevision}</div>}
                          {r.quranTaqeen && <div>🗣️ ت: {r.quranTaqeen}</div>}
                          {!r.quranRevision && !r.quranTaqeen && "—"}
                        </td>
                        <td className="p-2.5 border border-gray-200">
                          {r.noorHomeworkGrade !== null && r.noorHomeworkGrade !== undefined && (
                            <div>الواجب: {r.noorHomeworkGrade}/5</div>
                          )}
                          {r.behaviorGrade && <div>السلوك: {"⭐".repeat(r.behaviorGrade)}</div>}
                          {r.behaviorNotes && <div className="italic text-gray-500">{r.behaviorNotes}</div>}
                          {!r.noorHomeworkGrade && !r.behaviorGrade && !r.behaviorNotes && "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
