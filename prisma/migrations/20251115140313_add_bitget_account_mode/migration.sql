-- CreateEnum
CREATE TYPE "public"."BitgetAccountMode" AS ENUM ('UTA', 'CLASSIC');

-- AlterTable
ALTER TABLE "public"."exchange_connection"
ADD COLUMN "bitgetAccountMode" "public"."BitgetAccountMode";

ALTER TABLE "public"."user_exchange_connection"
ADD COLUMN "bitgetAccountMode" "public"."BitgetAccountMode";
