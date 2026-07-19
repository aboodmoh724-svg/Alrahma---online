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

  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' }
  });
  const dbReportNames = new Set(dbReports.map(r => normalizeName(r.studentName)));

  // Filter csvRecords to only those that do NOT exist in DB
  const missing = csvRecords.filter(r => {
    const norm = normalizeName(r.studentName);
    // Also check for partial match with DB reports to avoid duplicates
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

  console.log(`Missing reports count: ${missing.length}`);
  missing.forEach((r, idx) => {
    console.log(`\n[${idx + 1}] Student: "${r.studentName}" | Row: ${r.rowNum}`);
    console.log(`- Strengths: "${r.studentStrengths}"`);
    console.log(`- Behavior: "${r.behaviorNotes}"`);
    console.log(`- Needs: "${r.studentNeeds}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
