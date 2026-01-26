-- Create table to persist user exchange balance snapshots
CREATE TABLE "user_exchange_balance_snapshot" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL,
    "total_equity_usd" DECIMAL(32,8) NOT NULL,
    "available_usd" DECIMAL(32,8) NOT NULL,
    "locked_usd" DECIMAL(32,8) NOT NULL,
    "spot_equity_usd" DECIMAL(32,8),
    "futures_equity_usd" DECIMAL(32,8),
    "margin_equity_usd" DECIMAL(32,8),
    "payload_json" JSONB,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_exchange_balance_snapshot_pkey" PRIMARY KEY ("id")
);

-- Add indexes for quick lookup by connection and user
CREATE INDEX "user_exchange_balance_snapshot_connection_id_idx"
  ON "user_exchange_balance_snapshot"("connection_id", "captured_at");

CREATE INDEX "user_exchange_balance_snapshot_user_id_idx"
  ON "user_exchange_balance_snapshot"("user_id", "captured_at");

-- Foreign keys
ALTER TABLE "user_exchange_balance_snapshot"
  ADD CONSTRAINT "user_exchange_balance_snapshot_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "user_exchange_connection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_exchange_balance_snapshot"
  ADD CONSTRAINT "user_exchange_balance_snapshot_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Track last health check timestamp on user exchange connections
ALTER TABLE "user_exchange_connection"
  ADD COLUMN "last_health_check_at" TIMESTAMP(3);
