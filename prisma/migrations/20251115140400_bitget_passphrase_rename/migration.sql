DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exchange_connection'
      AND column_name = 'encrypted_passphrase'
  ) THEN
    ALTER TABLE "public"."exchange_connection"
      RENAME COLUMN "encrypted_passphrase" TO "encryptedPassphrase";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_exchange_connection'
      AND column_name = 'encrypted_passphrase'
  ) THEN
    ALTER TABLE "public"."user_exchange_connection"
      RENAME COLUMN "encrypted_passphrase" TO "encryptedPassphrase";
  END IF;
END $$;
