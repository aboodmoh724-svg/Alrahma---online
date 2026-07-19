import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwords";
import { generateStudentCode } from "../lib/student-code";

async function main() {
  const adminEmail = "admin.summer@alrahma.com";
  const teacherEmail = "teacher.summer.test@alrahma.com";

  // 1. Clean up existing test data
  console.log("🧹 تنظيف البيانات التجريبية السابقة...");
  
  // Delete students
  await prisma.student.deleteMany({
    where: {
      fullName: { in: ["طالب تجريبي قرآن", "طالب تجريبي نور بيان"] },
      studyMode: "ONSITE_SUMMER",
    },
  });

  // Delete circles
  await prisma.circle.deleteMany({
    where: {
      name: "حلقة تجريبية (صيفية)",
      studyMode: "ONSITE_SUMMER",
    },
  });

  // Delete admin & teacher
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, teacherEmail] },
    },
  });

  console.log("✅ تم تنظيف قاعدة البيانات.");

  // 2. Create Summer Admin
  const hashedAdminPassword = hashPassword("adminpassword123");
  const summerAdmin = await prisma.user.create({
    data: {
      fullName: "إدارة الدورة الصيفية",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "ADMIN",
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
  });

  // 3. Create Summer Teacher
  const hashedTeacherPassword = hashPassword("password123");
  const summerTeacher = await prisma.user.create({
    data: {
      fullName: "معلم تجريبي (صيفي)",
      email: teacherEmail,
      password: hashedTeacherPassword,
      role: "TEACHER",
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
  });

  // 4. Create Circle
  const circle = await prisma.circle.create({
    data: {
      name: "حلقة تجريبية (صيفية)",
      studyMode: "ONSITE_SUMMER",
      teacherId: summerTeacher.id,
    },
  });

  // 5. Create Test Student (Quran)
  const quranStudentCode = await generateStudentCode("ONSITE_SUMMER");
  const quranStudent = await prisma.student.create({
    data: {
      fullName: "طالب تجريبي قرآن",
      studentCode: quranStudentCode,
      parentWhatsapp: "905555555555",
      studyMode: "ONSITE_SUMMER",
      summerGroup: "QURAN",
      teacherId: summerTeacher.id,
      circleId: circle.id,
      isActive: true,
    },
  });

  // 6. Create Test Student (Noor Al-Bayan)
  const noorStudentCode = await generateStudentCode("ONSITE_SUMMER");
  const noorStudent = await prisma.student.create({
    data: {
      fullName: "طالب تجريبي نور بيان",
      studentCode: noorStudentCode,
      parentWhatsapp: "906666666666",
      studyMode: "ONSITE_SUMMER",
      summerGroup: "NOOR_AL_BAYAN",
      teacherId: summerTeacher.id,
      circleId: circle.id,
      isActive: true,
    },
  });

  console.log("\n=========================================");
  console.log("👑 حساب إدارة الدورة الصيفية الجديد:");
  console.log("=========================================");
  console.log(`- الاسم: ${summerAdmin.fullName}`);
  console.log(`- البريد الإلكتروني: ${summerAdmin.email}`);
  console.log(`- كلمة المرور: adminpassword123`);
  console.log(`- نوع التعليم: ONSITE_SUMMER (الدورة الصيفية)`);
  
  console.log("\n=========================================");
  console.log("👨‍🏫 حساب المعلم التجريبي للدورة الصيفية:");
  console.log("=========================================");
  console.log(`- الاسم: ${summerTeacher.fullName}`);
  console.log(`- البريد الإلكتروني: ${summerTeacher.email}`);
  console.log(`- كلمة المرور: password123`);
  
  console.log("\n=========================================");
  console.log("🏫 الحلقة والطلاب التجريبيين المضافين:");
  console.log("=========================================");
  console.log(`- الحلقة: ${circle.name}`);
  console.log(`- طالب 1 (قرآن): ${quranStudent.fullName} (كود: ${quranStudent.studentCode})`);
  console.log(`- طالب 2 (نور بيان): ${noorStudent.fullName} (كود: ${noorStudent.studentCode})`);
  console.log("=========================================\n");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
