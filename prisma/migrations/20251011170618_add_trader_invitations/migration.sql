-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."trader_invitation" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trader_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trader_invitation_token_key" ON "public"."trader_invitation"("token");

-- CreateIndex
CREATE INDEX "trader_invitation_token_idx" ON "public"."trader_invitation"("token");

-- CreateIndex
CREATE INDEX "trader_invitation_traderId_idx" ON "public"."trader_invitation"("traderId");

-- CreateIndex
CREATE INDEX "trader_invitation_status_idx" ON "public"."trader_invitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trader_invitation_traderId_email_key" ON "public"."trader_invitation"("traderId", "email");

-- AddForeignKey
ALTER TABLE "public"."trader_invitation" ADD CONSTRAINT "trader_invitation_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
