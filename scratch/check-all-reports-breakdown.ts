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
      studentName: row[0]?.trim() || '',
    };
  }).filter(r => r.studentName);

  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' }
  });

  const csvNames = new Set(csvRecords.map(r => normalizeName(r.studentName)));

  console.log(`Total DB reports: ${dbReports.length}`);
  dbReports.forEach(r => {
    const norm = normalizeName(r.studentName);
    const inCSV = csvNames.has(norm);
    console.log(`Report Student: "${r.studentName}" | Normalized: "${norm}" | In CSV: ${inCSV}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
