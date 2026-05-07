import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwords";

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: "test@test.com" },
  });

  if (existingUser) {
    console.log("User already exists:", existingUser);
    return;
  }

  const user = await prisma.user.create({
    data: {
      fullName: "dahabia",
      email: "test@test.com",
      password: hashPassword("test"),
      role: "ADMIN",
      studyMode: "REMOTE",
    },
  });

  console.log("User created successfully:", user);
}

main()
  .catch((error) => {
    console.error("CREATE USER ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
