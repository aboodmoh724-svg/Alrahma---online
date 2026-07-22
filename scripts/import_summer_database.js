const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const normalized = String(password || '');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, 64).toString('hex');
  return `scrypt$1$${salt}$${hash}`;
}

// Helper to normalize teacher emails
function makeTeacherEmail(teacherName) {
  const clean = teacherName.trim();
  if (clean.includes('أسامة سليمان')) return 'osama@test.com';
  if (clean.includes('راعي جوخة')) return 'ahmad_raei@test.com';
  if (clean.includes('ريان')) return 'rayan@test.com';
  if (clean.includes('أحمد القط')) return 'ahmad_alqatt@test.com';
  if (clean.includes('عبدالله اليحيى')) return 'abdullah@test.com';
  if (clean.includes('محسن')) return 'mohsen@test.com';
  if (clean.includes('العمري')) return 'abdulrahman@test.com';

  const firstWord = clean.split(/[\s\/_]+/)[0];
  return `${firstWord.toLowerCase()}@test.com`;
}

async function main() {
  console.log('🚀 Starting import of Summer Program Students, Circles, and Teachers...');

  const filePath = 'C:\\Users\\amohm\\Downloads\\بيانات الطلاب والحلقات.xls';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row
  const dataRows = rows.slice(1).filter((r) => r && r[0] && r[1] && r[2]);
  console.log(`Found ${dataRows.length} valid student rows in Excel.`);

  const passwordHash = hashPassword('12345');

  // Map to store created teachers and circles
  const teacherMap = new Map();
  const circleMap = new Map();

  let codeCounter = 7001;

  for (const row of dataRows) {
    const studentName = String(row[0]).trim();
    const circleName = String(row[1]).trim();
    const teacherName = String(row[2]).trim();

    // 1. Create or Find Teacher
    let teacher = teacherMap.get(teacherName);
    if (!teacher) {
      const email = makeTeacherEmail(teacherName);
      
      teacher = await prisma.user.upsert({
        where: { email },
        create: {
          fullName: teacherName,
          email,
          password: passwordHash,
          role: 'TEACHER',
          studyMode: 'ONSITE_SUMMER',
          isActive: true,
        },
        update: {
          fullName: teacherName,
          password: passwordHash,
          role: 'TEACHER',
          studyMode: 'ONSITE_SUMMER',
          isActive: true,
        },
      });

      teacherMap.set(teacherName, teacher);
      console.log(`✅ Teacher Account Created: ${teacher.fullName} (${teacher.email})`);
    }

    // 2. Create or Find Circle
    const circleKey = `${circleName}_${teacher.id}`;
    let circle = circleMap.get(circleKey);
    if (!circle) {
      circle = await prisma.circle.findFirst({
        where: { name: circleName, teacherId: teacher.id, studyMode: 'ONSITE_SUMMER' },
      });

      if (!circle) {
        circle = await prisma.circle.create({
          data: {
            name: circleName,
            teacherId: teacher.id,
            studyMode: 'ONSITE_SUMMER',
          },
        });
      }
      circleMap.set(circleKey, circle);
      console.log(`🏫 Circle Created: ${circle.name} (Teacher: ${teacher.fullName})`);
    }

    // 3. Determine Summer Group (QURAN or NOOR_AL_BAYAN)
    const summerGroup = circleName.includes('نور البيان') ? 'NOOR_AL_BAYAN' : 'QURAN';

    // 4. Create or Update Student
    const studentCode = String(codeCounter++);
    
    // Check if student exists
    const existingStudent = await prisma.student.findFirst({
      where: { fullName: studentName, studyMode: 'ONSITE_SUMMER' },
    });

    if (!existingStudent) {
      await prisma.student.create({
        data: {
          fullName: studentName,
          studentCode,
          studyMode: 'ONSITE_SUMMER',
          summerGroup,
          circleId: circle.id,
          teacherId: teacher.id,
          isActive: true,
        },
      });
      console.log(`👦 Student Added: ${studentName} (#${studentCode}) -> ${circleName}`);
    } else {
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          summerGroup,
          circleId: circle.id,
          teacherId: teacher.id,
          isActive: true,
        },
      });
      console.log(`🔄 Student Updated: ${studentName}`);
    }
  }

  console.log('\n🎉 ALL TEACHERS, CIRCLES, AND STUDENTS IMPORTED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Import Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
