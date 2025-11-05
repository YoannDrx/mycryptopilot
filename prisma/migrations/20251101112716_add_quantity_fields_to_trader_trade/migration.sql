-- AlterTable
ALTER TABLE "public"."trader_trade" ADD COLUMN     "entryQuantity" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN     "exitQuantity" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN     "netQuantity" DECIMAL(20,8) NOT NULL DEFAULT 0;
