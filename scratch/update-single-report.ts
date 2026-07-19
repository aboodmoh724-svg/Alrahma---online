import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  // Find report for أسيد أبوحشيش
  const studentName = 'أسيد أبوحشيش';
  const report = await prisma.annualReport.findFirst({
    where: {
      studentName: {
        contains: studentName
      },
      academicYear: '2025-2026'
    }
  });

  if (!report) {
    console.error(`Report for ${studentName} not found in DB`);
    return;
  }

  console.log(`Found report for ${report.studentName} with ID: ${report.id}`);
  console.log('Old values:');
  console.log('- نقاط التميز:', report.studentStrengths);
  console.log('- ملاحظات السلوك:', report.behaviorNotes);
  console.log('- ما يحتاجه الطالب:', report.studentNeeds);
  console.log('- رسالة الأهل:', report.parentMessage);

  // New values from CSV for أسيد أبوحشيش
  const updatedReport = await prisma.annualReport.update({
    where: { id: report.id },
    data: {
      memorizedDuringYear: 'جزء تبارك و جزء عم وسورة ق  و15 ص من البقرة',
      learnedDuringYear: 'الإستهداء بالقران (الحجرات - الطور) ، تعلم وحفظ 20 حديثا من كتاب الأربعون القلبية ، قيمة المراقبة تعلم وحفظ غريب القرآن (التكاثر- الناس والفاتحة)، أحكام الطهارة والصلاة والصيام ، الاداب العامة',
      studentStrengths: 'يتسم أسيد بذكاء وسرعة بديهة وقدرة كبيرة على الحفظ فضلا عن تلاوته وترتيله الجميل في القرآن وحب اصدقائه الكبير له.',
      behaviorNotes: 'مواظب على الحضور للتحفيظ ومتفاعل مع معلمه ولكن لديه نشاط زائد مع اصدقائه بالدرس يؤثر سلبا على الحلقة',
      studentNeeds: 'يمتلك الطالب قدرات استثنائية وسرعة بديهة تجعله متفوقاً على باقي الطلاب ولكنه في الآونة الأخيرة بدأ يعتمد على هذه الموهبة ويهمل الجاهزية المسبقة في البيت. ما ينقصه الآن هو تعظيم قيمة الإتقان من خلال تخصيص وقت ثابت للتحضير المنزلي قبل القدوم للحلقة لئلا يؤثر هذا التراخي العابر على جودة حفظه وثباته مستقبلاً',
      parentMessage: 'نشكر لكم ثقتكم بنا وحرصكم على تنشئة ابنكم على كتاب الله عز وجل.  نضع بين أيديكم هذا التقرير ليكون مرآةً لجهوده وندعوكم لاستمرار التواصل والمتابعة المنزلية لتعزيز نقاط تميزه وتطوير ما ينقصه ونسأل الله أن ينبته نباتاً حسناً وأن يجعله من أهل القرآن الكريم.'
    }
  });

  console.log('\nUpdated values successfully!');
  console.log('New values in DB:');
  console.log('- نقاط التميز:', updatedReport.studentStrengths);
  console.log('- ملاحظات السلوك:', updatedReport.behaviorNotes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
