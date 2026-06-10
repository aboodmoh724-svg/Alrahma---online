-- AlterTable
ALTER TABLE "MeetingMinute" ADD COLUMN "htmlPath" TEXT;
ALTER TABLE "MeetingMinute" ADD COLUMN "pdfPath" TEXT;
ALTER TABLE "MeetingMinute" ADD COLUMN "pdfGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MeetingMinuteRecipient" (
    "id" TEXT NOT NULL,
    "studyMode" "StudyMode" NOT NULL DEFAULT 'REMOTE',
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMinuteRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMinuteRecipient_studyMode_phone_key" ON "MeetingMinuteRecipient"("studyMode", "phone");

-- CreateIndex
CREATE INDEX "MeetingMinuteRecipient_studyMode_isActive_idx" ON "MeetingMinuteRecipient"("studyMode", "isActive");
