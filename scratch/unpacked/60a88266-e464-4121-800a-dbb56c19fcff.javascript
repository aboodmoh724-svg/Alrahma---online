// shared.jsx — student data + reusable primitives for all report directions.
// Exports everything to window so the other babel files can use them.

// ── Showcase student (row 72 of the sheet: أحمد محمد حبوب / م. ياسر القاضي) ──
const STUDENT = {
  name: 'أحمد محمد حبوب',
  teacher: 'ياسر القاضي',
  circle: 'نور بيان – براعم',
  year: '2025 – 2026',
  hijri: '١٤٤٧ هـ',
  grade: 'ممتاز',
  assess1: 75,
  assess2: 92,
  // ماذا حفظ
  memBook: 'كتاب فتح الرحمن',
  memPage: 35,
  memExtra: 'سورة ق',
  // ماذا تعلّم — بطاقات
  learned: [
    { icon: 'kaaba', label: 'أركان الإسلام', note: 'نظريًّا وتطبيقيًّا' },
    { icon: 'book', label: 'الاستهداء بالقرآن', note: 'سورة ق' },
    { icon: 'eye', label: 'قيمة المراقبة', note: 'مراقبة الله في السرّ والعلن' },
    { icon: 'heart', label: 'الآداب العامة', note: 'حُسن الخُلق والتعامل' },
    { icon: 'mosque', label: 'تحدّي الصلاة', note: 'المواظبة على الصلاة' },
  ],
  // نقاط القوة (col I)
  strengths: [
    { icon: 'spark', label: 'قوّة التذكّر' },
    { icon: 'target', label: 'تركيز عالٍ جدًّا' },
    { icon: 'check', label: 'تطبيق ما يتعلّمه' },
  ],
  // السلوك والتفاعل (مشتق من col J) — مؤشرات نوعية بدل الأرقام
  conduct: [
    { label: 'الالتزام داخل الحلقة', level: 4, cap: 'ممتاز' },
    { label: 'الأدب وحُسن السلوك', level: 4, cap: 'ممتاز' },
    { label: 'التفاعل والمشاركة', level: 3, cap: 'جيّد' },
  ],
  // الخطوة القادمة (إعادة صياغة إيجابية لـ col K)
  nextStep:
    'تنمية مهاراته الاجتماعية بزيادة تفاعله مع أقرانه في مثل سنّه، لتزدهر شخصيّته كما ازدهر حفظه.',
  // رسالة المعلّم (col L)
  message:
    'ابنكم يتمتّع بتركيزٍ عالٍ وذاكرةٍ قويّة، واهتمامٍ جميلٍ من قِبَلكم. القليل من تعزيز مهاراته في التواصل والمهارات الاجتماعية سيُحسِّنه كثيرًا — بارك الله فيه وفيكم.',
  signer: 'الإشراف التعليمي',
  org: 'تحفيظ الرحمة للقرآن الكريم',
};

// ── Line icons (simple, single-stroke) ──────────────────────────────
const ICON_PATHS = {
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
function Icon({ name, size = 24, stroke = 1.6, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }} />
  );
}

// ── Circular progress ring (SVG) ────────────────────────────────────
function Ring({ value, max = 100, size = 110, thick = 9, track, color, children }) {
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thick} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thick}
          strokelinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{children}</div>
    </div>
  );
}

// ── Level meter: filled pills out of 4 ──────────────────────────────
function LevelMeter({ level, max = 4, color, track, w, h = 7, gap = 5 }) {
  const flexible = w === undefined || w === '100%' || w === 'flex';
  return (
    <div style={{ display: 'flex', gap, direction: 'ltr', width: flexible ? '100%' : 'auto' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ ...(flexible ? { flex: 1 } : { width: w }), height: h, borderRadius: h,
          background: i < level ? color : track, transition: 'background .2s' }} />
      ))}
    </div>
  );
}

// ── Subtle 8-point khatam star, as faint background motif (data URI) ──
function khatamBg(hex, opacity = 0.06) {
  const col = encodeURIComponent(hex);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${col}' stroke-width='1' opacity='${opacity}'><rect x='20' y='20' width='24' height='24'/><rect x='20' y='20' width='24' height='24' transform='rotate(45 32 32)'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

Object.assign(window, { STUDENT, Icon, Ring, LevelMeter, khatamBg });
