-- CreateEnum
CREATE TYPE "public"."InvitationSource" AS ENUM ('EMAIL', 'LINK', 'SOCIAL_TWITTER', 'SOCIAL_TELEGRAM', 'SOCIAL_WHATSAPP');

-- CreateEnum
CREATE TYPE "public"."CreditType" AS ENUM ('EARNED_SIGNUP', 'EARNED_ACTIVE', 'EARNED_UPGRADE_PRO', 'EARNED_UPGRADE_ULTRA', 'EARNED_RETENTION_3M', 'SPENT_PRO_MONTH', 'SPENT_ULTRA_MONTH', 'SPENT_FEATURED', 'SPENT_ANALYTICS', 'SPENT_PROFILE_BOOST', 'SPENT_CUSTOM_BADGE', 'CLAWBACK_FRAUD');

-- AlterTable
ALTER TABLE "public"."trader_invitation" ADD COLUMN     "source" "public"."InvitationSource" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "customMessage" TEXT,
ADD COLUMN     "landingViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clickedAt" TIMESTAMP(3),
ADD COLUMN     "creditsAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inviteeActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviteeUpgraded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviteeUpgradedPlan" TEXT,
ADD COLUMN     "inviteeUpgradedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "trader_invitation_source_idx" ON "public"."trader_invitation"("source");

-- CreateTable
CREATE TABLE "public"."referral_credit" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."CreditType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_reward" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "action" TEXT NOT NULL,
    "creditsAwarded" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_credit_traderId_idx" ON "public"."referral_credit"("traderId");

-- CreateIndex
CREATE INDEX "referral_credit_createdAt_idx" ON "public"."referral_credit"("createdAt");

-- CreateIndex
CREATE INDEX "referral_credit_type_idx" ON "public"."referral_credit"("type");

-- CreateIndex
CREATE INDEX "referral_reward_traderId_idx" ON "public"."referral_reward"("traderId");

-- CreateIndex
CREATE INDEX "referral_reward_createdAt_idx" ON "public"."referral_reward"("createdAt");

-- CreateIndex
CREATE INDEX "referral_reward_action_idx" ON "public"."referral_reward"("action");

-- AddForeignKey
ALTER TABLE "public"."referral_credit" ADD CONSTRAINT "referral_credit_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_reward" ADD CONSTRAINT "referral_reward_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
