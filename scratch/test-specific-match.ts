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
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const csvRecords = rows.slice(1).map((row, idx) => {
    return {
      rowNum: idx + 2,
      studentName: row[0]?.trim() || '',
      teacherName: row[1]?.trim() || '',
    };
  }).filter(r => r.studentName);

  const targets = ['أحمد ساهر حجازي', 'عبدالقادر سليمان حمامو'];
  
  const dbStudents = await prisma.student.findMany({
    where: { studyMode: 'ONSITE', isActive: true },
    select: { id: true, fullName: true }
  });
  
  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' }
  });

  targets.forEach(t => {
    console.log(`\n--- Testing ${t} ---`);
    const csvRec = csvRecords.find(r => normalizeName(r.studentName) === normalizeName(t));
    console.log(`CSV Record found:`, csvRec ? `Row ${csvRec.rowNum}` : 'NOT FOUND');
    
    const dbStud = dbStudents.find(s => normalizeName(s.fullName) === normalizeName(t));
    console.log(`DB Student found:`, dbStud ? `ID: ${dbStud.id}, Name: ${dbStud.fullName}` : 'NOT FOUND');
    
    const dbRep = dbReports.find(r => normalizeName(r.studentName) === normalizeName(t));
    console.log(`DB Report found:`, dbRep ? `ID: ${dbRep.id}, Name: ${dbRep.studentName}` : 'NOT FOUND');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
