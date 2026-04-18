ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "readGuidelines" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "audioFileName" TEXT;
