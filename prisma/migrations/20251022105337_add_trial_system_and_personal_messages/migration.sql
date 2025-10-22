-- AlterTable
ALTER TABLE "public"."trader_invitation" ADD COLUMN     "personalMessage" TEXT;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialPlan" TEXT;
