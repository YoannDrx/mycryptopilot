# 🚀 Deployment Guide - MyCryptoPilot

**Dernière mise à jour**: 23 octobre 2025

Ce guide couvre le déploiement complet de MyCryptoPilot en production.

---

## 📋 Table des Matières

1. [Architecture Production](#architecture-production)
2. [Fly.io Worker - Cron & Discord Bot](#flyio-worker---cron--discord-bot)
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
│  FLY.IO WORKER                          │
│  - Cron jobs (sync exchanges, tiers…)   │
│  - Payment watcher (Base/Tron)          │
│  - Bot Discord 24/7                     │
│  - Connexion directe à Neon             │
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
- **Fly.io**: Worker unique (cron jobs + payment watcher + bot Discord)
- **Neon**: Database avec branch-per-preview

---

## Fly.io Worker - Cron & Discord Bot

Le worker Fly exécute toutes les tâches longues et l’automatisation Discord. Détails exhaustifs dans [`./.claude/docs/FLY-WORKER.md`](./FLY-WORKER.md). Résumé rapide :

### Prérequis

- ✅ `flyctl` installé (`brew install flyctl`)
- ✅ `fly auth login`
- ✅ Secrets copiés depuis `.env` (utiliser `fly secrets set -a mycryptopilot-worker ...`)
- ✅ Docker disponible (build pendant `fly deploy`)

### Fichiers concernés

```
mycryptopilot/
├── Dockerfile.fly          # Image pour le worker
├── fly.worker.toml         # Configuration Machines
├── scripts/start-fly-worker.ts
└── .dockerignore
```

### Déploiement

- Depuis la racine du repo : `pnpm worker:deploy` (alias de `fly deploy --config fly.worker.toml --ha=false`).

- `--ha=false` évite la création d’un standby VM (1 seule machine shared-cpu-1x).
- Le build lance `pnpm install`, `prisma generate`, puis démarre `pnpm worker`.
- Après déploiement, vérifier les machines via `fly machines list -a mycryptopilot-worker`.

### Surveillance & opérations

- Logs : `fly logs -a mycryptopilot-worker --no-tail`
- Statut : `fly status -a mycryptopilot-worker`
- Suppression d’une machine standby indésirable : `fly machines remove <id> -a mycryptopilot-worker --force`
- Redéploiement après mise à jour du code : relancer `fly deploy --config fly.worker.toml --ha=false`

### Contenu du worker

- `startPaymentWatcher` ➜ scrute Base/Tron toutes les 60 s (configurable via `PAYMENT_WATCHER_INTERVAL_MS`)
- `runExchangeSyncCronJob` ➜ toutes les 5 min
- Jobs quotidiens : active invitees (02:00 UTC), tier check (03:00 UTC), expiration reminders (09:00 UTC)
- `discordBot.initialize()` ➜ bot Discord avec slash commands, rôles dynamiques, DM

Si le bot ne démarre pas, vérifier les logs Fly (souvent token manquant ou `DISCORD_BOT_ENABLED=false`). Pour recharger les secrets, re-exécuter `fly secrets set ...` puis `fly deploy`.

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

| Branch          | Usage       | Endpoint                  | Fichier .env       |
| --------------- | ----------- | ------------------------- | ------------------ |
| **main** (prod) | Production  | `ep-proud-term-abutee8y`  | `.env.production`  |
| **dev**         | Staging/Dev | `ep-falling-bar-ab0lufee` | `.env.development` |
| **preview-\***  | PR previews | Auto-créées Vercel        | Variables Vercel   |

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

4. **Fly.io Worker**:
   - DB Neon branch `main` (mêmes credentials que prod)
   - Variables copiées depuis Vercel (voir `.claude/docs/FLY-WORKER.md`)
   - Secrets gérés via `fly secrets set`

### Checklist Variables

Voir [ENVIRONMENT.md](ENVIRONMENT.md) pour la checklist complète par service.

**Vérification**:

```bash
# Vercel
vercel env ls

# Fly (secrets)
fly secrets list -a mycryptopilot-worker

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

**Fly worker (Cron + Discord)**:

```bash
# Logs
fly logs -a mycryptopilot-worker --no-tail

# Machines
fly machines list -a mycryptopilot-worker
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

**Erreur: Fly worker crash loop / bot Discord down**

- Cause: Secret manquant, token Discord révoqué, ou DB inaccessible
- Solution: `fly logs -a mycryptopilot-worker --no-tail` + `fly secrets list -a mycryptopilot-worker`

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

**Fly worker**:

```bash
fly logs -a mycryptopilot-worker --no-tail
fly machines status <id> -a mycryptopilot-worker
```

**Neon**:

- Console: https://console.neon.tech → Monitoring tab
- Slow queries, connection stats, CPU usage

---

## Ressources

**Documentation**:

- [Vercel Docs](https://vercel.com/docs)
- [Fly Docs](https://fly.io/docs/)
- [Neon Docs](https://neon.tech/docs)

**MyCryptoPilot Docs**:

- [ENVIRONMENT.md](ENVIRONMENT.md) - Variables complètes
- [DISCORD-SETUP.md](DISCORD-SETUP.md) - Config Discord Bot + worker
- [DATABASE.md](DATABASE.md) - Schémas Prisma

**Support**:

- Vercel: support@vercel.com
- Fly: support@fly.io
- Neon: support@neon.tech
