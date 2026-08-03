const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (!admin) {
      console.error("No active admin user found in database");
      process.exit(1);
    }

    console.log("=== STARTING SMART BROADCAST OF SUMMER PROGRESS REPORTS ===");

    const res = await fetch("http://127.0.0.1:3005/api/summer/admin/send-progress-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `alrahma_user_id=${admin.id}`,
      },
      body: JSON.stringify({
        sendAsDocument: false, // Text + Verified Link Only
      }),
    });

    const data = await res.json();
    console.log("\n=================== FULL BROADCAST RESULT ===================");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error executing broadcast:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
