-- AlterTable
ALTER TABLE "public"."crypto_address" ADD COLUMN     "sweptAt" TIMESTAMP(3),
ADD COLUMN     "sweptTxHash" TEXT;

-- CreateIndex
CREATE INDEX "crypto_address_sweptAt_idx" ON "public"."crypto_address"("sweptAt");
