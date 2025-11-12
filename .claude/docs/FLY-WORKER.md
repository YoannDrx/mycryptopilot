# Fly.io Background Worker

This guide explains how to run every long‑lived job (cron equivalents + crypto payment watcher) on a single low-cost Fly.io machine.

## What the worker does

- Polls Base & Tron addresses continuously to detect crypto payments (`startPaymentWatcher`)
- Syncs Binance/Bybit connections every 5 minutes (replaces la route `/api/cron/sync-exchanges`)
- Runs the three daily cron jobs:
  - 02:00 UTC → active invitees bonus
  - 03:00 UTC → trader tier check
  - 09:00 UTC → subscription expiration reminders (emails + Discord)
- Démarre et supervise le bot Discord (mêmes commandes/rôles qu’avant, mais hébergé sur Fly)

Everything lives inside `scripts/start-fly-worker.ts`, so you can also run it locally with `pnpm worker`.

## Prerequisites

1. **Fly CLI**: `brew install flyctl` or see <https://fly.io/docs/hands-on/install-flyctl>.
2. **Fly account**: `fly auth login`.
3. **Docker** installed locally (the deployment builds `Dockerfile.fly`).
4. Existing production env values (copiées depuis Vercel via `.claude/commands/sync-env.md`).

## 1. Create the Fly app

```bash
# From the repo root
fly launch --config fly.worker.toml --dockerfile Dockerfile.fly --no-deploy
```

- When prompted for an app name, pick something unique (e.g. `mycryptopilot-worker`).
- Update `fly.worker.toml`’s `app` value if the CLI picked a different name.

## 2. Configure secrets

The worker needs the same secrets as the Next.js app plus the crypto watcher inputs. Copy them from your production `.env` source of truth:

| Category | Variables (all required unless noted) |
| --- | --- |
| Database & crypto | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `ENCRYPTION_SECRET`, `CRYPTO_NETWORK`, `CRYPTO_XPUB_BASE`, `CRYPTO_XPUB_TRON`, `BASE_RPC_URL`, `TRON_RPC_URL`, `USDC_BASE_CONTRACT`, `USDT_TRON_CONTRACT` |
| Auth & site config | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_EMAIL_CONTACT`, `EMAIL_FROM` |
| Notifications & Discord | `RESEND_API_KEY`, `DISCORD_BOT_ENABLED`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_PRO_ROLE_ID`, `DISCORD_ULTRA_ROLE_ID`, `DISCORD_FREE_ROLE_ID`, `DISCORD_ROLE_ADMIN_ID`, `DISCORD_LOG_CHANNEL_ID`, etc. |
| Cron-only | `CRON_SECRET` (still used by the HTTP fallback routes), `PAYMENT_WATCHER_INTERVAL_MS` (optional override, defaults to 60 000 ms) |

Set them in one shot (example):

```bash
fly secrets set \
  DATABASE_URL="..." \
  DATABASE_URL_UNPOOLED="..." \
  ENCRYPTION_SECRET="..." \
  CRYPTO_NETWORK="mainnet" \
  CRYPTO_XPUB_BASE="..." \
  CRYPTO_XPUB_TRON="..." \
  BASE_RPC_URL="..." \
  TRON_RPC_URL="..." \
  USDC_BASE_CONTRACT="0x..." \
  USDT_TRON_CONTRACT="TR..." \
  BETTER_AUTH_SECRET="..." \
  BETTER_AUTH_URL="https://mycryptopilot.app" \
  NEXT_PUBLIC_APP_URL="https://mycryptopilot.app" \
  NEXT_PUBLIC_EMAIL_CONTACT="contact@mycryptopilot.app" \
  EMAIL_FROM="noreply@mycryptopilot.app" \
  RESEND_API_KEY="re_..." \
  DISCORD_BOT_ENABLED="true" \
  DISCORD_BOT_TOKEN="..." \
  DISCORD_GUILD_ID="..." \
  DISCORD_PRO_ROLE_ID="..." \
  DISCORD_ULTRA_ROLE_ID="..." \
  DISCORD_FREE_ROLE_ID="..." \
  CRON_SECRET="..." \
  PAYMENT_WATCHER_INTERVAL_MS="60000"
```

Add any other env vars used by the jobs (e.g. Stripe legacy keys if still referenced).

## 3. Deploy

```bash
fly deploy --config fly.worker.toml --ha=false
```

Passing `--ha=false` prevents Fly from creating a standby VM, keeping the footprint at a single shared-cpu-1x machine (~$0.60/mo). The Dockerfile installs dependencies, runs `pnpm prisma generate`, and starts the worker via `pnpm worker`.

## 4. Monitor & operate

- **Status**: `fly status -a <app-name>`
- **Logs**: `fly logs -a <app-name> --no-tail`
- **SSH console** (for inspecting running machines): `fly ssh console -a <app-name>`
- **Redeploy** after code changes: `fly deploy --config fly.worker.toml --ha=false`
- **Remove a stray standby VM** (if one gets re-created): `fly machines list -a <app-name>` then `fly machines remove <id> -a <app-name> --force`

## 5. Local testing

Before deploying, you can simulate everything locally:

```bash
cp .env .env.local   # if needed
pnpm worker
```

The script auto-loads `.env.local`/`.env` when `NODE_ENV !== "production"`.

## 6. Disabling Vercel crons

Once the Fly worker is live, you can remove redundant cron entries from `vercel.json` (or leave them as an emergency fallback—just keep `CRON_SECRET` in sync). The worker already runs exchange sync + daily jobs, so double execution would duplicate notifications.

---

Need to rotate secrets or change the schedule? Update the values with `fly secrets set ...` and redeploy; the worker will restart with the new configuration automatically.
