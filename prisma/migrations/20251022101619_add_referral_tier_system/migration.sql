-- CreateEnum
CREATE TYPE "public"."TierLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateTable
CREATE TABLE "public"."referral_tier" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "tier" "public"."TierLevel" NOT NULL DEFAULT 'BRONZE',
    "activeInvitesCount" INTEGER NOT NULL DEFAULT 0,
    "tierUpgradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_tier_traderId_key" ON "public"."referral_tier"("traderId");

-- CreateIndex
CREATE INDEX "referral_tier_tier_idx" ON "public"."referral_tier"("tier");

-- CreateIndex
CREATE INDEX "referral_tier_activeInvitesCount_idx" ON "public"."referral_tier"("activeInvitesCount");

-- AddForeignKey
ALTER TABLE "public"."referral_tier" ADD CONSTRAINT "referral_tier_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
