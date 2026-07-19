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

const filePath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
const content = fs.readFileSync(filePath, 'utf8');
const rows = parseCSV(content);
const csvRecords = rows.slice(1).map(r => r[0]?.trim()).filter(Boolean);

console.log('Total CSV names:', csvRecords.length);

const targets = ['أحمد ساهر حجازي', 'عبدالقادر سليمان حمامو'];
targets.forEach(t => {
  const normT = normalizeName(t);
  const found = csvRecords.filter(n => normalizeName(n).includes(normT) || normT.includes(normalizeName(n)));
  console.log(`Searching for "${t}": found matches:`, found);
});
