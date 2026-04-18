ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentWhatsapp" TEXT;

UPDATE "Student"
SET "parentWhatsapp" = "RegistrationRequest"."parentWhatsapp"
FROM "RegistrationRequest"
WHERE "RegistrationRequest"."createdStudentId" = "Student"."id"
  AND "Student"."parentWhatsapp" IS NULL;
