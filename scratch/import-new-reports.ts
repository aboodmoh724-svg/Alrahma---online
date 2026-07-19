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
  
  // Replace line breaks and commas with standard separator
  let cleaned = text
    .replace(/[١٢٣٤٥٦٧٨٩٠\-\*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split by common delimiters
  let parts = cleaned.split(/[،\r\n\.\-]/).map(p => p.trim()).filter(p => p.length > 5);
  
  if (parts.length >= 2) {
    return parts.slice(0, 3).join('، ');
  }
  
  // Split by "و"
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

async function main() {
  const filePath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const csvRecords = rows.slice(1).map((row, idx) => {
    return {
      studentName: row[0]?.trim() || '',
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

  console.log(`Dry Run: Found ${missing.length} missing reports to generate.`);
  
  // Show first 15 examples to verify quality
  console.log('\n--- Examples of Summarized Fields (15 examples) ---');
  missing.slice(0, 15).forEach((m, idx) => {
    console.log(`\n[Example ${idx + 1}] Student: "${m.studentName}"`);
    console.log(`Original Strengths: "${m.studentStrengths}"`);
    console.log(`CONCISE STRENGTHS:  "${summarizeStrengths(m.studentStrengths)}"`);
    console.log(`Original Behavior:  "${m.behaviorNotes}"`);
    console.log(`CONCISE BEHAVIOR:   "${summarizeBehavior(m.behaviorNotes)}"`);
    console.log(`Original Needs:     "${m.studentNeeds}"`);
    console.log(`CONCISE NEEDS:      "${summarizeNeeds(m.studentNeeds)}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
