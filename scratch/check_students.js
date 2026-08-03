const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const students = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SUMMER",
        OR: [
          { fullName: { contains: "موسى" } },
          { fullName: { contains: "طاقوت" } },
          { fullName: { contains: "رستم" } },
        ],
      },
      select: { id: true, studentCode: true, fullName: true, isActive: true, studyMode: true },
    });

    console.log("Matching Students in DB:");
    console.log(JSON.stringify(students, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

check();
