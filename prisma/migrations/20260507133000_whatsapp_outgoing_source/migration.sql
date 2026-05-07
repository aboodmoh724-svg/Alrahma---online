ALTER TABLE "WhatsAppOutgoingMessage"
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS "context" JSONB;

CREATE INDEX IF NOT EXISTS "WhatsAppOutgoingMessage_source_createdAt_idx"
ON "WhatsAppOutgoingMessage"("source", "createdAt");
