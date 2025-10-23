# 🎮 Discord Bot - Guide de Configuration Complète

**Dernière mise à jour**: 12 octobre 2025 - Phase 0.3-0.5 (ChatGPT recommendations)

Ce guide détaille la configuration complète du bot Discord MyCryptoPilot, incluant:
- Configuration Developer Portal (permissions)
- Activation des Gateway Intents
- Hiérarchie des rôles serveur
- Structure des channels
- Variables d'environnement

---

## 📋 Table des Matières

1. [Phase 1: Developer Portal - Permissions Bot](#phase-1-developer-portal---permissions-bot)
2. [Phase 2: Developer Portal - Gateway Intents](#phase-2-developer-portal---gateway-intents)
3. [Phase 3: Générer URL d'Invitation](#phase-3-générer-url-dinvitation)
4. [Phase 4: Hiérarchie des Rôles Serveur](#phase-4-hiérarchie-des-rôles-serveur)
5. [Phase 5: Structure des Channels](#phase-5-structure-des-channels)
6. [Phase 6: Obtenir les IDs Discord](#phase-6-obtenir-les-ids-discord)
7. [Phase 7: Variables d'Environnement](#phase-7-variables-denvironnement)
8. [Vérification Finale](#vérification-finale)

---

## Phase 1: Developer Portal - Permissions Bot

### 1.1 - Accéder au Developer Portal

1. Aller sur: https://discord.com/developers/applications
2. Sélectionner votre application **MyCryptoPilot Bot**
3. Aller dans l'onglet **"Bot"**

### 1.2 - Permissions Requises

Le bot a besoin des permissions suivantes pour fonctionner correctement:

#### Permissions Critiques (P0 - Bloquantes)

| Permission | Raison | Requis pour |
|------------|--------|-------------|
| **Manage Roles** | Assigner rôles Free/Pro/Ultra automatiquement | Subscription system |
| **Manage Channels** | Créer channels privés `#trader-{name}` | Phase 2 |
| **Create Instant Invite** | Générer invites Discord automatiques | Phase 3 |
| **Send Messages** | Envoyer signaux dans channels | Webhook signals |

#### Permissions Importantes (P1)

| Permission | Raison |
|------------|--------|
| **Manage Messages** | Épingler/supprimer messages importants |
| **Read Message History** | Lire historique messages |
| **View Channels** | Voir tous les channels |
| **Embed Links** | Envoyer embeds riches (signaux) |
| **Attach Files** | Joindre fichiers (screenshots, etc.) |
| **Use External Emojis** | Utiliser emojis custom |
| **Add Reactions** | Réagir aux messages |

#### Permissions Optionnelles (P2)

| Permission | Raison |
|------------|--------|
| **Moderate Members** | Timeout/kick users si abus |
| **View Audit Log** | Tracking actions pour monitoring |
| **Manage Webhooks** | Créer webhooks pour intégrations |

### 1.3 - Cocher les Permissions

Dans Developer Portal → Bot → Bot Permissions:

```
✅ Manage Roles
✅ Manage Channels
✅ Create Instant Invite
✅ Send Messages
✅ Send Messages in Threads
✅ Manage Messages
✅ Read Message History
✅ View Channels
✅ Embed Links
✅ Attach Files
✅ Use External Emojis
✅ Add Reactions
✅ Moderate Members (optionnel)
✅ View Audit Log (optionnel)
✅ Manage Webhooks (optionnel)
```

---

## Phase 2: Developer Portal - Gateway Intents

### 2.1 - Activer les Privileged Gateway Intents

**CRITIQUE**: Ces intents DOIVENT être activés pour que le bot fonctionne!

1. Aller dans Developer Portal → Bot → **Privileged Gateway Intents**
2. Activer les 3 intents suivants:

```
✅ PRESENCE INTENT (optionnel)
✅ SERVER MEMBERS INTENT (REQUIS)
✅ MESSAGE CONTENT INTENT (REQUIS pour Phase 4 - teasers)
```

**Pourquoi c'est requis?**
- `SERVER MEMBERS INTENT`: Pour récupérer les membres Discord et lier `discordId` (utilisé dans `bot-client.ts`)
- `MESSAGE CONTENT INTENT`: Pour lire le contenu des messages (modération, teasers, Phase 4)

**⚠️ Important**: Après activation, **redémarrer le bot** (Railway/Fly.io) pour prendre effet!

---

## Phase 3: Générer URL d'Invitation

### 3.1 - OAuth2 URL Generator

1. Aller dans Developer Portal → **OAuth2** → **URL Generator**

2. **Sélectionner Scopes**:
```
✅ bot
✅ applications.commands
```

3. **Sélectionner Bot Permissions** (même liste que Phase 1):
```
✅ Manage Roles
✅ Manage Channels
✅ Create Instant Invite
✅ Send Messages
✅ Send Messages in Threads
✅ Manage Messages
✅ Read Message History
✅ View Channels
✅ Embed Links
✅ Attach Files
✅ Use External Emojis
✅ Add Reactions
✅ Moderate Members
✅ View Audit Log
✅ Manage Webhooks
```

4. **Copier l'URL générée** en bas de page

5. **Ouvrir l'URL** dans un navigateur et inviter le bot sur votre serveur Discord

### 3.2 - Réinviter le Bot (si déjà invité)

Si vous avez modifié les permissions après avoir invité le bot:

1. **Option A** (Recommandé): Utiliser l'URL générée ci-dessus (Discord mettra à jour les permissions automatiquement)

2. **Option B**: Kick le bot du serveur, puis réinviter avec la nouvelle URL

**Note**: Pas besoin de redéployer le code si vous changez juste les permissions OAuth2!

---

## Phase 4: Hiérarchie des Rôles Serveur

### 4.1 - Pourquoi la Hiérarchie est Critique?

⚠️ **RÈGLE DISCORD**: Un bot ne peut assigner/gérer que les rôles **EN DESSOUS** de lui dans la hiérarchie!

**Exemple**:
```
✅ Bot peut gérer "Free Member" si Bot est au-dessus
❌ Bot ne peut PAS gérer "Admin" si Admin est au-dessus du Bot
```

### 4.2 - Structure Recommandée

Aller sur Discord Server → Server Settings → Roles, et **ORDONNER AINSI**:

```
1. 🤖 BotMyCryptoPilot        ← RÔLE DU BOT (EN HAUT!)
   ─────────────────────────
2. 👑 Admin
3. 🛡️ Mod
   ─────────────────────────
4. 🚀 Ultra Trader
5. 💎 Pro Trader
6. 🆓 Free Member
   ─────────────────────────
7. @everyone
```

### 4.3 - Configurer les Rôles Plans

Le bot crée automatiquement les rôles Free/Pro/Ultra s'ils n'existent pas (via `ensureRolesExist()`).

**Noms des rôles** (définis dans `config.ts`):
- `Free Member` (Gray - 0x6b7280)
- `Pro Trader` (Amber - 0xf59e0b)
- `Ultra Trader` (Purple - 0x8b5cf6)

**Permissions par défaut**: Les rôles héritent des permissions de `@everyone` + permissions spécifiques définies dans `roles.ts`.

### 4.4 - Vérifier la Hiérarchie

1. Sur Discord, aller dans Server Settings → Roles
2. Vérifier que **BotMyCryptoPilot** est **en première position** (juste après owner)
3. Si ce n'est pas le cas, **drag & drop** le rôle du bot en haut

**Test**: Essayer d'assigner manuellement un rôle "Pro Trader" à un user → Si le bot est mal positionné, Discord bloquera l'action.

---

## Phase 5: Structure des Channels

### 5.1 - Créer les Catégories et Channels

Créer manuellement la structure suivante sur votre serveur Discord:

```
📁 PUBLIC
  ├─ #welcome
  ├─ #signals-free          ← Pour Phase 4 (teasers)
  ├─ #announcements
  └─ #support

📁 SIGNALS PRIVÉS            ← Catégorie VIDE (le bot créera les channels dynamiquement)
  └─ (channels #trader-{name} créés automatiquement par le bot en Phase 2)

📁 STAFF
  ├─ #admin
  ├─ #bot-logs              ← Pour monitoring (logs bot)
  └─ #audit
```

### 5.2 - Permissions Catégorie "SIGNALS PRIVÉS"

**CRITIQUE**: Configurer les permissions de la catégorie pour que seul le bot puisse créer/gérer les channels:

1. Clic-droit sur catégorie **"SIGNALS PRIVÉS"** → Edit Category
2. Onglet **Permissions** → Cliquer sur **"Advanced permissions"**
3. Configurer:

| Rôle/User | Permission | Valeur |
|-----------|----------|--------|
| `@everyone` | View Channels | ❌ **Deny** |
| `BotMyCryptoPilot` | View Channels | ✅ **Allow** |
| `BotMyCryptoPilot` | Manage Channels | ✅ **Allow** |
| `BotMyCryptoPilot` | Send Messages | ✅ **Allow** |
| `Admin` | View Channels | ✅ **Allow** |
| `Admin` | Manage Channels | ✅ **Allow** |

**Résultat**: Seuls le bot et les admins peuvent voir/gérer cette catégorie. Les users ne verront que les channels traders qu'ils follow.

### 5.3 - Permissions Channel #signals-free

Channel public, tous peuvent voir:

| Rôle | Permission | Valeur |
|------|-----------|--------|
| `@everyone` | View Channels | ✅ **Allow** |
| `@everyone` | Send Messages | ❌ **Deny** |
| `BotMyCryptoPilot` | Send Messages | ✅ **Allow** |

---

## Phase 6: Obtenir les IDs Discord

### 6.1 - Activer le Mode Développeur

1. Sur Discord, aller dans User Settings (engrenage en bas à gauche)
2. Onglet **"Advanced"**
3. Activer **"Developer Mode"** ✅

### 6.2 - Obtenir Channel IDs

Une fois le mode développeur activé:

1. **Clic-droit** sur un channel (ex: `#signals-free`)
2. Cliquer sur **"Copy ID"**
3. Coller l'ID dans un fichier texte temporaire

**IDs à récupérer**:
- `#signals-free` → Variable `DISCORD_FREE_SIGNALS_CHANNEL_ID`
- `#bot-logs` → Variable `DISCORD_LOG_CHANNEL_ID`

### 6.3 - Obtenir Role ID

1. Aller dans Server Settings → Roles
2. **Clic-droit** sur le rôle **Admin**
3. Cliquer sur **"Copy ID"**
4. Coller l'ID dans un fichier texte

**ID à récupérer**:
- `Admin` role → Variable `DISCORD_ROLE_ADMIN_ID`

### 6.4 - Obtenir Guild ID

**Déjà configuré** (variable `DISCORD_GUILD_ID` dans `.env`).

Si besoin de le récupérer:
1. **Clic-droit** sur le nom du serveur (en haut à gauche)
2. Cliquer sur **"Copy ID"**

---

## Phase 7: Variables d'Environnement

### 7.1 - Fichier .env (Local Development)

Copier `.env.example` vers `.env.local`:

```bash
cp .env.example .env.local
```

Puis remplir les valeurs:

```env
# Discord Bot (déjà configuré)
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_GUILD_ID="your-guild-id"
DISCORD_BOT_ENABLED="true"

# Discord OAuth (déjà configuré)
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Discord Bot Channels (Phase 0.2 - Nouvelles variables)
DISCORD_FREE_SIGNALS_CHANNEL_ID="123456789012345678"  # ID de #signals-free
DISCORD_LOG_CHANNEL_ID="123456789012345678"           # ID de #bot-logs
DISCORD_ROLE_ADMIN_ID="123456789012345678"            # ID du rôle Admin
```

### 7.2 - Railway (Production Bot)

Le bot Discord tourne sur **Railway** (pas Vercel, car serverless).

Ajouter les 3 nouvelles variables sur Railway:

1. Aller sur Railway Dashboard → Votre projet MyCryptoPilot Bot
2. Onglet **"Variables"**
3. Ajouter:
   - `DISCORD_FREE_SIGNALS_CHANNEL_ID` = `123...` (ID récupéré en Phase 6.2)
   - `DISCORD_LOG_CHANNEL_ID` = `123...`
   - `DISCORD_ROLE_ADMIN_ID` = `123...`
4. **Redeploy** le bot

### 7.3 - Vercel (Production Next.js)

Le site Next.js tourne sur **Vercel**.

Ajouter les variables:

1. Aller sur Vercel Dashboard → Projet MyCryptoPilot
2. Settings → **Environment Variables**
3. Ajouter les mêmes 3 variables
4. **Redeploy** le site

---

## Vérification Finale

### ✅ Checklist Configuration

Avant de passer aux Phases 2-5 (code), vérifier:

**Developer Portal**:
- ✅ Permissions bot (Manage Roles, Manage Channels, Create Instant Invite, etc.)
- ✅ Gateway Intents (SERVER MEMBERS INTENT ✅, MESSAGE CONTENT INTENT ✅)
- ✅ URL invitation générée et bot réinvité

**Serveur Discord**:
- ✅ Hiérarchie rôles (Bot en haut > Admin > Mod > Ultra > Pro > Free)
- ✅ Structure channels créée (PUBLIC, SIGNALS PRIVÉS, STAFF)
- ✅ Permissions catégorie "SIGNALS PRIVÉS" configurées
- ✅ Mode développeur activé

**IDs Récupérés**:
- ✅ `DISCORD_FREE_SIGNALS_CHANNEL_ID` (ID de #signals-free)
- ✅ `DISCORD_LOG_CHANNEL_ID` (ID de #bot-logs)
- ✅ `DISCORD_ROLE_ADMIN_ID` (ID du rôle Admin)

**Variables Env**:
- ✅ `.env.local` rempli (dev)
- ✅ Railway variables ajoutées (bot production)
- ✅ Vercel variables ajoutées (site production)

**Bot Redéployé**:
- ✅ Railway bot redéployé après ajout variables env
- ✅ Logs Railway affichent:
  - `Discord bot logged in as MyCryptoPilot#1234` ✅
  - `🔍 Checking bot permissions...` ✅
  - `✅ All permissions verified successfully!` ✅

### 🧪 Tests Rapides

#### Test 1: Vérifier Permissions Bot

1. Sur Discord, faire `/status`
2. Le bot doit répondre avec votre plan actuel

Si erreur → Vérifier logs Railway pour voir permissions manquantes

#### Test 2: Vérifier Hiérarchie Rôles

1. Créer un user test sur Discord
2. Manuellement, essayer d'assigner le rôle "Pro Trader"
3. Si Discord bloque → Vérifier hiérarchie (Bot doit être au-dessus)

#### Test 3: Vérifier Gateway Intents

1. Sur Railway, voir les logs bot au démarrage
2. Chercher `Discord bot logged in as` → Si absent, intent SERVER MEMBERS pas activé
3. Si le bot ne répond pas aux commandes → Vérifier intent MESSAGE CONTENT

---

## Commandes Bot Disponibles

Le bot Discord MyCryptoPilot supporte **11 commandes slash** (5 utilisateur + 6 admin).

### Commandes Utilisateur

#### `/help`
Affiche la liste des commandes disponibles.

```
📊 /status - Affiche le statut de ton abonnement
⬆️ /upgrade - Obtiens le lien pour upgrader
🔗 /link - Lie ton compte Discord à MyCryptoPilot
📊 /portfolio - Affiche ton portfolio (exchanges connectés)
❓ /help - Affiche cette liste
```

#### `/status`
Affiche le statut d'abonnement de l'utilisateur.

**Exemple de réponse**:
```
📊 Statut de ton abonnement

💎 Plan actuel: PRO (49$/mois)
📅 Expiration: 15 novembre 2025
📊 Signaux restants aujourd'hui: 42/50
👥 Traders suivis: 3/5
⏱️ Délai screener: 60s
```

#### `/upgrade`
Affiche les plans disponibles avec leurs avantages.

**Exemple**:
```
⬆️ Upgrade ton abonnement

💎 Plan PRO - 49$/mois
✅ 50 signaux par jour
✅ Suis jusqu'à 5 traders vérifiés
✅ Screener temps réel (60s)

🚀 Plan ULTRA - 99$/mois
✅ Signaux illimités
✅ Suis tous les traders
✅ Screener ultra-rapide (5s)

👉 https://mycryptopilot.com/pricing
```

#### `/link`
Permet de lier le compte Discord à MyCryptoPilot.

#### `/portfolio`
Affiche le portfolio et les exchanges connectés.

### Commandes Admin (Restricted)

Seuls les utilisateurs avec le rôle **Admin** peuvent utiliser ces commandes.

#### `/deploy-commands`
Force la republication des slash commands sur Discord.

#### `/create-roles`
Crée les 3 rôles Free/Pro/Ultra s'ils n'existent pas.

#### `/sync-roles`
Synchronise tous les rôles Discord avec les plans DB.

#### `/test-signal <traderId>`
Envoie un signal de test dans le channel Discord.

#### `/stats`
Affiche les statistiques du serveur (membres, signaux, etc.).

#### `/purge <count>`
Supprime les N derniers messages du channel (modération).

---

## Permissions Détaillées par Rôle

### 🆓 Free Member (Niveau 0)

**Permissions de base**:
- ✅ Voir les channels publics
- ✅ Envoyer des messages
- ✅ Lire l'historique
- ✅ Utiliser les commandes bot

**Limitations**:
- ❌ 5 signaux/jour max
- ❌ Suivre 1 seul trader
- ❌ Pas d'accès channels premium
- ❌ Pas de notifications DM

---

### 💎 Pro Trader (Niveau 1)

**Hérite de Free Member +**:
- ✅ Emojis externes
- ✅ Attacher fichiers
- ✅ Intégrer liens (preview)
- ✅ Ajouter réactions
- ✅ Accès channel `#pro-signals`
- ✅ **50 signaux/jour**
- ✅ Suivre **jusqu'à 5 traders**
- ✅ **Notifications DM** pour signaux

---

### 🚀 Ultra Trader (Niveau 2)

**Hérite de Pro + Free +**:
- ✅ Créer threads privés
- ✅ Accès channels `#ultra-lounge` et `#strategy-talks`
- ✅ **Signaux illimités**
- ✅ Suivre **tous les traders**
- ✅ **Notifications DM prioritaires**
- ✅ Badge "Ultra" sur profil
- ✅ Accès anticipé nouvelles features

**Principe d'héritage**: Chaque rôle supérieur hérite automatiquement des permissions du rôle inférieur.

---

### Channels Structure

**Channels Publics** (tous les rôles):
- `#general` - Discussion générale
- `#announcements` - Annonces officielles
- `#signals` - Signaux publics (lecture seule pour Free)

**Channels Pro** (`@Pro Trader` requis):
- `#pro-signals` - Signaux détaillés pour Pro
- `#support-pro` - Support dédié Pro

**Channels Ultra** (`@Ultra Trader` requis):
- `#ultra-lounge` - Salon privé Ultra
- `#strategy-talks` - Discussions stratégies avancées
- `#alpha-features` - Preview nouvelles features

---

### Assignation Automatique des Rôles

Les rôles sont assignés automatiquement dans 3 cas:

1. **Connexion Discord OAuth**: Le `discordId` est lié et le rôle assigné immédiatement
2. **Mise à jour du plan**: Achat Pro/Ultra → nouveau rôle assigné + notification DM
3. **Expiration du plan**: Cron job rétrograde automatiquement le rôle à Free

---

## 🚨 Troubleshooting

### Problème: Bot ne peut pas assigner de rôles

**Cause**: Hiérarchie des rôles incorrecte.

**Solution**:
1. Aller dans Server Settings → Roles
2. Drag & drop le rôle `BotMyCryptoPilot` **en première position** (juste après owner)
3. Retester

### Problème: Bot ne démarre pas (Railway)

**Cause**: Variables env manquantes ou Gateway Intents pas activés.

**Solution**:
1. Vérifier logs Railway: `railway logs --tail`
2. Si `Missing DISCORD_BOT_TOKEN` → Ajouter variable sur Railway
3. Si `PrivilegedIntentsRequired` → Activer intents dans Developer Portal, puis redéployer

### Problème: Commandes slash n'apparaissent pas

**Cause**: Bot pas ré-invité avec scope `applications.commands`.

**Solution**:
1. Générer nouvelle URL invitation (Phase 3)
2. S'assurer que scope `applications.commands` est coché
3. Ouvrir URL et "Réautoriser" le bot
4. Faire `/deploy-commands` (commande admin) pour forcer republication

### Problème: 500 MIDDLEWARE_INVOCATION_FAILED (production site)

**Cause**: Cookie session corrompu ou organisation inexistante.

**Solution**: ✅ **DÉJÀ FIXÉ** (commit précédent) - Try-catch défensifs ajoutés dans `middleware-utils.ts`.

---

## 📚 Liens Utiles

- **Discord Developer Portal**: https://discord.com/developers/applications
- **Documentation Discord.js**: https://discord.js.org/docs/packages/discord.js/main
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**🎉 Configuration terminée !** Vous pouvez maintenant passer aux Phases 2-5 (code) pour implémenter les features Discord.
