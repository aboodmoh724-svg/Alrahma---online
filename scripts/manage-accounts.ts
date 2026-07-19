import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwords";

async function main() {
  // 1. List all active admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      studyMode: true,
    },
  });

  console.log("=========================================");
  console.log("🔑 حسابات الإدارة المتاحة (Active Admins):");
  console.log("=========================================");
  if (admins.length === 0) {
    console.log("لا يوجد حسابات إدارة نشطة حالياً!");
  } else {
    admins.forEach((admin) => {
      console.log(`- الاسم: ${admin.fullName}`);
      console.log(`  البريد الإلكتروني: ${admin.email}`);
      console.log(`  نوع التعليم (Study Mode): ${admin.studyMode}`);
      console.log("-----------------------------------------");
    });
  }

  // 2. Create the test teacher account
  const testEmail = "teacher.summer.test@alrahma.com";
  
  // Clean up if it already exists
  const existing = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  if (existing) {
    await prisma.user.delete({ where: { email: testEmail } });
    console.log(`🗑️ تم حذف حساب المعلم التجريبي السابق (${testEmail}) لإعادة إنشائه.`);
  }

  const hashedPassword = hashPassword("password123");
  const testTeacher = await prisma.user.create({
    data: {
      fullName: "معلم تجريبي (صيفي)",
      email: testEmail,
      password: hashedPassword,
      role: "TEACHER",
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
  });

  console.log("\n=========================================");
  console.log("👨‍🏫 حساب المعلم التجريبي الجديد للدورة الصيفية:");
  console.log("=========================================");
  console.log(`- الاسم: ${testTeacher.fullName}`);
  console.log(`- البريد الإلكتروني: ${testTeacher.email}`);
  console.log(`- كلمة المرور: password123`);
  console.log(`- الدور: TEACHER (معلم)`);
  console.log(`- نوع التعليم: ONSITE_SUMMER (الدورة الصيفية)`);
  console.log("=========================================\n");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
