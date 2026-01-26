-- AlterEnum
ALTER TYPE "public"."Exchange" ADD VALUE 'BITGET';

-- AlterEnum
ALTER TYPE "public"."TradeSource" ADD VALUE 'BITGET';

-- Add encrypted passphrase storage for Bitget keys
ALTER TABLE "public"."exchange_connection"
ADD COLUMN "encrypted_passphrase" TEXT;

ALTER TABLE "public"."user_exchange_connection"
ADD COLUMN "encrypted_passphrase" TEXT;
