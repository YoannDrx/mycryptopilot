# 🚂 Guide de Déploiement Railway - Discord Bot

Ce guide explique comment déployer le bot Discord MyCryptoPilot sur Railway en production.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Vue d'ensemble](#vue-densemble)
3. [Méthode 1 : Déploiement Automatisé (Recommandé)](#méthode-1--déploiement-automatisé-recommandé)
4. [Méthode 2 : Déploiement Manuel](#méthode-2--déploiement-manuel)
5. [Configuration des Variables](#configuration-des-variables)
6. [Vérification du Déploiement](#vérification-du-déploiement)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)

---

## Prérequis

Avant de commencer, assure-toi d'avoir :

- ✅ Un compte Railway ([créer gratuitement](https://railway.app/))
- ✅ Le bot Discord configuré (voir [DISCORD_BOT.md](./DISCORD_BOT.md))
- ✅ Les variables d'environnement production (depuis Vercel Dashboard)
- ✅ Node.js 22+ installé (pour le déploiement automatisé)
- ✅ Git installé et projet versionné

---

## Vue d'ensemble

### Architecture de Production

```
┌─────────────────────────────────────────┐
│  VERCEL (Next.js App)                   │
│  - Interface web                        │
│  - API routes                           │
│  - Authentification                     │
│  URL: https://mycryptopilot.com         │
└─────────────────────────────────────────┘
              ↕ (Partage DB Neon)
┌─────────────────────────────────────────┐
│  RAILWAY (Discord Bot)                  │
│  - Bot Discord 24/7                     │
│  - Commandes slash                      │
│  - Accès même DB que Vercel             │
└─────────────────────────────────────────┘
```

### Fichiers de Configuration

Le projet contient déjà tous les fichiers nécessaires :

```
mycryptopilot/
├── nixpacks.toml              # Configuration Railway build
├── railway.json               # Configuration service Railway
├── .railwayignore            # Fichiers à ignorer lors du deploy
└── scripts/
    └── deploy-railway.sh     # Script de déploiement automatisé
```

---

## Méthode 1 : Déploiement Automatisé (Recommandé)

### Étape 1 : Exécuter le Script

```bash
# Rendre le script exécutable (déjà fait)
chmod +x scripts/deploy-railway.sh

# Lancer le déploiement
./scripts/deploy-railway.sh
```

Le script va automatiquement :
1. ✅ Installer Railway CLI si nécessaire
2. ✅ Te connecter à Railway
3. ✅ Créer un nouveau projet (si besoin)
4. ✅ Te demander de configurer les variables d'environnement
5. ✅ Déployer le bot
6. ✅ Afficher les logs

### Étape 2 : Configurer les Variables

Lorsque le script te le demande, configure ces variables dans Railway Dashboard :

**Option A : Via Dashboard** (Recommandé)

1. Va sur [Railway Dashboard](https://railway.app/dashboard)
2. Sélectionne ton projet
3. Clique sur l'onglet **"Variables"**
4. Ajoute chaque variable :

| Variable | Où la trouver | Exemple |
|----------|---------------|---------|
| `DISCORD_BOT_TOKEN` | Discord Developer Portal | `MTIzNDU2Nzg5...` |
| `DISCORD_GUILD_ID` | Discord (clic droit serveur) | `1426106950374002811` |
| `DISCORD_BOT_ENABLED` | - | `true` |
| `DATABASE_URL` | **Vercel Dashboard** → Variables | `postgresql://neondb_owner:***@ep-proud-term-abutee8y-pooler...` |
| `BETTER_AUTH_SECRET` | **Vercel Dashboard** → Variables | `your-production-secret-32-chars` |
| `NODE_ENV` | - | `production` |

**⚠️ CRITIQUE** : `DATABASE_URL` et `BETTER_AUTH_SECRET` doivent être **exactement les mêmes** que sur Vercel !

**Option B : Via CLI**

```bash
# Configurer les variables via Railway CLI
railway variables set DISCORD_BOT_TOKEN="ton_token_ici"
railway variables set DISCORD_GUILD_ID="ton_guild_id_ici"
railway variables set DISCORD_BOT_ENABLED="true"
railway variables set DATABASE_URL="ton_url_neon_production"
railway variables set BETTER_AUTH_SECRET="ton_secret_production"
railway variables set NODE_ENV="production"
```

### Étape 3 : Confirmer et Déployer

Une fois les variables configurées, le script déploiera automatiquement le bot.

---

## Méthode 2 : Déploiement Manuel

### Étape 1 : Installer Railway CLI

```bash
npm install -g @railway/cli
```

### Étape 2 : Se Connecter à Railway

```bash
railway login
```

Cela ouvrira un navigateur pour l'authentification.

### Étape 3 : Initialiser le Projet

```bash
# Depuis la racine du projet
railway init
```

Railway détectera automatiquement :
- ✅ `nixpacks.toml` (configuration build)
- ✅ `railway.json` (configuration service)
- ✅ `.railwayignore` (fichiers à ignorer)

### Étape 4 : Configurer les Variables

#### Option A : Via Dashboard

1. Va sur https://railway.app/dashboard
2. Sélectionne le projet
3. Variables → **New Variable**
4. Ajoute toutes les variables (voir tableau ci-dessus)

#### Option B : Via CLI

```bash
railway variables set DISCORD_BOT_TOKEN="ton_token"
railway variables set DISCORD_GUILD_ID="ton_guild_id"
railway variables set DISCORD_BOT_ENABLED="true"
railway variables set DATABASE_URL="ton_url_neon"
railway variables set BETTER_AUTH_SECRET="ton_secret"
railway variables set NODE_ENV="production"
```

### Étape 5 : Déployer

```bash
railway up
```

---

## Configuration des Variables

### Récupérer DATABASE_URL depuis Vercel

1. Va sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionne le projet **mycryptopilot**
3. **Settings** → **Environment Variables**
4. Cherche `DATABASE_URL` (scope: Production)
5. Copie la valeur **exacte**
6. Colle-la dans Railway

### Récupérer BETTER_AUTH_SECRET depuis Vercel

Même processus :
1. Vercel Dashboard → Settings → Environment Variables
2. Cherche `BETTER_AUTH_SECRET` (scope: Production)
3. Copie la valeur exacte
4. Colle-la dans Railway

### Variables Discord

Ces variables sont déjà dans `.env.development`, tu peux les copier :

```bash
# Voir les valeurs actuelles
cat .env.development | grep DISCORD
```

---

## Vérification du Déploiement

### 1. Vérifier le Build

```bash
# Afficher le statut du déploiement
railway status
```

Output attendu :
```
Project: mycryptopilot-discord-bot
Status: Deploying...
```

### 2. Suivre les Logs

```bash
# Afficher les logs en temps réel
railway logs
```

Tu devrais voir :
```
[dotenv] injecting env (6) from .env.production
🚀 Starting MyCryptoPilot Discord Bot...
Registering 5 slash commands...
Discord bot logged in as MyCryptoPilot Bot#2650
✅ Discord bot started successfully as MyCryptoPilot Bot#2650
🎮 Bot is ready to receive commands!
```

### 3. Tester les Commandes Discord

1. Va sur ton serveur Discord
2. Tape `/help` pour voir les commandes
3. Teste `/status` pour vérifier la connexion à la DB

---

## Monitoring & Logs

### Voir les Logs en Temps Réel

```bash
railway logs --follow
```

### Redémarrer le Bot

```bash
railway restart
```

### Vérifier le Statut

```bash
railway status
```

### Accéder au Dashboard

```bash
railway open
```

Cela ouvrira le Railway Dashboard dans le navigateur.

---

## Troubleshooting

### ❌ Erreur : "Invalid token"

**Cause** : `DISCORD_BOT_TOKEN` incorrect ou manquant.

**Solution** :
```bash
# Vérifier la variable
railway variables

# Corriger
railway variables set DISCORD_BOT_TOKEN="ton_vrai_token"
```

---

### ❌ Erreur : "Prisma connection error"

**Cause** : `DATABASE_URL` incorrect ou différent de Vercel.

**Solution** :
1. Vérifie que tu utilises **exactement** la même URL que Vercel
2. L'URL doit pointer vers Neon **production** (pas dev)
3. Doit contenir `-pooler` pour les connexions concurrentes

```bash
# Vérifier l'URL actuelle
railway variables | grep DATABASE_URL

# Comparer avec Vercel
# Vercel Dashboard → Settings → Environment Variables → DATABASE_URL
```

---

### ❌ Build échoue : "pnpm: command not found"

**Cause** : Railway n'utilise pas `nixpacks.toml`.

**Solution** :
1. Vérifie que `nixpacks.toml` est à la racine
2. Vérifie que `railway.json` pointe vers `nixpacks.toml`
3. Redéploie :
   ```bash
   railway up --force
   ```

---

### ❌ Bot se déconnecte après quelques minutes

**Cause** : Service Railway s'endort (uniquement free tier avec inactivité).

**Solution** :
- Upgrade vers Railway **Starter Plan** ($5/mois)
- Ou configure un **cron job** pour garder le bot actif :
  ```yaml
  # railway.json
  {
    "deploy": {
      "healthcheckPath": "/health",
      "healthcheckTimeout": 100
    }
  }
  ```

---

### ❌ Les commandes slash n'apparaissent pas

**Cause** : Commandes non enregistrées sur Discord.

**Solution** :
1. Vérifie les logs Railway :
   ```bash
   railway logs | grep "Registering"
   ```
2. Tu devrais voir : `Registering 5 slash commands...`
3. Si absent, redémarre :
   ```bash
   railway restart
   ```

---

## Commandes Utiles

### CLI Railway

```bash
# Voir toutes les commandes
railway --help

# Logs en temps réel
railway logs --follow

# Redémarrer
railway restart

# Ouvrir Dashboard
railway open

# Lister les variables
railway variables

# Supprimer une variable
railway variables delete VARIABLE_NAME

# Status
railway status

# Se déconnecter
railway logout
```

---

## Coûts Estimés

| Plan | Prix | Limitations |
|------|------|-------------|
| **Free Trial** | $5 crédit gratuit | 500h/mois d'exécution |
| **Hobby** | Usage-based (~$5/mois) | Bot 24/7 sans limitations |
| **Pro** | $20/mois | Support prioritaire, plus de ressources |

**Estimation pour le bot Discord** : ~$5-7/mois (usage normal)

---

## Prochaines Étapes

Après le déploiement :

- [ ] Tester toutes les commandes Discord en production
- [ ] Configurer des alertes Railway (Dashboard → Settings → Notifications)
- [ ] Surveiller les logs pendant 24h pour détecter les erreurs
- [ ] Documenter l'URL du Dashboard Railway dans le README
- [ ] Configurer un backup régulier des logs (optionnel)

---

## Support

- **Railway Docs** : https://docs.railway.app/
- **Railway Discord** : https://discord.gg/railway
- **Railway Status** : https://status.railway.app/

---

## Checklist de Déploiement

Avant de déployer :

- [ ] Railway CLI installé et connecté
- [ ] Variables d'environnement récupérées depuis Vercel
- [ ] `DATABASE_URL` et `BETTER_AUTH_SECRET` **identiques** à Vercel
- [ ] Bot Discord configuré (token, guild ID)
- [ ] Fichiers de config présents (`nixpacks.toml`, `railway.json`)

Pendant le déploiement :

- [ ] Build réussit sans erreurs
- [ ] Bot se connecte à Discord
- [ ] Commandes slash enregistrées (5 commandes)
- [ ] Connexion DB fonctionne

Après le déploiement :

- [ ] Tester `/help` dans Discord
- [ ] Tester `/status` pour vérifier la DB
- [ ] Surveiller les logs pendant 1h
- [ ] Configurer les alertes Railway
