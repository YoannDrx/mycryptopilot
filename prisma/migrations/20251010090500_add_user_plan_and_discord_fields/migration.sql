-- AlterTable: Add plan and Discord fields to user table
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "planName" TEXT;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "dailySignalsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "lastSignalReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "discordId" TEXT;

-- CreateIndex: Add unique constraint on discordId
CREATE UNIQUE INDEX IF NOT EXISTS "user_discordId_key" ON "public"."user"("discordId");
