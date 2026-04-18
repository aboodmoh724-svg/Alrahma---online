import "dotenv/config";
import { prisma } from "../lib/prisma";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

async function upsertUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "TEACHER";
  studyMode: "ONSITE";
}) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: input.fullName,
      password: input.password,
      role: input.role,
      studyMode: input.studyMode,
      isActive: true,
    },
    create: {
      fullName: input.fullName,
      email,
      password: input.password,
      role: input.role,
      studyMode: input.studyMode,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      studyMode: true,
      isActive: true,
    },
  });

  return user;
}

async function main() {
  const adminEmail = requiredEnv("ONSITE_ADMIN_EMAIL");
  const adminPassword = requiredEnv("ONSITE_ADMIN_PASSWORD");
  const adminName = (process.env.ONSITE_ADMIN_NAME || "Admin Onsite").trim();

  const teacherEmail = requiredEnv("ONSITE_TEACHER_EMAIL");
  const teacherPassword = requiredEnv("ONSITE_TEACHER_PASSWORD");
  const teacherName = (process.env.ONSITE_TEACHER_NAME || "Teacher Onsite").trim();

  const admin = await upsertUser({
    fullName: adminName,
    email: adminEmail,
    password: adminPassword,
    role: "ADMIN",
    studyMode: "ONSITE",
  });

  const teacher = await upsertUser({
    fullName: teacherName,
    email: teacherEmail,
    password: teacherPassword,
    role: "TEACHER",
    studyMode: "ONSITE",
  });

  console.log("Onsite users ready:");
  console.log({ admin, teacher });
}

main()
  .catch((error) => {
    console.error("CREATE ONSITE USERS ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

