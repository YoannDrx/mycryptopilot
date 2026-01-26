-- CreateTable
CREATE TABLE "public"."circuit_breakers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "max_daily_trades" INTEGER NOT NULL DEFAULT 20,
    "max_loss_percent" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "max_loss_amount" DECIMAL(20,8),
    "daily_trades_count" INTEGER NOT NULL DEFAULT 0,
    "daily_loss_usd" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "is_tripped" BOOLEAN NOT NULL DEFAULT false,
    "trip_reason" TEXT,
    "last_tripped_at" TIMESTAMP(3),
    "last_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circuit_breakers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "circuit_breakers_user_id_key" ON "public"."circuit_breakers"("user_id");

-- CreateIndex
CREATE INDEX "circuit_breakers_user_id_is_tripped_idx" ON "public"."circuit_breakers"("user_id", "is_tripped");

-- CreateIndex
CREATE INDEX "circuit_breakers_last_reset_at_idx" ON "public"."circuit_breakers"("last_reset_at");

-- AddForeignKey
ALTER TABLE "public"."circuit_breakers" ADD CONSTRAINT "circuit_breakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
