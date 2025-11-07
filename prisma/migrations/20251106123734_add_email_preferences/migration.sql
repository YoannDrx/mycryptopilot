/*
  Warnings:

  - You are about to drop the column `activeOrganizationId` on the `session` table. All the data in the column will be lost.
  - You are about to drop the `invitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `legacy_org_slugs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."invitation" DROP CONSTRAINT "invitation_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invitation" DROP CONSTRAINT "invitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."legacy_org_slugs" DROP CONSTRAINT "legacy_org_slugs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."member" DROP CONSTRAINT "member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."member" DROP CONSTRAINT "member_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscription" DROP CONSTRAINT "subscription_referenceId_fkey";

-- AlterTable
ALTER TABLE "public"."session" DROP COLUMN "activeOrganizationId";

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifyExchangeSyncFailures" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifyMarketingUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailNotifyNewSignals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifySubscriptionReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifyTraderInvitations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifyWeeklyPerformance" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "public"."invitation";

-- DropTable
DROP TABLE "public"."legacy_org_slugs";

-- DropTable
DROP TABLE "public"."member";

-- DropTable
DROP TABLE "public"."organization";

-- DropTable
DROP TABLE "public"."subscription";
