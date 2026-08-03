/**
 * Summer Evaluation Engine
 * 
 * Core evaluation logic for the Student Progress Report System.
 * Calculates scores, generates feedback, achievements, and recommendations
 * based on exam grades (from imported JSON) and daily reports (from DB).
 * 
 * Design principles:
 * - Pure functions: no database calls, receives data as parameters
 * - Track-aware: handles QURAN and NOOR_AL_BAYAN separately
 * - Data-driven feedback: all text generated from actual student metrics
 * - Reusable: same engine used for admin, teacher, parent, and PDF views
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
  const filePath = path.join(process.cwd(), "data", "summer-exam-grades.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cachedGrades = JSON.parse(raw) as GradesData;
  return _cachedGrades;
}

export function getStudentExamGrades(studentId: string): ImportedGrade | null {
  const data = loadExamGrades();
  return data.students.find((s) => s.studentId === studentId) || null;
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
  const recorded = new Set(reports.map((r) => r.dateKey));

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

  // Consistency score: combines regularity + low absence
  const attendanceRate = totalWorkingDays > 0 ? (present.length / totalWorkingDays) * 100 : 0;
  const streakRatio = totalWorkingDays > 0 ? (longestStreak / totalWorkingDays) * 100 : 0;
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
    avgHomeworkGrade: hwGrades.length > 0 ? Number((hwGrades.reduce((a, b) => a + b, 0) / hwGrades.length).toFixed(1)) : 0,
    avgParticipation: partGrades.length > 0 ? Number((partGrades.reduce((a, b) => a + b, 0) / partGrades.length).toFixed(1)) : 0,
    homeworkSubmissionRate: present.length > 0 ? Math.round((hwSubmitted / present.length) * 100) : 0,

    avgBehavior: Number(avgBehavior.toFixed(1)),
    consistencyScore,
    longestStreak,
  };
}

// ─── Smart Feedback Generator ─────────────────────────────────────────────────

export function generateSmartFeedback(
  studentName: string,
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): string {
  const firstName = studentName.split(" ")[0];
  const parts: string[] = [];

  // Opening based on overall performance
  if (finalScore >= 90) {
    parts.push(`حقق الطالب ${firstName} نتائج متميزة في الدورة الصيفية`);
  } else if (finalScore >= 80) {
    parts.push(`أظهر الطالب ${firstName} أداءً جيداً جداً خلال الدورة الصيفية`);
  } else if (finalScore >= 70) {
    parts.push(`بذل الطالب ${firstName} جهداً طيباً خلال الدورة الصيفية`);
  } else if (finalScore >= 60) {
    parts.push(`شارك الطالب ${firstName} في الدورة الصيفية`);
  } else {
    parts.push(`حضر الطالب ${firstName} الدورة الصيفية`);
  }

  // Track-specific observations
  if (track === "QURAN") {
    if (examScores.quranExam >= 85) {
      parts.push(`وتميز في اختبار حفظ القرآن الكريم`);
    } else if (examScores.quranExam >= 70) {
      parts.push(`وحقق مستوى جيداً في حفظ القرآن`);
    } else {
      parts.push(`ويحتاج إلى تعزيز الحفظ والمراجعة المستمرة`);
    }

    if (metrics.memorizationRate >= 80) {
      parts.push(`مع التزام ملحوظ بالحفظ اليومي`);
    }
    if (metrics.revisionDays >= metrics.presentDays * 0.7) {
      parts.push(`وانتظام في المراجعة`);
    } else if (metrics.revisionDays < metrics.presentDays * 0.4) {
      parts.push(`مع حاجة لزيادة وتيرة المراجعة لتثبيت المحفوظ`);
    }
  } else {
    // NOOR_AL_BAYAN
    if (examScores.noorBayanExam >= 85) {
      parts.push(`وتميز في اختبار نور البيان`);
    } else if (examScores.noorBayanExam >= 70) {
      parts.push(`وحقق مستوى جيداً في نور البيان`);
    } else {
      parts.push(`ويحتاج إلى تعزيز مهارات القراءة والتهجئة`);
    }

    if (metrics.avgHomeworkGrade >= 4) {
      parts.push(`مع تميز في حل الواجبات`);
    }
    if (metrics.avgParticipation >= 4) {
      parts.push(`ومشاركة فعالة في الحصص`);
    }

    if (examScores.qisarSuwarExam >= 85) {
      parts.push(`وإتقان في حفظ قصار السور`);
    }
  }

  // Tarbiya observation
  if (examScores.tarbiyaExam >= 80) {
    parts.push(`مع استيعاب جيد لدروس التربية الإيمانية`);
  } else if (examScores.tarbiyaExam < 50) {
    parts.push(`ويُنصح بمراجعة دروس التربية الإيمانية`);
  }

  // Closing
  parts.push(`نسأل الله له التوفيق والسداد`);

  return parts.join("، ") + ".";
}

// ─── Achievements Generator ──────────────────────────────────────────────────

export function generateAchievements(
  track: Track,
  examScores: ExamScores,
  metrics: DailyMetrics,
  finalScore: number
): string[] {
  const achievements: string[] = [];

  // Attendance achievements
  if (metrics.attendanceRate === 100) {
    achievements.push("🏅 حضور كامل طوال الدورة");
  } else if (metrics.attendanceRate >= 95) {
    achievements.push("⭐ حضور شبه كامل");
  }

  if (metrics.longestStreak >= 15) {
    achievements.push(`🔥 ${metrics.longestStreak} يوماً متتالياً من الحضور`);
  } else if (metrics.longestStreak >= 10) {
    achievements.push(`🔥 ${metrics.longestStreak} أيام حضور متتالية`);
  }

  // Exam achievements
  if (finalScore >= 95) {
    achievements.push("🌟 من أوائل الدورة الصيفية");
  }

  if (track === "QURAN") {
    if (examScores.quranExam >= 90) achievements.push("📖 تميز في اختبار القرآن الكريم");
    if (metrics.memorizationDays === metrics.presentDays && metrics.presentDays > 0) {
      achievements.push("📚 حفظ يومي مستمر بدون انقطاع");
    }
    if (metrics.revisionDays >= metrics.presentDays * 0.8 && metrics.presentDays > 0) {
      achievements.push("🔄 انتظام ممتاز في المراجعة");
    }
  } else {
    if (examScores.noorBayanExam >= 90) achievements.push("📖 تميز في اختبار نور البيان");
    if (examScores.qisarSuwarExam >= 90) achievements.push("🕋 تميز في حفظ قصار السور");
    if (metrics.homeworkSubmissionRate === 100 && metrics.presentDays > 0) {
      achievements.push("✅ التزام تام بتسليم الواجبات");
    }
    if (metrics.avgParticipation >= 4.5) {
      achievements.push("🙋 مشاركة فعالة ومتميزة");
    }
  }

  if (examScores.tarbiyaExam >= 90) {
    achievements.push("🌙 تميز في التربية الإيمانية");
  }

  if (metrics.avgBehavior >= 4.8) {
    achievements.push("🤝 سلوك مثالي وانضباط تام");
  }

  if (metrics.consistencyScore >= 95) {
    achievements.push("📊 انتظام استثنائي");
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

  // === Strengths ===
  if (metrics.attendanceRate >= 90) strengths.push("الانتظام في الحضور");

  if (track === "QURAN") {
    if (examScores.quranExam >= 75) strengths.push("إتقان حفظ القرآن");
    if (metrics.memorizationRate >= 80) strengths.push("الالتزام بالحفظ اليومي");
    if (metrics.revisionDays >= metrics.presentDays * 0.7) strengths.push("الانتظام في المراجعة");
  } else {
    if (examScores.noorBayanExam >= 75) strengths.push("إتقان مهارات نور البيان");
    if (examScores.qisarSuwarExam >= 80) strengths.push("حفظ قصار السور");
    if (metrics.avgHomeworkGrade >= 4) strengths.push("التميز في الواجبات");
    if (metrics.avgParticipation >= 4) strengths.push("المشاركة الفعالة");
  }

  if (examScores.tarbiyaExam >= 75) strengths.push("استيعاب التربية الإيمانية");
  if (metrics.avgBehavior >= 4) strengths.push("السلوك والانضباط");
  if (metrics.consistencyScore >= 85) strengths.push("الانتظام والاستمرارية");

  // === Improvement Areas ===
  if (metrics.attendanceRate < 80) improvementAreas.push("تحسين نسبة الحضور");

  if (track === "QURAN") {
    if (examScores.quranExam < 70) improvementAreas.push("تعزيز جودة الحفظ");
    if (metrics.revisionDays < metrics.presentDays * 0.5) improvementAreas.push("زيادة وتيرة المراجعة");
    if (metrics.memorizationRate < 60) improvementAreas.push("الالتزام بالحفظ اليومي");
  } else {
    if (examScores.noorBayanExam < 70) improvementAreas.push("تحسين مهارات القراءة");
    if (metrics.avgHomeworkGrade < 3 && metrics.avgHomeworkGrade > 0) improvementAreas.push("الاهتمام بالواجبات");
    if (metrics.homeworkSubmissionRate < 70) improvementAreas.push("الالتزام بتسليم الواجبات");
    if (examScores.qisarSuwarExam < 70) improvementAreas.push("تحسين حفظ قصار السور");
  }

  if (examScores.tarbiyaExam < 60) improvementAreas.push("مراجعة دروس التربية الإيمانية");
  if (metrics.avgBehavior < 3.5) improvementAreas.push("تحسين السلوك والانضباط");

  // Ensure at least one strength
  if (strengths.length === 0) strengths.push("المشاركة في الدورة الصيفية");

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
    if (examScores.quranExam < 70) {
      recs.push("التركيز على تحسين جودة الحفظ مع تقليل الكم وزيادة التكرار");
    } else if (examScores.quranExam >= 85) {
      recs.push("الاستمرار في الحفظ والانتقال لمرحلة الإتقان والتجويد");
    }

    if (metrics.revisionDays < metrics.presentDays * 0.5) {
      recs.push("تخصيص وقت يومي للمراجعة لتثبيت المحفوظ");
    }

    if (metrics.memorizationRate < 60) {
      recs.push("الالتزام بحفظ مقدار يومي ثابت ولو كان قليلاً");
    }
  } else {
    if (examScores.noorBayanExam < 70) {
      recs.push("الاستمرار في التدرب على القراءة والتهجئة يومياً");
    } else if (examScores.noorBayanExam >= 85) {
      recs.push("الاستمرار في التميز والانتقال لمرحلة القراءة المتقدمة");
    }

    if (metrics.avgHomeworkGrade < 3 && metrics.avgHomeworkGrade > 0) {
      recs.push("بذل جهد أكبر في حل الواجبات المنزلية");
    }

    if (examScores.qisarSuwarExam < 70) {
      recs.push("مراجعة حفظ قصار السور يومياً قبل النوم");
    }
  }

  if (examScores.tarbiyaExam < 60) {
    recs.push("مراجعة دروس التربية الإيمانية مع الأسرة");
  }

  if (metrics.attendanceRate < 85) {
    recs.push("المحافظة على الحضور المنتظم في البرامج القادمة");
  }

  // Always end with a positive recommendation
  if (finalScore >= 80) {
    recs.push("الحفاظ على هذا المستوى المتميز والاستمرار في طلب العلم");
  } else if (finalScore >= 60) {
    recs.push("المتابعة المستمرة مع المعلم لتحقيق نتائج أفضل");
  } else {
    recs.push("الالتحاق بحلقات التحفيظ الأسبوعية لتعزيز المستوى");
  }

  return recs;
}

// ─── Main Evaluation Function ─────────────────────────────────────────────────

export function evaluateStudent(
  studentId: string,
  studentName: string,
  track: Track,
  teacherName: string,
  circleName: string,
  reports: DailyReportData[],
  totalWorkingDays: number
): StudentEvaluation | null {
  // Get exam grades
  const gradeData = getStudentExamGrades(studentId);
  if (!gradeData) return null;

  const { examScores, finalScore, needsCommitment } = gradeData;

  // Calculate daily metrics
  const dailyMetrics = calculateDailyMetrics(reports, totalWorkingDays, track);

  // Generate all components
  const grade = getGradeLevel(finalScore);
  const snapshot = generateSnapshot(track, examScores, dailyMetrics);
  const achievements = generateAchievements(track, examScores, dailyMetrics, finalScore);
  const autoFeedback = generateSmartFeedback(studentName, track, examScores, dailyMetrics, finalScore);
  const recommendations = generateRecommendations(track, examScores, dailyMetrics, finalScore);

  return {
    studentId,
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
    achievements,
    autoFeedback,
    recommendations,
  };
}

// ─── Bulk Evaluation ─────────────────────────────────────────────────────────

export function evaluateAllStudents(
  students: Array<{
    id: string;
    fullName: string;
    summerGroup: string | null;
    teacherName: string;
    circleName: string;
    reports: DailyReportData[];
  }>,
  totalWorkingDays: number
): StudentEvaluation[] {
  const evaluations: StudentEvaluation[] = [];

  for (const student of students) {
    const track = (student.summerGroup === "NOOR_AL_BAYAN" ? "NOOR_AL_BAYAN" : "QURAN") as Track;
    const evaluation = evaluateStudent(
      student.id,
      student.fullName,
      track,
      student.teacherName,
      student.circleName,
      student.reports,
      totalWorkingDays
    );
    if (evaluation) evaluations.push(evaluation);
  }

  // Sort by finalScore descending
  evaluations.sort((a, b) => b.finalScore - a.finalScore);

  return evaluations;
}
