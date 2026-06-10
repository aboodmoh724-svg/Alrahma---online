CREATE TABLE "MeetingMinute" (
  "id" TEXT NOT NULL,
  "studyMode" "StudyMode" NOT NULL,
  "title" TEXT NOT NULL,
  "meetingType" TEXT,
  "location" TEXT,
  "meetingDate" TIMESTAMP(3),
  "hijriDate" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "preparedAt" TIMESTAMP(3),
  "preparedBy" TEXT,
  "reviewedBy" TEXT,
  "participants" JSONB NOT NULL,
  "agendaItems" JSONB NOT NULL,
  "decisions" JSONB NOT NULL,
  "notes" JSONB NOT NULL,
  "whatsappText" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MeetingMinute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MeetingMinute_studyMode_createdAt_idx"
  ON "MeetingMinute"("studyMode", "createdAt");

CREATE INDEX "MeetingMinute_createdById_idx"
  ON "MeetingMinute"("createdById");

ALTER TABLE "MeetingMinute"
  ADD CONSTRAINT "MeetingMinute_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
