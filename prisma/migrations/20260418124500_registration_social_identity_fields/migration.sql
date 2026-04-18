ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "fatherAlive" BOOLEAN;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "motherAlive" BOOLEAN;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "livingWith" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "fatherEducation" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "motherEducation" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "idImageUrl" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN IF NOT EXISTS "idImageFileName" TEXT;
