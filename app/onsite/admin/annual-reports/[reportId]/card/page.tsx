import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tajawal } from "next/font/google";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

type CardPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

// Parser for the 6 cards in learnedDuringYear
function parseLearnedCards(learnedStr: string | null) {
  if (!learnedStr) return [];
  const items = learnedStr.split(/[،,]/).map(s => s.trim()).filter(Boolean);
  return items.map(item => {
    let title = item;
    let subtitle = "";
    if (item.includes(":")) {
      const parts = item.split(":");
      title = parts[0].trim();
      subtitle = parts[1].trim();
    } else if (item.includes("：")) {
      const parts = item.split("：");
      title = parts[0].trim();
      subtitle = parts[1].trim();
    }
    
    // Select icon
    let icon = "📖";
    if (title.includes("حديث") || title.includes("الحديث") || title.includes("حفظ")) {
      icon = "“";
    } else if (title.includes("مراقبة") || title.includes("المراقبة") || title.includes("قيمة")) {
      icon = "👁️";
    } else if (title.includes("أدب") || title.includes("الأدب") || title.includes("الآداب") || title.includes("سلوك")) {
      icon = "❤️";
    }
    return { title, subtitle, icon };
  });
}

function parseBehavior(behaviorStr: string | null) {
  const result = { commitment: "ممتاز", manners: "ممتاز", interaction: "ممتاز" };
  if (!behaviorStr) return result;

  const parts = behaviorStr.split(/[،,]/);
  parts.forEach((p) => {
    const clean = p.trim();
    if (clean.includes("الالتزام")) {
      result.commitment = clean.split(":")[1]?.trim() || "ممتاز";
    } else if (clean.includes("الأدب") || clean.includes("السلوك")) {
      result.manners = clean.split(":")[1]?.trim() || "ممتاز";
    } else if (clean.includes("التفاعل") || clean.includes("المشاركة")) {
      result.interaction = clean.split(":")[1]?.trim() || "ممتاز";
    }
  });
  return result;
}

export default async function AnnualReportCardPage({ params }: CardPageProps) {
  const { reportId } = await params;

  const report = await prisma.annualReport.findUnique({
    where: { id: reportId },
    include: {
      student: {
        select: {
          fullName: true,
          circle: { select: { name: true } },
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const studentName = report.student?.fullName || report.studentName;
  const circleName = report.student?.circle?.name || report.halaqaType || "حلقة قرآن";
  const strengths = report.studentStrengths
    ? report.studentStrengths.split(/[،,]/).map((s) => s.trim()).filter(Boolean)
    : ["إقبال على الحفظ", "حضور وتفاعل طيّب", "حسن الخلق والتعاون"];

  const behavior = parseBehavior(report.behaviorNotes);
  const learnedCards = parseLearnedCards(report.learnedDuringYear);

  // Helper to render behavior segments
  const renderSegments = (rating: string) => {
    let activeCount = 4; // default "ممتاز"
    if (rating.includes("جيد جدا")) activeCount = 3;
    else if (rating.includes("جيد")) activeCount = 2;
    else if (rating.includes("مقبول")) activeCount = 1;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-10 rounded-full ${
              i <= activeCount ? "bg-[#142e2b]" : "bg-[#142e2b]/15"
            }`}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#f3f0e6] py-10 px-4 ${tajawal.variable} font-sans`} dir="rtl">
      {/* Control buttons for Admin */}
      <div className="mx-auto max-w-[850px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/admin/annual-reports"
          className="rounded-full bg-[#142e2b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a3d39] shadow-sm"
        >
          🡪 العودة إلى لوحة التقارير السنوية
        </Link>
        <PrintCardButton />
      </div>

      {/* The Certificate Card */}
      <div className="mx-auto w-full max-w-[850px] bg-[#fbf9f4] border-[16px] border-[#e4dcbf] relative overflow-hidden shadow-2xl p-6 md:p-10 print-card rounded-xl">
        {/* Inner double gold line border */}
        <div className="absolute inset-1.5 border border-[#c5a96b]/35 pointer-events-none rounded"></div>
        <div className="absolute inset-2.5 border-2 border-[#c5a96b]/15 pointer-events-none rounded"></div>

        {/* Top Header Logo & Text */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="h-14 w-14 bg-[#142e2b] rounded-full flex items-center justify-center text-[#c5a96b] font-black text-lg border border-[#c5a96b]/40 shadow-sm mb-2">
            رحمة
          </div>
          <h2 className="text-[#142e2b] text-base font-black tracking-wide">تحفيظ الرحمة للقرآن الكريم</h2>
          <p className="text-[10px] font-bold text-[#142e2b]/60 flex items-center gap-1 mt-0.5">
            <span>✦</span> التقرير السنوي للطالب <span>✦</span>
          </p>
        </div>

        {/* Student Name Block */}
        <div className="text-center mb-4">
          <h1 className="text-[#142e2b] text-3xl md:text-4xl font-extrabold tracking-tight">
            {studentName}
          </h1>
          <div className="mt-2 flex justify-center gap-3 text-[11px] font-bold text-[#142e2b]/70">
            <span>المعلم: <strong className="text-[#142e2b]">{report.teacherName || "غير محدد"}</strong></span>
            <span>|</span>
            <span>الحلقة: <strong className="text-[#142e2b]">{circleName}</strong></span>
            <span>|</span>
            <span>العام: <strong className="text-[#142e2b]">{report.academicYear}</strong></span>
          </div>
        </div>

        {/* Medal rating in Center */}
        <div className="flex justify-center mb-6">
          <div className="relative flex flex-col items-center bg-[#142e2b] text-[#c5a96b] px-6 py-2.5 rounded-2xl border-2 border-[#c5a96b] shadow-md min-w-[140px] text-center">
            {/* Medal hanger */}
            <div className="absolute -top-1.5 h-1.5 w-6 bg-[#c5a96b] rounded-t"></div>
            <span className="text-[10px] font-bold text-[#c5a96b]/80">التقدير النهائي</span>
            <span className="text-base font-black tracking-wide mt-0.5 text-white">
              {report.finalRating || "ممتاز"}
            </span>
          </div>
        </div>

        {/* Evaluations Grid (First and Second Evaluation) */}
        <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto mb-6">
          <div className="bg-white border border-[#e4dcbf] rounded-xl p-3 text-center shadow-sm">
            <span className="text-[28px] font-black text-[#142e2b]">{report.firstEvaluation || "-"}</span>
            <p className="text-[10px] font-bold text-[#142e2b]/50 mt-0.5">التقييم الأول</p>
          </div>
          <div className="bg-white border border-[#e4dcbf] rounded-xl p-3 text-center shadow-sm">
            <span className="text-[28px] font-black text-[#142e2b]">{report.secondEvaluation || "-"}</span>
            <p className="text-[10px] font-bold text-[#142e2b]/50 mt-0.5">التقييم الثاني</p>
          </div>
        </div>

        {/* Memorized Section (ما حفظه الطالب خلال العام) */}
        <div className="bg-[#142e2b] text-white rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#c5a96b]/20 rounded-lg flex items-center justify-center text-[#c5a96b]">
              📖
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#c5a96b] tracking-wider block uppercase">ما حفظه الطالب خلال العام</span>
              <p className="text-xs font-bold mt-0.5 leading-6 text-white/95">
                {report.memorizedDuringYear || "لا يوجد سجل للحفظ"}
              </p>
            </div>
          </div>
        </div>

        {/* Learned Section (ما تعلّمه خلال العام) */}
        {learnedCards.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3 text-xs font-black text-[#142e2b]/60">
              <span className="h-px w-8 bg-[#c5a96b]/40"></span>
              <span>ما تعلّمه خلال العام</span>
              <span className="h-px w-8 bg-[#c5a96b]/40"></span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {learnedCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#e4dcbf] rounded-xl p-3 shadow-xs flex flex-col justify-center items-center text-center min-h-[90px]"
                >
                  <span className="text-base text-[#142e2b]/80 mb-1">{card.icon}</span>
                  <span className="text-[11px] font-black text-[#142e2b] leading-5">{card.title}</span>
                  {card.subtitle && (
                    <span className="text-[9px] font-bold text-[#142e2b]/50 mt-0.5 leading-4">
                      {card.subtitle}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Section (Strengths and Behavior) */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths Column */}
          <div className="space-y-3">
            <h3 className="text-[#142e2b] text-[13px] font-black flex items-center gap-1.5 border-b border-[#e4dcbf] pb-1.5">
              <span className="text-[#c5a96b]">✦</span> بم يتميز الطالب
            </h3>
            <div className="space-y-2">
              {strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#e4dcbf] rounded-xl p-3 shadow-xs flex items-center justify-between gap-3"
                >
                  <p className="text-[11px] font-bold text-[#142e2b] leading-6">{str}</p>
                  <span className="text-xs text-[#c5a96b]">✦</span>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior / Segment Ratings Column */}
          <div className="space-y-3">
            <h3 className="text-[#142e2b] text-[13px] font-black flex items-center gap-1.5 border-b border-[#e4dcbf] pb-1.5">
              <span className="text-[#c5a96b]">✦</span> السلوك والتفاعل
            </h3>
            <div className="space-y-4 bg-white border border-[#e4dcbf] rounded-xl p-4 shadow-xs">
              {/* commitment */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-[#142e2b]">الالتزام داخل الحلقة</span>
                {renderSegments(behavior.commitment)}
              </div>

              {/* manners */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-[#142e2b]">الأدب وحسن السلوك</span>
                {renderSegments(behavior.manners)}
              </div>

              {/* interaction */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-[#142e2b]">التفاعل والمشاركة</span>
                {renderSegments(behavior.interaction)}
              </div>
            </div>
          </div>
        </div>

        {/* Next Step Box */}
        <div className="border border-dashed border-[#c5a96b] bg-[#fffbf4]/30 rounded-xl p-4 mb-4 relative shadow-xs">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[9px] font-bold text-[#c5a96b] tracking-wider block uppercase">الخطوة القادمة</span>
              <p className="text-[11px] font-bold text-[#142e2b]/85 mt-1 leading-6">
                {report.studentNeeds || "الاستمرار في المتابعة المنزلية والمواظبة على الحضور وتثبيت المحفوظ القديم."}
              </p>
            </div>
            <div className="h-6 w-6 rounded-full bg-[#142e2b] flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
              ↗
            </div>
          </div>
        </div>

        {/* Parent Message Box */}
        <div className="bg-[#142e2b] text-white rounded-xl p-5 mb-6 shadow-sm">
          <span className="text-[9px] font-bold text-[#c5a96b] tracking-wider block uppercase">رسالة إلى أهل الطالب</span>
          <p className="text-[11px] font-bold mt-1.5 leading-6 opacity-90">
            {report.parentMessage || "نشكر لكم حرصكم ومتابعتكم المستمرة لابننا الطيب، ونسأل الله أن يجعله قرة عين لكم ومن أهل القرآن وخاصته."}
          </p>
          <div className="flex justify-end text-[9px] font-bold text-[#c5a96b] mt-3">
            <span>✎ قسم الإشراف التعليمي</span>
          </div>
        </div>

        {/* Footer / Verse quote */}
        <div className="text-center border-t border-[#e4dcbf] pt-4 mt-6">
          <p className="text-xs italic font-medium text-[#c5a96b] leading-7">
            هَنِيئًا مَرِيئًا وَالِدَاكَ عَلَيْهِمَا ❁ مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالْحُلِيِّ
          </p>
          <p className="text-[10px] font-bold text-[#142e2b]/40 mt-1 leading-5">
            ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
          </p>
          <p className="text-[9px] font-bold text-[#142e2b]/30 mt-2">
            بارك الله في جهد ابننا الطيب، ونفع به، وجعله من حملة كتاب الله العاملين به.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 6px double #c5a96b !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
