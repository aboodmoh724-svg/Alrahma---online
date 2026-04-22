-- Add finance access flag to users.
ALTER TABLE "User" ADD COLUMN "canAccessFinance" BOOLEAN NOT NULL DEFAULT false;

-- Keep current remote admins able to open finance after the migration.
UPDATE "User"
SET "canAccessFinance" = true
WHERE "role" = 'ADMIN' AND "studyMode" = 'REMOTE' AND "isActive" = true;
