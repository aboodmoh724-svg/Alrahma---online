CREATE TYPE "WhatsAppIncomingCategory" AS ENUM ('GENERAL', 'INTERVIEW_RESCHEDULE', 'ABSENCE_EXCUSE');

ALTER TABLE "RegistrationRequest"
ADD COLUMN "interviewResult" TEXT,
ADD COLUMN "interviewLevel" TEXT,
ADD COLUMN "interviewDecision" TEXT;

CREATE TABLE "WhatsAppIncomingMessage" (
  "id" TEXT NOT NULL,
  "messageId" TEXT,
  "channel" "StudyMode" NOT NULL,
  "fromNumber" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" "WhatsAppIncomingCategory" NOT NULL DEFAULT 'GENERAL',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "raw" JSONB,
  "studentId" TEXT,
  "registrationRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WhatsAppIncomingMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppIncomingMessage_messageId_key" ON "WhatsAppIncomingMessage"("messageId");
CREATE INDEX "WhatsAppIncomingMessage_channel_isRead_createdAt_idx" ON "WhatsAppIncomingMessage"("channel", "isRead", "createdAt");
CREATE INDEX "WhatsAppIncomingMessage_fromNumber_idx" ON "WhatsAppIncomingMessage"("fromNumber");
CREATE INDEX "WhatsAppIncomingMessage_studentId_idx" ON "WhatsAppIncomingMessage"("studentId");
CREATE INDEX "WhatsAppIncomingMessage_registrationRequestId_idx" ON "WhatsAppIncomingMessage"("registrationRequestId");

ALTER TABLE "WhatsAppIncomingMessage"
ADD CONSTRAINT "WhatsAppIncomingMessage_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppIncomingMessage"
ADD CONSTRAINT "WhatsAppIncomingMessage_registrationRequestId_fkey"
FOREIGN KEY ("registrationRequestId") REFERENCES "RegistrationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
