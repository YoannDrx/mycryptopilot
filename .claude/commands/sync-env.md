---
description: Synchronise automatiquement les variables d'environnement entre local (.env) et distant (Vercel + GitHub Actions + secrets Fly)
---

# 🔄 Sync Environment Variables

Cette commande **synchronise automatiquement** les variables d'environnement locales vers les plateformes distantes (Vercel, GitHub Actions) et fournit les instructions manuelles pour Fly.

**Durée estimée**: 3-5 minutes (incluant l'exécution automatique)

**Mode**: Synchronisation automatique avec confirmation

---

## Instructions

Tu vas analyser les variables d'environnement locales et distantes, identifier les différences, puis **synchroniser automatiquement** les variables manquantes.

### 🎯 Objectifs

1. **Parser les fichiers .env locaux** (avec valeurs pour synchronisation)
2. **Lister les variables distantes** (Vercel PROD + PREVIEW + GitHub Actions + Fly secrets)
3. **Mapper intelligemment** les variables selon leur destination
4. **Identifier les différences** et générer le plan de synchronisation
5. **Demander confirmation** à l'utilisateur avant de procéder
6. **Exécuter automatiquement** les commandes de synchronisation
7. **Générer un rapport final** avec résultats de la synchronisation

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

### Fly worker (cron + Discord)

```bash
# Vérifier que l'app Fly est accessible
fly status -a mycryptopilot-worker >/dev/null

# Lister les secrets (nom uniquement)
fly secrets list -a mycryptopilot-worker
```

**Parser la sortie** pour extraire les noms de secrets présents sur Fly (valeurs masquées). Toute modification se fait ensuite via `fly secrets set ...`.

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

# Tron API (optional)
TRON_API_KEY

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

#### **E. Secrets Fly worker (cron + Discord)**

Le worker Fly exécute les cron jobs, le payment watcher et le bot Discord. Il doit partager les mêmes secrets critiques que Vercel (DB, auth, crypto) + la configuration Discord.

**Secrets REQUIS**:

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

# Notifications / Emails
RESEND_API_KEY
EMAIL_FROM
```

⚠️ Secrets Fly = **copie stricte** des valeurs Vercel Production (pas de variantes). Toute mise à jour doit être répercutée via `fly secrets set -a mycryptopilot-worker KEY="value"`.

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

````markdown
# 🔄 Rapport de Synchronisation des Variables d'Environnement

**Date**: <DATE_ACTUELLE>
**Durée analyse**: <temps_execution>

---

## 📊 Résumé Global

| Environnement         | Total Variables | ✅ Sync | ⚠️ Missing | 🚫 Extra | ❌ Absent |
| --------------------- | --------------- | ------- | ---------- | -------- | --------- |
| **Vercel Production** | 45              | 40      | 5          | 0        | 0         |
| **Vercel Preview**    | 42              | 38      | 4          | 0        | 0         |
| **GitHub Actions**    | 15              | 10      | 5          | 0        | 0         |
| **Fly worker**        | 18              | 16      | 2          | 0        | 0         |

**Fichiers Locaux**:

- `.env` (production): <N> variables
- `.env.local` (development): <N> variables
- `.env.test` (tests): <N> variables

**⚠️ Fly worker secrets**:

- **Objectif**: refléter 100 % des variables critiques de Vercel PROD (DB, auth, crypto, Discord)
- **Actuel**: <N> secrets (`fly secrets list -a mycryptopilot-worker`)
- **Secrets manquants**: <N> (ajouter via `fly secrets set ...`)

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

| Variable           | Source Locale   | Valeur (premiers chars) | Action         |
| ------------------ | --------------- | ----------------------- | -------------- |
| `CRYPTO_XPUB_BASE` | `.env` line 106 | xpub6Ejw...             | Ajouter à PROD |
| `DATABASE_URL`     | `.env` line 26  | postgresql://...        | Ajouter à PROD |
| ...                | ...             | ...                     | ...            |

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
````

### Vercel Preview

Variables définies localement mais absentes de Vercel PREVIEW:

| Variable               | Source Locale         | Valeur (premiers chars) | Action            |
| ---------------------- | --------------------- | ----------------------- | ----------------- |
| `CRYPTO_XPUB_BASE`     | `.env.local` line 101 | xpub6MKM...             | Ajouter à PREVIEW |
| `BASE_RPC_URL_TESTNET` | `.env.local` line 96  | https://sepolia...      | Ajouter à PREVIEW |
| ...                    | ...                   | ...                     | ...               |

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

| Variable                  | Source Locale       | Valeur (premiers chars)  | Action         |
| ------------------------- | ------------------- | ------------------------ | -------------- |
| `DATABASE_URL`            | `.env.test` line 24 | postgresql://postgres... | Ajouter secret |
| `BETTER_AUTH_SECRET_TEST` | `.env.test` line 32 | OeoX...                  | Ajouter secret |
| ...                       | ...                 | ...                      | ...            |

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

### Fly worker (cron + Discord)

Secrets nécessaires pour le worker mais absents de Fly:

| Secret                   | Source Locale  | Valeur (premiers chars) | Action                                                  |
| ------------------------ | -------------- | ----------------------- | ------------------------------------------------------- |
| `DISCORD_PRO_ROLE_ID`    | `.env` line 85 | 142699...               | `fly secrets set -a mycryptopilot-worker DISCORD_PRO_ROLE_ID=...` |
| `DATABASE_URL_UNPOOLED`  | `.env` line 27 | postgresql://...        | `fly secrets set -a mycryptopilot-worker DATABASE_URL_UNPOOLED=...` |
| ...                      | ...            | ...                     | ...                                                     |

Chaque secret se met à jour ainsi :

```bash
fly secrets set -a mycryptopilot-worker KEY="value"
```

> ⚠️ Le worker redémarre automatiquement après ajout/modification d’un secret. Vérifier `fly logs -a mycryptopilot-worker --no-tail`.

---

## 🚫 Variables En Trop (Orphelines)

Variables présentes sur distant mais **non définies dans les fichiers locaux**:

| Variable            | Environnement  | Âge     | Action Recommandée          |
| ------------------- | -------------- | ------- | --------------------------- |
| `OLD_VARIABLE_NAME` | Vercel PROD    | 30d ago | ⚠️ Supprimer (obsolète)     |
| `DEPRECATED_KEY`    | GitHub Actions | 15d ago | ⚠️ Supprimer (non utilisée) |
| ...                 | ...            | ...     | ...                         |

**Commandes pour nettoyer**:

```bash
# Supprimer OLD_VARIABLE_NAME de Vercel
vercel env rm OLD_VARIABLE_NAME production --yes

# Supprimer DEPRECATED_KEY de GitHub Actions
gh secret delete DEPRECATED_KEY -R YoannDrx/mycryptopilot
```

---

## 🚨 Secrets superflus sur Fly (Critique!)

⚠️ **Secrets présents sur Fly mais inutiles pour le worker**:

Le worker a besoin uniquement des secrets listés plus haut. Ne laissez pas de secrets supplémentaires inutilisés (ex : anciennes clés Stripe, secrets temporaires, etc.), pour éviter les divergences avec Vercel.

Suppression :

```bash
fly secrets unset -a mycryptopilot-worker SECRET_NAME
```

---

## ❌ Variables Absentes Partout

Variables définies localement mais **absentes de TOUS les environnements distants**:

| Variable            | Source Locale         | Mapping Recommandé    | Priorité |
| ------------------- | --------------------- | --------------------- | -------- |
| `NEW_API_KEY`       | `.env` line 150       | Vercel PROD + PREVIEW | P1       |
| `TEST_FEATURE_FLAG` | `.env.local` line 200 | Vercel PREVIEW        | P2       |
| ...                 | ...                   | ...                   | ...      |

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
- ✅ Les secrets Fly sont chiffrés - OK

### Fly worker (cron + Discord)

- 🚨 **CRITIQUE**: Fly doit contenir exactement la liste de secrets documentée (pas plus)
- ⛔ **Ne JAMAIS ajouter** de variables aléatoires (XPUB/testnet) si le worker ne les consomme pas
- ✅ **Partager** DATABASE_URL et BETTER_AUTH_SECRET avec Vercel PROD (mêmes valeurs)
- 🔍 **Vérifier** que toutes les variables Discord sont présentes
- 💡 **Astuce**: secrets injectés automatiquement, pas besoin de `.env`

### Performance

- 💡 GitHub Actions: Ajouter uniquement les variables nécessaires pour CI (pas toutes)
- 💡 Vercel: Utiliser les mêmes valeurs pour PROD/PREVIEW quand possible (OAuth keys, Discord config, etc.)
- 💡 Fly: Garder uniquement les secrets nécessaires sur le worker

### Maintenance

- 🔄 Lancer cette commande `/sync-env` après chaque ajout de variable locale
- 🔄 Vérifier la synchronisation avant chaque déploiement production
- 📝 Documenter les nouvelles variables dans `ENV_CHECKLIST.md` (si existant)
- 🚀 Après modification des secrets Fly: surveiller `fly logs` pour confirmer le redémarrage

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

### Fly Worker

- **App**: mycryptopilot-worker
- **Process**: worker (cron + Discord)
- **Region**: cdg (peut varier)
- **Status**: `fly status -a mycryptopilot-worker`
- **Secrets attendus**: alignés sur Vercel PROD (voir section E)

---

**🎉 Fin du Rapport**

_Généré par `/sync-env` le <DATE>_

````

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

## Étape 5: Synchronisation Automatique

**IMPORTANT**: Cette étape exécute automatiquement les commandes pour synchroniser les variables.

### A. Générer le Plan de Synchronisation

Pour chaque variable manquante, générer la commande appropriée:

#### Vercel (via CLI avec stdin)

```bash
# Format pour ajouter une variable Vercel avec stdin:
echo "VALUE_HERE" | vercel env add VAR_NAME production

# Exemple:
echo "xpub6Ejw21u9tffx..." | vercel env add CRYPTO_XPUB_BASE production
````

**Variables à synchroniser sur Vercel PROD**:

- Toutes les variables de `.env` selon mapping (section E3)
- Utiliser `production` comme environnement

**Variables à synchroniser sur Vercel PREVIEW**:

- Toutes les variables de `.env.local` selon mapping (section E3)
- Utiliser `preview` comme environnement

**Variables COMMUNES (PROD + PREVIEW)**:

- Ajouter 2 fois (une fois avec `production`, une fois avec `preview`)

#### GitHub Actions (via gh CLI avec stdin)

```bash
# Format pour ajouter un secret GitHub:
echo "VALUE_HERE" | gh secret set VAR_NAME -R YoannDrx/mycryptopilot

# Exemple:
echo "postgresql://..." | gh secret set DATABASE_URL -R YoannDrx/mycryptopilot
```

**Variables à synchroniser sur GitHub Actions**:

- Variables de `.env.test` nécessaires pour CI
- Voir mapping section E3-D

#### Fly (secrets manuels)

⚠️ Fly ne propose pas d'API CLI pour lire/écrire des valeurs en clair (uniquement `set/unset`).

Pour Fly, générer uniquement des **instructions manuelles** avec:

- Nom de la variable
- Valeur à copier-coller
- Lien direct vers dashboard

### B. Demander Confirmation à l'Utilisateur

Avant d'exécuter les commandes, afficher:

```markdown
## 🚀 Plan de Synchronisation

**Variables à ajouter**:

- Vercel Production: <N> variables
- Vercel Preview: <N> variables
- GitHub Actions: <N> secrets
- Fly worker: <N> secrets (manuel)

**⚠️ ATTENTION**:

- Les valeurs seront ajoutées automatiquement depuis les fichiers .env locaux
- Vercel et GitHub Actions seront mis à jour via CLI
- Fly nécessite une confirmation manuelle (commande `fly secrets set ...`)

**Voulez-vous procéder à la synchronisation automatique?**
```

**Attendre la réponse de l'utilisateur** avec `AskUserQuestion`:

- Option 1: "Oui, synchroniser maintenant" → Continuer
- Option 2: "Non, seulement afficher le rapport" → Skip sync, afficher rapport
- Option 3: "Annuler" → Arrêter la commande

### C. Exécuter la Synchronisation

Si l'utilisateur confirme:

1. **Vercel Production**:
   - Pour chaque variable manquante:
     - Parser `.env` pour extraire la valeur
     - Exécuter: `echo "value" | vercel env add VAR_NAME production`
     - Logger: "✅ Ajouté VAR_NAME à Vercel PROD" ou "❌ Erreur: ..."

2. **Vercel Preview**:
   - Pour chaque variable manquante:
     - Parser `.env.local` pour extraire la valeur
     - Exécuter: `echo "value" | vercel env add VAR_NAME preview`
     - Logger: "✅ Ajouté VAR_NAME à Vercel PREVIEW" ou "❌ Erreur: ..."

3. **GitHub Actions**:
   - Pour chaque secret manquant:
     - Parser `.env.test` pour extraire la valeur
     - Exécuter: `echo "value" | gh secret set VAR_NAME -R YoannDrx/mycryptopilot`
     - Logger: "✅ Ajouté VAR_NAME à GitHub Actions" ou "❌ Erreur: ..."

4. **Fly worker** (manuel):
   - Générer instructions détaillées avec valeurs à copier-coller
   - Afficher le lien direct: https://railway.app/project/<id>/service/<id>/variables

### D. Gestion des Erreurs

Pour chaque commande exécutée:

- ✅ **Succès**: Logger et continuer
- ❌ **Échec**: Logger l'erreur, demander si continuer ou arrêter
- ⚠️ **Warning**: Variable existe déjà → Skip ou demander confirmation pour override

### E. Rapport Final

Après synchronisation, afficher:

```markdown
## ✅ Synchronisation Terminée!

**Résultats**:

- Vercel Production: <N> variables ajoutées (✅ <success> / ❌ <failed>)
- Vercel Preview: <N> variables ajoutées (✅ <success> / ❌ <failed>)
- GitHub Actions: <N> secrets ajoutés (✅ <success> / ❌ <failed>)
- Fly: <N> secrets à ajouter manuellement (instructions ci-dessous)

**Variables ajoutées avec succès**:

- ✅ DATABASE_URL → Vercel PROD
- ✅ CRYPTO_XPUB_BASE → Vercel PROD
- ✅ BETTER_AUTH_SECRET → Vercel PROD + PREVIEW
- ...

**Erreurs rencontrées**:

- ❌ STRIPE_SECRET_KEY → Vercel PROD (erreur: already exists)
- ...

**Actions manuelles requises**:

- Fly: Ajouter 2 secrets via CLI (voir instructions ci-dessous)
```

---

## Workflow Exécution

Lorsque l'utilisateur lance `/sync-env`:

1. Afficher: "🔄 Analyse des variables d'environnement..."
2. **Parser fichiers locaux avec VALEURS** (pour synchronisation)
3. Lister variables Vercel (afficher compteur)
4. Lister secrets GitHub Actions (afficher compteur)
- 5. Lister secrets Fly (afficher compteur + status)
6. **Analyser et identifier différences**
7. **Générer plan de synchronisation**
8. **Afficher plan + demander confirmation**
9. Si confirmé:
   - **Exécuter synchronisation automatique** (Vercel, GitHub, instructions Fly manuelles)
   - **Afficher progress en temps réel** (✅/❌ pour chaque variable)
10. **Générer rapport final** avec résultats
11. Résumé final: "✅ Synchronisation terminée! <N> variables ajoutées, <N> erreurs"

**Durée totale estimée**: 3-5 minutes (incluant exécution).

**Sécurité**:

- Ne JAMAIS logger les valeurs complètes des secrets (premiers/derniers 4 chars seulement)
- Parser les fichiers .env localement (pas de transmission)
- Utiliser stdin pour passer les valeurs (plus sécurisé que arguments CLI)
