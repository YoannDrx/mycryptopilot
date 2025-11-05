-- CreateTable
CREATE TABLE "public"."risk_calculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capital" DECIMAL(20,2) NOT NULL,
    "riskPercent" DECIMAL(5,2) NOT NULL,
    "entryPrice" DECIMAL(20,8) NOT NULL,
    "stopLoss" DECIMAL(20,8) NOT NULL,
    "positionType" TEXT NOT NULL,
    "takeProfits" JSONB NOT NULL,
    "riskAmount" DECIMAL(20,8) NOT NULL,
    "positionSize" DECIMAL(20,8) NOT NULL,
    "contracts" DECIMAL(20,8) NOT NULL,
    "rrRatio" DECIMAL(10,4) NOT NULL,
    "symbol" TEXT,
    "notes" TEXT,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "presetName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_calculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_calculation_userId_createdAt_idx" ON "public"."risk_calculation"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "risk_calculation_userId_isPreset_idx" ON "public"."risk_calculation"("userId", "isPreset");

-- AddForeignKey
ALTER TABLE "public"."risk_calculation" ADD CONSTRAINT "risk_calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
