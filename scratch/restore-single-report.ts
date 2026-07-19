import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const studentName = 'أسيد أبوحشيش';
  const report = await prisma.annualReport.findFirst({
    where: {
      studentName: { contains: studentName },
      academicYear: '2025-2026'
    }
  });

  if (!report) {
    console.error('Report not found');
    return;
  }

  await prisma.annualReport.update({
    where: { id: report.id },
    data: {
      memorizedDuringYear: 'جزء تبارك وجزء عم وسورة ق و15 ص من البقرة',
      learnedDuringYear: 'الإستهداء بالقران (الحجرات - الطور) ، تعلم وحفظ 20 حديثا من كتاب الأربعون القلبية ، قيمة المراقبة ، تعلم وحفظ غريب القرآن (التكاثر - الناس والفاتحة) ، أحكام الطهارة والصلاة والصيام ، الاداب العامة',
      studentStrengths: 'ذكاء وسرعة بديهة، قدرة عالية على الحفظ، تلاوة وترتيل جميل',
      behaviorNotes: 'الالتزام داخل الحلقة: ممتاز، الأدب وحُسن السلوك: جيّد، التفاعل والمشاركة: ممتاز',
      studentNeeds: 'يمتلك الطالب قدرات استثنائية وسرعة بديهة تجعله متفوّقًا على باقي الطلاب، ولكنه بدأ يعتمد على هذه الموهبة ويُهمل التحضير المسبق في البيت. ما ينقصه هو تعظيم قيمة الإتقان بتخصيص وقت ثابت للتحضير المنزلي قبل الحلقة؛ لئلا يؤثّر ذلك على جودة حفظه وثباته.',
      parentMessage: 'نشكر لكم ثقتكم بنا وحرصكم على تنشئة ابنكم على كتاب الله عز وجل. ندعوكم لاستمرار المتابعة المنزلية لتعزيز نقاط تميّزه وتطوير ما ينقصه، ونسأل الله أن يُنبته نباتًا حسنًا، وأن يجعله من أهل القرآن الكريم.'
    }
  });

  console.log('Restored report for أسيد أبوحشيش successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
