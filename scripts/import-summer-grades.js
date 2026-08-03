const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. Read Excel
  const wb = xlsx.readFile(path.join(__dirname, '..', 'docs', '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u062f\u0631\u062c\u0627\u062a.xlsx'));
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  // 2. Get DB students
  const dbStudents = await prisma.student.findMany({
    where: { isActive: true, studyMode: 'ONSITE_SUMMER' },
    select: {
      id: true, fullName: true, summerGroup: true, studentCode: true,
      teacher: { select: { fullName: true } },
      circle: { select: { name: true } },
    },
  });

  // 3. Normalize function
  function norm(s) {
    if (!s) return '';
    return String(s).trim().replace(/\s+/g, ' ')
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
      .replace(/\u0629/g, '\u0647')           // taa marbuta -> ha
      .replace(/\u0623|\u0625|\u0622/g, '\u0627'); // normalize alef
  }

  // 4. Match function
  function matchStudent(excelName, teacherName, circleName) {
    const normExcel = norm(excelName);
    
    // Exact match
    let match = dbStudents.find(s => norm(s.fullName) === normExcel);
    if (match) return { ...match, confidence: 'exact' };

    // Exact match ignoring *** suffix
    const cleanName = excelName.replace(/\s*\*+\s*$/, '').trim();
    match = dbStudents.find(s => norm(s.fullName) === norm(cleanName));
    if (match) return { ...match, confidence: 'exact' };

    // Match by words overlap + same teacher
    const excelWords = normExcel.split(' ').filter(Boolean);
    let bestMatch = null;
    let bestScore = 0;

    for (const s of dbStudents) {
      const dbWords = norm(s.fullName).split(' ').filter(Boolean);
      const common = excelWords.filter(w => dbWords.includes(w)).length;
      const score = common / Math.max(excelWords.length, dbWords.length);
      
      // Bonus for same teacher
      const sameTeacher = s.teacher && norm(s.teacher.fullName).includes(norm(teacherName).split('/')[0].trim());
      const adjustedScore = sameTeacher ? score + 0.2 : score;
      
      if (adjustedScore > bestScore && adjustedScore >= 0.5) {
        bestScore = adjustedScore;
        bestMatch = s;
      }
    }

    if (bestMatch && bestScore >= 0.8) return { ...bestMatch, confidence: 'high' };
    if (bestMatch && bestScore >= 0.5) return { ...bestMatch, confidence: 'low' };
    return null;
  }

  // 5. Process rows
  const result = {
    meta: {
      importDate: new Date().toISOString().slice(0, 10),
      source: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u062f\u0631\u062c\u0627\u062a.xlsx',
      courseStart: '2026-07-09',
      courseEnd: '2026-08-07',
      weights: {
        QURAN: { quranExam: 0.75, tarbiya: 0.10, behavior: 0.08, attendance: 0.07 },
        NOOR_AL_BAYAN: { noorExam: 0.60, qisarSuwar: 0.15, tarbiya: 0.10, behavior: 0.08, attendance: 0.07 },
      },
    },
    students: [],
    unmatched: [],
    excluded: [],
  };

  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();
    const phone = String(row[1] || '').trim();
    const circle = String(row[2] || '').trim();
    const teacher = String(row[3] || '').trim();
    const isNoor = circle.includes('\u0646\u0648\u0631 \u0627\u0644\u0628\u064a\u0627\u0646');
    const isRemote = circle.includes('\u0639\u0646 \u0628\u0639\u062f');
    const track = isNoor ? 'NOOR_AL_BAYAN' : 'QURAN';

    const quranExam = Number(row[4]) || 0;
    const tarbiyaExam = Number(row[5]) || 0;
    const noorExam = Number(row[6]) || 0;
    const qisarSuwar = Number(row[7]) || 0;
    const behaviorScore = Number(row[8]) || 0;
    const attendanceScore = Number(row[9]) || 0;
    const finalScore = Number(row[10]) || 0;
    const needsCommitment = String(row[11] || '').trim().length > 0;

    // Exclusions
    const allZero = quranExam === 0 && tarbiyaExam === 0 && noorExam === 0 && qisarSuwar === 0 && behaviorScore === 0;
    const noGrades = row.length <= 4 || (row[4] === undefined && row[5] === undefined);
    
    if (isRemote && (noGrades || allZero)) {
      result.excluded.push({ name, reason: '\u0637\u0627\u0644\u0628 \u0639\u0646 \u0628\u0639\u062f \u0628\u062f\u0648\u0646 \u062f\u0631\u062c\u0627\u062a', circle, teacher });
      continue;
    }
    if (allZero && !isRemote) {
      result.excluded.push({ name, reason: '\u062f\u0631\u062c\u0627\u062a \u0635\u0641\u0631\u064a\u0629 (\u0627\u0646\u0633\u062d\u0627\u0628 \u0645\u062d\u062a\u0645\u0644)', circle, teacher });
      continue;
    }

    // Match
    const matched = matchStudent(name, teacher, circle);
    
    const entry = {
      studentId: matched ? matched.id : null,
      studentName: name.replace(/\s*\*+\s*$/, '').trim(),
      matchConfidence: matched ? matched.confidence : 'unmatched',
      track,
      teacherName: teacher,
      circleName: circle,
      examScores: {
        quranExam: track === 'QURAN' ? quranExam : 0,
        tarbiyaExam,
        noorBayanExam: track === 'NOOR_AL_BAYAN' ? noorExam : 0,
        qisarSuwarExam: track === 'NOOR_AL_BAYAN' ? qisarSuwar : 0,
        behaviorScore,
        attendanceScore,
      },
      finalScore,
      needsCommitment,
    };

    if (!matched) {
      result.unmatched.push(entry);
    } else {
      result.students.push(entry);
    }
  }

  // 6. Write JSON
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'summer-exam-grades.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log('=== Import Results ===');
  console.log('Matched:', result.students.length);
  console.log('Unmatched:', result.unmatched.length);
  console.log('Excluded:', result.excluded.length);
  console.log('\\nMatched students:');
  result.students.forEach(s => console.log(`  [${s.matchConfidence}] ${s.studentName} -> ${s.studentId}`));
  if (result.unmatched.length > 0) {
    console.log('\\nUnmatched:');
    result.unmatched.forEach(s => console.log(`  ${s.studentName} (${s.teacherName})`));
  }
  if (result.excluded.length > 0) {
    console.log('\\nExcluded:');
    result.excluded.forEach(s => console.log(`  ${s.name}: ${s.reason}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
