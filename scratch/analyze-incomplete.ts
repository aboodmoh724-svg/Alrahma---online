import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const jsonPath = path.join(__dirname, 'incomplete-students.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('JSON file does not exist');
    return;
  }

  const incompleteStudents = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const completelyBlank = incompleteStudents.filter((s: any) => !s.hasSomeData);
  const partiallyMissing = incompleteStudents.filter((s: any) => s.hasSomeData);

  let mdContent = `# تحليل الطلاب ذوي البيانات غير المكتملة في ملف الـ CSV\n\n`;
  
  mdContent += `> [!IMPORTANT]\n`;
  mdContent += `> تم تقسيم الطلاب غير المكتملة بياناتهم إلى فئتين بناءً على طلبك:\n`;
  mdContent += `> 1. **طلاب فارغو البيانات تماماً (6 طلاب)**: لديهم الاسم فقط وكافة الخانات الأخرى فارغة. هؤلاء **لم يتم ولن يتم** إنشاء بطاقات تقارير لهم.\n`;
  mdContent += `> 2. **طلاب لديهم نقص جزئي في بعض البيانات (35 طالباً)**: لديهم بعض البيانات ولكن تنقصهم بعض التقييمات أو رسائل أولياء الأمور.\n\n`;

  mdContent += `## أولاً: طلاب فارغو البيانات تماماً (جميع الخانات والبيانات فارغة)\n`;
  mdContent += `هؤلاء الطلاب لن يتم عمل تصاميم لهم كما طلبت:\n\n`;
  mdContent += `| الرقم في الملف | اسم الطالب | حالة البيانات | الإجراء المتخذ |\n`;
  mdContent += `| :---: | :--- | :--- | :--- |\n`;
  completelyBlank.forEach((s: any) => {
    mdContent += `| السطر ${s.rowNum} | **${s.name}** | فارغ بالكامل ❌ | حجب التصميم والتقرير |\n`;
  });

  mdContent += `\n## ثانياً: طلاب لديهم نقص جزئي في البيانات (تحتاج لمراجعتك)\n`;
  mdContent += `هؤلاء الطلاب لديهم تقارير تم إنشاؤها بالاعتماد على البيانات المتوفرة، ولكن هناك خانات فارغة لديهم في الملف الأصلي:\n\n`;
  mdContent += `| الرقم في الملف | اسم الطالب | الخانات المفقودة في الملف الأصلي |\n`;
  mdContent += `| :---: | :--- | :--- |\n`;
  partiallyMissing.forEach((s: any) => {
    mdContent += `| السطر ${s.rowNum} | ${s.name} | ${s.missingFields.join(', ')} |\n`;
  });

  const artifactPath = path.join(__dirname, '../analysis_results.md');
  fs.writeFileSync(artifactPath, mdContent);
  console.log(`Saved Markdown analysis to ${artifactPath}`);
}

main().catch(console.error);
