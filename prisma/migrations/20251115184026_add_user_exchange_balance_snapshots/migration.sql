/*
  Warnings:

  - You are about to drop the column `available_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `captured_at` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `connection_id` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `futures_equity_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `locked_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `margin_equity_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `payload_json` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `spot_equity_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `total_equity_usd` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_exchange_balance_snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `last_health_check_at` on the `user_exchange_connection` table. All the data in the column will be lost.
  - Added the required column `availableUsd` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `connectionId` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lockedUsd` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalEquityUsd` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `user_exchange_balance_snapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."user_exchange_balance_snapshot" DROP CONSTRAINT "user_exchange_balance_snapshot_connection_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_exchange_balance_snapshot" DROP CONSTRAINT "user_exchange_balance_snapshot_user_id_fkey";

-- DropIndex
DROP INDEX "public"."user_exchange_balance_snapshot_connection_id_idx";

-- DropIndex
DROP INDEX "public"."user_exchange_balance_snapshot_user_id_idx";

-- AlterTable
ALTER TABLE "public"."user_exchange_balance_snapshot" DROP COLUMN "available_usd",
DROP COLUMN "captured_at",
DROP COLUMN "connection_id",
DROP COLUMN "created_at",
DROP COLUMN "futures_equity_usd",
DROP COLUMN "locked_usd",
DROP COLUMN "margin_equity_usd",
DROP COLUMN "payload_json",
DROP COLUMN "spot_equity_usd",
DROP COLUMN "total_equity_usd",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "availableUsd" DECIMAL(32,8) NOT NULL,
ADD COLUMN     "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "connectionId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "futuresEquityUsd" DECIMAL(32,8),
ADD COLUMN     "lockedUsd" DECIMAL(32,8) NOT NULL,
ADD COLUMN     "marginEquityUsd" DECIMAL(32,8),
ADD COLUMN     "payloadJson" JSONB,
ADD COLUMN     "spotEquityUsd" DECIMAL(32,8),
ADD COLUMN     "totalEquityUsd" DECIMAL(32,8) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_exchange_connection" DROP COLUMN "last_health_check_at",
ADD COLUMN     "lastHealthCheckAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_exchange_balance_snapshot_connectionId_capturedAt_idx" ON "public"."user_exchange_balance_snapshot"("connectionId", "capturedAt");

-- CreateIndex
CREATE INDEX "user_exchange_balance_snapshot_userId_capturedAt_idx" ON "public"."user_exchange_balance_snapshot"("userId", "capturedAt");

-- AddForeignKey
ALTER TABLE "public"."user_exchange_balance_snapshot" ADD CONSTRAINT "user_exchange_balance_snapshot_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "public"."user_exchange_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exchange_balance_snapshot" ADD CONSTRAINT "user_exchange_balance_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
