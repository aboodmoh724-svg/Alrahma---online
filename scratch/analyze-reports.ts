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
  console.log(`Parsed ${rows.length} rows (including header)`);

  const header = rows[0];
  console.log('Headers found:', header);

  // Map rows to objects
  const records = rows.slice(1).map((row, idx) => {
    return {
      rowNum: idx + 2,
      studentName: row[0]?.trim(),
      teacherName: row[1]?.trim(),
      halaqaType: row[2]?.trim(),
      firstEvaluation: row[3]?.trim(),
      secondEvaluation: row[4]?.trim(),
      finalRating: row[5]?.trim(),
      memorizedDuringYear: row[6]?.trim(),
      learnedDuringYear: row[7]?.trim(),
      studentStrengths: row[8]?.trim(),
      behaviorNotes: row[9]?.trim(),
      studentNeeds: row[10]?.trim(),
      parentMessage: row[11]?.trim(),
    };
  }).filter(r => r.studentName); // skip empty rows

  console.log(`Found ${records.length} valid student records in CSV`);

  // Fetch active onsite students
  const dbStudents = await prisma.student.findMany({
    where: {
      studyMode: 'ONSITE',
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      circle: {
        select: {
          name: true,
        }
      }
    }
  });

  console.log(`Found ${dbStudents.length} active ONSITE students in database`);

  // Match analysis
  const matched: Array<{ csv: typeof records[0]; db: typeof dbStudents[0] }> = [];
  const unmatchedCSV: typeof records = [];
  
  const dbStudentsMap = new Map<string, typeof dbStudents[0]>();
  dbStudents.forEach(s => {
    dbStudentsMap.set(normalizeName(s.fullName), s);
  });

  records.forEach(r => {
    const normName = normalizeName(r.studentName);
    const match = dbStudentsMap.get(normName);
    if (match) {
      matched.push({ csv: r, db: match });
    } else {
      // Let's do a partial search to help find near matches
      let partialMatch = null;
      for (const s of dbStudents) {
        const normDb = normalizeName(s.fullName);
        if (normDb.includes(normName) || normName.includes(normDb)) {
          partialMatch = s;
          break;
        }
      }
      if (partialMatch) {
        matched.push({ csv: r, db: partialMatch });
      } else {
        unmatchedCSV.push(r);
      }
    }
  });

  console.log(`\n--- Match Results ---`);
  console.log(`Matched: ${matched.length} students`);
  console.log(`Unmatched from CSV: ${unmatchedCSV.length} students`);

  if (unmatchedCSV.length > 0) {
    console.log(`\nUnmatched CSV Students List (First 20):`);
    unmatchedCSV.slice(0, 20).forEach(r => {
      console.log(`- [Row ${r.rowNum}] Name: "${r.studentName}" | Teacher: "${r.teacherName}"`);
    });
  }

  // Find DB students who don't have reports in this CSV
  const csvStudentNames = new Set(records.map(r => normalizeName(r.studentName)));
  const missingReportsFromDB = dbStudents.filter(s => !csvStudentNames.has(normalizeName(s.fullName)));

  console.log(`\nStudents in DB without reports in CSV: ${missingReportsFromDB.length}`);
  if (missingReportsFromDB.length > 0) {
    console.log(`\nDB Students Missing Reports (First 20):`);
    missingReportsFromDB.slice(0, 20).forEach(s => {
      console.log(`- Name: "${s.fullName}" | Circle: "${s.circle?.name || 'No Circle'}"`);
    });
  }

  // Check database for existing annual reports
  const existingReportsCount = await prisma.annualReport.count({
    where: {
      academicYear: '2025-2026',
    }
  });
  console.log(`\nExisting annual reports in database for 2025-2026: ${existingReportsCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
