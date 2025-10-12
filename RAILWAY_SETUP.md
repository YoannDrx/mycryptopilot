# 🚂 Railway Setup Guide - Discord Bot Production

This guide explains how to deploy the MyCryptoPilot Discord Bot on Railway.

## 📋 Prerequisites

1. **Railway Account**: https://railway.app
2. **GitHub Repo**: Connected to Railway
3. **Discord Bot**: Created on https://discord.com/developers/applications
4. **Production Variables**: From Vercel (Database, Auth, etc.)

## 🚀 Quick Setup

### Step 1: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `YoannDrx/mycryptopilot`
4. Railway will create a service automatically

### Step 2: Configure Build Settings

1. Click on your service
2. Go to "Settings" tab
3. Set **Start Command**:
   ```bash
   pnpm tsx scripts/start-discord-bot.ts
   ```
4. Set **Build Command** (if needed):
   ```bash
   pnpm install
   ```

### Step 3: Add Environment Variables

Go to "Variables" tab and add ALL these variables:

#### 🗄️ Database (Required)
```bash
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=require
```
**⚠️ Important**: Use the SAME Neon database as Vercel (production branch)

#### 🔐 Authentication (Required)
```bash
BETTER_AUTH_URL=https://www.mycryptopilot.app
BETTER_AUTH_SECRET=<copy-from-vercel>
```
**⚠️ Important**: Use the SAME secret as Vercel

#### 🤖 Discord Bot (Required)
```bash
DISCORD_BOT_TOKEN=<your-bot-token>
DISCORD_GUILD_ID=<your-server-id>
DISCORD_BOT_ENABLED=true
```

#### 📺 Discord Channels (Required)
```bash
DISCORD_FREE_SIGNALS_CHANNEL_ID=<channel-id-for-signals-free>
DISCORD_LOG_CHANNEL_ID=<channel-id-for-logs>
```

**How to get Channel IDs:**
1. Enable "Developer Mode" in Discord Settings → Advanced
2. Right-click on channel → "Copy ID"

#### 👮 Discord Roles (Optional)
```bash
DISCORD_ROLE_ADMIN_ID=<admin-role-id>
```

**How to get Role ID:**
1. Enable "Developer Mode" in Discord Settings → Advanced
2. Right-click on role in Server Settings → "Copy ID"

#### 🎭 OAuth (Required)
```bash
DISCORD_CLIENT_ID=<same-as-vercel>
DISCORD_CLIENT_SECRET=<same-as-vercel>
```

#### 📧 Email (Required)
```bash
RESEND_API_KEY=<same-as-vercel>
EMAIL_FROM=contact@mycryptopilot.app
```

#### 🌍 Environment (Required)
```bash
NODE_ENV=production
```

### Step 4: Deploy

1. After adding all variables, Railway will **auto-deploy**
2. Check "Deployments" tab → should show "Deployment created"
3. Wait 2-3 minutes for build + deploy
4. Check "Logs" tab → should see:
   ```
   Discord bot logged in as MyCryptoPilot Bot#2650
   ✅ Discord slash commands registered successfully
   ✅ Discord roles created successfully
   Discord bot initialized successfully
   ```

## ✅ Verification

### Test Bot is Running

1. Go to your Discord server
2. Type `/` → you should see 11 commands:
   - 5 user commands: `/link`, `/unlink`, `/check`, `/invite-accept`, `/invitation-cancel`
   - 6 admin commands: `/admin-sync-roles`, `/admin-stats`, `/admin-check-permissions`, `/admin-bot-info`, `/admin-assign-role`, `/admin-test-signal`

### Test Admin Commands

1. Run `/admin-bot-info` → should show bot info
2. Run `/admin-test-signal` → should post a test signal in `#signals-free`

## 🔧 Troubleshooting

### Bot says "DISCORD_FREE_SIGNALS_CHANNEL_ID non configuré"

**Solution**: Railway hasn't redeployed after adding the variable.

1. Go to Railway Dashboard → "Deployments" tab
2. Check if a new deployment was triggered after adding the variable
3. If not, force redeploy:
   - Go to "Settings" → Click "Redeploy" button
   - OR push a new commit to `main` branch

### Bot not responding to commands

**Check**:
1. Verify `DISCORD_BOT_ENABLED=true` is set
2. Check logs for errors: Railway → "Logs" tab
3. Verify bot has correct permissions in Discord Server Settings

### Database connection errors

**Check**:
1. Verify `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are correct
2. Check if Neon database is accessible (test from Vercel)
3. Verify IP whitelisting if configured on Neon

## 🔄 Redeployment

Railway automatically redeploys when:
- You push new commits to `main` branch (GitHub integration)
- You add/update environment variables
- You click "Redeploy" button manually

## 📊 Monitoring

**Check bot health**:
1. Railway → "Logs" tab → real-time logs
2. Railway → "Metrics" tab → memory, CPU usage
3. Discord → Run `/admin-bot-info` → uptime, memory, ping

**Useful logs to watch**:
- `Discord bot logged in as...` → Bot connected successfully
- `✅ Discord slash commands registered` → Commands ready
- `✅ Discord roles created` → Roles configured
- `Error:` → Issues to investigate

## 💰 Costs

Railway pricing:
- **Hobby Plan**: $5/month
- **Usage**: ~30-40MB RAM, minimal CPU
- **Expected cost**: ~$3-5/month for 24/7 bot

## 🔗 Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Discord Developers**: https://discord.com/developers/applications
- **Neon Database**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com/dashboard

## 📝 Notes

- The bot runs **standalone** on Railway (not on Vercel)
- Vercel serverless functions timeout after 10s, so we need a persistent service
- Railway provides 24/7 uptime for the bot
- All data is stored in the shared Neon database (same as Vercel)
