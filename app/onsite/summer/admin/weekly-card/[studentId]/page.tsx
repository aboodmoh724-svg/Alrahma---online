import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSummerEducationTopics } from "@/lib/summer-education-plan";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";

type CardPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function SummerWeeklyCardPage({ params }: CardPageProps) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      circle: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
  });

  if (!student || student.studyMode !== "ONSITE_SUMMER") {
    notFound();
  }

  // Get last 7 days reports for this student
  const reports = await prisma.summerReport.findMany({
    where: { studentId: student.id },
    orderBy: { dateKey: "desc" },
    take: 7,
  });

  const topics = await getSummerEducationTopics();
  const studentCategory = student.summerGroup === "NOOR_AL_BAYAN" ? "SIGHAR" : "KIBAR";
  const filteredTopics = topics.filter((t) => t.category === studentCategory);
  const defaultTopic = filteredTopics[0] || topics[0];

  const presentReports = reports.filter((r) => r.status === "PRESENT");
  const attendanceRate = reports.length > 0 ? Math.round((presentReports.length / reports.length) * 100) : 100;
  
  const avgBehavior = presentReports.length > 0
    ? (presentReports.reduce((acc, r) => acc + (r.behaviorGrade || 5), 0) / presentReports.length).toFixed(1)
    : "5.0";

  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

  const C = {
    ink: "#0f5a35",
    inkDark: "#0a3f2a",
    gold: "#bd8f2d",
    cream: "#f6eee7",
    paper: "#fffaf4",
    line: "#d8bf83",
    mute: "#5a646e",
  };

  return (
    <div className="min-h-screen bg-[#f3f0e6] py-8 px-4 flex flex-col items-center" dir="rtl">
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=El+Messiri:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Control Navigation Header */}
      <div className="w-full max-w-[780px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/summer/admin"
          className="rounded-full px-5 py-2.5 text-sm font-black text-white shadow-sm"
          style={{ background: C.ink }}
        >
          🡪 العودة إلى لوحة التحكم الصيفية
        </Link>
        <PrintCardButton />
      </div>

      {/* Certificate Weekly Card */}
      <div
        className="w-full max-w-[780px] min-h-[1100px] relative overflow-hidden shadow-2xl p-[34px_46px_36px] flex flex-col justify-between print-card rounded-3xl"
        style={{
          background: C.paper,
          border: `2px solid ${C.line}`,
          boxSizing: "border-box",
        }}
      >
        <div className="relative flex flex-col flex-grow">
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <img
              src="/images/summer_quran_logo_v2.jpg"
              alt="شعار الدورة الصيفية"
              className="w-[78px] h-[78px] object-contain rounded-2xl border border-[#d8bf83]"
            />
            <div className="text-[20px] font-black tracking-wide text-center" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              تحفيظ الرحمة للقرآن الكريم ونور البيان
            </div>
            <span className="rounded-full bg-[#0f5a35]/10 px-4 py-1 text-xs font-black" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              بطاقة الأداء الأسبوعي المميز - الدورة الصيفية 🌟
            </span>
          </div>

          {/* Student Info */}
          <div className="text-center mt-4">
            <h1 className="text-[38px] font-bold leading-tight" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              {student.fullName}
            </h1>
            <div className="flex justify-center gap-4 mt-2 text-sm flex-wrap font-bold" style={{ color: C.mute, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              <span>المعلّم: <b style={{ color: C.ink }}>{student.teacher?.fullName || "غير محدد"}</b></span>
              <span>|</span>
              <span>الحلقة: <b style={{ color: C.ink }}>{student.circle?.name || "-"}</b></span>
              <span>|</span>
              <span>المسار: <b style={{ color: C.gold }}>{isNoor ? "نور البيان والتمهيدي" : "القرآن الكريم"}</b></span>
            </div>
          </div>

          {/* Performance Summary Bar */}
          <div className="grid grid-cols-3 gap-3 my-6 text-center">
            <div className="rounded-2xl p-4 border" style={{ background: C.cream, borderColor: C.line }}>
              <span className="text-xs font-bold block" style={{ color: C.mute }}>نسبة الحضور الأسبوعي</span>
              <span className="text-2xl font-black mt-1 block" style={{ color: C.ink }}>{attendanceRate}%</span>
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: C.cream, borderColor: C.line }}>
              <span className="text-xs font-bold block" style={{ color: C.mute }}>معدل السلوك والانضباط</span>
              <span className="text-2xl font-black mt-1 block" style={{ color: C.gold }}>{avgBehavior} / 5 ⭐</span>
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: C.cream, borderColor: C.line }}>
              <span className="text-xs font-bold block" style={{ color: C.mute }}>عدد الحصص المنجزة</span>
              <span className="text-2xl font-black mt-1 block" style={{ color: C.ink }}>{presentReports.length} حصة</span>
            </div>
          </div>

          {/* Achievement Summary Section */}
          <div className="rounded-2xl p-5 mb-5 text-white shadow-md" style={{ background: C.ink }}>
            <h3 className="text-base font-black mb-2" style={{ color: C.gold, fontFamily: '"El Messiri", serif' }}>
              {isNoor ? "📚 ملخص إنجاز نور البيان هذا الأسبوع" : "📖 ملخص إنجاز القرآن الكريم هذا الأسبوع"}
            </h3>
            {presentReports.length === 0 ? (
              <p className="text-sm font-bold text-white/80">لم يتم تسجيل حصص هذا الأسبوع بعد.</p>
            ) : (
              <div className="space-y-2 text-sm font-medium">
                {presentReports.map((r, idx) => (
                  <div key={r.id || idx} className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="font-mono text-white/60">{r.dateKey}</span>
                    <span className="font-bold text-white">
                      {isNoor
                        ? `الدرس: ${r.noorLearned || "-"} (الواجب: ${r.noorHomework ? "تم ✅" : "لم يتم ❌"})`
                        : `الحفظ: ${r.quranNew || "-"} | المراجعة: ${r.quranRevision || "-"}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Islamic Education Weekly Lesson Box */}
          <div className="rounded-2xl p-5 border border-dashed mb-6" style={{ borderColor: C.gold, background: "rgba(189,143,45,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🕌</span>
              <h3 className="text-base font-black" style={{ color: C.gold, fontFamily: '"El Messiri", serif' }}>
                خطة دروس التربية والإيمان (درس هذا الأسبوع)
              </h3>
            </div>
            <p className="text-base font-black" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              {defaultTopic ? defaultTopic.title : "دروس الأثر الأخلاقي والسيرة النبوية"}
            </p>
            <p className="text-sm leading-relaxed mt-1 font-semibold" style={{ color: C.mute }}>
              {defaultTopic ? defaultTopic.details : "تعزيز قيم التوحيد، طاعة الوالدين، والتخلق بأخلاق النبي محمد ﷺ."}
            </p>
          </div>

          {/* Closing Verse */}
          <div className="text-center rounded-2xl p-5 border" style={{ background: C.cream, borderColor: C.line }}>
            <div className="text-xl font-bold leading-normal mb-2" style={{ color: C.gold, fontFamily: '"Amiri", serif' }}>
              ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
            </div>
            <p className="text-sm font-bold" style={{ color: C.ink }}>
              بارك الله في جهود ابننا الطيب، وجعله قرة عين لوالديه ومن أهل القرآن وخاصته.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background-color: white !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-card { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
