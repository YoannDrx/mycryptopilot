# ✅ Environment Variables Checklist

Complete checklist of ALL environment variables needed for MyCryptoPilot across all services.

---

## 🌐 VERCEL (Web Application - Production)

**Access**: https://vercel.com/dashboard → Project → Settings → Environment Variables

### ✅ Required Variables

#### Database
- [ ] `DATABASE_URL` - Neon pooled connection (production branch)
- [ ] `DATABASE_URL_UNPOOLED` - Neon direct connection (production branch)

#### Authentication
- [ ] `BETTER_AUTH_URL` - **MUST BE**: `https://www.mycryptopilot.app`
- [ ] `BETTER_AUTH_SECRET` - Same as dev (from `openssl rand -base64 32`)

#### OAuth Providers
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth (production app)
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth (production app)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth (can reuse dev)
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth (can reuse dev)
- [ ] `DISCORD_CLIENT_ID` - Discord OAuth (can reuse dev)
- [ ] `DISCORD_CLIENT_SECRET` - Discord OAuth (can reuse dev)

#### Email
- [ ] `RESEND_API_KEY` - Resend production key
- [ ] `RESEND_AUDIENCE_ID` - Resend audience ID
- [ ] `EMAIL_FROM` - `contact@mycryptopilot.app`
- [ ] `NEXT_PUBLIC_EMAIL_CONTACT` - `contact@mycryptopilot.app`

#### Crypto Payments
- [ ] `BASE_RPC_URL` - `https://mainnet.base.org`
- [ ] `TRON_RPC_URL` - `https://api.trongrid.io`
- [ ] `CRYPTO_XPUB_BASE` - Base XPUB (PRODUCTION - never reuse dev!)
- [ ] `CRYPTO_XPUB_TRON` - Tron XPUB (PRODUCTION - never reuse dev!)
- [ ] `BINANCE_MASTER_WALLET_BASE` - Binance USDC address (Base)
- [ ] `BINANCE_MASTER_WALLET_TRON` - Binance USDT address (Tron)

#### Stripe (Legacy)
- [ ] `STRIPE_SECRET_KEY` - Stripe production key
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

#### Cron Jobs
- [ ] `CRON_SECRET` - From `openssl rand -base64 32`

#### Environment
- [ ] `NODE_ENV` - Set to `production`

### ⚠️ Optional Variables (Discord Bot - NOT used on Vercel)

These are only for Railway. Do NOT set on Vercel:
- ❌ `DISCORD_BOT_TOKEN` - Only on Railway
- ❌ `DISCORD_BOT_ENABLED` - Only on Railway
- ❌ `DISCORD_GUILD_ID` - Only on Railway
- ❌ `DISCORD_FREE_SIGNALS_CHANNEL_ID` - Only on Railway
- ❌ `DISCORD_LOG_CHANNEL_ID` - Only on Railway
- ❌ `DISCORD_ROLE_ADMIN_ID` - Only on Railway

---

## 🚂 RAILWAY (Discord Bot - Production)

**Access**: https://railway.app/dashboard → Project → Variables

### ✅ Required Variables

#### Discord Bot (Critical)
- [ ] `DISCORD_BOT_TOKEN` - From Discord Developer Portal
- [ ] `DISCORD_GUILD_ID` - Your server ID (right-click server → Copy ID)
- [ ] `DISCORD_BOT_ENABLED` - Set to `true`

#### Discord Channels (Critical for bot features)
- [ ] `DISCORD_FREE_SIGNALS_CHANNEL_ID` - Channel ID for #signals-free
- [ ] `DISCORD_LOG_CHANNEL_ID` - Channel ID for #bot-logs (optional)

#### Discord Roles (Optional)
- [ ] `DISCORD_ROLE_ADMIN_ID` - Admin role ID for admin commands

#### Database (Same as Vercel)
- [ ] `DATABASE_URL` - Same as Vercel
- [ ] `DATABASE_URL_UNPOOLED` - Same as Vercel

#### Authentication (Same as Vercel)
- [ ] `BETTER_AUTH_URL` - **MUST BE**: `https://www.mycryptopilot.app`
- [ ] `BETTER_AUTH_SECRET` - Same as Vercel

#### OAuth (Same as Vercel)
- [ ] `DISCORD_CLIENT_ID` - Same as Vercel
- [ ] `DISCORD_CLIENT_SECRET` - Same as Vercel

#### Email (Same as Vercel)
- [ ] `RESEND_API_KEY` - Same as Vercel
- [ ] `EMAIL_FROM` - `contact@mycryptopilot.app`

#### Environment
- [ ] `NODE_ENV` - Set to `production`

### ⚠️ Notes

- Railway auto-redeploys when you add/update variables
- Check "Deployments" tab to verify new deployment triggered
- Check "Logs" tab to see bot startup logs
- Variables in **purple/violet** are Railway-provided (ignore them)
- Variables in **white** are user-defined (yours)

---

## 🏠 LOCAL DEVELOPMENT (.env.local)

**Access**: `/Users/yoannandrieux/Projets/mycryptopilot/.env.local`

### ✅ Already Configured

All dev variables are in `.env.local`. Do NOT commit this file!

Key differences from production:
- `BETTER_AUTH_URL=http://localhost:3000` (not https)
- Discord OAuth uses dev app (different Client ID/Secret)
- GitHub OAuth uses dev app (different Client ID/Secret)
- Database uses Neon "vercel-dev" branch (auto-managed)
- Crypto uses TEST xpubs (never use in production!)

---

## 🔍 How to Get Discord IDs

### Channel ID
1. Enable "Developer Mode" in Discord Settings → Advanced
2. Right-click on channel → "Copy ID"
3. Example: `1426970006779990177`

### Server (Guild) ID
1. Enable "Developer Mode" in Discord Settings → Advanced
2. Right-click on server name → "Copy ID"
3. Example: `1426106950374002811`

### Role ID
1. Enable "Developer Mode" in Discord Settings → Advanced
2. Go to Server Settings → Roles
3. Right-click on role → "Copy ID"
4. Example: `1426971103078776853`

---

## 🚨 Common Issues

### Issue: `/admin-test-signal` says "DISCORD_FREE_SIGNALS_CHANNEL_ID non configuré"

**Cause**: Railway hasn't redeployed after adding the variable.

**Solution**:
1. Check Railway → "Deployments" tab
2. If no new deployment, force redeploy:
   - Push a new commit to `main` branch, OR
   - Railway → "Settings" → Click "Redeploy"
3. Wait 2-3 minutes
4. Check "Logs" tab for `Discord bot logged in as...`
5. Test `/admin-test-signal` again

### Issue: OAuth login fails with "redirect_uri mismatch"

**Cause**: `BETTER_AUTH_URL` is wrong or OAuth app redirect URIs not configured.

**Solution Vercel (Production)**:
1. Verify `BETTER_AUTH_URL=https://www.mycryptopilot.app` (NO trailing slash!)
2. Check OAuth apps have redirect URI: `https://www.mycryptopilot.app/api/auth/callback/{provider}`

**Solution Local (Dev)**:
1. Verify `BETTER_AUTH_URL=http://localhost:3000` in `.env.local`
2. Check OAuth apps have redirect URI: `http://localhost:3000/api/auth/callback/{provider}`

### Issue: Database connection errors

**Solution**:
1. Verify `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are correct
2. Check Neon dashboard - database should be "Active"
3. Verify IP whitelisting (if configured) includes Vercel/Railway IPs

---

## 📝 Verification Commands

### Verify Vercel Variables
```bash
# Check all environment variables on Vercel
vercel env ls --environment production
```

### Verify Railway Variables
1. Go to Railway Dashboard
2. Click your service
3. Go to "Variables" tab
4. Count: should have ~15-20 variables

### Test Discord Bot
```bash
# Check if bot is running on Railway
# Go to Railway → "Logs" tab → should see:
# "Discord bot logged in as MyCryptoPilot Bot#2650"
# "✅ Discord slash commands registered successfully"
```

### Test Website
```bash
# Test production site
curl https://www.mycryptopilot.app
# Should return 200 OK (not 500)
```

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Discord Developers**: https://discord.com/developers/applications
- **Neon Console**: https://console.neon.tech
- **Resend Dashboard**: https://resend.com/overview

---

**Last Updated**: 2025-10-12 (Phase 5 - Discord Integration MVP Complete)
