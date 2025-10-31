# 🚀 Deployment Guide - MyCryptoPilot

**Dernière mise à jour**: 23 octobre 2025

Ce guide couvre le déploiement complet de MyCryptoPilot en production.

---

## 📋 Table des Matières

1. [Architecture Production](#architecture-production)
2. [Railway - Discord Bot](#railway---discord-bot)
3. [Neon - Database Branching](#neon---database-branching)
4. [Vercel - Web App](#vercel---web-app)
5. [Variables d'Environnement](#variables-denvironnement)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Architecture Production

```
┌─────────────────────────────────────────┐
│  VERCEL (Next.js App)                   │
│  - Interface web                        │
│  - API routes                           │
│  - Authentification                     │
│  URL: https://mycryptopilot.app         │
└─────────────────────────────────────────┘
              ↕ (Partage DB Neon)
┌─────────────────────────────────────────┐
│  RAILWAY (Discord Bot)                  │
│  - Bot Discord 24/7                     │
│  - Commandes slash                      │
│  - Accès même DB que Vercel             │
└─────────────────────────────────────────┘
              ↕ (PostgreSQL)
┌─────────────────────────────────────────┐
│  NEON (Database)                        │
│  - PostgreSQL 15                        │
│  - Branching per PR                     │
│  - Auto-scaling                         │
└─────────────────────────────────────────┘
```

**Services**:
- **Vercel**: Web app production (main branch auto-deploy)
- **Railway**: Discord bot (24/7, manual deploy)
- **Neon**: Database avec branch-per-preview

---

## Railway - Discord Bot

### Prérequis

- ✅ Compte Railway ([créer](https://railway.app/))
- ✅ Bot Discord configuré (voir [DISCORD-SETUP.md](DISCORD-SETUP.md))
- ✅ Variables env production
- ✅ Node.js 22+ installé

### Fichiers Configuration

```
mycryptopilot/
├── nixpacks.toml        # Railway build config
├── railway.json         # Service Railway
├── .railwayignore      # Fichiers exclus
└── scripts/
    └── deploy-railway.sh  # Script auto-deploy
```

### Méthode 1: Déploiement Automatisé (Recommandé)

```bash
# Rendre exécutable
chmod +x scripts/deploy-railway.sh

# Lancer déploiement
./scripts/deploy-railway.sh
```

Le script:
1. Installe Railway CLI si nécessaire
2. Te connecte à Railway
3. Crée projet (si besoin)
4. Configure variables env
5. Déploie le bot
6. Affiche logs

### Méthode 2: Déploiement Manuel

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Créer projet
railway init

# 4. Configurer variables
railway variables set DISCORD_BOT_TOKEN="..."
railway variables set DISCORD_GUILD_ID="..."
railway variables set DATABASE_URL="..."
# ... (voir section Variables)

# 5. Déployer
railway up

# 6. Vérifier logs
railway logs
```

### Variables Requises Railway

| Variable | Source | Exemple |
|----------|--------|---------|
| `DISCORD_BOT_TOKEN` | Discord Developer Portal | `MTI3...xyz` |
| `DISCORD_GUILD_ID` | Discord Server (right-click) | `127...890` |
| `DATABASE_URL` | Neon Console | `postgresql://...` |
| `DATABASE_URL_UNPOOLED` | Neon Console | `postgresql://...` |
| `BETTER_AUTH_URL` | Vercel URL | `https://mycryptopilot.app` |
| `BETTER_AUTH_SECRET` | Vercel Variables | `random_secret_32+` |
| `BASE_RPC_URL` | Vercel Variables | `https://mainnet.base.org` |
| `TRON_RPC_URL` | Vercel Variables | `https://api.trongrid.io` |
| `CRYPTO_XPUB_BASE` | Vercel Variables | `xpub6F...` |
| `CRYPTO_XPUB_TRON` | Vercel Variables | `xpub6D...` |
| `RESEND_API_KEY` | Resend Dashboard | `re_...` |
| `EMAIL_FROM` | Resend Domain | `noreply@mycryptopilot.app` |

**Total**: 15 variables minimum

### Vérification Déploiement

```bash
# Check logs
railway logs --tail

# Vérifier status
railway status

# Restart si besoin
railway restart
```

**Logs attendus**:
```
✅ Discord bot logged in as MyCryptoPilot#1234
✅ Guild found: MyCryptoPilot Server (ID: 127...890)
✅ Registered 11 commands (5 user + 6 admin)
✅ Bot ready!
```

### Monitoring Railway

**Dashboard**: https://railway.app/dashboard

**Métriques**:
- CPU usage (should be < 5%)
- Memory usage (should be < 200MB)
- Network (Discord API calls)
- Logs (errors, warnings)

**Alertes à configurer**:
- Memory > 500MB
- CPU > 50%
- Crashes repeated
- API rate limits

### Troubleshooting Railway

**Problème: Bot ne démarre pas**
```bash
# Check logs
railway logs

# Vérifier variables
railway variables

# Common errors:
# - Missing DISCORD_BOT_TOKEN → Add variable
# - Invalid GUILD_ID → Check Discord server
# - Database unreachable → Check DATABASE_URL
```

**Problème: Bot se déconnecte**
```bash
# Restart bot
railway restart

# Si erreur persiste, check Discord Developer Portal
# - Gateway Intents activés?
# - Bot token révoqué?
```

**Problème: Commandes slash n'apparaissent pas**
```bash
# Redeploy commands
railway run npm run discord:deploy

# Ou depuis le bot Discord:
# /deploy-commands (admin only)
```

---

## Neon - Database Branching

### Status Database

**Migrations appliquées**: ✅ Database opérationnelle

```bash
npx prisma migrate status
# Database schema is up to date! ✅
```

**Fonctionnalités actives**:
- ✅ Profils traders
- ✅ Système signaux
- ✅ Follow/unfollow
- ✅ Paiements crypto
- ✅ Discord integration

### Branches Neon

| Branch | Usage | Endpoint | Fichier .env |
|--------|-------|----------|--------------|
| **main** (prod) | Production | `ep-proud-term-abutee8y` | `.env.production` |
| **dev** | Staging/Dev | `ep-falling-bar-ab0lufee` | `.env.development` |
| **preview-\*** | PR previews | Auto-créées Vercel | Variables Vercel |

### Branch-Per-Preview Setup

**Avantages**:
- ✅ DB isolée par Pull Request
- ✅ Pas de risque casser dev/prod
- ✅ Tests E2E sur données isolées
- ✅ Nettoyage auto après merge

**Configuration**:

1. **Vercel Dashboard**:
   - Settings → Integrations → Neon
   - Activer "Create a branch for each Preview deployment"

2. **Neon Console**:
   - Settings → Branching
   - Activer "Auto-delete branches"
   - Délai rétention: 7 jours

3. **Test**:
```bash
git checkout -b test-preview
git push origin test-preview
# Vérifier Vercel → Preview deployment → DB Neon dédiée
```

### Commandes Prisma

**Local (dev branch)**:
```bash
# Apply migrations
pnpm prisma migrate dev

# Generate client
pnpm prisma generate

# Open Studio
npx prisma studio
```

**Production (via Vercel)**:
```bash
# Deploy migrations
pnpm prisma migrate deploy
```

### Neon CLI

```bash
# Install
npm install -g neonctl

# List branches
neonctl branches list --project-id <project-id>

# Create branch
neonctl branches create --name preview-test --parent dev

# Delete branch
neonctl branches delete preview-test
```

---

## Vercel - Web App

### Auto-Deployment

**Main branch** → Déploiement automatique production

```bash
git checkout main
git merge feature/xxx
git push origin main
# → https://mycryptopilot.app (auto-deploy)
```

**Feature branches** → Preview deployments

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# → https://mycryptopilot-git-feature-xxx.vercel.app
```

### Variables Vercel

**Configurer dans**: Vercel → Settings → Environment Variables

**Production Scope** (35+ variables):
- Database (DATABASE_URL, DATABASE_URL_UNPOOLED)
- Auth (BETTER_AUTH_URL, BETTER_AUTH_SECRET, BETTER_AUTH_TRUST_HOST)
- Discord (DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID)
- Email (RESEND_API_KEY, EMAIL_FROM)
- Crypto (BASE_RPC_URL, TRON_RPC_URL, CRYPTO_XPUB_BASE, CRYPTO_XPUB_TRON, CRYPTO_NETWORK)
- Binance (BINANCE_API_KEY, BINANCE_API_SECRET)
- Bybit (BYBIT_API_KEY, BYBIT_API_SECRET)
- Encryption (ENCRYPTION_KEY)

Voir [ENVIRONMENT.md](ENVIRONMENT.md) pour la liste complète.

### Build Settings

**Framework Preset**: Next.js
**Build Command**: `pnpm build`
**Output Directory**: `.next`
**Install Command**: `pnpm install`

**Environment Variables** injectées automatiquement:
- `VERCEL_URL`
- `VERCEL_ENV` (production/preview)
- `VERCEL_GIT_COMMIT_SHA`

### Monitoring Vercel

**Dashboard**: https://vercel.com/dashboard

**Métriques**:
- Build time (should be < 3min)
- Function executions
- Bandwidth usage
- Edge requests

**Logs**:
```bash
# Installer Vercel CLI
npm install -g vercel

# Check logs
vercel logs --all
```

---

## Variables d'Environnement

### Environnements

1. **Local Development** (`.env.development`):
   - DB Neon branch `dev`
   - BETTER_AUTH_URL = `http://localhost:3000`
   - Testnet crypto (optionnel)

2. **Vercel Preview** (auto-configuré):
   - DB Neon branch `preview-*`
   - BETTER_AUTH_URL = `https://$VERCEL_URL`
   - Mainnet crypto

3. **Vercel Production** (`.env.production`):
   - DB Neon branch `main`
   - BETTER_AUTH_URL = `https://mycryptopilot.app`
   - Mainnet crypto

4. **Railway** (Discord Bot):
   - DB Neon branch `main` (même que prod)
   - Variables copiées depuis Vercel
   - 15 variables minimum

### Checklist Variables

Voir [ENVIRONMENT.md](ENVIRONMENT.md) pour la checklist complète par service.

**Vérification**:
```bash
# Vercel
vercel env ls

# Railway
railway variables

# Local
cat .env.development | grep DATABASE_URL
```

---

## Monitoring & Troubleshooting

### Health Checks

**Vercel (Web)**:
```bash
# Test homepage
curl https://mycryptopilot.app

# Test API
curl https://mycryptopilot.app/api/health

# Check build status
vercel --prod
```

**Railway (Discord)**:
```bash
# Check bot status
railway logs --tail

# Test command Discord
/status (dans le serveur Discord)
```

**Neon (Database)**:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
npx prisma migrate status
```

### Troubleshooting Commun

**Erreur: Build Vercel timeout**
- Cause: Build > 45min (limite Hobby plan)
- Solution: Optimiser build ou upgrade plan

**Erreur: Railway bot crash loop**
- Cause: Variable manquante ou DB inaccessible
- Solution: Check `railway logs` + `railway variables`

**Erreur: Neon connection pool exhausted**
- Cause: Trop de connexions simultanées
- Solution: Utiliser DATABASE_URL (pooled) pas UNPOOLED

**Erreur: Discord commands not showing**
- Cause: Bot pas réinvité avec `applications.commands` scope
- Solution: Générer nouvelle URL invitation (voir [DISCORD-SETUP.md](DISCORD-SETUP.md))

### Logs & Debug

**Vercel**:
```bash
vercel logs --all           # All deployments
vercel logs --prod          # Production only
vercel logs --follow        # Tail logs
```

**Railway**:
```bash
railway logs                # Last 100 lines
railway logs --tail         # Follow logs
railway logs --filter error # Errors only
```

**Neon**:
- Console: https://console.neon.tech → Monitoring tab
- Slow queries, connection stats, CPU usage

---

## Ressources

**Documentation**:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Neon Docs](https://neon.tech/docs)

**MyCryptoPilot Docs**:
- [ENVIRONMENT.md](ENVIRONMENT.md) - Variables complètes
- [DISCORD-SETUP.md](DISCORD-SETUP.md) - Config Discord Bot
- [DATABASE.md](DATABASE.md) - Schémas Prisma

**Support**:
- Vercel: support@vercel.com
- Railway: Discord server
- Neon: support@neon.tech
