CREATE TABLE IF NOT EXISTS "WhatsAppReplyMemory" (
  "id" TEXT NOT NULL,
  "incomingMessageId" TEXT NOT NULL,
  "outgoingMessageId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "editedAnswer" TEXT,
  "category" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppReplyMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppReplyMemory_incomingMessageId_outgoingMessageId_key"
ON "WhatsAppReplyMemory"("incomingMessageId", "outgoingMessageId");

CREATE INDEX IF NOT EXISTS "WhatsAppReplyMemory_status_createdAt_idx"
ON "WhatsAppReplyMemory"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "WhatsAppReplyMemory_category_idx"
ON "WhatsAppReplyMemory"("category");
