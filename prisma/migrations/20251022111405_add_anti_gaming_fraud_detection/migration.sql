-- AlterTable
ALTER TABLE "public"."trader_invitation" ADD COLUMN     "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "signupIp" TEXT,
ADD COLUMN     "suspiciousReason" TEXT;

-- CreateTable
CREATE TABLE "public"."fraud_log" (
    "id" TEXT NOT NULL,
    "traderId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "severity" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_log_traderId_idx" ON "public"."fraud_log"("traderId");

-- CreateIndex
CREATE INDEX "fraud_log_userId_idx" ON "public"."fraud_log"("userId");

-- CreateIndex
CREATE INDEX "fraud_log_type_idx" ON "public"."fraud_log"("type");

-- CreateIndex
CREATE INDEX "fraud_log_severity_idx" ON "public"."fraud_log"("severity");

-- CreateIndex
CREATE INDEX "fraud_log_resolved_idx" ON "public"."fraud_log"("resolved");

-- CreateIndex
CREATE INDEX "fraud_log_createdAt_idx" ON "public"."fraud_log"("createdAt");
