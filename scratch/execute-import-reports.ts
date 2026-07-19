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

function summarizeStrengths(text: string): string {
  if (!text) return 'إقبال على الحفظ، حضور وتعلّم، حُسن الخُلق';
  
  let cleaned = text
    .replace(/[١٢٣٤٥٦٧٨٩٠\-\*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  let parts = cleaned.split(/[،\r\n\.\-]/).map(p => p.trim()).filter(p => p.length > 4);
  
  if (parts.length >= 2) {
    return parts.slice(0, 3).join('، ');
  }
  
  parts = cleaned.split(/\s+و\s+/).map(p => p.trim()).filter(p => p.length > 3);
  if (parts.length >= 2) {
    return parts.slice(0, 3).join('، ');
  }
  
  return cleaned.length > 50 ? cleaned.slice(0, 50) + '...' : cleaned;
}

function summarizeBehavior(text: string): string {
  const defaultBehavior = 'الالتزام داخل الحلقة: ممتاز، الأدب وحُسن السلوك: ممتاز، التفاعل والمشاركة: ممتاز';
  if (!text || text.includes('لا توجد ملاحظات') || text.includes('ممتاز')) {
    return defaultBehavior;
  }
  
  let commitment = 'ممتاز';
  let manners = 'ممتاز';
  let participation = 'ممتاز';
  
  if (text.includes('حرك') || text.includes('كلام') || text.includes('نشاط') || text.includes('شغب') || text.includes('عناد') || text.includes('يشغل') || text.includes('تشتت') || text.includes('مزح') || text.includes('مشاغب')) {
    manners = 'جيّد';
    commitment = 'جيّد';
  }
  if (text.includes('غياب') || text.includes('تأخر') || text.includes('تاخر') || text.includes('تقصير') || text.includes('إهمال') || text.includes('اهمل') || text.includes('يعتمد')) {
    commitment = 'مقبول';
  }
  if (text.includes('خجول') || text.includes('شرود') || text.includes('صمت') || text.includes('سرحان') || text.includes('يسرح') || text.includes('تشتت')) {
    participation = 'مقبول';
  }
  
  return `الالتزام داخل الحلقة: ${commitment}، الأدب وحُسن السلوك: ${manners}، التفاعل والمشاركة: ${participation}`;
}

function summarizeNeeds(text: string): string {
  if (!text) return 'الاستمرار في المتابعة المنزلية والمواظبة على الحضور وتثبيت المحفوظ القديم.';
  
  let cleaned = text
    .replace(/[١٢٣٤٥٦٧٨٩٠\-\*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  let sentences = cleaned.split(/[\.\n]/).map(s => s.trim()).filter(s => s.length > 8);
  if (sentences.length >= 1) {
    return sentences.slice(0, 2).join('. ') + '.';
  }
  
  return cleaned;
}

function summarizeParentMessage(text: string): string {
  if (!text) return 'نشكر لكم حرصكم ومتابعتكم المستمرة لابننا الطيب، ونسأل الله أن يجعله قرة عين لكم ومن أهل القرآن وخاصته.';
  
  let cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length > 150) {
    return cleaned.slice(0, 150) + '...';
  }
  return cleaned;
}

const manualMapping: Record<string, string> = {
  'احمد طرقجي': 'احمد محمد طرقجي',
  'عبدالله عصام العريني': 'عبدالله عصام حسن العريني',
  'محمد نور برغود': 'محمد نور محمود برغود',
  'عمر تشتش': 'عمر احمد تشتش',
  'عمر محمد الابضال': 'عمر محمد ابضال',
  'قصي احمد فضيله': 'قصي احمد مضيله',
};

async function main() {
  const filePath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
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

  // Fetch all DB reports to check for duplicates
  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' }
  });
  const dbReportNames = new Set(dbReports.map(r => normalizeName(r.studentName)));

  // Fetch active ONSITE students
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

  // Filter missing reports
  const missing = csvRecords.filter(r => {
    const norm = normalizeName(r.studentName);
    let exists = dbReportNames.has(norm);
    if (!exists) {
      for (const name of dbReportNames) {
        if (norm.includes(name) || name.includes(norm)) {
          exists = true;
          break;
        }
      }
    }
    return !exists;
  });

  console.log(`Found ${missing.length} missing reports to import.`);

  // Find the highest key index
  let maxSuffix = 0;
  dbReports.forEach(r => {
    const match = r.studentKey.match(/annual-2025-2026-(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxSuffix) maxSuffix = idx;
    }
  });
  console.log(`Current highest studentKey suffix index: ${maxSuffix}`);

  let insertedCount = 0;
  for (const m of missing) {
    const normName = normalizeName(m.studentName);
    
    // Check manual mapping first
    let dbName = manualMapping[normName] || m.studentName;
    let student = dbStudentsMap.get(normalizeName(dbName));
    
    if (!student) {
      // Try partial matching
      for (const s of dbStudents) {
        const normDb = normalizeName(s.fullName);
        if (normDb.includes(normName) || normName.includes(normDb)) {
          student = s;
          break;
        }
      }
    }

    maxSuffix++;
    const nextKey = `annual-2025-2026-${String(maxSuffix).padStart(4, '0')}`;

    // Summarize text fields to concise bullet style
    const studentStrengths = summarizeStrengths(m.studentStrengths);
    const behaviorNotes = summarizeBehavior(m.behaviorNotes);
    const studentNeeds = summarizeNeeds(m.studentNeeds);
    const parentMessage = summarizeParentMessage(m.parentMessage);

    // Create report
    await prisma.annualReport.create({
      data: {
        studentKey: nextKey,
        academicYear: '2025-2026',
        studentName: student ? student.fullName : m.studentName,
        teacherName: m.teacherName || null,
        halaqaType: m.halaqaType || null,
        firstEvaluation: m.firstEvaluation || null,
        secondEvaluation: m.secondEvaluation || null,
        finalRating: m.finalRating || null,
        memorizedDuringYear: m.memorizedDuringYear || null,
        learnedDuringYear: m.learnedDuringYear || null,
        studentStrengths,
        behaviorNotes,
        studentNeeds,
        parentMessage,
        dataStatus: 'needs_review',
        reviewStatus: 'REVIEW',
        studentId: student ? student.id : null,
        circleId: student ? student.circleId : null,
        teacherId: student ? student.teacherId : null,
      }
    });

    insertedCount++;
    console.log(`[${insertedCount}/${missing.length}] Created report for "${student ? student.fullName : m.studentName}" with key: ${nextKey} (Matched: ${student ? 'YES' : 'NO'})`);
  }

  console.log(`\nSuccessfully imported ${insertedCount} new reports into database!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
