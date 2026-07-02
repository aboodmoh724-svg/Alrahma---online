import * as fs from 'fs';
import * as path from 'path';

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentLine.push(currentToken.trim());
      lines.push(currentLine);
      currentLine = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken || currentLine.length > 0) {
    currentLine.push(currentToken.trim());
    lines.push(currentLine);
  }

  return lines;
}

async function main() {
  const csvPath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    console.error('CSV is empty');
    return;
  }

  const header = rows[0];
  console.log('Headers:', header.map((h, i) => `${i}: ${h}`).join(' | '));

  const incompleteStudents: Array<{
    name: string;
    missingFields: string[];
    rowNum: number;
    hasSomeData: boolean;
  }> = [];

  // We start from row index 1 (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= 1 || !row[0]) continue; // Empty row or no student name

    const name = row[0]; // اسم الطالب
    const teacher = row[1]; // اسم المعلم
    const firstEval = row[3]; // التقييم الأول
    const secondEval = row[4]; // التقييم الثاني
    const memorized = row[6]; // ماذا حفظ الطالب خلال سنة
    const learned = row[7]; // ماذا تعلم الطالب خلال سنة
    const strengths = row[8]; // بماذا يتميز الطالب
    const behavior = row[9]; // ملاحظات السلوك
    const nextStep = row[10]; // ماذا يحتاج الطالب
    const message = row[11]; // رسالة إلى أهل الطالب

    const missingFields: string[] = [];

    if (!teacher) missingFields.push('اسم المعلم');
    if (!firstEval || firstEval === '0' || firstEval === '-') missingFields.push('التقييم الأول');
    if (!secondEval || secondEval === '0' || secondEval === '-') missingFields.push('التقييم الثاني');
    if (!memorized) missingFields.push('ماذا حفظ الطالب خلال سنة');
    if (!learned) missingFields.push('ماذا تعلم الطالب خلال سنة');
    if (!strengths) missingFields.push('بماذا يتميز الطالب');
    if (!behavior) missingFields.push('ملاحظات السلوك');
    if (!nextStep) missingFields.push('ماذا يحتاج الطالب (الخطوة القادمة)');
    if (!message) missingFields.push('رسالة إلى أهل الطالب');

    if (missingFields.length > 0) {
      // Check if the student has at least SOME data (meaning they are not completely empty rows)
      const dataFields = [teacher, firstEval, secondEval, memorized, learned, strengths, behavior, nextStep, message];
      const filledCount = dataFields.filter(Boolean).length;
      
      incompleteStudents.push({
        name,
        missingFields,
        rowNum: i + 1,
        hasSomeData: filledCount > 0
      });
    }
  }

  console.log(`\nFound ${incompleteStudents.length} students with incomplete fields out of ${rows.length - 1} rows:\n`);
  incompleteStudents.forEach((student) => {
    console.log(`- Row ${student.rowNum}: ${student.name} (hasSomeData: ${student.hasSomeData})`);
    console.log(`  Missing: ${student.missingFields.join(', ')}`);
  });

  // Write results to a json file
  fs.writeFileSync(
    path.join(__dirname, 'incomplete-students.json'),
    JSON.stringify(incompleteStudents, null, 2)
  );
}

main().catch(console.error);
