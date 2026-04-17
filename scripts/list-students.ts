import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

  console.log(students);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });