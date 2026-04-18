DO $$ BEGIN
  CREATE TYPE "ParentSentChannel" AS ENUM ('EMAIL', 'WHATSAPP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "parentSentAt" TIMESTAMP(3);
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "parentSentChannel" "ParentSentChannel";
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "parentSentError" TEXT;
