/**
 * Summer Evaluation Engine
 * 
 * Core evaluation logic for the Student Progress Report System.
 * Calculates scores, generates feedback, achievements, and recommendations
 * based on exam grades (from imported JSON) and daily reports (from DB).
 */

import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Track = "QURAN" | "NOOR_AL_BAYAN";

export type ExamScores = {
  quranExam: number;       // 0-100 (Quran track)
  tarbiyaExam: number;     // 0-100 (both tracks)
  noorBayanExam: number;   // 0-100 (Noor track)
  qisarSuwarExam: number;  // 0-100 (Noor track)
  behaviorScore: number;   // 0-100
  attendanceScore: number; // 0-100
};

export type DailyReportData = {
  dateKey: string;
  status: "PRESENT" | "ABSENT";
  quranNew: string | null;
  quranRevision: string | null;
  quranTaqeen: string | null;
  noorLearned: string | null;
  noorHomework: boolean | null;
  noorHomeworkGrade: number | null;
  noorParticipation: number | null;
  behaviorGrade: number | null;
  createdAt: Date;
};

export type DailyMetrics = {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  missingDays: number;
  attendanceRate: number;

  // Quran
  memorizationDays: number;
  revisionDays: number;
  taqeenDays: number;
  memorizationRate: number;

  // Noor Al-Bayan
  lessonsCount: number;
  avgHomeworkGrade: number;
  avgParticipation: number;
  homeworkSubmissionRate: number;

  // Shared
  avgBehavior: number;
  consistencyScore: number;
  longestStreak: number;
};

export type GradeLevel = {
  label: string;
  color: string;
  bgColor: string;
};

export type StudentSnapshot = {
  strengths: string[];
  improvementAreas: string[];
};

export type EmotionalMilestone = {
  icon: string;
  title: string;
  desc: string;
  color: string;
};

export type StudentEvaluation = {
  studentId: string;
  studentName: string;
  track: Track;
  teacherName: string;
  circleName: string;

  examScores: ExamScores;
  dailyMetrics: DailyMetrics;

  finalScore: number;
  grade: GradeLevel;
  needsCommitment: boolean;

  snapshot: StudentSnapshot;
  milestones: EmotionalMilestone[];
  achievements: string[];
  autoFeedback: string;
  recommendations: string[];
};

// ─── Grade Scale ──────────────────────────────────────────────────────────────

const GRADE_SCALE: Array<{ min: number; label: string; color: string; bgColor: string }> = [
  { min: 90, label: "ممتاز",        color: "#059669", bgColor: "#ECFDF5" },
  { min: 80, label: "جيد جداً",     color: "#0C5C5E", bgColor: "#EDF5F4" },
  { min: 70, label: "جيد",          color: "#D97706", bgColor: "#FFFBEB" },
  { min: 60, label: "مقبول",        color: "#EA580C", bgColor: "#FFF7ED" },
  { min: 0,  label: "يحتاج متابعة", color: "#DC2626", bgColor: "#FEF2F2" },
];

export function getGradeLevel(score: number): GradeLevel {
  const grade = GRADE_SCALE.find((g) => score >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
  return { label: grade.label, color: grade.color, bgColor: grade.bgColor };
}

// ─── Exam Grades Reader ──────────────────────────────────────────────────────

type ImportedGrade = {
  studentId: string;
  studentName: string;
  matchConfidence: string;
  track: Track;
  teacherName: string;
  circleName: string;
  examScores: ExamScores;
  finalScore: number;
  needsCommitment: boolean;
};

type GradesData = {
  meta: {
    importDate: string;
    courseStart: string;
    courseEnd: string;
    weights: Record<string, Record<string, number>>;
  };
  students: ImportedGrade[];
  excluded: Array<{ name: string; reason: string }>;
};

let _cachedGrades: GradesData | null = null;

export function loadExamGrades(): GradesData {
  if (_cachedGrades) return _cachedGrades;
  try {
    const filePath = path.join(process.cwd(), "data", "summer-exam-grades.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      _cachedGrades = JSON.parse(raw) as GradesData;
      return _cachedGrades;
    }
  } catch (e) {
    console.error("Error reading summer-exam-grades.json:", e);
  }
  return {
    meta: {
      importDate: new Date().toISOString().slice(0, 10),
      courseStart: "2026-07-09",
      courseEnd: "2026-08-07",
      weights: {},
    },
    students: [],
    excluded: [],
  };
}

export function getStudentExamGrades(studentIdOrCode: string, studentName?: string): ImportedGrade | null {
  const data = loadExamGrades();
  let match = data.students.find((s) => s.studentId === studentIdOrCode);
  if (!match && studentName) {
    const norm = (str: string) => str.trim().replace(/\s+/g, " ");
    match = data.students.find((s) => norm(s.studentName) === norm(studentName));
  }
  return match || null;
}

export function getCourseMeta() {
  return loadExamGrades().meta;
}

// ─── Daily Metrics Calculator ──────────────────────────────────────────────────

function hasContent(val: string | null | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && !trimmed.includes("لا يوجد");
}

export function calculateDailyMetrics(
  reports: DailyReportData[],
  totalWorkingDays: number,
  track: Track
): DailyMetrics {
  const present = reports.filter((r) => r.status === "PRESENT");
  const absent = reports.filter((r) => r.status === "ABSENT");

  // Quran metrics
  const memDays = present.filter((r) => hasContent(r.quranNew)).length;
  const revDays = present.filter((r) => hasContent(r.quranRevision)).length;
  const taqDays = present.filter((r) => hasContent(r.quranTaqeen)).length;

  // Noor metrics
  const lessons = present.filter((r) => hasContent(r.noorLearned)).length;
  const hwGrades = present.filter((r) => r.noorHomeworkGrade != null).map((r) => r.noorHomeworkGrade!);
  const partGrades = present.filter((r) => r.noorParticipation != null).map((r) => r.noorParticipation!);
  const hwSubmitted = present.filter((r) => r.noorHomework === true).length;

  // Behavior
  const behavGrades = present.filter((r) => r.behaviorGrade != null).map((r) => r.behaviorGrade!);
  const avgBehavior = behavGrades.length > 0 ? behavGrades.reduce((a, b) => a + b, 0) / behavGrades.length : 5;

  // Consistency & Streak
  const sortedDates = [...reports].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  let longestStreak = 0;
  let currentStreak = 0;
  for (const r of sortedDates) {
    if (r.status === "PRESENT") {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const attendanceRate = totalWorkingDays > 0 ? (present.length / totalWorkingDays) * 100 : 100;
  const streakRatio = totalWorkingDays > 0 ? (longestStreak / totalWorkingDays) * 100 : 100;
  const consistencyScore = Math.round(attendanceRate * 0.6 + streakRatio * 0.4);

  return {
    totalWorkingDays,
    presentDays: present.length,
    absentDays: absent.length,
    missingDays: totalWorkingDays - reports.length,
    attendanceRate: Math.round(attendanceRate),

    memorizationDays: memDays,
    revisionDays: revDays,
    taqeenDays: taqDays,
    memorizationRate: present.length > 0 ? Math.round((memDays / present.length) * 100) : 0,

    lessonsCount: lessons,
    avgHomeworkGrade: hwGrades.length > 0 ? Number((hwGrades.reduce((a, b) => a + b, 0) / hwGrades.length).toFixed(1)) : 5,
    avgParticipation: partGrades.length > 0 ? Number((partGrades.reduce((a, b) => a + b, 0) / partGrades.length).toFixed(1)) : 5,
    homeworkSubmissionRate: present.length > 0 ? Math.round((hwSubmitted / present.length) * 100) : 100,

    avgBehavior: Number(avgBehavior.toFixed(1)),
    consistencyScore,
    longestStreak,
  };
}

// ─── Emotional Milestones Generator ──────────────────────────────────────────

export function generateMilestones(
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): EmotionalMilestone[] {
  const milestones: EmotionalMilestone[] = [];

  // Attendance Medal
  if (metrics.attendanceRate >= 95) {
    milestones.push({
      icon: "🥇",
      title: "وسام المواظبة والانتظام",
      desc: "حضور واستمرارية عالية طوال أيام الدورة",
      color: "#D97706",
    });
  }

  // Excellence Star
  if (finalScore >= 85) {
    milestones.push({
      icon: "🌟",
      title: "نجم التميز والتفوق",
      desc: "أداء استثنائي ونتائج متميزة في الاختبارات",
      color: "#059669",
    });
  }

  // Track Honor Trophy
  if (track === "QURAN" && (examScores.quranExam >= 85 || metrics.memorizationRate >= 80)) {
    milestones.push({
      icon: "🏆",
      title: "شرف الإتقان والحفظ",
      desc: "همة عالية في حفظ القرآن الكريم ومراجعته",
      color: "#0C5C5E",
    });
  } else if (track === "NOOR_AL_BAYAN" && (examScores.noorBayanExam >= 85 || metrics.avgParticipation >= 4.5)) {
    milestones.push({
      icon: "🏆",
      title: "وسام التفوق في نور البيان",
      desc: "إتقان ممتاز للقراءة والتهجئة والمشاركة",
      color: "#0C5C5E",
    });
  }

  // Behavior Honor Badge
  if (metrics.avgBehavior >= 4.7 || examScores.behaviorScore >= 90) {
    milestones.push({
      icon: "👑",
      title: "تاج الأخلاق والسلوك",
      desc: "سلوك راقٍ وانضباط يقتدى به داخل الحلقة",
      color: "#7C3AED",
    });
  }

  return milestones;
}

// ─── Smart Feedback Generator (Humanized) ───────────────────────────────────

export function generateSmartFeedback(
  studentName: string,
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): string {
  const firstName = studentName.split(" ")[0];

  if (finalScore >= 90) {
    return `ما شاء الله تبارك الله، أظهر الطالب ${firstName} تميزاً واجتهاداً كبيراً خلال هذه الدورة. حرصه على الحضور والمتابعة كان سبباً في تحقيقه هذه النتائج المشرفة. نسأل الله أن يبارك فيه وفي أهله.`;
  } else if (finalScore >= 80) {
    return `أظهر الطالب ${firstName} أدائاً جيداً جداً وتفاعلاً رائعاً مع معلمه. بفضل الله ثم متابعته المستمرة حقق مستوى متقدماً، ومزيد من الاستمرار سيوصله لقمة التميز بإذن الله.`;
  } else if (finalScore >= 70) {
    return `بذل الطالب ${firstName} جهداً طيباً وملموساً خلال الدورة الصيفية. هو طالب مجتهد ويثمر فيه التوجيه، ونوصي بمواصلة المراجعة المنزلية لتثبيت النتيجة.`;
  } else if (finalScore >= 60) {
    return `شارك الطالب ${firstName} بانتظام في الدورة الصيفية، وأظهر استجابة لطيفة في الحلقة. يحتاج لمزيد من الدعم وتشجيعه في البيت ليرفع مستواه في الدورة القادمة.`;
  } else {
    return `حضر الطالب ${firstName} في الدورة ويسرنا قربه من حلقة القرآن. نوصي بتكثيف المتابعة معه في المنزل وتخصيص وقت يومي ثابت للمراجعة.`;
  }
}

// ─── Achievements Generator ──────────────────────────────────────────────────

export function generateAchievements(
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): string[] {
  const achievements: string[] = [];

  if (metrics.attendanceRate === 100) {
    achievements.push("🏅 حضور كامل طوال الدورة");
  } else if (metrics.attendanceRate >= 95) {
    achievements.push("⭐ مواظبة ممتازة على الحضور");
  }

  if (metrics.longestStreak >= 15) {
    achievements.push(`🔥 ${metrics.longestStreak} يوماً متتالياً من الحضور`);
  }

  if (finalScore >= 90) {
    achievements.push("🌟 من المتفوقين في الدورة الصيفية");
  }

  if (track === "QURAN") {
    if (examScores.quranExam >= 85) achievements.push("📖 إتقان حفظ القرآن الكريم");
    if (metrics.memorizationDays === metrics.presentDays && metrics.presentDays > 0) {
      achievements.push("📚 حفظ يومي مستمر بدون انقطاع");
    }
  } else {
    if (examScores.noorBayanExam >= 85) achievements.push("📖 تميز في مهارات نور البيان");
    if (examScores.qisarSuwarExam >= 85) achievements.push("🕋 إتقان حفظ قصار السور");
  }

  if (examScores.tarbiyaExam >= 85) {
    achievements.push("🌙 استيعاب ممتاز للتربية الإيمانية");
  }

  return achievements;
}

// ─── Student Snapshot Generator ───────────────────────────────────────────────

export function generateSnapshot(
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics
): StudentSnapshot {
  const strengths: string[] = [];
  const improvementAreas: string[] = [];

  if (metrics.attendanceRate >= 90) strengths.push("الانتظام والمواظبة في الحضور");

  if (track === "QURAN") {
    if (examScores.quranExam >= 75) strengths.push("إتقان الحفظ وجودة التلاوة");
    if (metrics.memorizationRate >= 80) strengths.push("الالتزام بمقدار الحفظ اليومي");
    if (metrics.revisionDays >= metrics.presentDays * 0.7) strengths.push("المحافظة على المراجعة");
  } else {
    if (examScores.noorBayanExam >= 75) strengths.push("إتقان قواعد القراءة والتهجئة");
    if (examScores.qisarSuwarExam >= 80) strengths.push("حفظ وتكرار قصار السور");
    if (metrics.avgParticipation >= 4) strengths.push("المشاركة والتفاعل في الحلقة");
  }

  if (examScores.tarbiyaExam >= 75) strengths.push("استيعاب دروس التربية الإيمانية");
  if (metrics.avgBehavior >= 4) strengths.push("حُسن الأدب والسلوك في الحلقة");

  if (metrics.attendanceRate < 85) improvementAreas.push("زيادة الالتزام بالحضور الدائم");

  if (track === "QURAN") {
    if (examScores.quranExam < 75) improvementAreas.push("تكثيف التكرار لرفع جودة الحفظ");
    if (metrics.revisionDays < metrics.presentDays * 0.6) improvementAreas.push("تخصيص ورد يومي ثابت للمراجعة");
  } else {
    if (examScores.noorBayanExam < 75) improvementAreas.push("التدرب على التهجئة السريعة في المنزل");
    if (examScores.qisarSuwarExam < 75) improvementAreas.push("مراجعة قصار السور يومياً");
  }

  if (examScores.tarbiyaExam < 70) improvementAreas.push("استرجاع مفاهيم الآداب والتربية");

  if (strengths.length === 0) strengths.push("المشاركة الفعالة في حلقة القرآن");

  return { strengths, improvementAreas };
}

// ─── Recommendations Generator ────────────────────────────────────────────────

export function generateRecommendations(
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): string[] {
  const recs: string[] = [];

  if (track === "QURAN") {
    if (examScores.quranExam < 75) {
      recs.push("التركيز على مراجعة الآيات القديمة يومياً مع التكرار بصوت مسموع");
    } else {
      recs.push("الاستمرار في الحفظ اليومي مع تثبيت الأحكام والتجويد");
    }
  } else {
    if (examScores.noorBayanExam < 75) {
      recs.push("قراءة صفحة يومياً من كتاب نور البيان بالتهجئة مع أحد الوالدين");
    } else {
      recs.push("مواصلة القراءة والمطالعة اليومية لتثبيت سرعة القراءة");
    }
  }

  if (examScores.tarbiyaExam < 75) {
    recs.push("مذاكرة الأذكار والآداب اليومية وتطبيقها في الحياة اليومية");
  }

  if (finalScore >= 80) {
    recs.push("الحفاظ على هذه الهمة العالية والالتحاق بالدورة القرآنية القادمة");
  } else {
    recs.push("تخصيص 15 دقيقة منزلية ثابتة يومياً لمتابعة الدرجات والمراجعة");
  }

  return recs;
}

// ─── Main Evaluation Function (with Fallback for test/new students) ─────────────

export function evaluateStudent(
  studentIdOrCode: string,
  studentName: string,
  track: Track,
  teacherName: string,
  circleName: string,
  reports: DailyReportData[],
  totalWorkingDays: number
): StudentEvaluation {
  // Get imported exam grades or construct fallback for test student
  const gradeData = getStudentExamGrades(studentIdOrCode, studentName);

  let examScores: ExamScores;
  let finalScore: number;
  let needsCommitment: boolean;

  if (gradeData) {
    examScores = gradeData.examScores;
    finalScore = gradeData.finalScore;
    needsCommitment = gradeData.needsCommitment;
  } else {
    // Dynamic Fallback from daily reports (for test student "7500" or new students)
    const presentCount = reports.filter((r) => r.status === "PRESENT").length;
    const attRate = totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : 90;
    const behavAvg = reports.length > 0
      ? reports.reduce((s, r) => s + (r.behaviorGrade || 5), 0) / reports.length
      : 5;
    const baseScore = Math.round(attRate * 0.3 + (behavAvg / 5) * 70);

    examScores = {
      quranExam: track === "QURAN" ? baseScore : 0,
      tarbiyaExam: baseScore,
      noorBayanExam: track === "NOOR_AL_BAYAN" ? baseScore : 0,
      qisarSuwarExam: track === "NOOR_AL_BAYAN" ? baseScore : 0,
      behaviorScore: Math.round((behavAvg / 5) * 100),
      attendanceScore: attRate,
    };
    finalScore = baseScore;
    needsCommitment = baseScore < 75;
  }

  const dailyMetrics = calculateDailyMetrics(reports, totalWorkingDays, track);
  const grade = getGradeLevel(finalScore);
  const snapshot = generateSnapshot(track, examScores, dailyMetrics);
  const milestones = generateMilestones(track, examScores, dailyMetrics, finalScore);
  const achievements = generateAchievements(track, examScores, dailyMetrics, finalScore);
  const autoFeedback = generateSmartFeedback(studentName, track, examScores, dailyMetrics, finalScore);
  const recommendations = generateRecommendations(track, examScores, dailyMetrics, finalScore);

  return {
    studentId: studentIdOrCode,
    studentName,
    track,
    teacherName,
    circleName,
    examScores,
    dailyMetrics,
    finalScore,
    grade,
    needsCommitment,
    snapshot,
    milestones,
    achievements,
    autoFeedback,
    recommendations,
  };
}
