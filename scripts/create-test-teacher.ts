import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: "teacher@test.com" },
  });

  if (existingUser) {
    console.log("Teacher already exists:", existingUser);
    return;
  }

  const teacher = await prisma.user.create({
    data: {
      fullName: "Teacher Test",
      email: "teacher@test.com",
      password: "test",
      role: "TEACHER",
      studyMode: "REMOTE",
    },
  });

  console.log("Teacher created successfully:", teacher);
}

main()
  .catch((error) => {
    console.error("CREATE TEACHER ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });