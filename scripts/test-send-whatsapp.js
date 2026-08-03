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

    console.log("Checking WhatsApp status...");
    const statusRes = await fetch("http://127.0.0.1:3005/api/summer/admin/whatsapp-status", {
      headers: { Cookie: `alrahma_user_id=${admin.id}` },
    });
    const statusData = await statusRes.json();
    console.log("WhatsApp Status:", JSON.stringify(statusData, null, 2));

    if (!statusData.ready) {
      console.log("\n⚠️ WhatsApp Client is NOT ready. QR code required or WhatsApp session needs to be authenticated in Admin Dashboard!");
    }
  } catch (err) {
    console.error("Error checking WhatsApp status:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
