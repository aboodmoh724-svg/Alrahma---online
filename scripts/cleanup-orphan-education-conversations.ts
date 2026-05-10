import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const orphanConversations = await prisma.educationConversation.findMany({
    where: {
      type: "SUPERVISION_TEACHER",
      teacherId: null,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  console.log(`Orphan supervision-teacher conversations: ${orphanConversations.length}`);
  for (const conversation of orphanConversations.slice(0, 50)) {
    console.log(
      `${conversation.id} messages=${conversation._count.messages} updatedAt=${conversation.updatedAt.toISOString()}`
    );
  }
  if (orphanConversations.length > 50) {
    console.log(`...and ${orphanConversations.length - 50} more`);
  }

  if (dryRun || orphanConversations.length === 0) {
    console.log(dryRun ? "Dry run only. No conversations were deleted." : "No cleanup needed.");
    return;
  }

  const result = await prisma.educationConversation.deleteMany({
    where: {
      id: {
        in: orphanConversations.map((conversation) => conversation.id),
      },
    },
  });

  console.log(`Deleted conversations: ${result.count}`);
}

main()
  .catch((error) => {
    console.error("CLEANUP ORPHAN EDUCATION CONVERSATIONS ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
