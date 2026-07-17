# Crypto sweep — archived

The custody experiment is not part of MyCryptoPilot's read-only product.
`sweep-to-binance.ts` now rejects every invocation before reading addresses or
signing a transaction. The old operational procedure is intentionally removed
so it cannot be mistaken for a supported production workflow.

Historical code remains temporarily for architecture review and must not be
deployed, scheduled, or used with a mnemonic. MyCryptoPilot accepts no crypto
payment, holds no funds, and performs no sweep.
