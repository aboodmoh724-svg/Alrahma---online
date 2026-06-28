import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tajawal } from "next/font/google";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-tajawal",
});

type CardPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

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

  const getRatingBarWidth = (rating: string) => {
    if (rating === "ممتاز") return "w-full bg-[#0a3f2a]";
    if (rating === "جيد جداً" || rating === "جيد جدا" || rating === "جيد") return "w-3/4 bg-[#bd8f2d]";
    if (rating === "مقبول") return "w-1/2 bg-amber-500";
    return "w-1/3 bg-red-500";
  };

  return (
    <div className={`min-h-screen bg-[#f3f0e6] py-10 px-4 ${tajawal.variable} font-sans`} dir="rtl">
      {/* Control buttons for Admin */}
      <div className="mx-auto max-w-[900px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/admin/annual-reports"
          className="rounded-full bg-[#0a3f2a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f5a35] shadow-sm"
        >
          🡪 العودة إلى لوحة التقارير السنوية
        </Link>
        <PrintCardButton />
      </div>

      {/* The Certificate Card */}
      <div className="mx-auto max-w-[900px] bg-[#fbf9f4] border-[16px] border-[#e4dcbf] relative overflow-hidden shadow-2xl p-8 md:p-12 print-card rounded-2xl">
        {/* Inner double border for vintage style */}
        <div className="absolute inset-2 border border-[#d8bf83]/40 pointer-events-none rounded"></div>
        <div className="absolute inset-3 border border-[#d8bf83]/20 pointer-events-none rounded"></div>

        {/* Top Header Grid */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-[#d8bf83]/40 pb-6 mb-8">
          <div className="text-center md:text-right">
            <h2 className="text-[#0a3f2a] text-lg font-black tracking-wide">تحفيظ الرحمة للقرآن الكريم</h2>
            <p className="text-xs font-bold text-[#1c2d31]/60 mt-1">قسم الإشراف التعليمي - أفيون حضوري</p>
          </div>
          <div className="h-16 w-16 bg-[#0a3f2a] rounded-full flex items-center justify-center text-[#f2d18a] font-black text-xl shadow-md border-2 border-[#d8bf83]">
            رحمة
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-[#0a3f2a] text-lg font-black tracking-wide">التقرير السنوي الشامل</h2>
            <p className="text-xs font-bold text-[#1c2d31]/60 mt-1">العام الدراسي: {report.academicYear}</p>
          </div>
        </div>

        {/* Student name block */}
        <div className="text-center mb-10">
          <p className="text-[#bd8f2d] text-sm font-black tracking-widest uppercase">بطاقة أداء الطالب</p>
          <h1 className="text-[#0a3f2a] text-3xl md:text-5xl font-black mt-2 tracking-tight drop-shadow-sm">
            {studentName}
          </h1>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-bold text-[#1c2d31]/70">
            <span className="bg-[#e4dcbf]/30 px-3 py-1.5 rounded-full border border-[#d8bf83]/30">
              الحلقة: <strong className="text-[#0a3f2a]">{circleName}</strong>
            </span>
            <span className="bg-[#e4dcbf]/30 px-3 py-1.5 rounded-full border border-[#d8bf83]/30">
              المعلم: <strong className="text-[#0a3f2a]">{report.teacherName || "غير محدد"}</strong>
            </span>
            <span className="bg-[#e4dcbf]/30 px-3 py-1.5 rounded-full border border-[#d8bf83]/30">
              التقدير العام: <strong className="text-[#bd8f2d]">{report.finalRating || "ممتاز"}</strong>
            </span>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Strengths Column */}
          <div className="space-y-4">
            <h3 className="text-[#0a3f2a] text-lg font-black flex items-center gap-2 border-b border-[#d8bf83]/30 pb-2">
              <span className="text-[#bd8f2d]">✦</span> بم يتميز الطالب
            </h3>
            <div className="space-y-3">
              {strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 border border-[#e4dcbf] rounded-2xl p-4 shadow-sm flex items-start gap-3 hover:-translate-y-0.5 transition duration-200"
                >
                  <div className="h-6 w-6 rounded-full bg-[#0a3f2a]/10 flex items-center justify-center text-[#0a3f2a] text-xs font-black shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-[#1c2d31] leading-7">{str}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior / Ratings Column */}
          <div className="space-y-4">
            <h3 className="text-[#0a3f2a] text-lg font-black flex items-center gap-2 border-b border-[#d8bf83]/30 pb-2">
              <span className="text-[#bd8f2d]">✦</span> السلوك والتفاعل
            </h3>
            <div className="space-y-5 bg-white/60 border border-[#e4dcbf]/50 rounded-2xl p-5 shadow-sm">
              {/* commitment */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-[#1c2d31]">
                  <span>الالتزام داخل الحلقة</span>
                  <span className="text-[#0a3f2a]">{behavior.commitment}</span>
                </div>
                <div className="h-2 w-full bg-[#e4dcbf]/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getRatingBarWidth(behavior.commitment)}`}></div>
                </div>
              </div>

              {/* manners */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-[#1c2d31]">
                  <span>الأدب وحسن السلوك</span>
                  <span className="text-[#0a3f2a]">{behavior.manners}</span>
                </div>
                <div className="h-2 w-full bg-[#e4dcbf]/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getRatingBarWidth(behavior.manners)}`}></div>
                </div>
              </div>

              {/* interaction */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-[#1c2d31]">
                  <span>التفاعل والمشاركة</span>
                  <span className="text-[#0a3f2a]">{behavior.interaction}</span>
                </div>
                <div className="h-2 w-full bg-[#e4dcbf]/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getRatingBarWidth(behavior.interaction)}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Step Box */}
        <div className="bg-[#fffaf4] border border-[#d8bf83] rounded-2xl p-5 mb-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#bd8f2d]"></div>
          <h3 className="text-[#0a3f2a] text-sm font-black tracking-wide flex items-center gap-2">
            🚀 التوصية والخطوة القادمة:
          </h3>
          <p className="mt-2 text-sm font-bold text-[#1c2d31]/80 leading-7">
            {report.studentNeeds || "الاستمرار على هذا التميز ومتابعة الحفظ اليومي بانتظام ومذاكرة الآيات بجدية."}
          </p>
        </div>

        {/* Parent Message Box */}
        <div className="bg-[#0a3f2a] border border-[#0f5a35] text-white rounded-2xl p-6 mb-8 shadow-md">
          <h3 className="text-[#f2d18a] text-sm font-black flex items-center gap-2">
            ✉️ رسالة إلى أهل الطالب:
          </h3>
          <p className="mt-2 text-sm font-bold leading-8 opacity-90">
            {report.parentMessage || "نشكر لكم ثقتكم الغالية بمشروع الرحمة القرآني، وندعوكم لاستمرار المتابعة والتوجيه المنزلي، جعله الله قرة عين لكم وبارك فيه."}
          </p>
        </div>

        {/* Footer / Verse quote */}
        <div className="text-center border-t-2 border-[#d8bf83]/40 pt-6 mt-8">
          <p className="text-sm italic font-medium text-[#bd8f2d] leading-8">
            « هَنِيئًا مَرِيئًا لِوَالِدَيْكِ عَلَيْهِمَا .. مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالحُلِيّ »
          </p>
          <p className="text-xs font-bold text-[#1c2d31]/40 mt-3 leading-7">
            بارك الله في جهد ابننا الطيب، ونفع به، وجعله من حملة كتاب الله العاملين به.
          </p>
        </div>
      </div>
    </div>
  );
}
