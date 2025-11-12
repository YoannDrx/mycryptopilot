# 🗺️ Environment Variables Mapping Guide

**Dernière mise à jour**: 2 novembre 2025
**Projet**: MyCryptoPilot

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des environnements](#architecture-des-environnements)
3. [Mapping des variables](#mapping-des-variables)
4. [Guide de synchronisation](#guide-de-synchronisation)
5. [Troubleshooting](#troubleshooting)
6. [Sécurité](#sécurité)

---

## Vue d'ensemble

Ce document décrit **où chaque variable d'environnement doit être configurée** selon l'environnement (local dev, Vercel production, Vercel preview, GitHub Actions).

### Fichiers Locaux

| Fichier        | Environnement     | Usage                                           | Gitignore       |
| -------------- | ----------------- | ----------------------------------------------- | --------------- |
| `.env`         | Production backup | Référence locale des valeurs PROD (mainnet)     | ✅ Oui          |
| `.env.local`   | Development       | Variables pour `pnpm dev` (testnet)             | ✅ Oui          |
| `.env.test`    | E2E Tests         | Variables pour tests Playwright (testnet local) | ✅ Oui          |
| `.env.example` | Template          | Template pour nouveaux devs                     | ❌ Non (tracké) |
| `.env.sweep`   | Sweep Binance     | Secrets sweep locaux (seed, wallets)            | ✅ Oui          |

### Environnements Distants

| Environnement         | Description             | Configuration    | Branches           |
| --------------------- | ----------------------- | ---------------- | ------------------ |
| **Vercel Production** | App en production       | Vercel Dashboard | `main`             |
| **Vercel Preview**    | Déploiements preview PR | Vercel Dashboard | Toutes sauf `main` |
| **GitHub Actions**    | CI/CD (tests, builds)   | GitHub Secrets   | Toutes             |

---

## Architecture des Environnements

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOCAL DEV                                │
│  .env.local (testnet) + .env (fallback)                         │
│  → pnpm dev (http://localhost:3000)                             │
│  → Database: Neon "vercel-dev" branch                           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                         git push origin
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL PREVIEW                              │
│  Variables depuis Vercel Dashboard (Preview scope)              │
│  → Déploiement automatique par PR                               │
│  → Database: Neon branch auto-créée (ex: preview/feature/X)     │
│  → URL: mycryptopilot-git-feature-X-yoanndrx.vercel.app        │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                           Merge PR
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL PRODUCTION                             │
│  Variables depuis Vercel Dashboard (Production scope)           │
│  → Déploiement automatique sur main                             │
│  → Database: Neon "production" branch                           │
│  → URL: https://www.mycryptopilot.app                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS                              │
│  Secrets depuis GitHub Repository Settings                      │
│  → CI: Tests E2E, type check, lint                              │
│  → Database: Locale PostgreSQL (pas Neon)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mapping des Variables

### 🔴 Variables PRODUCTION Uniquement

Ces variables sont **spécifiques à la production** (mainnet, DB prod, OAuth prod).

| Variable                | Source Locale | Vercel PROD      | Vercel PREVIEW | GitHub Actions | Notes                           |
| ----------------------- | ------------- | ---------------- | -------------- | -------------- | ------------------------------- |
| `DATABASE_URL`          | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | Neon production branch (pooled) |
| `DATABASE_URL_UNPOOLED` | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | Neon production branch (direct) |
| `BETTER_AUTH_URL`       | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | `https://www.mycryptopilot.app` |
| `CRYPTO_NETWORK`        | `.env`        | ✅ `mainnet`     | ❌ Non         | ❌ Non         | Mode réseau crypto              |
| `CRYPTO_XPUB_BASE`      | `.env`        | ✅ Oui (mainnet) | ❌ Non         | ❌ Non         | XPUB Base mainnet               |
| `CRYPTO_XPUB_TRON`      | `.env`        | ✅ Oui (mainnet) | ❌ Non         | ❌ Non         | XPUB Tron mainnet               |
| `BASE_RPC_URL`          | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | `https://mainnet.base.org`      |
| `TRON_RPC_URL`          | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | `https://api.trongrid.io`       |
| `GITHUB_CLIENT_ID`      | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | OAuth GitHub prod               |
| `GITHUB_CLIENT_SECRET`  | `.env`        | ✅ Oui           | ❌ Non         | ❌ Non         | OAuth GitHub prod               |

**⚠️ CRITIQUE**: Ces variables utilisent de **l'argent réel** (mainnet). Ne JAMAIS les mélanger avec testnet!

---

### 🟡 Variables PREVIEW Uniquement

Ces variables sont **spécifiques aux previews** (testnet, DB dev).

| Variable               | Source Locale | Vercel PROD | Vercel PREVIEW   | GitHub Actions | Notes                            |
| ---------------------- | ------------- | ----------- | ---------------- | -------------- | -------------------------------- |
| `CRYPTO_NETWORK`       | `.env.local`  | ❌ Non      | ✅ `testnet`     | ❌ Non         | Mode réseau crypto               |
| `CRYPTO_XPUB_BASE`     | `.env.local`  | ❌ Non      | ✅ Oui (testnet) | ❌ Non         | XPUB Base testnet                |
| `CRYPTO_XPUB_TRON`     | `.env.local`  | ❌ Non      | ✅ Oui (testnet) | ❌ Non         | XPUB Tron testnet                |
| `BASE_RPC_URL_TESTNET` | `.env.local`  | ❌ Non      | ✅ Oui           | ❌ Non         | `https://sepolia.base.org`       |
| `TRON_RPC_URL_TESTNET` | `.env.local`  | ❌ Non      | ✅ Oui           | ❌ Non         | `https://api.shasta.trongrid.io` |

**Note**: Les `DATABASE_URL` pour preview sont gérées **automatiquement** par l'intégration Vercel + Neon (une DB branch par PR).

---

### 🟢 Variables COMMUNES (PROD + PREVIEW)

Ces variables sont **partagées** entre tous les environnements Vercel.

| Variable                          | Source       | Vercel PROD        | Vercel PREVIEW                     | GitHub Actions     | Notes                                                                                                                        |
| --------------------------------- | ------------ | ------------------ | ---------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`              | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Secret pour JWT/sessions                                                                                                     |
| `GOOGLE_CLIENT_ID`                | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | OAuth Google (multi-redirect)                                                                                                |
| `GOOGLE_CLIENT_SECRET`            | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | OAuth Google                                                                                                                 |
| `DISCORD_CLIENT_ID`               | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | OAuth Discord (multi-redirect)                                                                                               |
| `DISCORD_CLIENT_SECRET`           | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | OAuth Discord                                                                                                                |
| `DISCORD_BOT_ENABLED`             | `.env`       | ✅ Oui (`true`)    | ✅ Oui (`true` pour tests preview) | ✅ Oui (`true`)    | Active le bot dans `scripts/start-discord-bot.ts`                                                                            |
| `DISCORD_BOT_TOKEN`               | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Discord bot (même bot dev/prod)                                                                                              |
| `DISCORD_GUILD_ID`                | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | ID du serveur Discord                                                                                                        |
| `DISCORD_FREE_SIGNALS_CHANNEL_ID` | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Channel teasers gratuits                                                                                                     |
| `DISCORD_LOG_CHANNEL_ID`          | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Channel logs bot                                                                                                             |
| `DISCORD_ROLE_ADMIN_ID`           | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Rôle admin                                                                                                                   |
| `DISCORD_FREE_ROLE_ID`            | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Rôle Free                                                                                                                    |
| `DISCORD_PRO_ROLE_ID`             | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Rôle Pro                                                                                                                     |
| `DISCORD_ULTRA_ROLE_ID`           | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Rôle Ultra                                                                                                                   |
| `DISCORD_WEBHOOK_SIGNALS_URL`     | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Webhook pour signaux                                                                                                         |
| `RESEND_API_KEY`                  | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Email service                                                                                                                |
| `RESEND_AUDIENCE_ID`              | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Newsletter                                                                                                                   |
| `EMAIL_FROM`                      | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Email expéditeur                                                                                                             |
| `NEXT_PUBLIC_EMAIL_CONTACT`       | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Email contact public                                                                                                         |
| `CRON_SECRET`                     | `.env`       | ✅ Oui             | ✅ Oui                             | ❌ Non             | Secret pour cron jobs                                                                                                        |
| `ENCRYPTION_SECRET`               | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Chiffrement API keys (AES-256)                                                                                               |
| `BINANCE_MASTER_WALLET_BASE`      | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Wallet Binance Base                                                                                                          |
| `BINANCE_MASTER_WALLET_TRON`      | `.env`       | ✅ Oui             | ✅ Oui                             | ✅ Oui             | Wallet Binance Tron                                                                                                          |
| `TRON_API_KEY`                    | `.env`       | ✅ Oui (optionnel) | ✅ Oui (optionnel)                 | ✅ Oui (optionnel) | Clé API TronGrid (https://www.trongrid.io) - Améliore les quotas pour le payment watcher. Optionnel mais recommandé en prod. |
| `BINANCE_USER_API_KEY`            | `.env.local` | ❌ Non             | ❌ Non                             | ❌ Non             | Test uniquement (readonly)                                                                                                   |
| `BINANCE_USER_SECRET_KEY`         | `.env.local` | ❌ Non             | ❌ Non                             | ❌ Non             | Test uniquement (readonly)                                                                                                   |
| `BYBIT_USER_API_KEY`              | `.env.local` | ❌ Non             | ❌ Non                             | ❌ Non             | Test uniquement (readonly)                                                                                                   |
| `BYBIT_USER_SECRET_KEY`           | `.env.local` | ❌ Non             | ❌ Non                             | ❌ Non             | Test uniquement (readonly)                                                                                                   |
| `SWEEP_MIN_THRESHOLD_USD`         | `.env.sweep` | ❌ Non             | ❌ Non                             | ❌ Non             | Seuil USD pour sweep (default 10)                                                                                            |
| `DRY_RUN`                         | `.env.sweep` | ❌ Non             | ❌ Non                             | ❌ Non             | Active le mode dry-run pour sweep (default: true). Passer à `false` pour envoyer de vraies transactions.                     |
| `SWEEP_MNEMONIC_BASE`             | `.env.sweep` | ❌ Non             | ❌ Non                             | ❌ Non             | Mnemonic Base (sweep)                                                                                                        |
| `SWEEP_MNEMONIC_TRON`             | `.env.sweep` | ❌ Non             | ❌ Non                             | ❌ Non             | Mnemonic Tron (sweep)                                                                                                        |

#### Stripe (Legacy - conservé pour compatibilité NOW.TS)

| Variable                             | Source | Vercel PROD | Vercel PREVIEW | GitHub Actions | Notes                  |
| ------------------------------------ | ------ | ----------- | -------------- | -------------- | ---------------------- |
| `STRIPE_SECRET_KEY`                  | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `STRIPE_WEBHOOK_SECRET`              | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `STRIPE_PRO_PLAN_ID`                 | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `STRIPE_PRO_YEARLY_PLAN_ID`          | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `STRIPE_ULTRA_PLAN_ID`               | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |
| `STRIPE_ULTRA_YEARLY_PLAN_ID`        | `.env` | ✅ Oui      | ✅ Oui         | ✅ Oui         | Non utilisé mais gardé |

**Note**: MyCryptoPilot utilise des **paiements crypto uniquement**. Stripe est conservé pour compatibilité avec le template NOW.TS.

#### Variables sweep locales (`.env.sweep` uniquement)

| Variable                              | Usage                  | Notes                                                                       |
| ------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `DRY_RUN`                             | `true` par défaut      | Passe à `false` pour envoyer de vraies transactions (confirmation requise). |
| `SWEEP_MIN_THRESHOLD_USD`             | Seuil minimum          | Supérieur à 0 pour éviter le dust.                                          |
| `SWEEP_MNEMONIC_BASE`                 | Seed Base              | Stocker chiffré (1Password). Jamais committer.                              |
| `SWEEP_MNEMONIC_TRON`                 | Seed Tron              | Idem.                                                                       |
| `BINANCE_MASTER_WALLET_BASE` / `TRON` | Peut être dupliqué ici | Surcharge locale possible si différent de `.env`.                           |

Ces variables ne doivent **jamais** être ajoutées à Vercel/GitHub Actions. Elles sont destinées à l’opérateur qui exécute `scripts/sweep-to-binance.ts`.

---

### 🔵 Variables GitHub Actions

Variables nécessaires pour **CI/CD** (tests E2E, type checking, lint).

| Variable                  | Source      | GitHub Actions  | Notes                                      |
| ------------------------- | ----------- | --------------- | ------------------------------------------ |
| `DATABASE_URL`            | `.env.test` | ✅ Oui          | PostgreSQL local (pas Neon)                |
| `BETTER_AUTH_SECRET_TEST` | `.env.test` | ✅ Oui          | Peut être différent de prod                |
| `CRYPTO_NETWORK`          | `.env.test` | ✅ Oui          | `testnet`                                  |
| `CRYPTO_XPUB_BASE`        | `.env.test` | ✅ Oui          | XPUB testnet                               |
| `CRYPTO_XPUB_TRON`        | `.env.test` | ✅ Oui          | XPUB testnet                               |
| `BASE_RPC_URL_TESTNET`    | `.env.test` | ✅ Oui          | RPC testnet                                |
| `TRON_RPC_URL_TESTNET`    | `.env.test` | ✅ Oui          | RPC testnet                                |
| `DISCORD_BOT_ENABLED`     | `.env.test` | ✅ Oui (`true`) | Active le bot durant les tests fin de flux |
| `RESEND_API_KEY`          | `.env.test` | ✅ Oui          | Pour tests email                           |
| `ENCRYPTION_SECRET`       | `.env.test` | ✅ Oui          | Même que prod pour cohérence               |

**Variables partagées avec Vercel** (voir section précédente):

- Discord (bot, channels, roles, webhook)
- Stripe (legacy)
- Binance wallets

---

## Guide de Synchronisation

### Ajouter une Variable sur Vercel

#### Production

```bash
# Ajouter à Production
vercel env add NOM_VARIABLE production

# Vercel va demander la valeur (coller depuis .env)
```

#### Preview

```bash
# Ajouter à Preview (toutes les branches sauf main)
vercel env add NOM_VARIABLE preview

# Vercel va demander la valeur (coller depuis .env.local)
```

#### Les Deux

```bash
# Ajouter à Production ET Preview
vercel env add NOM_VARIABLE production preview

# Vercel va demander la valeur (même valeur pour les deux)
```

### Ajouter un Secret sur GitHub Actions

```bash
# Ajouter un secret
gh secret set NOM_SECRET -R YoannDrx/mycryptopilot

# GitHub va demander la valeur (coller depuis .env.test)
```

**Alternative (depuis fichier)**:

```bash
# Lire depuis fichier
gh secret set NOM_SECRET -R YoannDrx/mycryptopilot < <(grep "^NOM_SECRET=" .env.test | cut -d'=' -f2-)
```

### Supprimer des Variables

#### Vercel

```bash
# Supprimer de Production
vercel env rm NOM_VARIABLE production --yes

# Supprimer de Preview
vercel env rm NOM_VARIABLE preview --yes

# Supprimer d'une branche spécifique
vercel env rm NOM_VARIABLE preview nom-branche --yes
```

#### GitHub Actions

```bash
# Supprimer un secret
gh secret delete NOM_SECRET -R YoannDrx/mycryptopilot
```

### Commande de Vérification

Utiliser la commande custom `/sync-env`:

```bash
# Dans Claude Code
/sync-env
```

Cette commande va:

1. Parser les fichiers `.env*` locaux
2. Lister variables Vercel (PROD + PREVIEW)
3. Lister secrets GitHub Actions
4. Comparer et identifier les différences
5. Générer un rapport avec commandes de correction

---

## Troubleshooting

### Problème: Variables Vercel orphelines après merge PR

**Symptôme**: Variables restent après merge/close de PR

**Cause**: `delete_branch_on_merge` désactivé sur GitHub

**Solution**: ✅ **Déjà corrigé** (24 oct 2025)

```bash
# Vérifier que c'est activé
gh api repos/YoannDrx/mycryptopilot --jq '.delete_branch_on_merge'
# Doit afficher: true
```

**Workflow normal**:

1. Merge PR → GitHub supprime branche auto
2. Vercel détecte → supprime preview
3. Neon détecte → supprime DB branch
4. Variables liées disparaissent

### Problème: Branches Neon orphelines

**Symptôme**: Branches Neon existent alors que PR est mergée

**Cause**: Branches Git pas supprimées (voir ci-dessus)

**Solution**: Supprimer manuellement

```bash
# Lister branches Neon
neonctl branches list --project-id wispy-forest-21715747

# Supprimer une branche orpheline
neonctl branches delete BRANCH_ID --project-id wispy-forest-21715747
```

### Problème: Preview utilise mainnet au lieu de testnet

**Symptôme**: Preview pointe vers crypto mainnet

**Cause**: Variables mal configurées

**Solution**: Vérifier mapping

```bash
# Lister variables Preview
vercel env ls

# Vérifier CRYPTO_NETWORK sur Preview
# Doit être "testnet" pour Preview
# Doit être "mainnet" pour Production
```

### Problème: OAuth redirect mismatch

**Symptôme**: Erreur "redirect_uri_mismatch" lors de login

**Cause**: `BETTER_AUTH_URL` incorrect

**Solution**:

- **Production**: `BETTER_AUTH_URL="https://www.mycryptopilot.app"`
- **Preview**: Géré automatiquement par Vercel (pas besoin de set)
- **Local**: `BETTER_AUTH_URL="http://localhost:3000"`

### Problème: Tests E2E échouent dans CI

**Symptôme**: Tests passent en local mais échouent dans GitHub Actions

**Causes possibles**:

1. DATABASE_URL manquant ou incorrect
2. Secrets GitHub Actions manquants
3. PostgreSQL pas configuré dans CI

**Solution**:

```bash
# Vérifier secrets GitHub Actions
gh secret list -R YoannDrx/mycryptopilot

# Ajouter DATABASE_URL pour tests (local)
gh secret set DATABASE_URL -R YoannDrx/mycryptopilot
# Valeur: postgresql://postgres:postgres@localhost:5432/mycryptopilot_test
```

---

## Sécurité

### ⚠️ Règles de Sécurité CRITIQUES

#### 1. Ne JAMAIS commit de fichiers .env

Vérifier `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.test
.env.test.local
.env*.local
```

✅ `.env.example` est le **seul** fichier env tracké dans Git (template sans valeurs)

#### 2. Séparer Mainnet et Testnet

| Environnement  | Crypto Network | XPUBs         | Risque          |
| -------------- | -------------- | ------------- | --------------- |
| **Production** | `mainnet`      | XPUBs mainnet | 🔴 Argent réel  |
| **Preview**    | `testnet`      | XPUBs testnet | ✅ Aucun risque |
| **Local Dev**  | `testnet`      | XPUBs testnet | ✅ Aucun risque |
| **CI Tests**   | `testnet`      | XPUBs testnet | ✅ Aucun risque |

**⚠️ NE JAMAIS**:

- Utiliser XPUBs mainnet en dev/test
- Utiliser XPUBs testnet en production
- Mélanger les deux environnements

#### 3. Protéger les Seed Phrases

Les **seed phrases** (12-24 mots) contrôlent les fonds:

- ✅ **DO**: Sauvegarder dans 1Password/Bitwarden (vault chiffré)
- ✅ **DO**: Écrire sur papier (coffre-fort physique)
- ✅ **DO**: Backup multiple (2-3 copies, lieux différents)
- ❌ **DON'T**: Jamais commit dans Git
- ❌ **DON'T**: Jamais partager avec qui que ce soit
- ❌ **DON'T**: Jamais stocker en clair sur ordinateur

#### 4. XPUBs vs Seed Phrases

| Type                        | Sécurité    | Commit Git? | Vercel?   | Usage                           |
| --------------------------- | ----------- | ----------- | --------- | ------------------------------- |
| **Seed Phrase**             | 🔴 CRITIQUE | ❌ JAMAIS   | ❌ JAMAIS | Récupération fonds uniquement   |
| **XPRV** (extended private) | 🔴 CRITIQUE | ❌ JAMAIS   | ❌ JAMAIS | Génération adresses (dangereux) |
| **XPUB** (extended public)  | ✅ Safe     | ❌ Non      | ✅ Oui    | Génération adresses (safe)      |

**⚠️ CRITIQUE**: Les scripts doivent générer des **XPUB** (`.neuter()`), jamais XPRV!

#### 5. Encryption Secret

`ENCRYPTION_SECRET` chiffre les API keys Binance/Bybit en DB:

- ✅ Générer avec: `openssl rand -hex 32`
- ⚠️ **NE JAMAIS changer en production** (invaliderait toutes les clés)
- ✅ Même secret dans tous les environnements (pour cohérence)

#### 6. Secrets GitHub Actions

Les secrets GitHub Actions sont **chiffrés** mais:

- ✅ Ajouter uniquement les secrets **nécessaires** pour CI
- ✅ Utiliser testnet XPUBs (pas mainnet)
- ✅ Éviter d'ajouter des clés privées ou sensibles

#### 7. OAuth Secrets

| Provider    | Multi-redirect? | Config                         |
| ----------- | --------------- | ------------------------------ |
| **GitHub**  | ❌ Non          | Apps séparées dev/prod         |
| **Google**  | ✅ Oui          | 1 app, multiples redirect URIs |
| **Discord** | ✅ Oui          | 1 app, multiples redirect URIs |

**Redirect URIs à configurer**:

- Local: `http://localhost:3000/api/auth/callback/PROVIDER`
- Production: `https://www.mycryptopilot.app/api/auth/callback/PROVIDER`

---

## Checklist Setup Nouveau Dev

Pour un nouveau développeur qui clone le repo:

### 1. Cloner et installer

```bash
git clone git@github.com:YoannDrx/mycryptopilot.git
cd mycryptopilot
pnpm install
```

### 2. Copier template env

```bash
cp .env.example .env.local
```

### 3. Remplir .env.local

Demander au lead dev ou copier depuis 1Password:

- [ ] `DATABASE_URL` (Neon vercel-dev branch)
- [ ] `BETTER_AUTH_SECRET`
- [ ] `CRYPTO_NETWORK="testnet"`
- [ ] `CRYPTO_XPUB_BASE` (testnet)
- [ ] `CRYPTO_XPUB_TRON` (testnet)
- [ ] `BASE_RPC_URL_TESTNET`
- [ ] `TRON_RPC_URL_TESTNET`
- [ ] OAuth keys (Google, Discord, GitHub dev)
- [ ] Discord bot config
- [ ] Resend API key
- [ ] Autres selon besoins

### 4. Lancer dev server

```bash
pnpm dev
```

### 5. Tester

- [ ] App démarre sur http://localhost:3000
- [ ] Login fonctionne (OAuth)
- [ ] Dashboard accessible
- [ ] Aucune erreur console

---

## Maintenance

### Audit Régulier

**Fréquence recommandée**: Mensuel

```bash
# Lancer la commande de sync
/sync-env
```

Vérifier:

- Variables orphelines
- Branches Neon orphelines
- Secrets GitHub Actions inutilisés

### Rotation des Secrets

**Secrets à renouveler périodiquement**:

| Secret               | Fréquence | Impact                                     |
| -------------------- | --------- | ------------------------------------------ |
| `BETTER_AUTH_SECRET` | 6-12 mois | Force reconnexion users                    |
| `CRON_SECRET`        | 6-12 mois | Régénérer et mettre à jour partout         |
| `ENCRYPTION_SECRET`  | ❌ JAMAIS | Invaliderait toutes les API keys chiffrées |

**Secrets OAuth**: Pas besoin de rotation (gérés par providers)

---

**📝 Fin du Guide de Mapping**

Pour toute question, consulter:

- `.claude/CLAUDE.md` - Instructions générales
- `.claude/commands/sync-env.md` - Commande de vérification
- `ENV_CHECKLIST.md` - Checklist complète (si existant)
