import { promises as fs } from "fs";
import path from "path";
import type { EvaluationResult } from "@/lib/summer-evaluation";

async function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "alrahma_tahfeez_logo.png");
    const bytes = await fs.readFile(logoPath);
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const bytes = await fs.readFile(logoPath);
      return `data:image/png;base64,${bytes.toString("base64")}`;
    } catch {
      return "";
    }
  }
}

export async function generateStudentReportPdfHtml(
  studentName: string,
  trackLabel: string,
  circleName: string,
  teacherName: string,
  evaluation: EvaluationResult
): Promise<string> {
  const logoDataUrl = await getLogoBase64();
  const { finalScore, grade, examScores: es, snapshot, autoFeedback, recommendations, track } = evaluation;

  const starCount = finalScore >= 90 ? 5 : finalScore >= 80 ? 4 : finalScore >= 70 ? 3 : 2;
  const firstName = studentName.split(" ")[0];

  const subjectItems = track === "QURAN"
    ? [
      { label: "اختبار القرآن الكريم", score: es.quranExam },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam },
    ]
    : [
      { label: "اختبار القراءة والتهجئة", score: es.noorBayanExam },
      { label: "حفظ قصار السور", score: es.qisarSuwarExam },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam },
    ];

  const strokeDash = ((finalScore / 100) * 251.2).toFixed(1);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير إنجاز الطالب - ${studentName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #ffffff;
      color: #1F2937;
      width: 210mm;
      height: 296mm;
      padding: 0;
      margin: 0 auto;
      overflow: hidden;
    }
    .page-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #E5DEC9;
    }
    .header {
      background-color: #0C5C5E;
      color: #ffffff;
      padding: 24px 30px 48px 30px;
      text-align: center;
      position: relative;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 3px 14px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 8px;
    }
    .badge img {
      width: 16px;
      height: 16px;
      object-fit: contain;
    }
    .title {
      font-size: 22px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .subtitle {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
    }
    .divider {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 10px;
      margin-top: 8px;
    }
    .certified {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      display: block;
      margin-bottom: 2px;
    }
    .student-name {
      font-size: 24px;
      font-weight: bold;
      color: #FDE68A;
      margin-bottom: 6px;
    }
    .meta-pills {
      display: inline-block;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 4px 14px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.9);
    }
    .score-section {
      text-align: center;
      margin-top: -36px;
      position: relative;
      z-index: 10;
    }
    .score-card {
      display: inline-block;
      background: #ffffff;
      border: 2px solid #E5DEC9;
      border-radius: 16px;
      padding: 12px 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      width: 220px;
    }
    .svg-ring-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto;
    }
    .svg-ring {
      width: 100px;
      height: 100px;
      transform: rotate(-90deg);
    }
    .ring-bg {
      fill: none;
      stroke: #F3F4F6;
      stroke-width: 8;
    }
    .ring-val {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
    }
    .ring-text {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .score-percent {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
    }
    .score-label {
      font-size: 9px;
      color: #9CA3AF;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .stars {
      color: #D97706;
      font-size: 14px;
      margin-top: 4px;
      letter-spacing: 2px;
    }
    .grade-ribbon {
      margin-top: 6px;
      display: inline-block;
      padding: 2px 14px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      color: #ffffff;
    }
    .content {
      padding: 12px 28px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-grow: 1;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #0C5C5E;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .box {
      background: #ffffff;
      border: 1px solid #E5E3DF;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .progress-item {
      margin-bottom: 8px;
    }
    .progress-item:last-child {
      margin-bottom: 0;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .progress-bar-bg {
      height: 7px;
      background: #F3F4F6;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .strength-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .improvement-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .box-heading {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .list-item {
      font-size: 10px;
      margin-bottom: 3px;
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .teacher-quote {
      background: #FAF7F0;
      border-right: 4px solid #0C5C5E;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      color: #374151;
      line-height: 1.5;
    }
    .teacher-sign {
      font-size: 9px;
      font-weight: bold;
      color: #0C5C5E;
      margin-top: 4px;
      text-align: left;
    }
    .rec-item {
      font-size: 10.5px;
      color: #374151;
      margin-bottom: 4px;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .num-badge {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(12, 92, 94, 0.1);
      color: #0C5C5E;
      font-size: 9px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .dua-box {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 10px;
      padding: 10px 14px;
      text-align: center;
      font-size: 11px;
      color: #047857;
      line-height: 1.4;
      font-weight: 500;
    }
    .footer {
      background: #FAF7F0;
      border-top: 1px solid #EAE3D2;
      padding: 8px 20px;
      text-align: center;
      font-size: 9px;
      color: #6B7280;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="badge">
          ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo">` : ""}
          <span>تحفيظ الرحمة للقرآن الكريم</span>
        </div>
        <div class="title">تقرير إنجاز الطالب</div>
        <div class="subtitle">الدورة الصيفية 2026 - الفترة الأولى</div>

        <div class="divider">
          <span class="certified">يُشهد بأن الطالب</span>
          <div class="student-name">${studentName}</div>
          <div class="meta-pills">
            ${trackLabel} • ${circleName} • المعلم: ${teacherName}
          </div>
        </div>
      </div>

      <!-- Score Card -->
      <div class="score-section">
        <div class="score-card">
          <div class="svg-ring-container">
            <svg class="svg-ring" viewBox="0 0 100 100" width="100" height="100">
              <circle class="ring-bg" cx="50" cy="50" r="40" />
              <circle class="ring-val" cx="50" cy="50" r="40" stroke="${grade.color}" stroke-dasharray="${strokeDash} 251.2" />
            </svg>
            <div class="ring-text">
              <span class="score-label">النتيجة النهائية</span>
              <span class="score-percent" style="color: ${grade.color}">${finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1)}%</span>
              <span style="font-size: 9px; font-weight: bold; color: #374151;">${grade.label}</span>
            </div>
          </div>
          <div class="stars">
            ${Array.from({ length: 5 }).map((_, i) => i < starCount ? "★" : "☆").join(" ")}
          </div>
          <div class="grade-ribbon" style="background-color: ${grade.color}">
            تقدير عام: ${grade.label}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <!-- Academic Performance -->
        <div>
          <div class="section-title">📊 الأداء الأكاديمي</div>
          <div class="box">
            ${subjectItems.map((item) => {
              const sColor = item.score >= 85 ? "#059669" : item.score >= 75 ? "#0C5C5E" : item.score >= 60 ? "#D97706" : "#DC2626";
              return `
                <div class="progress-item">
                  <div class="progress-header">
                    <span style="font-weight: 600; color: #374151;">${item.label}</span>
                    <span style="font-weight: bold; color: ${sColor};">${item.score % 1 === 0 ? item.score : item.score.toFixed(1)}%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${item.score}%; background-color: ${sColor};"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Strengths & Improvements -->
        ${(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) ? `
          <div class="grid-2">
            ${snapshot.strengths.length > 0 ? `
              <div class="strength-box">
                <div class="box-heading" style="color: #166534;">✨ نقاط القوة</div>
                ${snapshot.strengths.map(s => `<div class="list-item" style="color: #15803D;"><span style="color: #16A34A; font-weight: bold;">✓</span> <span>${s}</span></div>`).join("")}
              </div>
            ` : ""}
            ${snapshot.improvementAreas.length > 0 ? `
              <div class="improvement-box">
                <div class="box-heading" style="color: #92400E;">🌱 فرص التحسين</div>
                ${snapshot.improvementAreas.map(s => `<div class="list-item" style="color: #B45309;"><span style="color: #D97706; font-weight: bold;">↑</span> <span>${s}</span></div>`).join("")}
              </div>
            ` : ""}
          </div>
        ` : ""}

        <!-- Teacher Message -->
        <div>
          <div class="section-title">💬 رسالة المعلم</div>
          <div class="teacher-quote">
            "${autoFeedback}"
            <div class="teacher-sign">— المعلم: ${teacherName}</div>
          </div>
        </div>

        <!-- Recommendations -->
        ${recommendations.length > 0 ? `
          <div>
            <div class="section-title">🏡 توصيات للأسرة</div>
            <div class="box">
              ${recommendations.map((rec, i) => `
                <div class="rec-item">
                  <div class="num-badge">${i + 1}</div>
                  <span>${rec}</span>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Du'a -->
        <div class="dua-box">
          «نسأل الله أن يبارك في الطالب <strong>${firstName}</strong>، وأن يجعله من أهل القرآن وخاصته، وأن ينفع به والده وأمه.»
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong style="color: #0C5C5E;">تحفيظ الرحمة للقرآن الكريم</strong> — الدورة الصيفية 2026 - الفترة الأولى
    </div>
  </div>
</body>
</html>`;
}
