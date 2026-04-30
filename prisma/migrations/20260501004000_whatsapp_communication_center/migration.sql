ALTER TYPE "WhatsAppIncomingCategory" ADD VALUE IF NOT EXISTS 'COMPLAINT';
ALTER TYPE "WhatsAppIncomingCategory" ADD VALUE IF NOT EXISTS 'INQUIRY';
ALTER TYPE "WhatsAppIncomingCategory" ADD VALUE IF NOT EXISTS 'THANKS';
ALTER TYPE "WhatsAppIncomingCategory" ADD VALUE IF NOT EXISTS 'CONFIRMATION';
ALTER TYPE "WhatsAppIncomingCategory" ADD VALUE IF NOT EXISTS 'STRUGGLE_REPLY';

CREATE TYPE "WhatsAppFollowUpStatus" AS ENUM ('NEW', 'IN_REVIEW', 'REPLIED', 'CLOSED', 'ESCALATED');

CREATE TABLE "WhatsAppOutgoingMessage" (
  "id" TEXT NOT NULL,
  "messageId" TEXT,
  "channel" "StudyMode" NOT NULL,
  "toNumber" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" "WhatsAppIncomingCategory" NOT NULL DEFAULT 'GENERAL',
  "studentId" TEXT,
  "registrationRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsAppOutgoingMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WhatsAppIncomingMessage"
ADD COLUMN "followUpStatus" "WhatsAppFollowUpStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "supervisorNote" TEXT,
ADD COLUMN "lastOutgoingMessageId" TEXT;

CREATE INDEX "WhatsAppOutgoingMessage_channel_toNumber_createdAt_idx" ON "WhatsAppOutgoingMessage"("channel", "toNumber", "createdAt");
CREATE INDEX "WhatsAppOutgoingMessage_studentId_idx" ON "WhatsAppOutgoingMessage"("studentId");
CREATE INDEX "WhatsAppOutgoingMessage_registrationRequestId_idx" ON "WhatsAppOutgoingMessage"("registrationRequestId");
CREATE INDEX "WhatsAppIncomingMessage_lastOutgoingMessageId_idx" ON "WhatsAppIncomingMessage"("lastOutgoingMessageId");

ALTER TABLE "WhatsAppOutgoingMessage"
ADD CONSTRAINT "WhatsAppOutgoingMessage_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppOutgoingMessage"
ADD CONSTRAINT "WhatsAppOutgoingMessage_registrationRequestId_fkey"
FOREIGN KEY ("registrationRequestId") REFERENCES "RegistrationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppIncomingMessage"
ADD CONSTRAINT "WhatsAppIncomingMessage_lastOutgoingMessageId_fkey"
FOREIGN KEY ("lastOutgoingMessageId") REFERENCES "WhatsAppOutgoingMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
