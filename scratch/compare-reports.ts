import 'dotenv/config';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

function parseCSV(content: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell);
      result.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (row.length > 0 || cell) {
    row.push(cell);
    result.push(row);
  }
  return result;
}

function normalizeName(value: string | null | undefined) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

async function main() {
  const filePath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
  if (!fs.existsSync(filePath)) {
    console.error('File not found at:', filePath);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const header = rows[0];

  const csvRecords = rows.slice(1).map((row, idx) => {
    return {
      rowNum: idx + 2,
      studentName: row[0]?.trim() || '',
      teacherName: row[1]?.trim() || '',
      halaqaType: row[2]?.trim() || '',
      firstEvaluation: row[3]?.trim() || '',
      secondEvaluation: row[4]?.trim() || '',
      finalRating: row[5]?.trim() || '',
      memorizedDuringYear: row[6]?.trim() || '',
      learnedDuringYear: row[7]?.trim() || '',
      studentStrengths: row[8]?.trim() || '',
      behaviorNotes: row[9]?.trim() || '',
      studentNeeds: row[10]?.trim() || '',
      parentMessage: row[11]?.trim() || '',
    };
  }).filter(r => r.studentName);

  // Fetch all active ONSITE students
  const dbStudents = await prisma.student.findMany({
    where: { studyMode: 'ONSITE', isActive: true },
    select: {
      id: true,
      fullName: true,
      circleId: true,
      teacherId: true,
      circle: { select: { name: true } }
    }
  });

  const dbStudentsMap = new Map<string, typeof dbStudents[0]>();
  dbStudents.forEach(s => {
    dbStudentsMap.set(normalizeName(s.fullName), s);
  });

  // Fetch existing 2025-2026 annual reports in DB
  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' }
  });

  const dbReportsMap = new Map<string, typeof dbReports[0]>();
  dbReports.forEach(r => {
    dbReportsMap.set(normalizeName(r.studentName), r);
  });

  const matchedWithDifferences: Array<{
    studentName: string;
    differences: Array<{ field: string; csv: string; db: string }>;
  }> = [];
  const matchedWithNoDifferences: string[] = [];
  const missingReportInDB: typeof csvRecords = [];
  const unmatchedStudentNames: typeof csvRecords = [];

  for (const csvRec of csvRecords) {
    const normName = normalizeName(csvRec.studentName);
    
    // Find matching student in DB
    let student = dbStudentsMap.get(normName);
    if (!student) {
      // Try partial match
      for (const s of dbStudents) {
        const normDb = normalizeName(s.fullName);
        if (normDb.includes(normName) || normName.includes(normDb)) {
          student = s;
          break;
        }
      }
    }

    if (!student) {
      unmatchedStudentNames.push(csvRec);
      continue;
    }

    // Check if annual report exists in DB
    const report = dbReportsMap.get(normalizeName(student.fullName)) || dbReportsMap.get(normName);
    if (!report) {
      missingReportInDB.push(csvRec);
      continue;
    }

    // Compare fields
    const diffs: Array<{ field: string; csv: string; db: string }> = [];
    const fieldsToCompare = [
      { key: 'teacherName', label: 'اسم المعلم' },
      { key: 'finalRating', label: 'التقدير النهائي' },
      { key: 'memorizedDuringYear', label: 'ما حفظه الطالب' },
      { key: 'learnedDuringYear', label: 'ما تعلمه الطالب' },
      { key: 'studentStrengths', label: 'نقاط التميز' },
      { key: 'behaviorNotes', label: 'ملاحظات السلوك' },
      { key: 'studentNeeds', label: 'ما يحتاجه الطالب' },
      { key: 'parentMessage', label: 'رسالة الأهل' }
    ];

    fieldsToCompare.forEach(f => {
      const csvVal = (csvRec as any)[f.key] || '';
      const dbVal = (report as any)[f.key] || '';
      if (csvVal.replace(/\r\n/g, '\n').trim() !== dbVal.replace(/\r\n/g, '\n').trim()) {
        diffs.push({ field: f.label, csv: csvVal, db: dbVal });
      }
    });

    if (diffs.length > 0) {
      matchedWithDifferences.push({ studentName: student.fullName, differences: diffs });
    } else {
      matchedWithNoDifferences.push(student.fullName);
    }
  }

  // Find DB students who don't have reports in this CSV
  const csvStudentNames = new Set(csvRecords.map(r => normalizeName(r.studentName)));
  const dbStudentsMissingInCSV = dbStudents.filter(s => {
    const normDb = normalizeName(s.fullName);
    let matched = csvStudentNames.has(normDb);
    if (!matched) {
      for (const name of csvStudentNames) {
        if (normDb.includes(name) || name.includes(normDb)) {
          matched = true;
          break;
        }
      }
    }
    return !matched;
  });

  // Write markdown report
  const reportPath = path.join('C:/Users/amohm/.gemini/antigravity/brain/d1ed6b66-ea5d-4cf2-bdb1-544d31a9ea0d/analysis_results.md');
  
  let md = `# تحليل ومراجعة التقارير السنوية - أفيون 2026\n\n`;
  md += `تم تحليل ملف الإكسل المرفوع ومقارنته بالتقارير السنوية المسجلة بقاعدة البيانات والطلاب الفعليين.\n\n`;
  
  md += `## 📊 إحصائيات سريعة\n`;
  md += `- **إجمالي الطلاب في ملف الـ CSV**: ${csvRecords.length}\n`;
  md += `- **إجمالي طلاب الحضوري النشطين بقاعدة البيانات**: ${dbStudents.length}\n`;
  md += `- **تقارير سنوية متطابقة تماماً (بدون فروقات)**: ${matchedWithNoDifferences.length}\n`;
  md += `- **تقارير سنوية موجودة وتحتوي على فروقات نصوص**: ${matchedWithDifferences.length}\n`;
  md += `- **تقارير مفقودة في قاعدة البيانات (تحتاج إنشاء)**: ${missingReportInDB.length}\n`;
  md += `- **سجلات بالملف لا تطابق أي طالب بقاعدة البيانات (أخطاء إملائية/طلاب غير مسجلين)**: ${unmatchedStudentNames.length}\n`;
  md += `- **طلاب في قاعدة البيانات ليس لديهم سجلات بالملف**: ${dbStudentsMissingInCSV.length}\n\n`;

  md += `---\n\n`;

  md += `## ⚠️ 1. تقارير سنوية تحتوي على فروقات نصوص (${matchedWithDifferences.length})\n`;
  md += `هؤلاء الطلاب لديهم تقارير مسجلة في قاعدة البيانات، ولكن نصوصها تختلف عن تلك الموجودة في الملف:\n\n`;
  
  matchedWithDifferences.forEach(item => {
    md += `### 👤 الطالب: ${item.studentName}\n`;
    md += `| الحقل | النص في الملف (CSV) | النص في قاعدة البيانات |\n`;
    md += `| :--- | :--- | :--- |\n`;
    item.differences.forEach(d => {
      md += `| **${d.field}** | \`${d.csv.replace(/\n/g, ' ')}\` | \`${d.db.replace(/\n/g, ' ')}\` |\n`;
    });
    md += `\n`;
  });

  md += `---\n\n`;

  md += `## ➕ 2. تقارير مفقودة تحتاج إنشاء في قاعدة البيانات (${missingReportInDB.length})\n`;
  md += `هؤلاء الطلاب لهم بيانات بالملف ولكن **لا يوجد لهم أي تقرير سنوي** في قاعدة البيانات:\n\n`;
  md += `| م | اسم الطالب | اسم المعلم | نوع الحلقة | التقدير النهائي | ما حفظه الطالب |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  missingReportInDB.forEach((r, idx) => {
    md += `| ${idx + 1} | **${r.studentName}** | ${r.teacherName} | ${r.halaqaType} | \`${r.finalRating}\` | ${r.memorizedDuringYear} |\n`;
  });
  md += `\n\n`;

  md += `---\n\n`;

  md += `## 🔍 3. أسماء بالملف لا تطابق قاعدة البيانات (${unmatchedStudentNames.length})\n`;
  md += `هذه الأسماء موجودة في ملف الإكسل ولكن لم نجد لها أي تطابق (أو تطابق جزئي قريب) مع الطلاب النشطين بقاعدة البيانات. قد تكون بسبب أخطاء إملائية أو طلاب غير مسجلين بالمنصة:\n\n`;
  md += `| م | الاسم في الملف | اسم المعلم بالملف | ملاحظة |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  unmatchedStudentNames.forEach((r, idx) => {
    md += `| ${idx + 1} | **${r.studentName}** | ${r.teacherName} | يرجى مراجعة الاسم برمجياً أو تسجيل الطالب |\n`;
  });
  md += `\n\n`;

  md += `---\n\n`;

  md += `## ❌ 4. طلاب في قاعدة البيانات ليس لديهم تقارير بالملف (${dbStudentsMissingInCSV.length})\n`;
  md += `هؤلاء الطلاب مسجلون في المنصة حضوري ولكن لم تذكر أسماؤهم في ملف الإكسل المرفوع:\n\n`;
  md += `| م | اسم الطالب بقاعدة البيانات | الحلقة المسجل بها |\n`;
  md += `| :--- | :--- | :--- |\n`;
  dbStudentsMissingInCSV.forEach((s, idx) => {
    md += `| ${idx + 1} | **${s.fullName}** | ${s.circle?.name || 'بدون حلقة'} |\n`;
  });

  fs.writeFileSync(reportPath, md, 'utf8');
  console.log('Analysis markdown generated successfully at:', reportPath);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
