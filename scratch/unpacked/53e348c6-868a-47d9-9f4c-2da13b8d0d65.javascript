// ReportOne.jsx — "التصميم الأول" data-driven. Clear Western numerals,
// 3-stat strip, بم يتميز chips + السلوك level meters, framed, ceremonial.
// Adaptive: full layout for students with chips/levels (حلقة ياسر القاضي);
// academic layout (learned + dua) otherwise. Reuses Icon, LevelMeter, khatamBg.

function ReportOne({ student }) {
  const s = student;
  const C = {
    ink: '#1f3139', inkSoft: '#33474e', gold: '#a8895a', goldHi: '#c7af90',
    cream: '#f6f2e9', paper: '#fffefb', line: '#e6ddca', mute: '#5a646e',
  };
  const disp = '"El Messiri", serif';
  const body = '"IBM Plex Sans Arabic", sans-serif';

  const learned = parseLearned(s.L);
  const mem = memInfo(s.m);
  const hasPersonal = !!(s.chips && s.levels);
  const first = (s.n || '').trim().split(/\s+/)[0];
  const withName = (t) => (t ? t.replace(/^\s*ابنكم\s+/, 'ابنكم ' + first + ' ') : t);
  const num = (v) => /^\d+$/.test(('' + v).trim()) && ('' + v).trim() !== '0';
  const a1 = s.a1, a2 = s.a2;
  const improved = num(a1) && num(a2) && (+a2 > +a1) ? ('+' + (+a2 - +a1) + ' تحسُّنًا') : '';

  const Eyebrow = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
      <span style={{ width: 26, height: 1, background: C.gold, opacity: .6 }} />
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span style={{ fontFamily: body, fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: C.gold, whiteSpace: 'nowrap' }}>{children}</span>
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span style={{ width: 26, height: 1, background: C.gold, opacity: .6 }} />
    </div>
  );

  // a single big stat cell with a clear Latin numeral
  const Stat = ({ label, value, sub, accent }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px' }}>
      {num(value)
        ? <div style={{ fontFamily: body, fontVariantNumeric: 'lining-nums', fontSize: 46, fontWeight: 700, color: accent ? C.ink : C.ink, lineHeight: 1, letterSpacing: -1 }}>{('' + value).trim()}</div>
        : <div style={{ fontSize: 17, fontWeight: 700, color: C.inkSoft, padding: '12px 0' }}>{('' + value).trim() && ('' + value).trim() !== '0' ? ('' + value).trim() : '—'}</div>}
      <div style={{ fontFamily: body, fontSize: 14, color: C.mute, marginTop: 9, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontFamily: body, fontSize: 12.5, color: C.gold, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const SubHead = ({ children, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
      <Icon name={icon} size={17} color={C.gold} stroke={1.7} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: body, fontSize: 15.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  );

  const fixedH = student.fixedH || null;
  return (
    <div dir="rtl" style={{ width: 780, minHeight: fixedH || 1320, height: fixedH || undefined, background: C.cream, fontFamily: body, color: C.ink,
      position: 'relative', backgroundImage: khatamBg(C.gold, 0.07), backgroundSize: '58px 58px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 16, border: `1px solid ${C.gold}`, opacity: .45, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 21, border: `1px solid ${C.gold}`, opacity: .22, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', padding: '34px 46px 36px', display: 'flex', flexDirection: 'column', minHeight: fixedH || 1320, height: fixedH || undefined, boxSizing: 'border-box' }}>
        {/* logo lockup */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <img src="alrahma-mark.png" alt="شعار تحفيظ الرحمة" style={{ width: 58, height: 58, objectFit: 'contain' }} ref={(el) => { if (el && window.LOGO_SRC) el.src = window.LOGO_SRC; }} />
          <div style={{ fontFamily: disp, fontSize: 19, fontWeight: 600, color: C.ink, letterSpacing: .2 }}>تحفيظ الرحمة للقرآن الكريم</div>
        </div>

        {/* hero */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Eyebrow>التقرير السنوي للطالب</Eyebrow>
          <div style={{ fontFamily: disp, fontSize: 44, fontWeight: 700, lineHeight: 1.05, color: C.ink }}>{s.n}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 13, fontFamily: body, fontSize: 15, color: C.inkSoft, flexWrap: 'wrap' }}>
            <span><span style={{ color: C.mute }}>المعلّم: </span><b style={{ fontWeight: 700 }}>{s.t}</b></span>
            <span style={{ color: C.line }}>|</span>
            <span><span style={{ color: C.mute }}>الحلقة: </span><b style={{ fontWeight: 700 }}>{s.c}</b></span>
            <span style={{ color: C.line }}>|</span>
            <span><span style={{ color: C.mute }}>العام: </span><b style={{ fontWeight: 700 }}>2025 – 2026</b></span>
          </div>
        </div>

        {/* medal */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 4 }}>
          <Medal C={C} disp={disp} grade={s.g} />
        </div>

        {/* stat strip — adaptive: page-mode shows 3 cells incl. page */}
        {mem.mode === 'page' ? (
          <div style={{ display: 'flex', alignItems: 'center', background: C.paper, border: `1px solid ${C.line}`,
            borderRadius: 14, marginTop: 16, boxShadow: '0 1px 2px rgba(31,49,57,.04)' }}>
            <Stat label="التقييم الأول" value={a1} />
            <span style={{ width: 1, height: 54, background: C.line }} />
            <Stat label="التقييم الثاني" value={a2} sub={improved} />
            <span style={{ width: 1, height: 54, background: C.line }} />
            <Stat label="فتح الرحمن — الصفحة" value={mem.page} sub={/سورة ق|بسورة ق/.test(s.L) ? 'مع سورة ق' : ''} />
          </div>
        ) : (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', background: C.paper, border: `1px solid ${C.line}`,
              borderRadius: 14, marginTop: 16, boxShadow: '0 1px 2px rgba(31,49,57,.04)' }}>
              <Stat label="التقييم الأول" value={a1} />
              <span style={{ width: 1, height: 54, background: C.line }} />
              <Stat label="التقييم الثاني" value={a2} sub={improved} />
            </div>
            <div style={{ marginTop: 12, background: C.ink, borderRadius: 13, padding: '14px 20px', color: '#fff',
              display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon name="book" size={22} color={C.goldHi} stroke={1.5} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: C.goldHi, marginBottom: 3, fontWeight: 600 }}>ما حفظه الطالب خلال العام</div>
                <div style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.5 }}>{mem.text}</div>
              </div>
            </div>
          </React.Fragment>
        )}

        {/* learned */}
        <div style={{ marginTop: 22 }}>
          <Eyebrow>ما تعلّمه خلال العام</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${learned.length <= 5 ? learned.length : 3},1fr)`, gap: 10, alignItems: 'stretch' }}>
            {learned.map((it, i) => (
              <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12,
                padding: '14px 10px 13px', textAlign: 'center', display: 'block' }}>
                <div style={{ width: 40, height: 40, margin: '0 auto 8px', borderRadius: '50%', background: C.cream,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={it.icon} size={20} color={C.gold} stroke={1.5} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>{it.label}</div>
                {it.note && <div style={{ fontSize: 11.5, color: C.mute, lineHeight: 1.35, marginTop: 4 }}>{it.note}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── adaptive bottom ── */}
        {hasPersonal ? (
          <React.Fragment>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
              <div>
                <SubHead icon="spark">بم يتميز الطالب</SubHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
                  {s.chips.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, background: C.paper,
                      border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px' }}>
                      <Icon name={it[0]} size={18} color={C.gold} stroke={1.6} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{it[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SubHead icon="check">السلوك والتفاعل</SubHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 17 }}>
                  {s.levels.map((it, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.inkSoft, whiteSpace: 'nowrap' }}>{it.label}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.gold, whiteSpace: 'nowrap' }}>{it.cap}</span>
                      </div>
                      <LevelMeter level={it.level} color={C.ink} track={C.line} w={'100%'} h={6} gap={5} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {s.need && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginTop: 18, padding: '14px 17px',
                border: `1px dashed ${C.gold}`, borderRadius: 12, background: 'rgba(168,137,90,.06)' }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  <Icon name="arrow" size={17} color={C.goldHi} stroke={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 2 }}>الخطوة القادمة</div>
                  <div style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.6 }}>{s.need}</div>
                </div>
              </div>
            )}
            <MsgCard C={C} body={body} text={withName(s.msg)} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <DividerOne C={C} />
            <MsgCard C={C} body={body}
              text={`نفخر بـ${first} وبما حقّقه هذا العام، ونسأل الله أن يبارك فيه ويجعله من حَمَلة كتابه العاملين به. شكرًا لتعاونكم ومتابعتكم الدائمة، فهي خير عون له على الطريق.`} />
          </React.Fragment>
        )}

        <div style={{ flexGrow: 1, minHeight: 0 }} />
        {/* كلمة ختامية — لكل الطلاب */}
        <ClosingWord C={C} disp={disp} body={body} dua={s.dua} />
      </div>
    </div>
  );
}

function DividerOne({ C }) {
  return (
    <div style={{ margin: '26px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: .85 }}>
      <span style={{ width: 90, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold})` }} />
      <span style={{ position: 'relative', width: 14, height: 14, transform: 'rotate(45deg)', flexShrink: 0 }}>
        <span style={{ position: 'absolute', inset: 0, border: `1px solid ${C.gold}` }} />
        <span style={{ position: 'absolute', inset: 0, border: `1px solid ${C.gold}`, transform: 'rotate(45deg)' }} />
      </span>
      <span style={{ width: 90, height: 1, background: `linear-gradient(270deg, transparent, ${C.gold})` }} />
    </div>
  );
}

function MsgCard({ C, body, text }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ position: 'relative', background: C.ink, borderRadius: 16, padding: '22px 26px 18px', color: '#fff' }}>
        <div style={{ position: 'absolute', top: 18, insetInlineStart: 22, opacity: .35 }}>
          <Icon name="quote" size={26} color={C.goldHi} stroke={1.6} />
        </div>
        <div style={{ fontFamily: body, fontSize: 14, fontWeight: 700, letterSpacing: 1.2, color: C.goldHi, marginBottom: 10 }}>رسالة إلى أهل الطالب</div>
        <div style={{ fontSize: 16.5, lineHeight: 1.92, color: '#f3eee3', fontWeight: 400 }}>{text}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 15, paddingTop: 14, borderTop: '1px solid rgba(199,175,144,.28)' }}>
          <Icon name="pen" size={16} color={C.goldHi} stroke={1.6} />
          <span style={{ fontSize: 15, color: C.goldHi, fontWeight: 600 }}>قسم الإشراف التعليمي</span>
        </div>
      </div>
    </div>
  );
}

function Medal({ C, disp, grade }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 64, display: 'flex', gap: 26, zIndex: 0 }}>
        <span style={{ width: 16, height: 40, background: C.gold, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)', transform: 'rotate(-8deg)' }} />
        <span style={{ width: 16, height: 40, background: C.goldHi, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)', transform: 'rotate(8deg)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: 100, height: 100, borderRadius: '50%',
        background: `conic-gradient(${C.goldHi},${C.gold},${C.goldHi},${C.gold},${C.goldHi})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(168,137,90,.4)' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: C.ink, border: `2px solid ${C.goldHi}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Icon name="star" size={15} color={C.goldHi} stroke={1.4} />
          <span style={{ fontFamily: disp, fontSize: grade.length > 6 ? 18 : 22, fontWeight: 700, color: '#fff', lineHeight: 1, textAlign: 'center', padding: '0 4px' }}>{grade}</span>
          <span style={{ fontSize: 10, color: C.goldHi, letterSpacing: .5 }}>التقدير النهائي</span>
        </div>
      </div>
    </div>
  );
}

function ClosingWord({ C, disp, body, dua }) {
  const verse = '"Amiri", serif';
  const Orn = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span style={{ width: 64, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold})` }} />
      <span style={{ position: 'relative', width: 11, height: 11, transform: 'rotate(45deg)', flexShrink: 0 }}>
        <span style={{ position: 'absolute', inset: 0, border: `1px solid ${C.gold}` }} />
        <span style={{ position: 'absolute', inset: 0, border: `1px solid ${C.gold}`, transform: 'rotate(45deg)' }} />
      </span>
      <span style={{ width: 64, height: 1, background: `linear-gradient(270deg, transparent, ${C.gold})` }} />
    </div>
  );
  const Bayt = ({ sadr, ajuz }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 56, flexWrap: 'wrap',
      fontFamily: verse, fontSize: 24, color: C.gold, fontWeight: 700, lineHeight: 1.7 }}>
      <span>{sadr}</span>
      <span>{ajuz}</span>
    </div>
  );
  return (
    <div style={{ marginTop: 22, textAlign: 'center', background: 'rgba(168,137,90,.05)',
      border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 26px 22px' }}>
      <div style={{ fontFamily: body, fontSize: 13, fontWeight: 700, letterSpacing: 3, color: C.gold, marginBottom: 14 }}>كلمة ختامية</div>
      <Orn />
      <div style={{ margin: '15px 0 13px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <Bayt sadr="هَنِيئًا مَرِيئًا وَالِدَاكَ عَلَيْهِمَا" ajuz="مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالْحُلَلِ" />
      </div>
      <div style={{ fontFamily: body, fontSize: 13.5, fontWeight: 600, color: C.inkSoft, marginBottom: 13 }}>
        ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
      </div>
      <Orn />
      <div style={{ maxWidth: 640, margin: '14px auto 0', fontFamily: body, fontSize: 15.5, lineHeight: 1.85, color: C.ink, fontWeight: 500 }}>
        {dua || 'بارك الله في جهوده، وجعل القرآن نورَ قلبه، ووفَّقه لمزيدٍ من الثبات على طريقه.'}
      </div>
    </div>
  );
}

window.ReportOne = ReportOne;