-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'TRADER', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."FollowStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CryptoNetwork" AS ENUM ('BASE', 'TRON', 'POLYGON', 'ETHEREUM');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "userRole" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."trader_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "priceMonthlyUSD" INTEGER NOT NULL DEFAULT 0,
    "statsJson" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trader_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crypto_address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" "public"."CryptoNetwork" NOT NULL,
    "address" TEXT NOT NULL,
    "derivationPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "status" "public"."FollowStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crypto_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT,
    "network" "public"."CryptoNetwork" NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountToken" DECIMAL(38,18) NOT NULL,
    "amountUSD" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "plan" TEXT NOT NULL,
    "daysGranted" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."signal" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "ttlSec" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trader_profile_userId_key" ON "public"."trader_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_address_address_key" ON "public"."crypto_address"("address");

-- CreateIndex
CREATE INDEX "crypto_address_userId_idx" ON "public"."crypto_address"("userId");

-- CreateIndex
CREATE INDEX "follow_traderId_idx" ON "public"."follow"("traderId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_userId_traderId_key" ON "public"."follow"("userId", "traderId");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_payment_txHash_key" ON "public"."crypto_payment"("txHash");

-- CreateIndex
CREATE INDEX "crypto_payment_userId_idx" ON "public"."crypto_payment"("userId");

-- CreateIndex
CREATE INDEX "crypto_payment_txHash_idx" ON "public"."crypto_payment"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "signal_hash_key" ON "public"."signal"("hash");

-- CreateIndex
CREATE INDEX "signal_traderId_idx" ON "public"."signal"("traderId");

-- CreateIndex
CREATE INDEX "signal_createdAt_idx" ON "public"."signal"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."trader_profile" ADD CONSTRAINT "trader_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crypto_address" ADD CONSTRAINT "crypto_address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow" ADD CONSTRAINT "follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow" ADD CONSTRAINT "follow_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crypto_payment" ADD CONSTRAINT "crypto_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crypto_payment" ADD CONSTRAINT "crypto_payment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."crypto_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."signal" ADD CONSTRAINT "signal_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
