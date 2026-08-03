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

    console.log("Sending test progress reports with high-quality PDF attachments to +90 546 492 45 10...");

    const res = await fetch("http://127.0.0.1:3005/api/summer/admin/send-progress-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `alrahma_user_id=${admin.id}`,
      },
      body: JSON.stringify({
        overridePhone: "905464924510",
        limit: 3,
        sendAsDocument: true,
        mediaFormat: "pdf",
      }),
    });

    const data = await res.json();
    console.log("Broadcast Test Result:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error running test send script:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
