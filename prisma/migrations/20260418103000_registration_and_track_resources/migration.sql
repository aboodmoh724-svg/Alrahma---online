CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE IF NOT EXISTS "TrackResource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "track" TEXT,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrackResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RegistrationRequest" (
  "id" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "previousStudent" BOOLEAN NOT NULL DEFAULT false,
  "birthDate" TIMESTAMP(3),
  "grade" TEXT,
  "gender" TEXT,
  "country" TEXT,
  "preferredPeriod" TEXT,
  "parentWhatsapp" TEXT NOT NULL,
  "parentEmail" TEXT,
  "previousStudy" TEXT,
  "memorizedAmount" TEXT,
  "hasLearningIssues" BOOLEAN NOT NULL DEFAULT false,
  "learningIssuesNote" TEXT,
  "hasDevice" BOOLEAN NOT NULL DEFAULT false,
  "requestedTracks" TEXT,
  "notes" TEXT,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "createdStudentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TrackResource" ("id", "title", "description", "track", "fileUrl", "fileName", "updatedAt")
VALUES
  ('track-resource-hijaa-system', 'نظام الفصول التعليمية - مسار الهجاء', 'ملف تعريفي وتنظيمي لمسار الهجاء.', 'HIJAA', '/uploads/track-resources/hijaa-system.pdf', 'hijaa-system.pdf', CURRENT_TIMESTAMP),
  ('track-resource-rubai-system', 'نظام الفصول التعليمية - المسار الرباعي', 'ملف تعريفي وتنظيمي للمسار الرباعي.', 'RUBAI', '/uploads/track-resources/rubai-system.pdf', 'rubai-system.pdf', CURRENT_TIMESTAMP),
  ('track-resource-fardi-system', 'نظام الفصول التعليمية - المسار الفردي', 'ملف تعريفي وتنظيمي للمسار الفردي.', 'FARDI', '/uploads/track-resources/fardi-system.pdf', 'fardi-system.pdf', CURRENT_TIMESTAMP),
  ('track-resource-tilawa-system', 'نظام الفصول التعليمية - مسار التلاوة', 'ملف تعريفي وتنظيمي لمسار التلاوة.', 'TILAWA', '/uploads/track-resources/tilawa-system.pdf', 'tilawa-system.pdf', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
