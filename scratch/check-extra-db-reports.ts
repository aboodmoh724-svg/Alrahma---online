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
    console.error('File not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const csvNames = new Set(rows.slice(1).map(r => normalizeName(r[0])));

  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' },
    select: {
      id: true,
      studentName: true,
      studentId: true,
    }
  });

  console.log(`DB Reports count: ${dbReports.length}`);
  
  const unmatched: typeof dbReports = [];
  dbReports.forEach(r => {
    const normName = normalizeName(r.studentName);
    let matched = csvNames.has(normName);
    if (!matched) {
      // Try partial match
      for (const name of csvNames) {
        if (normName.includes(name) || name.includes(normName)) {
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      unmatched.push(r);
    }
  });

  console.log(`DB reports not found in CSV (${unmatched.length}):`);
  unmatched.forEach(r => {
    console.log(`- ID: ${r.id} | Name: "${r.studentName}" | Student ID: ${r.studentId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
