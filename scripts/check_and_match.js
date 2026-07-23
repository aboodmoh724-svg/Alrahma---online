const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndLink() {
  console.log('=== Checking Summer Circles & Students ===');

  // Fetch all ONSITE_SUMMER circles
  const summerCircles = await prisma.circle.findMany({
    where: { studyMode: 'ONSITE_SUMMER' },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      students: { select: { id: true, fullName: true, parentWhatsapp: true } },
    },
  });

  console.log(`Found ${summerCircles.length} summer circles.`);
  summerCircles.forEach((c) => {
    console.log(`Circle [${c.id}]: "${c.name}" | Teacher: ${c.teacher?.fullName} | Students: ${c.students.length}`);
  });

  // Fetch all ONSITE_SUMMER students
  const summerStudents = await prisma.student.findMany({
    where: { studyMode: 'ONSITE_SUMMER' },
    include: {
      circle: true,
      teacher: true,
    },
  });

  console.log(`\nTotal Summer Students: ${summerStudents.length}`);

  // Fetch all non-summer students to check for matching parentWhatsapp
  const otherStudents = await prisma.student.findMany({
    where: {
      studyMode: { not: 'ONSITE_SUMMER' },
      parentWhatsapp: { not: null },
    },
    select: {
      id: true,
      fullName: true,
      parentWhatsapp: true,
      studyMode: true,
    },
  });

  console.log(`Found ${otherStudents.length} students in other modes with parentWhatsapp.`);

  // Try matching
  let matchedCount = 0;
  summerStudents.forEach((st) => {
    const cleanName = st.fullName.trim();
    // find match
    const match = otherStudents.find((os) => {
      const osName = os.fullName.trim();
      return osName === cleanName || osName.includes(cleanName) || cleanName.includes(osName);
    });

    if (match && match.parentWhatsapp) {
      matchedCount++;
      console.log(`🎯 Match found: Summer Student "${st.fullName}" <-> Afyon/Other Student "${match.fullName}" (${match.studyMode}) => WhatsApp: ${match.parentWhatsapp}`);
    }
  });

  console.log(`Total matches found: ${matchedCount} / ${summerStudents.length}`);
}

checkAndLink()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
