# 🔍 Analyse : Simplification des Variables d'Environnement

**Date** : 11 octobre 2025
**Problème** : Impossible de se connecter via Discord OAuth en production
**Cause racine** : Credentials OAuth identiques dev/prod + trop de fichiers .env

---

## 📋 Table des Matières

1. [Problème Identifié](#problème-identifié)
2. [État Actuel](#état-actuel)
3. [Analyse du Flow Better Auth](#analyse-du-flow-better-auth)
4. [Solution Recommandée](#solution-recommandée)
5. [Plan de Migration](#plan-de-migration)
6. [Checklist de Validation](#checklist-de-validation)

---

## 🚨 Problème Identifié

### Symptôme

**Impossible de se connecter via Discord OAuth en production** (`https://www.mycryptopilot.app`)

### Cause Racine

#### 1. Credentials OAuth Identiques Dev/Prod ❌

**Fichier** : `.env.development` vs `.env.production`

```bash
# .env.development (ligne 36-37)
DISCORD_CLIENT_ID="1421427515922317332"
DISCORD_CLIENT_SECRET="l3TSO3EdXa0ATKB4yTR1LAOmNgqVk7c-"

# .env.production (ligne 37-38)
DISCORD_CLIENT_ID="1421427515922317332"  # ❌ MÊME ID!
DISCORD_CLIENT_SECRET="l3TSO3EdXa0ATKB4yTR1LAOmNgqVk7c-"  # ❌ MÊME SECRET!
```

**Conséquence** :
L'app Discord OAuth `1421427515922317332` est configurée avec **un seul redirect URI** :
`http://localhost:3000/api/auth/callback/discord`

Quand un user tente de se connecter en production :

1. User clique "Sign in with Discord" sur `https://www.mycryptopilot.app`
2. Redirigé vers Discord OAuth
3. Discord essaie de rediriger vers `http://localhost:3000/...` ❌
4. **Échec** : localhost n'est pas accessible depuis internet

#### 2. Credentials GitHub Différents (Correct) ✅

```bash
# .env.development
GITHUB_CLIENT_ID="Ov23liYgMOyfTOd5uUNk"

# .env.production
GITHUB_CLIENT_ID="Ov23ctdVYWeKQsWOxzcz"  # ✅ ID différent!
```

GitHub fonctionne car il y a **2 apps séparées** (dev + prod).

#### 3. Google OAuth Identique (Problème Potentiel) ⚠️

```bash
# .env.development + .env.production
GOOGLE_CLIENT_ID="728181273656-8qmvc2374hpu3r0faf6tq1i4s6ihnm15.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
```

Google OAuth permet **plusieurs redirect URIs** dans une même app, donc ça peut fonctionner si les 2 URLs sont configurées :

- `http://localhost:3000/api/auth/callback/google`
- `https://www.mycryptopilot.app/api/auth/callback/google`

---

## 📁 État Actuel

### Fichiers .env Existants

| Fichier                    | Usage                             | Gitignored | Committé |
| -------------------------- | --------------------------------- | ---------- | -------- |
| `.env`                     | Base (jamais utilisé directement) | ✅         | ❌       |
| `.env.local`               | Dev local override                | ✅         | ❌       |
| `.env.development`         | Dev (NODE_ENV=development)        | ✅         | ❌       |
| `.env.production`          | Prod (NODE_ENV=production)        | ✅         | ❌       |
| `.env.test`                | Tests (NODE_ENV=test)             | ✅         | ❌       |
| `.env.example`             | Template public                   | ❌         | ✅       |
| `.env.production.template` | Template prod                     | ❌         | ✅       |

**Total** : 7 fichiers (trop complexe!)

### Comment Next.js Charge les .env

**Ordre de priorité** (du plus fort au plus faible) :

1. `.env.$(NODE_ENV).local` (ex: `.env.development.local`)
2. `.env.local` (chargé partout SAUF en test)
3. `.env.$(NODE_ENV)` (ex: `.env.development`)
4. `.env` (base)

**Exemple Dev** :

```bash
pnpm dev  # NODE_ENV=development
# Charge dans l'ordre :
# 1. .env.development.local (si existe)
# 2. .env.local (si existe)
# 3. .env.development ✅ (chargé)
# 4. .env (si existe)
```

**Exemple Prod (Vercel)** :

```bash
# NODE_ENV=production
# Charge dans l'ordre :
# 1. .env.production.local (si existe)
# 2. .env.local (ignoré sur Vercel)
# 3. .env.production ✅ (devrait être chargé)
# 4. .env (si existe)
```

### Problème de Confusion

**Scénario actuel** :

- Dev : `.env.development` avec `BETTER_AUTH_URL=http://localhost:3000`
- Prod Vercel : Variables dans Vercel Dashboard OU `.env.production` (selon config)

Si Vercel charge `.env.production` mais que `BETTER_AUTH_URL` est mal configuré → OAuth échoue.

---

## 🔐 Analyse du Flow Better Auth

### Configuration Better Auth

**Fichier** : `src/lib/auth/auth-config-setup.ts`

```typescript
export const authOptions = {
  baseURL: process.env.BETTER_AUTH_URL, // ⚠️ CRITICAL
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },
};
```

### Flow OAuth Discord

1. **User clique "Sign in with Discord"**

   ```typescript
   // Frontend
   <button onClick={() => signIn.social({ provider: "discord" })}>
     Sign in with Discord
   </button>
   ```

2. **Better Auth génère l'URL d'autorisation**

   ```
   https://discord.com/api/oauth2/authorize
     ?client_id=1421427515922317332
     &redirect_uri={BETTER_AUTH_URL}/api/auth/callback/discord
     &response_type=code
     &scope=identify+email
   ```

   - ⚠️ `redirect_uri` doit matcher exactement celui configuré dans l'app Discord

3. **User autorise sur Discord**
   - Discord affiche "Authorize MyCryptoPilot"
   - User clique "Authorize"

4. **Discord redirige avec code**

   ```
   {BETTER_AUTH_URL}/api/auth/callback/discord?code=ABC123
   ```

   - ⚠️ Si `BETTER_AUTH_URL` est mal configuré → redirige vers mauvaise URL

5. **Better Auth échange le code contre un token**

   ```typescript
   POST https://discord.com/api/oauth2/token
   {
     client_id: DISCORD_CLIENT_ID,
     client_secret: DISCORD_CLIENT_SECRET,
     code: "ABC123",
     redirect_uri: "{BETTER_AUTH_URL}/api/auth/callback/discord"
   }
   ```

6. **Better Auth récupère les infos user**

   ```typescript
   GET https://discord.com/api/users/@me
   Authorization: Bearer {access_token}
   ```

7. **Better Auth crée/met à jour le user en DB**

   ```typescript
   await prisma.user.upsert({
     where: { email: discordUser.email },
     create: { ... },
     update: { discordId: discordUser.id }
   });
   ```

8. **Session créée et user connecté**

### Point de Défaillance

**Étape 4** : Si `BETTER_AUTH_URL=http://localhost:3000` en production, Discord redirige vers `http://localhost:3000/api/auth/callback/discord?code=ABC123` au lieu de `https://www.mycryptopilot.app/api/auth/callback/discord?code=ABC123`.

---

## ✅ Solution Recommandée

### Architecture Simplifiée

**2 fichiers .env principaux** :

1. **`.env.local`** (Dev - gitignored)
2. **`.env`** (Prod - JAMAIS committé, variables dans Vercel Dashboard)
3. **`.env.example`** (Template public - committé)
4. **`.env.test`** (Tests CI - committé avec fakes)

### Comparaison Avant/Après

| Avant                      | Après            | Raison                        |
| -------------------------- | ---------------- | ----------------------------- |
| `.env.development`         | `.env.local`     | Next.js standard, plus simple |
| `.env.production`          | Vercel Dashboard | Secrets jamais committés      |
| `.env.production.template` | `.env.example`   | Un seul template suffit       |
| `.env`                     | ❌ Supprimé      | Pas utilisé directement       |

### Nouvelle Structure

```
mycryptopilot/
├── .env.local          # Dev local (gitignored)
├── .env.test           # Tests CI (committé avec fakes)
├── .env.example        # Template public (committé)
└── .gitignore          # Ignore .env* sauf .env.example et .env.test
```

**`.gitignore`** :

```gitignore
# Environment Variables
.env
.env.local
.env*.local

# KEEP these committed
!.env.example
!.env.test
```

---

## 🔧 Plan de Migration

### Étape 1 : Créer App Discord OAuth Production (15 min)

1. **Aller sur** [Discord Developer Portal](https://discord.com/developers/applications)

2. **Créer nouvelle application** :
   - Name : `MyCryptoPilot (Production)`
   - Description : `Crypto trading signals platform - Production`

3. **Configurer OAuth2** :
   - Aller dans "OAuth2" → "General"
   - **Redirects URLs** : Ajouter
     ```
     https://www.mycryptopilot.app/api/auth/callback/discord
     ```
   - **Scopes** : `identify`, `email`

4. **Copier les credentials** :

   ```
   Client ID: [NEW_DISCORD_CLIENT_ID_PROD]
   Client Secret: [NEW_DISCORD_CLIENT_SECRET_PROD]
   ```

5. **Mettre à jour l'app Dev** (optionnel pour clarté) :
   - Renommer app existante `1421427515922317332` → `MyCryptoPilot (Development)`
   - Vérifier redirect URL : `http://localhost:3000/api/auth/callback/discord`

### Étape 2 : Créer `.env.local` (Dev)

1. **Copier `.env.development`** → **`.env.local`** :

   ```bash
   cp .env.development .env.local
   ```

2. **Vérifier le contenu** :

   ```bash
   # .env.local
   BETTER_AUTH_URL=http://localhost:3000
   DISCORD_CLIENT_ID="1421427515922317332"  # Dev app
   DISCORD_CLIENT_SECRET="l3TSO3EdXa0ATKB4yTR1LAOmNgqVk7c-"
   # ... rest
   ```

3. **Tester en local** :
   ```bash
   pnpm dev
   # Ouvrir http://localhost:3000
   # Tester "Sign in with Discord" → Doit fonctionner
   ```

### Étape 3 : Configurer Variables Vercel (Production)

1. **Aller sur** [Vercel Dashboard](https://vercel.com) → Projet MyCryptoPilot → Settings → Environment Variables

2. **Ajouter/Mettre à jour ces variables** (Production uniquement) :

   ```bash
   # 🔐 Authentication
   BETTER_AUTH_URL=https://www.mycryptopilot.app
   BETTER_AUTH_SECRET=OeoX7CKrmcGSW+XJOYcbfJBvKLSFTJb00u+nohBis40=

   # 🎭 OAuth - PRODUCTION CREDENTIALS
   GITHUB_CLIENT_ID=Ov23ctdVYWeKQsWOxzcz
   GITHUB_CLIENT_SECRET=6f33c650d13dce86829bf9d952972dc5b1f1d7f5

   GOOGLE_CLIENT_ID=728181273656-8qmvc2374hpu3r0faf6tq1i4s6ihnm15.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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

   DISCORD_CLIENT_ID=[NEW_DISCORD_CLIENT_ID_PROD]
   DISCORD_CLIENT_SECRET=[NEW_DISCORD_CLIENT_SECRET_PROD]

   # 🗄️ Database
   DATABASE_URL=postgresql://neondb_owner:npg_AYqjQp3nMg7J@ep-proud-term-abutee8y-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_AYqjQp3nMg7J@ep-proud-term-abutee8y.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

   # 📧 Email
   RESEND_API_KEY=re_3Lrrvpgo_K3FBXqYyLkgW3yYAhp3wBx8H
   RESEND_AUDIENCE_ID=66880be7-8a76-4f1b-a2ad-82c2a4cf32fe
   EMAIL_FROM=contact@mycryptopilot.app
   NEXT_PUBLIC_EMAIL_CONTACT=contact@mycryptopilot.app

   # 💳 Crypto Payments (TODO: Add production xpub keys)
   BASE_RPC_URL=https://mainnet.base.org
   TRON_RPC_URL=https://api.trongrid.io
   CRYPTO_XPUB_BASE=[TO_BE_GENERATED]
   CRYPTO_XPUB_TRON=[TO_BE_GENERATED]

   # 🤖 Discord Bot (IMPORTANT: Bot runs on Railway, not Vercel)
   DISCORD_BOT_ENABLED=false
   DISCORD_BOT_TOKEN=  # Leave empty on Vercel
   DISCORD_GUILD_ID=   # Leave empty on Vercel
   ```

3. **Redéployer** :

   ```bash
   git push origin main
   # Vercel auto-deploy avec nouvelles variables
   ```

4. **Tester en production** :
   - Aller sur `https://www.mycryptopilot.app`
   - Cliquer "Sign in with Discord"
   - ✅ Doit rediriger vers Discord
   - ✅ Doit rediriger vers `https://www.mycryptopilot.app/api/auth/callback/discord`
   - ✅ User connecté

### Étape 4 : Nettoyer les Anciens Fichiers

1. **Supprimer les fichiers obsolètes** :

   ```bash
   rm .env.development
   rm .env.production
   rm .env.production.template
   ```

2. **Garder** :

   ```bash
   .env.local          # Dev (gitignored)
   .env.test           # Tests (committé)
   .env.example        # Template (committé)
   ```

3. **Mettre à jour `.env.example`** :

   ```bash
   # Ajouter un commentaire clair
   # ==============================================================================
   # 📝 ENVIRONMENT VARIABLES TEMPLATE
   # ==============================================================================
   # Copy this file to .env.local for local development
   # For production, set these variables in Vercel Dashboard
   # ==============================================================================

   # 🔐 AUTHENTICATION (CRITICAL)
   # BETTER_AUTH_URL must match your domain:
   #   - Development: http://localhost:3000
   #   - Production: https://www.mycryptopilot.app
   # This URL is used for OAuth callbacks - MUST be exact!
   BETTER_AUTH_URL="http://localhost:3000"
   # ...
   ```

4. **Commit les changements** :

   ```bash
   git add .gitignore .env.example .env.test
   git commit -m "refactor: simplify environment variables structure

   - Removed .env.development, .env.production, .env.production.template
   - Use .env.local for development (gitignored)
   - Use Vercel Dashboard for production variables
   - Keep .env.test for CI
   - Update .env.example with clear comments"

   git push origin main
   ```

### Étape 5 : Vérifier Google OAuth (Optionnel)

Si Google OAuth ne fonctionne pas en production :

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. **Ouvrir l'OAuth Client** : `728181273656-8qmvc2374hpu3r0faf6tq1i4s6ihnm15`

3. **Vérifier "Authorized redirect URIs"** contient :

   ```
   http://localhost:3000/api/auth/callback/google
   https://www.mycryptopilot.app/api/auth/callback/google
   ```

4. Si manquant, **ajouter la prod URL** et sauvegarder.

---

## ✅ Checklist de Validation

### Before Migration

- [ ] **Backup** : Copier tous les fichiers `.env*` dans un dossier `backup/`
- [ ] **Discord Dev** : Vérifier que l'app dev `1421427515922317332` fonctionne en local
- [ ] **GitHub** : Tester login GitHub en local (doit fonctionner)
- [ ] **Google** : Tester login Google en local (doit fonctionner)

### After Step 1 (Discord Prod App)

- [ ] App Discord Production créée
- [ ] Redirect URL configuré : `https://www.mycryptopilot.app/api/auth/callback/discord`
- [ ] Client ID et Secret copiés

### After Step 2 (.env.local)

- [ ] `.env.local` créé
- [ ] `BETTER_AUTH_URL=http://localhost:3000` ✅
- [ ] `pnpm dev` démarre sans erreur
- [ ] Discord login fonctionne en local ✅

### After Step 3 (Vercel Variables)

- [ ] Toutes les variables ajoutées dans Vercel Dashboard
- [ ] `BETTER_AUTH_URL=https://www.mycryptopilot.app` ✅
- [ ] `DISCORD_CLIENT_ID=[NEW_PROD_ID]` ✅
- [ ] Redéployé via `git push`
- [ ] **TEST CRITIQUE** : Discord login fonctionne en production ✅
- [ ] GitHub login fonctionne en production ✅
- [ ] Google login fonctionne en production ✅

### After Step 4 (Cleanup)

- [ ] Anciens fichiers supprimés
- [ ] `.env.example` mis à jour avec commentaires clairs
- [ ] `.gitignore` correct (ignore `.env.local`, pas `.env.example` ni `.env.test`)
- [ ] Commit + push
- [ ] README mis à jour (si mention des fichiers .env)

### Final Validation

- [ ] **Local Dev** :
  - [ ] `pnpm dev` démarre
  - [ ] Discord login ✅
  - [ ] GitHub login ✅
  - [ ] Google login ✅

- [ ] **Production** :
  - [ ] `https://www.mycryptopilot.app` accessible
  - [ ] Discord login ✅
  - [ ] GitHub login ✅
  - [ ] Google login ✅

- [ ] **CI Tests** :
  - [ ] Playwright tests passent
  - [ ] Utilise `.env.test` correctement

---

## 🎯 Résultat Final

### Avant

7 fichiers `.env*` :

```
.env
.env.local
.env.development        ← utilisé en dev
.env.production         ← utilisé en prod (mais confus)
.env.production.template
.env.example
.env.test
```

**Problèmes** :

- Credentials OAuth dev/prod identiques → Discord échoue en prod
- Trop de fichiers → confusion
- Pas clair quel fichier utiliser

### Après

3 fichiers `.env*` :

```
.env.local       ← Dev (gitignored)
.env.example     ← Template (committé)
.env.test        ← Tests CI (committé)
```

**Avantages** :

- ✅ Credentials OAuth séparés dev/prod
- ✅ Structure simple et claire
- ✅ Vercel Dashboard pour prod (sécurisé)
- ✅ Plus de confusion

---

## 📚 Références

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Better Auth Configuration](https://www.better-auth.com/docs/configuration)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Document créé le** : 11 octobre 2025
**Auteur** : Claude Code Analysis
**Status** : Ready for implementation
