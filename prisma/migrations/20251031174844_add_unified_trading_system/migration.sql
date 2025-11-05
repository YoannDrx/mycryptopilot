-- CreateEnum
CREATE TYPE "public"."TradeSource" AS ENUM ('BINANCE', 'BYBIT', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."InstrumentType" AS ENUM ('SPOT', 'FUTURES');

-- CreateEnum
CREATE TYPE "public"."TradeStatus" AS ENUM ('OPEN', 'CLOSED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."CopyMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "public"."CopyStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."exchange_trade" ADD COLUMN     "traderTradeId" TEXT;

-- AlterTable
ALTER TABLE "public"."signal" ADD COLUMN     "linkedTradeId" TEXT;

-- CreateTable
CREATE TABLE "public"."trader_trade" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "source" "public"."TradeSource" NOT NULL,
    "instrumentType" "public"."InstrumentType" NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" "public"."TradeStatus" NOT NULL,
    "side" "public"."TradeSide" NOT NULL,
    "totalQuantity" DECIMAL(20,8) NOT NULL,
    "averageEntry" DECIMAL(20,8) NOT NULL,
    "averageExit" DECIMAL(20,8),
    "stopLoss" DECIMAL(20,8),
    "takeProfit" JSONB,
    "realizedPnl" DECIMAL(20,8),
    "fees" DECIMAL(20,8) NOT NULL,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trader_trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_exchange_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchange" "public"."Exchange" NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "encryptedSecretKey" TEXT NOT NULL,
    "keyIv" TEXT NOT NULL,
    "keyTag" TEXT NOT NULL,
    "mode" "public"."CopyMode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_exchange_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."copy_trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalTradeId" TEXT NOT NULL,
    "mode" "public"."CopyMode" NOT NULL,
    "status" "public"."CopyStatus" NOT NULL,
    "exchangeOrderId" TEXT,
    "executedPrice" DECIMAL(20,8),
    "executedQuantity" DECIMAL(20,8),
    "slippage" DECIMAL(10,4),
    "manualEntry" DECIMAL(20,8),
    "manualExit" DECIMAL(20,8),
    "manualPnl" DECIMAL(20,8),
    "notes" TEXT,
    "stopLoss" DECIMAL(20,8),
    "takeProfit" JSONB,
    "copiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copy_trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trader_trade_traderProfileId_status_idx" ON "public"."trader_trade"("traderProfileId", "status");

-- CreateIndex
CREATE INDEX "trader_trade_symbol_idx" ON "public"."trader_trade"("symbol");

-- CreateIndex
CREATE INDEX "trader_trade_openedAt_idx" ON "public"."trader_trade"("openedAt");

-- CreateIndex
CREATE INDEX "user_exchange_connection_userId_idx" ON "public"."user_exchange_connection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_exchange_connection_userId_exchange_key" ON "public"."user_exchange_connection"("userId", "exchange");

-- CreateIndex
CREATE INDEX "copy_trade_userId_status_idx" ON "public"."copy_trade"("userId", "status");

-- CreateIndex
CREATE INDEX "copy_trade_originalTradeId_idx" ON "public"."copy_trade"("originalTradeId");

-- CreateIndex
CREATE INDEX "exchange_trade_traderTradeId_idx" ON "public"."exchange_trade"("traderTradeId");

-- CreateIndex
CREATE INDEX "signal_linkedTradeId_idx" ON "public"."signal"("linkedTradeId");

-- AddForeignKey
ALTER TABLE "public"."exchange_trade" ADD CONSTRAINT "exchange_trade_traderTradeId_fkey" FOREIGN KEY ("traderTradeId") REFERENCES "public"."trader_trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."signal" ADD CONSTRAINT "signal_linkedTradeId_fkey" FOREIGN KEY ("linkedTradeId") REFERENCES "public"."trader_trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trader_trade" ADD CONSTRAINT "trader_trade_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "public"."trader_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exchange_connection" ADD CONSTRAINT "user_exchange_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."copy_trade" ADD CONSTRAINT "copy_trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."copy_trade" ADD CONSTRAINT "copy_trade_originalTradeId_fkey" FOREIGN KEY ("originalTradeId") REFERENCES "public"."trader_trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
