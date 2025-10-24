---
description: Vérifie intelligemment la synchronisation des variables d'environnement entre local (.env) et distant (Vercel + GitHub Actions + Railway)
---

# 🔄 Sync Environment Variables

Cette commande vérifie la synchronisation des variables d'environnement et génère un rapport détaillé avec actions recommandées.

**Durée estimée**: 2-3 minutes

---

## Instructions

Tu vas analyser les variables d'environnement locales et distantes, puis générer un rapport complet avec recommandations de synchronisation.

### 🎯 Objectifs

1. **Parser les fichiers .env locaux**
2. **Lister les variables distantes** (Vercel PROD + PREVIEW + GitHub Actions + Railway)
3. **Mapper intelligemment** les variables selon leur destination
4. **Comparer et identifier les différences**
5. **Générer un rapport actionnable**

---

## Étape 1: Parser les Fichiers Locaux

**Lire et parser**:
- `.env` → Production backup (mainnet)
- `.env.local` → Development (testnet)
- `.env.test` → E2E tests (testnet local)

**Extraire toutes les variables** (format `VAR_NAME=value`):
```bash
# Extraire noms de variables uniquement (sans valeurs pour sécurité)
grep -E "^[A-Z_].*=" .env | cut -d'=' -f1
grep -E "^[A-Z_].*=" .env.local | cut -d'=' -f1
grep -E "^[A-Z_].*=" .env.test | cut -d'=' -f1
```

**Créer un inventaire** des variables uniques avec leur source:
- Variables présentes dans `.env` uniquement
- Variables présentes dans `.env.local` uniquement
- Variables présentes dans `.env.test` uniquement
- Variables présentes partout (communes)

---

## Étape 2: Lister les Variables Distantes

### Vercel

```bash
# Lister toutes les variables Vercel (tous environnements)
vercel env ls

# Note: Vercel montre automatiquement les environnements pour chaque variable
```

**Parser la sortie** pour extraire:
- Nom de variable
- Environnements (Production, Preview, Development)

### GitHub Actions

```bash
# Lister tous les secrets GitHub Actions
gh secret list -R YoannDrx/mycryptopilot
```

**Parser la sortie** pour extraire les noms de secrets.

### Railway

```bash
# Vérifier que le service Railway est linké
railway status 2>&1 | grep -q "No Railway project linked" && echo "⚠️ Railway not linked - skipping" || {
  # Lister toutes les variables Railway (production environment)
  railway variables --kv
}
```

**Parser la sortie** pour extraire:
- Nom de variable
- Valeur (pour comparaison - NE PAS logger les valeurs sensibles!)

**Note importante**: Railway variables sont listées en format `KEY=value`. Si Railway n'est pas linké au projet, cette étape sera sautée avec un warning.

---

## Étape 3: Mapping Intelligent des Variables

### 📋 Règles de Mapping

#### **A. Variables PRODUCTION (Vercel Production uniquement)**

Ces variables doivent être sur **Vercel Production** (source: `.env`):

```
# Database (production branch)
DATABASE_URL
DATABASE_URL_UNPOOLED

# Auth URL production
BETTER_AUTH_URL="https://www.mycryptopilot.app"

# Crypto Mainnet
CRYPTO_NETWORK="mainnet"
CRYPTO_XPUB_BASE (mainnet - depuis .env)
CRYPTO_XPUB_TRON (mainnet - depuis .env)
BASE_RPC_URL (mainnet)
TRON_RPC_URL (mainnet)

# OAuth Production (si différent de dev)
GITHUB_CLIENT_ID (production)
GITHUB_CLIENT_SECRET (production)
```

#### **B. Variables PREVIEW (Vercel Preview uniquement)**

Ces variables doivent être sur **Vercel Preview** (source: `.env.local`):

```
# Auth URL preview
BETTER_AUTH_URL="http://localhost:3000" (ou preview URL dynamique)

# Crypto Testnet
CRYPTO_NETWORK="testnet"
CRYPTO_XPUB_BASE (testnet - depuis .env.local)
CRYPTO_XPUB_TRON (testnet - depuis .env.local)
BASE_RPC_URL_TESTNET
TRON_RPC_URL_TESTNET
```

#### **C. Variables COMMUNES (Vercel Production + Preview)**

Ces variables doivent être sur **les deux environnements**:

```
# Auth
BETTER_AUTH_SECRET

# OAuth (si partagé dev/prod)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET

# Discord Bot
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
DISCORD_FREE_SIGNALS_CHANNEL_ID
DISCORD_LOG_CHANNEL_ID
DISCORD_ROLE_ADMIN_ID
DISCORD_FREE_ROLE_ID
DISCORD_PRO_ROLE_ID
DISCORD_ULTRA_ROLE_ID
DISCORD_WEBHOOK_SIGNALS_URL

# Email
RESEND_API_KEY
RESEND_AUDIENCE_ID
EMAIL_FROM
NEXT_PUBLIC_EMAIL_CONTACT

# Cron
CRON_SECRET

# Encryption
ENCRYPTION_SECRET

# Binance (if used)
BINANCE_MASTER_WALLET_BASE
BINANCE_MASTER_WALLET_TRON
BINANCE_USER_API_KEY
BINANCE_USER_SECRET_KEY

# Bybit (if used)
BYBIT_USER_API_KEY
BYBIT_USER_SECRET_KEY

# Stripe (legacy - but keep for NOW.TS compatibility)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_PLAN_ID
STRIPE_PRO_YEARLY_PLAN_ID
STRIPE_ULTRA_PLAN_ID
STRIPE_ULTRA_YEARLY_PLAN_ID

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST

# Upload (optional)
UPLOADTHING_TOKEN
```

#### **D. Variables GitHub Actions**

Ces variables sont nécessaires pour **CI/CD** (source: `.env.test` ou spécifique CI):

```
# Variables pour tests E2E dans CI
DATABASE_URL (dev/test branch)
BETTER_AUTH_SECRET_TEST (peut être différent de prod pour isolation)
CRYPTO_NETWORK="testnet"
CRYPTO_XPUB_BASE (testnet)
CRYPTO_XPUB_TRON (testnet)
BASE_RPC_URL_TESTNET
TRON_RPC_URL_TESTNET

# API Keys nécessaires pour tests
RESEND_API_KEY (pour tests email)
ENCRYPTION_SECRET
DISCORD_BOT_TOKEN (si tests Discord)
# ... autres selon besoins CI
```

#### **E. Variables Railway (Discord Bot uniquement - 15 vars)**

Railway héberge le **Discord Bot standalone** qui nécessite seulement un sous-ensemble de variables.

**Variables REQUISES (15 vars)**:

```
# Core Database & Auth (4 vars)
DATABASE_URL                      # Neon production (SAME as Vercel PROD!)
DATABASE_URL_UNPOOLED             # Direct DB connection (required by Prisma)
BETTER_AUTH_SECRET                # Auth secret (SAME as Vercel PROD!)
NODE_ENV=production               # Production mode

# Discord Bot (3 vars)
DISCORD_BOT_TOKEN                 # Token du bot Discord
DISCORD_GUILD_ID                  # ID du serveur Discord
DISCORD_BOT_ENABLED=true          # Active le bot

# Discord Configuration (8 vars)
DISCORD_INVITE_URL                # Lien d'invitation au serveur
DISCORD_FREE_SIGNALS_CHANNEL_ID   # Channel signaux gratuits
DISCORD_LOG_CHANNEL_ID            # Channel logs bot
DISCORD_ROLE_ADMIN_ID             # Role admin
DISCORD_FREE_ROLE_ID              # Role plan FREE
DISCORD_PRO_ROLE_ID               # Role plan PRO
DISCORD_ULTRA_ROLE_ID             # Role plan ULTRA
DISCORD_WEBHOOK_SIGNALS_URL       # Webhook pour signaux
```

**Variables INTERDITES sur Railway (6 vars)**:

⚠️ Ces variables sont utilisées **UNIQUEMENT par l'app web (Vercel)**, **PAS par le Discord Bot**:

```
❌ BASE_RPC_URL           # RPC calls paiements Base (Vercel only)
❌ CRON_SECRET            # Authentification cron jobs (Vercel only)
❌ CRYPTO_NETWORK         # Configuration réseau crypto (Vercel only)
❌ CRYPTO_XPUB_BASE       # HD wallet XPUB Base (Vercel only)
❌ CRYPTO_XPUB_TRON       # HD wallet XPUB Tron (Vercel only)
❌ TRON_RPC_URL           # RPC calls paiements Tron (Vercel only)
```

**🎯 Objectif Railway**: Garder exactement **15 variables** (pas plus, pas moins).

**Source**: Ces variables sont définies dans `.env` (production) et doivent être identiques à Vercel PROD pour DATABASE_URL et BETTER_AUTH_SECRET.

---

## Étape 4: Analyse et Comparaison

Pour chaque variable locale, déterminer:

1. **Où elle devrait être** (selon mapping ci-dessus)
2. **Où elle est actuellement** (Vercel PROD/PREVIEW, GitHub Actions)
3. **Status**:
   - ✅ **Sync**: présente partout où elle devrait être
   - ⚠️ **Missing**: absente d'un environnement requis
   - 🚫 **Extra**: présente dans un environnement non requis
   - ❌ **Absent**: pas du tout présente sur distant

Pour chaque variable distante, vérifier:
- Est-elle définie dans un fichier local?
- Si non, c'est une **variable orpheline** (à supprimer?)

---

## Étape 5: Génération du Rapport

**Format du rapport**:

```markdown
# 🔄 Rapport de Synchronisation des Variables d'Environnement

**Date**: <DATE_ACTUELLE>
**Durée analyse**: <temps_execution>

---

## 📊 Résumé Global

| Environnement         | Total Variables | ✅ Sync | ⚠️ Missing | 🚫 Extra | ❌ Absent |
|-----------------------|-----------------|---------|-----------|----------|-----------|
| **Vercel Production** | 45              | 40      | 5         | 0        | 0         |
| **Vercel Preview**    | 42              | 38      | 4         | 0        | 0         |
| **GitHub Actions**    | 15              | 10      | 5         | 0        | 0         |
| **Railway (Bot)**     | 15 (optimal)    | 13      | 2         | 0        | 0         |

**Fichiers Locaux**:
- `.env` (production): <N> variables
- `.env.local` (development): <N> variables
- `.env.test` (tests): <N> variables

**⚠️ Railway Status**:
- **Objectif**: 15 variables (Discord Bot uniquement)
- **Actuel**: <N> variables
- **Variables interdites détectées**: <N> (à supprimer!)

---

## ✅ Variables Bien Synchronisées (<N> variables)

Ces variables sont présentes partout où elles devraient être:

- `BETTER_AUTH_SECRET` → Vercel PROD + PREVIEW ✅
- `DISCORD_BOT_TOKEN` → Vercel PROD + PREVIEW ✅
- `ENCRYPTION_SECRET` → Vercel PROD + PREVIEW + GitHub Actions ✅
- ...

---

## ⚠️ Variables Manquantes (<N> variables)

### Vercel Production

Variables définies localement mais absentes de Vercel PROD:

| Variable | Source Locale | Valeur (premiers chars) | Action |
|----------|---------------|-------------------------|--------|
| `CRYPTO_XPUB_BASE` | `.env` line 106 | xpub6Ejw... | Ajouter à PROD |
| `DATABASE_URL` | `.env` line 26 | postgresql://... | Ajouter à PROD |
| ... | ... | ... | ... |

**Commandes pour corriger**:
```bash
# Ajouter CRYPTO_XPUB_BASE à Production
vercel env add CRYPTO_XPUB_BASE production
# Coller la valeur depuis .env ligne 106

# Ajouter DATABASE_URL à Production
vercel env add DATABASE_URL production
# Coller la valeur depuis .env ligne 26

# ... etc pour chaque variable
```

### Vercel Preview

Variables définies localement mais absentes de Vercel PREVIEW:

| Variable | Source Locale | Valeur (premiers chars) | Action |
|----------|---------------|-------------------------|--------|
| `CRYPTO_XPUB_BASE` | `.env.local` line 101 | xpub6MKM... | Ajouter à PREVIEW |
| `BASE_RPC_URL_TESTNET` | `.env.local` line 96 | https://sepolia... | Ajouter à PREVIEW |
| ... | ... | ... | ... |

**Commandes pour corriger**:
```bash
# Ajouter CRYPTO_XPUB_BASE (testnet) à Preview
vercel env add CRYPTO_XPUB_BASE preview
# Coller la valeur depuis .env.local ligne 101

# Ajouter BASE_RPC_URL_TESTNET à Preview
vercel env add BASE_RPC_URL_TESTNET preview
# Coller la valeur depuis .env.local ligne 96

# ... etc
```

### GitHub Actions

Variables définies localement mais absentes de GitHub Actions:

| Variable | Source Locale | Valeur (premiers chars) | Action |
|----------|---------------|-------------------------|--------|
| `DATABASE_URL` | `.env.test` line 24 | postgresql://postgres... | Ajouter secret |
| `BETTER_AUTH_SECRET_TEST` | `.env.test` line 32 | OeoX... | Ajouter secret |
| ... | ... | ... | ... |

**Commandes pour corriger**:
```bash
# Ajouter DATABASE_URL à GitHub Actions
gh secret set DATABASE_URL -R YoannDrx/mycryptopilot
# Coller la valeur depuis .env.test ligne 24

# Ajouter BETTER_AUTH_SECRET_TEST
gh secret set BETTER_AUTH_SECRET_TEST -R YoannDrx/mycryptopilot
# Coller la valeur depuis .env.test ligne 32

# ... etc
```

### Railway (Discord Bot)

Variables nécessaires pour le Discord Bot mais absentes de Railway:

| Variable | Source Locale | Valeur (premiers chars) | Action |
|----------|---------------|-------------------------|--------|
| `DISCORD_PRO_ROLE_ID` | `.env` line 85 | 142699... | Ajouter à Railway |
| `DATABASE_URL_UNPOOLED` | `.env` line 27 | postgresql://... | Ajouter à Railway |
| ... | ... | ... | ... |

**Commandes pour corriger**:

⚠️ **Note**: Railway CLI ne permet pas d'ajouter des variables via CLI. Tu dois utiliser le dashboard.

**Via Dashboard Railway**:
1. Va sur https://railway.app/dashboard
2. Sélectionne le projet **MyCryptoPilot**
3. Sélectionne le service **mycryptopilot**
4. Va dans l'onglet **Variables**
5. Clique sur **+ New Variable** pour chaque variable manquante
6. Copie-colle les valeurs depuis `.env`

**Liste des variables à ajouter**:
```
DISCORD_PRO_ROLE_ID = <valeur depuis .env ligne 85>
DATABASE_URL_UNPOOLED = <valeur depuis .env ligne 27>
... (etc pour chaque variable)
```

---

## 🚫 Variables En Trop (Orphelines)

Variables présentes sur distant mais **non définies dans les fichiers locaux**:

| Variable | Environnement | Âge | Action Recommandée |
|----------|---------------|-----|---------------------|
| `OLD_VARIABLE_NAME` | Vercel PROD | 30d ago | ⚠️ Supprimer (obsolète) |
| `DEPRECATED_KEY` | GitHub Actions | 15d ago | ⚠️ Supprimer (non utilisée) |
| ... | ... | ... | ... |

**Commandes pour nettoyer**:
```bash
# Supprimer OLD_VARIABLE_NAME de Vercel
vercel env rm OLD_VARIABLE_NAME production --yes

# Supprimer DEPRECATED_KEY de GitHub Actions
gh secret delete DEPRECATED_KEY -R YoannDrx/mycryptopilot
```

---

## 🚨 Variables INTERDITES sur Railway (Critique!)

⚠️ **Variables présentes sur Railway mais qui NE DOIVENT PAS y être**:

Railway héberge uniquement le **Discord Bot**, qui n'utilise **AUCUNE variable crypto/payment**.

| Variable | Environnement | Raison | Action Urgente |
|----------|---------------|--------|----------------|
| `BASE_RPC_URL` | Railway | Crypto payments (Vercel only) | 🔴 SUPPRIMER |
| `CRON_SECRET` | Railway | Cron jobs (Vercel only) | 🔴 SUPPRIMER |
| `CRYPTO_NETWORK` | Railway | Crypto config (Vercel only) | 🔴 SUPPRIMER |
| `CRYPTO_XPUB_BASE` | Railway | HD wallet (Vercel only) | 🔴 SUPPRIMER |
| `CRYPTO_XPUB_TRON` | Railway | HD wallet (Vercel only) | 🔴 SUPPRIMER |
| `TRON_RPC_URL` | Railway | Crypto payments (Vercel only) | 🔴 SUPPRIMER |

**Impact**: Ces variables ne sont **PAS utilisées** par le Discord Bot et polluent l'environnement Railway.

**Commandes pour nettoyer**:

⚠️ **Railway CLI ne permet pas de supprimer des variables**. Tu dois utiliser le dashboard:

1. Va sur https://railway.app/dashboard
2. Sélectionne le projet **MyCryptoPilot**
3. Sélectionne le service **mycryptopilot**
4. Va dans l'onglet **Variables**
5. Clique sur les 3 points (...) à côté de chaque variable interdite
6. Clique sur **Delete**
7. Confirme la suppression

**Variables à supprimer** (6 au total):
```
❌ BASE_RPC_URL
❌ CRON_SECRET
❌ CRYPTO_NETWORK
❌ CRYPTO_XPUB_BASE
❌ CRYPTO_XPUB_TRON
❌ TRON_RPC_URL
```

**Objectif**: Railway doit avoir exactement **15 variables** (pas plus!).

---

## ❌ Variables Absentes Partout

Variables définies localement mais **absentes de TOUS les environnements distants**:

| Variable | Source Locale | Mapping Recommandé | Priorité |
|----------|---------------|-------------------|----------|
| `NEW_API_KEY` | `.env` line 150 | Vercel PROD + PREVIEW | P1 |
| `TEST_FEATURE_FLAG` | `.env.local` line 200 | Vercel PREVIEW | P2 |
| ... | ... | ... | ... |

**Action**: Ajouter ces variables selon le mapping recommandé.

---

## 🔍 Détail par Variable

### Variables Critiques (P0 - Bloquantes)

#### `DATABASE_URL`
- **Devrait être**: Vercel PROD, Vercel PREVIEW (dev branch), GitHub Actions
- **Est sur**: ❌ Aucun environnement
- **Source**: `.env` line 26 (PROD), `.env.test` line 24 (CI)
- **Action**: Ajouter IMMÉDIATEMENT (bloque app en production)

#### `CRYPTO_XPUB_BASE`
- **Devrait être**: Vercel PROD (mainnet), Vercel PREVIEW (testnet)
- **Est sur**: ❌ Aucun environnement
- **Source**: `.env` line 106 (mainnet), `.env.local` line 101 (testnet)
- **Action**: Ajouter IMMÉDIATEMENT (bloque paiements crypto)

... (continuer pour chaque variable critique)

### Variables Importantes (P1)

... (lister variables P1 avec même format)

### Variables Optionnelles (P2)

... (lister variables P2)

---

## 📋 Script de Synchronisation Automatique

**Option 1: Ajouter toutes les variables manquantes automatiquement**

⚠️ **Attention**: Ce script va ajouter TOUTES les variables manquantes. Vérifier le rapport avant d'exécuter!

```bash
# TODO: Ce script sera généré dynamiquement basé sur l'analyse
# Il contiendra toutes les commandes `vercel env add` et `gh secret set` nécessaires
```

**Option 2: Synchronisation manuelle guidée**

Suivre les commandes dans les sections "Commandes pour corriger" ci-dessus, une par une.

---

## 💡 Recommandations

### Sécurité

- ⚠️ Ne JAMAIS commit les fichiers `.env*` dans git (vérifier `.gitignore`)
- ⚠️ Utiliser des XPUBs **différents** pour PROD (mainnet) et PREVIEW (testnet)
- ⚠️ Vérifier que `CRYPTO_NETWORK` est bien "mainnet" en PROD et "testnet" en PREVIEW
- ✅ Les secrets GitHub Actions sont chiffrés - OK
- ✅ Les variables Vercel sont chiffrées - OK
- ✅ Les variables Railway sont chiffrées - OK

### Railway (Discord Bot)

- 🚨 **CRITIQUE**: Railway doit avoir **EXACTEMENT 15 variables** (pas plus!)
- ⛔ **Ne JAMAIS ajouter** de variables crypto (XPUB, RPC_URL, CRYPTO_NETWORK, CRON_SECRET) sur Railway
- ✅ **Partager** DATABASE_URL et BETTER_AUTH_SECRET avec Vercel PROD (mêmes valeurs!)
- 🔍 **Vérifier** que toutes les 11 variables Discord sont présentes
- 💡 **Astuce**: Railway variables sont automatiquement injectées - pas besoin de fichier .env

### Performance

- 💡 GitHub Actions: Ajouter uniquement les variables nécessaires pour CI (pas toutes)
- 💡 Vercel: Utiliser les mêmes valeurs pour PROD/PREVIEW quand possible (OAuth keys, Discord config, etc.)
- 💡 Railway: Garder le strict minimum (15 vars) pour réduire l'overhead

### Maintenance

- 🔄 Lancer cette commande `/sync-env` après chaque ajout de variable locale
- 🔄 Vérifier la synchronisation avant chaque déploiement production
- 📝 Documenter les nouvelles variables dans `ENV_CHECKLIST.md` (si existant)
- 🚀 Après modification variables Railway: Redéployer le bot (`railway up` ou via dashboard)

---

## ⚙️ Configuration Actuelle Détectée

### Vercel Project

- **Name**: mycryptopilot
- **Owner**: yoanndrxs-projects
- **Production Branch**: main (probablement)
- **Preview Branches**: toutes les autres branches

### GitHub Repository

- **Owner**: YoannDrx
- **Repo**: mycryptopilot
- **Secrets Scope**: Repository-level

### Railway Project

- **Name**: MyCryptoPilot
- **Service**: mycryptopilot (Discord Bot)
- **Environment**: production
- **Status**: <linked/not-linked> (détecté via `railway status`)
- **Variables Attendues**: 15 (Discord Bot uniquement)

---

**🎉 Fin du Rapport**

_Généré par `/sync-env` le <DATE>_
```

---

## Contraintes & Guidelines

1. **Sécurité**:
   - Ne JAMAIS logger les valeurs complètes des secrets
   - Afficher uniquement premiers/derniers 4 caractères pour vérification
   - Format: `xpub6Ejw...atyx` ou `postgre...uire`

2. **Parsing**:
   - Ignorer les commentaires dans .env (`#`)
   - Ignorer les lignes vides
   - Gérer les valeurs avec `=` dans la valeur (ex: URLs)
   - Détecter format: `VAR_NAME="value with spaces"`

3. **Mapping**:
   - Utiliser la logique de mapping définie dans Étape 3
   - Être intelligent: détecter patterns (ex: `*_TESTNET` → PREVIEW)
   - Variables `NEXT_PUBLIC_*` → PROD + PREVIEW (publiques)

4. **Rapport**:
   - Markdown bien formaté
   - Tableaux pour données structurées
   - Emojis pour clarté visuelle
   - Commandes copiables directement

5. **Performance**:
   - Utiliser des commandes CLI efficaces
   - Éviter les appels API redondants
   - Parser les sorties plutôt que relancer les commandes

---

## Workflow Exécution

Lorsque l'utilisateur lance `/sync-env`:

1. Afficher: "🔄 Analyse des variables d'environnement..."
2. Parser fichiers locaux (afficher compteurs)
3. Lister variables Vercel (afficher compteur)
4. Lister secrets GitHub Actions (afficher compteur)
5. **Lister variables Railway** (afficher compteur + status linked/not-linked)
6. Analyser et comparer (afficher progress par catégorie)
7. **Vérifier variables interdites sur Railway** (critique!)
8. Générer et afficher le rapport complet
9. Résumé final: "✅ Analyse terminée! <N> variables analysées, <N> différences détectées"

**Durée totale estimée**: 2-3 minutes.

**Ordre d'affichage des sections du rapport**:
1. Résumé Global (tableau avec Vercel, GitHub Actions, Railway)
2. Variables Bien Synchronisées
3. Variables Manquantes (Vercel PROD, PREVIEW, GitHub Actions, Railway)
4. 🚨 **Variables INTERDITES sur Railway** (section critique en priorité!)
5. Variables En Trop (Orphelines)
6. Variables Absentes Partout
7. Détail par Variable
8. Script de Synchronisation Automatique
9. Recommandations
10. Configuration Actuelle Détectée
