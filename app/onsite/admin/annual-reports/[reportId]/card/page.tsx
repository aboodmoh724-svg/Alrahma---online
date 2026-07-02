import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";

type CardPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

// ── Line icons (simple, single-stroke) from original Canva bundle ──
const ICON_PATHS: Record<string, string> = {
  book: '<path d="M12 7v13"/><path d="M3 5.6C5 5.1 9 5 12 7c3-2 7-1.9 9-1.4V19c-2-.5-6-.6-9 1.4-3-2-7-1.9-9-1.4z"/>',
  kaaba: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"/><path d="M4 7.2l8 4.2 8-4.2M12 11.4V21"/>',
  eye: '<path d="M2 12s3.5-6.6 10-6.6S22 12 22 12s-3.5 6.6-10 6.6S2 12 2 12z"/><circle cx="12" cy="12" r="2.4"/>',
  heart: '<path d="M12 20s-6.6-4.2-9.1-8.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9.1 4.7C18.6 15.8 12 20 12 20z"/>',
  mosque: '<path d="M4 21h16M5.5 21v-7m13 7v-7"/><path d="M6 14a6 6 0 0 1 12 0"/><path d="M12 8V5.2m0 0a1.4 1.4 0 1 0 0-.1z"/>',
  spark: '<path d="M12 3l1.9 6.4L20 11l-6.1 1.6L12 19l-1.9-6.4L4 11l6.1-1.6z"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
  check: '<circle cx="12" cy="12" r="8.4"/><path d="M8.4 12.3l2.4 2.3 4.7-4.9"/>',
  medal: '<circle cx="12" cy="14.5" r="5.4"/><path d="M8.8 9.8 6.2 3.4M15.2 9.8 17.8 3.4"/><path d="m12 11.9 1 2 2.1.2-1.6 1.5.5 2.1L12 17.5l-2 1.2.5-2.1-1.6-1.5 2.1-.2z"/>',
  quote: '<path d="M10 7.5C7.5 7.5 6 9.3 6 11.5S7.5 15 9.6 15c0 2.3-1.6 3.4-3.4 3.9M20 7.5c-2.5 0-4 1.8-4 4s1.5 3.5 3.6 3.5c0 2.3-1.6 3.4-3.4 3.9"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0"/><path d="M16 5.4a3 3 0 0 1 0 5.7M20.4 19a5.4 5.4 0 0 0-3.9-5.2"/>',
  arrow: '<path d="M7 17 17 7M9.2 7H17v7.8"/>',
  pen: '<path d="m4 20 4-1 9.6-9.6a2 2 0 0 0-2.8-2.8L5 16.2 4 20z"/><path d="M14.5 6.6 17.4 9.5"/>',
  star: '<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.9 6.9 19.6l1-5.7-4.1-4 5.7-.8z"/>',
};

function Icon({ name, size = 24, stroke = 1.6, color = 'currentColor', style }: { name: string; size?: number; stroke?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  );
}

// ── Subtle 8-point khatam star, as faint background motif (data URI) ──
function khatamBg(hex: string, opacity = 0.07) {
  const col = encodeURIComponent(hex);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${col}' stroke-width='1' opacity='${opacity}'><rect x='20' y='20' width='24' height='24'/><rect x='20' y='20' width='24' height='24' transform='rotate(45 32 32)'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Parser for the 6 cards in learnedDuringYear
function parseLearnedCards(learnedStr: string | null) {
  if (!learnedStr) return [];
  const items = learnedStr.split(/[،,]/).map(s => s.trim()).filter(Boolean);
  return items.map(item => {
    let label = item;
    let note = "";
    if (item.includes(":")) {
      const parts = item.split(":");
      label = parts[0].trim();
      note = parts[1].trim();
    } else if (item.includes("：")) {
      const parts = item.split("：");
      label = parts[0].trim();
      note = parts[1].trim();
    }
    
    // Select icon
    let icon = "book";
    if (label.includes("أركان") || label.includes("الإسلام")) {
      icon = "kaaba";
    } else if (label.includes("حديث") || label.includes("الحديث") || label.includes("حفظ")) {
      icon = "quote";
    } else if (label.includes("مراقبة") || label.includes("المراقبة") || label.includes("قيمة")) {
      icon = "eye";
    } else if (label.includes("أدب") || label.includes("الأدب") || label.includes("الآداب") || label.includes("سلوك")) {
      icon = "heart";
    } else if (label.includes("صلاة") || label.includes("الصلاة")) {
      icon = "mosque";
    }
    return { label, note, icon };
  });
}

function parseStrengths(strengthsStr: string | null) {
  if (!strengthsStr) return [];
  const items = strengthsStr.split(/[،,]/).map(s => s.trim()).filter(Boolean);
  return items.map((item, idx) => {
    let icon = "spark";
    if (item.includes("حفظ") || item.includes("الحفظ")) icon = "book";
    else if (item.includes("تلاوة") || item.includes("ترتيل") || item.includes("صوت")) icon = "star";
    else if (item.includes("تركيز") || item.includes("انتباه")) icon = "target";
    else if (item.includes("التزام") || item.includes("أدب")) icon = "check";
    
    // Fallbacks to match style
    if (idx === 1 && icon === "spark") icon = "target";
    if (idx === 2 && icon === "spark") icon = "star";
    
    return [icon, item];
  });
}

function parseLevels(behaviorStr: string | null) {
  const result = [
    { label: "الالتزام داخل الحلقة", level: 4, cap: "ممتاز" },
    { label: "الأدب وحُسن السلوك", level: 4, cap: "ممتاز" },
    { label: "التفاعل والمشاركة", level: 4, cap: "ممتاز" },
  ];
  if (!behaviorStr) return result;

  const parts = behaviorStr.split(/[،,]/);
  parts.forEach((p) => {
    const clean = p.trim();
    let label = "";
    let cap = "ممتاز";
    let level = 4;

    if (clean.includes("الالتزام")) {
      label = "الالتزام داخل الحلقة";
      cap = clean.split(":")[1]?.trim() || "ممتاز";
    } else if (clean.includes("الأدب") || clean.includes("السلوك")) {
      label = "الأدب وحُسن السلوك";
      cap = clean.split(":")[1]?.trim() || "ممتاز";
    } else if (clean.includes("التفاعل") || clean.includes("المشاركة")) {
      label = "التفاعل والمشاركة";
      cap = clean.split(":")[1]?.trim() || "ممتاز";
    }

    if (label) {
      if (cap.includes("ممتاز")) level = 4;
      else if (cap.includes("جيد جدا") || cap.includes("جيّد جدّاً")) level = 3;
      else if (cap.includes("جيد") || cap.includes("جيّد") || cap.includes("جيِّد")) level = 2;
      else if (cap.includes("مقبول")) level = 1;
      
      const idx = result.findIndex(r => r.label === label);
      if (idx !== -1) {
        result[idx] = { label, level, cap };
      }
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

  // Exact color definitions from Canva source code
  const C = {
    ink: '#1f3139',
    inkSoft: '#33474e',
    gold: '#a8895a',
    goldHi: '#c7af90',
    cream: '#f6f2e9',
    paper: '#fffefb',
    line: '#e6ddca',
    mute: '#5a646e',
  };

  const studentName = report.student?.fullName || report.studentName;
  const first = studentName.trim().split(/\s+/)[0];
  const circleName = report.student?.circle?.name || report.halaqaType || "حلقة قرآن";
  
  const strengths = parseStrengths(report.studentStrengths);
  const levels = parseLevels(report.behaviorNotes);
  const learned = parseLearnedCards(report.learnedDuringYear);

  const num = (v: any) => /^\d+$/.test(('' + v).trim()) && ('' + v).trim() !== '0';
  const a1 = report.firstEvaluation;
  const a2 = report.secondEvaluation;
  const improved = num(a1) && num(a2) && (+a2! > +a1!) ? (`+${+a2! - +a1!} تحسُّناً`) : '';

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 justify-center mb-3.5">
      <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span className="text-sm font-bold tracking-widest uppercase white-space-nowrap" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {children}
      </span>
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
    </div>
  );

  const Stat = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
    <div className="flex-1 text-center py-1.5 px-1">
      {num(value) ? (
        <div className="text-[46px] font-bold tracking-tight leading-none" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif', fontVariantNumeric: 'lining-nums' }}>
          {('' + value).trim()}
        </div>
      ) : (
        <div className="text-lg font-bold py-3 text-center" style={{ color: C.inkSoft }}>
          {('' + value).trim() && ('' + value).trim() !== '0' ? ('' + value).trim() : '—'}
        </div>
      )}
      <div className="text-sm mt-2 font-medium" style={{ color: C.mute, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {label}
      </div>
      {sub && (
        <div className="text-[12.5px] font-bold mt-1" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
          {sub}
        </div>
      )}
    </div>
  );

  const SubHead = ({ children, icon }: { children: React.ReactNode; icon: string }) => (
    <div className="flex items-center gap-2 pb-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
      <Icon name={icon} size={17} color={C.gold} stroke={1.7} className="shrink-0" />
      <span className="text-base font-bold white-space-nowrap" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {children}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f0e6] py-10 px-4 flex flex-col items-center">
      {/* Google fonts stylesheet link */}
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=El+Messiri:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Control buttons for Admin */}
      <div className="w-full max-w-[780px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/admin/annual-reports"
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition shadow-sm"
          style={{ background: C.ink }}
        >
          🡪 العودة إلى لوحة التقارير السنوية
        </Link>
        <PrintCardButton />
      </div>

      {/* The Certificate Card */}
      <div
        className="w-full max-w-[780px] min-h-[1432px] relative overflow-hidden shadow-2xl p-[34px_46px_36px] flex flex-col justify-between print-card rounded-2xl"
        style={{
          background: C.cream,
          backgroundImage: khatamBg(C.gold, 0.07),
          backgroundSize: '58px 58px',
          boxSizing: 'border-box'
        }}
        dir="rtl"
      >
        {/* Double borders with opacity from original Canva React component */}
        <div className="absolute inset-4 pointer-events-none rounded" style={{ border: `1px solid ${C.gold}`, opacity: 0.45 }} />
        <div className="absolute inset-[21px] pointer-events-none rounded" style={{ border: `1px solid ${C.gold}`, opacity: 0.22 }} />

        {/* Content wrapper */}
        <div className="relative flex flex-col flex-grow">
          {/* Logo Lockup */}
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <img src="/logo.png" alt="شعار تحفيظ الرحمة" className="w-[58px] h-[58px] object-contain" />
            <div className="text-[19px] font-semibold tracking-wide" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              تحفيظ الرحمة للقرآن الكريم
            </div>
          </div>

          {/* Hero header */}
          <div className="text-center mt-3.5">
            <Eyebrow>التقرير السنوي للطالب</Eyebrow>
            <h1 className="text-[44px] font-bold leading-[1.05]" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              {studentName}
            </h1>
            <div className="flex justify-center gap-[18px] mt-3.5 text-sm flex-wrap" style={{ color: C.inkSoft, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              <span><span style={{ color: C.mute }}>المعلّم: </span><b className="font-bold">{report.teacherName || "غير محدد"}</b></span>
              <span style={{ color: C.line }}>|</span>
              <span><span style={{ color: C.mute }}>الحلقة: </span><b className="font-bold">{circleName}</b></span>
              <span style={{ color: C.line }}>|</span>
              <span><span style={{ color: C.mute }}>العام: </span><b className="font-bold">2025 – 2026</b></span>
            </div>
          </div>

          {/* Ribbon Medal */}
          <div className="flex justify-center mt-4 mb-1 relative">
            {/* Hanger ribbon tails */}
            <div className="absolute top-16 flex gap-6 z-0">
              <span className="w-4 h-10 transform -rotate-6" style={{ background: C.gold, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
              <span className="w-4 h-10 transform rotate-6" style={{ background: C.goldHi, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
            </div>
            {/* Medal circle with conic gradient */}
            <div
              className="relative z-10 w-[100px] h-[100px] rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: `conic-gradient(${C.goldHi}, ${C.gold}, ${C.goldHi}, ${C.gold}, ${C.goldHi})`,
                boxShadow: '0 6px 18px rgba(168,137,90,.4)'
              }}
            >
              <div
                className="w-[84px] h-[84px] rounded-full flex flex-col items-center justify-center gap-0.5"
                style={{ background: C.ink, border: `2px solid ${C.goldHi}` }}
              >
                <Icon name="star" size={15} color={C.goldHi} stroke={1.4} />
                <span
                  className="font-bold text-white leading-none text-center px-1"
                  style={{
                    fontFamily: '"El Messiri", serif',
                    fontSize: (report.finalRating || "ممتاز").length > 6 ? '18px' : '22px'
                  }}
                >
                  {report.finalRating || "ممتاز"}
                </span>
                <span className="text-[10px] tracking-wider" style={{ color: C.goldHi }}>التقدير النهائي</span>
              </div>
            </div>
          </div>

          {/* Stat strip (First evaluation / Second evaluation / Page count if page mode) */}
          <div
            className="flex items-center rounded-2xl mt-4 shadow-sm"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <Stat label="التقييم الأول" value={a1} />
            <span className="w-px h-[54px]" style={{ background: C.line }} />
            <Stat label="التقييم الثاني" value={a2} sub={improved} />
          </div>

          {/* Memorized section (ما حفظه الطالب خلال العام) */}
          <div
            className="mt-3 rounded-[13px] p-[14px_20px] text-white flex items-center gap-3.5"
            style={{ background: C.ink }}
          >
            <Icon name="book" size={22} color={C.goldHi} stroke={1.5} className="shrink-0" />
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: C.goldHi }}>ما حفظه الطالب خلال العام</div>
              <p className="text-[16.5px] font-semibold leading-relaxed">
                {report.memorizedDuringYear || "لا يوجد سجل للحفظ"}
              </p>
            </div>
          </div>

          {/* Learned section (ما تعلمه خلال العام) */}
          {learned.length > 0 && (
            <div className="mt-5.5">
              <Eyebrow>ما تعلّمه خلال العام</Eyebrow>
              <div
                className="grid gap-2.5 items-stretch"
                style={{
                  gridTemplateColumns: `repeat(${learned.length <= 5 ? learned.length : 3}, 1fr)`
                }}
              >
                {learned.map((it, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-[14px_10px_13px] text-center flex flex-col justify-between"
                    style={{ background: C.paper, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
                      style={{ background: C.cream }}
                    >
                      <Icon name={it.icon} size={20} color={C.gold} stroke={1.5} />
                    </div>
                    <span className="text-[13.5px] font-bold leading-snug" style={{ color: C.ink }}>
                      {it.label}
                    </span>
                    {it.note && (
                      <span className="text-[11.5px] leading-snug mt-1" style={{ color: C.mute }}>
                        {it.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Behaviors (بم يتميز & السلوك والتفاعل) */}
          <div className="grid grid-cols-2 gap-4.5 mt-5.5">
            {/* Strengths column */}
            <div>
              <SubHead icon="spark">بم يتميز الطالب</SubHead>
              <div className="flex flex-col gap-2 mt-3">
                {strengths.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: C.paper, border: `1px solid ${C.line}` }}
                  >
                    <Icon name={it[0]} size={18} color={C.gold} stroke={1.6} className="shrink-0" />
                    <span className="text-[14.5px] font-bold leading-tight" style={{ color: C.ink }}>
                      {it[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Behaviors column */}
            <div>
              <SubHead icon="check">السلوك والتفاعل</SubHead>
              <div className="flex flex-col gap-3.5 mt-4">
                {levels.map((it, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline gap-2 mb-2 text-sm font-semibold">
                      <span style={{ color: C.inkSoft }}>{it.label}</span>
                      <span className="text-[12.5px] font-bold" style={{ color: C.gold }}>
                        {it.cap}
                      </span>
                    </div>
                    {/* LevelMeter horizontal pills */}
                    <div className="flex gap-1.5 ltr" style={{ width: '100%' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="flex-grow h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background: i <= it.level ? C.ink : C.line
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Step Box */}
          {report.studentNeeds && (
            <div
              className="flex items-start gap-3 mt-4.5 p-[14px_17px] rounded-xl border border-dashed"
              style={{ border: `1px dashed ${C.gold}`, background: 'rgba(168,137,90,.06)' }}
            >
              <div
                className="shrink-0 w-8.5 h-8.5 rounded-full flex items-center justify-center mt-0.5 text-white"
                style={{ background: C.ink }}
              >
                <Icon name="arrow" size={17} color={C.goldHi} stroke={1.8} />
              </div>
              <div>
                <span className="text-sm font-bold mb-0.5 block" style={{ color: C.gold }}>
                  الخطوة القادمة
                </span>
                <p className="text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {report.studentNeeds}
                </p>
              </div>
            </div>
          )}

          {/* Message to Parent Card */}
          <div className="mt-4.5">
            <div className="relative rounded-2xl p-[22px_26px_18px] text-white" style={{ background: C.ink }}>
              <div className="absolute top-4.5 inset-inline-end-5 opacity-35">
                <Icon name="quote" size={26} color={C.goldHi} stroke={1.6} />
              </div>
              <span className="text-sm font-bold tracking-wide mb-2.5 block" style={{ color: C.goldHi }}>
                رسالة إلى أهل الطالب
              </span>
              <p className="text-[16.5px] leading-[1.92] font-normal" style={{ color: '#f3eee3' }}>
                {withName(report.parentMessage || "نشكر لكم حرصكم ومتابعتكم المستمرة لابننا الطيب، ونسأل الله أن يجعله قرة عين لكم ومن أهل القرآن وخاصته.")}
              </p>
              <div className="flex items-center gap-2 mt-3.5 pt-3.5" style={{ borderTop: '1px solid rgba(199,175,144,.28)' }}>
                <Icon name="pen" size={16} color={C.goldHi} stroke={1.6} />
                <span className="text-xs font-semibold" style={{ color: C.goldHi }}>
                  قسم الإشراف التعليمي
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacing flex grow */}
        <div className="flex-grow min-h-[20px]" />

        {/* Closing Word */}
        <div
          className="text-center rounded-2xl p-[20px_26px_22px] border"
          style={{ background: 'rgba(168,137,90,.05)', border: `1px solid ${C.line}` }}
        >
          <span className="text-xs font-bold tracking-widest uppercase block mb-3.5" style={{ color: C.gold }}>
            كلمة ختامية
          </span>
          {/* Ornamental Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.gold})` }} />
            <span className="relative w-[11px] h-[11px] transform rotate-45 shrink-0">
              <span className="absolute inset-0" style={{ border: `1px solid ${C.gold}` }} />
              <span className="absolute inset-0 transform rotate-45" style={{ border: `1px solid ${C.gold}` }} />
            </span>
            <span className="w-16 h-px" style={{ background: `linear-gradient(270deg, transparent, ${C.gold})` }} />
          </div>

          {/* Amiri Verse */}
          <div className="my-[15px] flex justify-center items-baseline gap-14 flex-wrap text-2xl font-bold leading-normal" style={{ color: C.gold, fontFamily: '"Amiri", serif' }}>
            <span>هَنِيئًا مَرِيئًا وَالِدَاكَ عَلَيْهِمَا</span>
            <span>مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالْحُلَلِ</span>
          </div>

          <div className="text-[13.5px] font-semibold mb-3" style={{ color: C.inkSoft }}>
            ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
          </div>

          {/* Ornamental Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.gold})` }} />
            <span className="relative w-[11px] h-[11px] transform rotate-45 shrink-0">
              <span className="absolute inset-0" style={{ border: `1px solid ${C.gold}` }} />
              <span className="absolute inset-0 transform rotate-45" style={{ border: `1px solid ${C.gold}` }} />
            </span>
            <span className="w-16 h-px" style={{ background: `linear-gradient(270deg, transparent, ${C.gold})` }} />
          </div>

          <p className="max-w-[640px] mx-auto mt-3.5 text-[15.5px] leading-relaxed font-medium" style={{ color: C.ink }}>
            {report.studentNeeds ? `بارك الله في جهود ${first}، وجعل القرآن نورَ قلبه، ووفَّقه لمزيدٍ من الثبات على طريقه.` : 'بارك الله في جهوده، وجعل القرآن نورَ قلبه، ووفَّقه لمزيدٍ من الثبات على طريقه.'}
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
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border-radius: 0 !important;
          }
        }
        .ltr {
          direction: ltr !important;
        }
      `}</style>
    </div>
  );

  function withName(t: string | null) {
    if (!t) return "";
    return t.replace(/^\s*ابنكم\s+/, 'ابنكم ' + first + ' ');
  }
}
