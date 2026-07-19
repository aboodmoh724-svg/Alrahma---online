import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwords";

async function main() {
  const email = "test-teacher@alrahma.com";
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      password: hashPassword("teacher1234")
    }
  });

  console.log(`Password updated successfully for ${email}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
