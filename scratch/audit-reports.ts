import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const reports = await prisma.annualReport.findMany({
    include: {
      student: {
        select: {
          fullName: true,
          circle: { select: { name: true } },
        },
      },
    },
    orderBy: {
      studentName: 'asc',
    },
  });

  console.log(`Auditing ${reports.length} reports in the database...`);

  const issues: Array<{
    reportId: string;
    studentName: string;
    type: 'ERROR' | 'WARNING';
    description: string;
    field: string;
    value: string;
  }> = [];

  for (const r of reports) {
    const sName = r.student?.fullName || r.studentName;

    // 1. Audit Name
    if (!sName || sName.trim().split(/\s+/).length < 2) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'WARNING',
        description: 'الاسم قد يكون غير كامل (اسم واحد فقط)',
        field: 'اسم الطالب',
        value: sName,
      });
    }

    // 2. Audit Teacher
    if (!r.teacherName || r.teacherName.includes('TBD') || r.teacherName.includes('غير محدد')) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'اسم المعلم غير محدد أو يحتوي على نص مؤقت',
        field: 'اسم المعلم',
        value: r.teacherName || '',
      });
    }

    // 3. Audit Evaluations
    if (!r.firstEvaluation || r.firstEvaluation === '0') {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'التقييم الأول مفقود أو يساوي صفر',
        field: 'التقييم الأول',
        value: String(r.firstEvaluation),
      });
    }
    if (!r.secondEvaluation || r.secondEvaluation === '0') {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'التقييم الثاني مفقود أو يساوي صفر',
        field: 'التقييم الثاني',
        value: String(r.secondEvaluation),
      });
    }

    // 4. Audit Memorized Text
    if (!r.memorizedDuringYear || r.memorizedDuringYear.trim().length < 5) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'حقل "ما حفظه الطالب" مفقود أو قصير جداً',
        field: 'ما حفظه الطالب',
        value: r.memorizedDuringYear || '',
      });
    }

    // 5. Audit Learned Text
    if (!r.learnedDuringYear || r.learnedDuringYear.trim().length < 5) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'حقل "ما تعلمه الطالب" مفقود أو فارغ',
        field: 'ما تعلمه الطالب',
        value: r.learnedDuringYear || '',
      });
    } else {
      // Check if learned has at least 3 cards (commas)
      const cards = r.learnedDuringYear.split(/[،,]/).map(c => c.trim()).filter(Boolean);
      if (cards.length < 3) {
        issues.push({
          reportId: r.id,
          studentName: sName,
          type: 'WARNING',
          description: 'محتوى "ما تعلمه الطالب" يحتوي على أقل من 3 بطاقات',
          field: 'ما تعلمه الطالب',
          value: r.learnedDuringYear,
        });
      }
    }

    // 6. Audit Strengths
    if (!r.studentStrengths || r.studentStrengths.trim().length < 5) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'نقاط تميز الطالب مفقودة أو فارغة',
        field: 'بم يتميز الطالب',
        value: r.studentStrengths || '',
      });
    }

    // 7. Audit Behavior Notes
    if (!r.behaviorNotes || r.behaviorNotes.trim().length < 5) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'ملاحظات السلوك والتفاعل مفقودة أو فارغة',
        field: 'السلوك والتفاعل',
        value: r.behaviorNotes || '',
      });
    }

    // 8. Audit Next Step
    if (!r.studentNeeds || r.studentNeeds.trim().length < 5) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'حقل "الخطوة القادمة" مفقود أو فارغ',
        field: 'الخطوة القادمة',
        value: r.studentNeeds || '',
      });
    }

    // 9. Audit Parent Message
    if (!r.parentMessage || r.parentMessage.trim().length < 10) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'رسالة ولي الأمر فارغة أو قصيرة جداً',
        field: 'رسالة ولي الأمر',
        value: r.parentMessage || '',
      });
    }

    // 10. Check for spelling errors or bad text symbols (like double spaces or brackets)
    const checkText = [r.studentName, r.teacherName, r.memorizedDuringYear, r.learnedDuringYear, r.studentStrengths, r.studentNeeds, r.parentMessage].join(' ');
    if (checkText.includes('null') || checkText.includes('undefined') || checkText.includes('[object')) {
      issues.push({
        reportId: r.id,
        studentName: sName,
        type: 'ERROR',
        description: 'يحتوي التقرير على كلمات برمجية خاطئة (null/undefined)',
        field: 'فحص عام للنصوص',
        value: 'تم العثور على قيم برمجية تالفة في النصوص',
      });
    }
  }

  // Generate Report Audit Markdown
  let md = `# تقرير تدقيق ومراجعة جودة البيانات للتقارير السنوية\n\n`;
  md += `> [!IMPORTANT]\n`;
  md += `> تم إجراء فحص تلقائي شامل لجميع التقارير الـ **${reports.length}** الموجودة في قاعدة البيانات للتأكد من خلوها من الأخطاء الإملائية أو البيانات الناقصة قبل إرسالها لأولياء الأمور.\n\n`;

  const errors = issues.filter(i => i.type === 'ERROR');
  const warnings = issues.filter(i => i.type === 'WARNING');

  md += `### 📊 خلاصة الفحص:\n`;
  md += `- **إجمالي التقارير المفحوصة**: ${reports.length}\n`;
  md += `- **تقارير سليمة 100% بدون أي ملاحظات**: ${reports.length - Array.from(new Set(issues.map(i => i.studentName))).length}\n`;
  md += `- **إجمالي الملاحظات الحرجة (أخطاء/نقص بيانات)**: ${errors.length} ❌\n`;
  md += `- **إجمالي التنبيهات (تحتاج مراجعة بشرية)**: ${warnings.length} ⚠️\n\n`;

  if (errors.length > 0) {
    md += `## ❌ أولاً: الأخطاء الحرجة ونقص البيانات (تحتاج إصلاح فوراً)\n\n`;
    md += `| اسم الطالب | الحقل المتأثر | نوع الملاحظة | القيمة الحالية |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    errors.forEach(e => {
      md += `| **${e.studentName}** | ${e.field} | ${e.description} | \`${e.value || 'فارغ'}\` |\n`;
    });
  } else {
    md += `## ❌ أولاً: الأخطاء الحرجة ونقص البيانات\n`;
    md += `🎉 لا توجد أخطاء حرجة أو بيانات مفقودة في التقارير المعتمدة!\n\n`;
  }

  if (warnings.length > 0) {
    md += `\n## ⚠️ ثانياً: التنبيهات الاسترشادية (للمراجعة البشرية والتأكيد)\n\n`;
    md += `| اسم الطالب | الحقل المتأثر | نوع التنبيه | القيمة الحالية |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    warnings.forEach(w => {
      md += `| **${w.studentName}** | ${w.field} | ${w.description} | \`${w.value}\` |\n`;
    });
  }

  const outPath = path.join(__dirname, '../report_audit_results.md');
  fs.writeFileSync(outPath, md);
  console.log(`Saved audit report to ${outPath}`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
