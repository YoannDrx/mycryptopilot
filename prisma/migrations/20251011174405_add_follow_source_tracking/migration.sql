-- CreateEnum
CREATE TYPE "public"."FollowSource" AS ENUM ('DIRECT', 'INVITATION', 'REFERRAL');

-- AlterTable
ALTER TABLE "public"."follow" ADD COLUMN     "invitationId" TEXT,
ADD COLUMN     "source" "public"."FollowSource" NOT NULL DEFAULT 'DIRECT';

-- CreateIndex
CREATE INDEX "follow_source_idx" ON "public"."follow"("source");
