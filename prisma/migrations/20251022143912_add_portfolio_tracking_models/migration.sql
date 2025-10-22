-- CreateEnum
CREATE TYPE "public"."Exchange" AS ENUM ('BINANCE');

-- CreateEnum
CREATE TYPE "public"."TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT');

-- CreateEnum
CREATE TYPE "public"."PerformancePeriod" AS ENUM ('ALL_TIME', 'LAST_30D', 'LAST_90D', 'LAST_365D');

-- CreateTable
CREATE TABLE "public"."exchange_connection" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "exchange" "public"."Exchange" NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "encryptedSecretKey" TEXT NOT NULL,
    "keyIv" TEXT NOT NULL,
    "keyTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "nextSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_trade" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "public"."TradeSide" NOT NULL,
    "type" "public"."OrderType" NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "quoteQuantity" DECIMAL(20,8) NOT NULL,
    "fee" DECIMAL(20,8) NOT NULL,
    "feeAsset" TEXT NOT NULL,
    "realizedPnl" DECIMAL(20,8),
    "executedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trader_performance_snapshot" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "period" "public"."PerformancePeriod" NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winrate" DECIMAL(5,2) NOT NULL,
    "totalProfits" DECIMAL(20,8) NOT NULL,
    "totalLosses" DECIMAL(20,8) NOT NULL,
    "netPnl" DECIMAL(20,8) NOT NULL,
    "profitFactor" DECIMAL(10,4) NOT NULL,
    "sharpeRatio" DECIMAL(10,4),
    "sortinoRatio" DECIMAL(10,4),
    "maxDrawdown" DECIMAL(10,4) NOT NULL,
    "averageWin" DECIMAL(20,8) NOT NULL,
    "averageLoss" DECIMAL(20,8) NOT NULL,
    "largestWin" DECIMAL(20,8) NOT NULL,
    "largestLoss" DECIMAL(20,8) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trader_performance_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_connection_traderProfileId_idx" ON "public"."exchange_connection"("traderProfileId");

-- CreateIndex
CREATE INDEX "exchange_connection_isActive_nextSyncAt_idx" ON "public"."exchange_connection"("isActive", "nextSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_connection_traderProfileId_exchange_key" ON "public"."exchange_connection"("traderProfileId", "exchange");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_trade_externalOrderId_key" ON "public"."exchange_trade"("externalOrderId");

-- CreateIndex
CREATE INDEX "exchange_trade_connectionId_executedAt_idx" ON "public"."exchange_trade"("connectionId", "executedAt");

-- CreateIndex
CREATE INDEX "exchange_trade_symbol_idx" ON "public"."exchange_trade"("symbol");

-- CreateIndex
CREATE INDEX "exchange_trade_executedAt_idx" ON "public"."exchange_trade"("executedAt");

-- CreateIndex
CREATE INDEX "trader_performance_snapshot_traderProfileId_idx" ON "public"."trader_performance_snapshot"("traderProfileId");

-- CreateIndex
CREATE INDEX "trader_performance_snapshot_calculatedAt_idx" ON "public"."trader_performance_snapshot"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "trader_performance_snapshot_traderProfileId_period_key" ON "public"."trader_performance_snapshot"("traderProfileId", "period");

-- AddForeignKey
ALTER TABLE "public"."exchange_connection" ADD CONSTRAINT "exchange_connection_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "public"."trader_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_trade" ADD CONSTRAINT "exchange_trade_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "public"."exchange_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trader_performance_snapshot" ADD CONSTRAINT "trader_performance_snapshot_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "public"."trader_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
