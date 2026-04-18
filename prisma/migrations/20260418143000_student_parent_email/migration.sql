ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT;

UPDATE "Student"
SET "parentEmail" = "RegistrationRequest"."parentEmail"
FROM "RegistrationRequest"
WHERE "RegistrationRequest"."createdStudentId" = "Student"."id"
  AND "Student"."parentEmail" IS NULL;
