# 🤖 Discord Bot - MyCryptoPilot

Ce guide explique comment configurer et utiliser le bot Discord MyCryptoPilot.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Variables d'environnement](#variables-denvironnement)
4. [Commandes disponibles](#commandes-disponibles)
5. [Démarrage du bot](#démarrage-du-bot)
6. [Architecture](#architecture)
7. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Le bot Discord MyCryptoPilot permet aux utilisateurs de :

- **Vérifier leur statut d'abonnement** : Plan actuel, signaux restants, date d'expiration
- **Obtenir des informations d'upgrade** : Plans Pro et Ultra avec leurs avantages
- **Lier leur compte Discord** : Connexion entre compte Discord et compte MyCryptoPilot

### Features

- ✅ **Slash Commands** : `/help`, `/status`, `/upgrade`
- ✅ **Gestion des rôles** : Assignation automatique selon le plan (Free/Pro/Ultra)
- ✅ **Logging structuré** : Suivi des événements et erreurs
- ✅ **Reconnexion automatique** : Gestion des déconnexions

---

## Configuration initiale

### 1. Créer une application Discord

1. Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquer sur **"New Application"**
3. Nommer l'application : `MyCryptoPilot Bot`
4. Aller dans l'onglet **"Bot"**
5. Cliquer sur **"Add Bot"** puis **"Yes, do it!"**
6. Copier le **Bot Token** (tu en auras besoin plus tard)

### 2. Configurer les permissions du bot

Dans l'onglet **"Bot"**, activer les **Privileged Gateway Intents** :

- ✅ **Server Members Intent** (pour gérer les rôles)
- ✅ **Message Content Intent** (optionnel, pour les messages)

### 3. Récupérer le Guild ID (Server ID)

1. Ouvrir Discord (application desktop ou web)
2. Aller dans **User Settings** > **Advanced**
3. Activer le **Developer Mode**
4. Faire clic droit sur ton serveur Discord
5. Cliquer sur **"Copy Server ID"**

### 4. Inviter le bot sur ton serveur

1. Dans le **Developer Portal**, aller dans l'onglet **"OAuth2"** > **"URL Generator"**
2. Cocher les scopes suivants :
   - ✅ `bot`
   - ✅ `applications.commands`
3. Cocher les permissions suivantes :
   - ✅ `Manage Roles`
   - ✅ `Send Messages`
   - ✅ `Use Slash Commands`
4. Copier l'URL générée et l'ouvrir dans un navigateur
5. Sélectionner ton serveur et cliquer sur **"Authorize"**

---

## Variables d'environnement

Ajoute ces variables dans ton fichier `.env.local` :

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN="ton_bot_token_ici"
DISCORD_GUILD_ID="ton_server_id_ici"
DISCORD_BOT_ENABLED="true"
```

**⚠️ IMPORTANT** : Ne commit JAMAIS le bot token dans Git !

---

## Commandes disponibles

Le bot supporte les commandes slash suivantes :

### `/help`

Affiche la liste des commandes disponibles avec leurs descriptions.

**Exemple de réponse** :
```
📊 /status
Affiche le statut de ton abonnement (plan actuel, date d'expiration, signaux restants)

⬆️ /upgrade
Obtiens le lien pour upgrader ton abonnement (Pro ou Ultra) et débloquer plus de signaux

❓ /help
Affiche cette liste de commandes
```

---

### `/status`

Affiche le statut de l'abonnement de l'utilisateur.

**Pré-requis** : L'utilisateur doit avoir lié son compte Discord à MyCryptoPilot (via le champ `discordId` dans la DB).

**Exemple de réponse** :
```
📊 Statut de ton abonnement

💎 Plan actuel: PRO (49$/mois)
📅 Expiration: 15 novembre 2025
📊 Signaux restants aujourd'hui: 42/50
👥 Traders suivis: 3/5
⏱️ Délai screener: 60s

⬆️ Envie de plus ?
Utilise `/upgrade` pour passer Pro ou Ultra et débloquer plus de signaux !
```

---

### `/upgrade`

Affiche les plans d'abonnement disponibles avec leurs avantages.

**Exemple de réponse** :
```
⬆️ Upgrade ton abonnement

💎 Plan PRO - 49$/mois
✅ 50 signaux par jour
✅ Suis jusqu'à 5 traders vérifiés
✅ Screener temps réel (60s)
✅ Console de risque
✅ Journal de trading

🚀 Plan ULTRA - 99$/mois
✅ Signaux illimités
✅ Suis tous les traders vérifiés
✅ Screener ultra-rapide (5s)
✅ Alertes personnalisées
✅ Filtres avancés
✅ Accès prioritaire au support

💳 Comment upgrader ?
🔗 Visite la page pricing:
https://mycryptopilot.com/pricing

Paiements acceptés: USDC (Base) et USDT (Tron)
```

---

## Démarrage du bot

### En développement (local)

Démarrer le bot dans un terminal séparé :

```bash
pnpm discord-bot
```

Le bot devrait afficher :

```
🚀 Starting MyCryptoPilot Discord Bot...
✅ Discord bot started successfully as MyCryptoPilot Bot#1234
🎮 Bot is ready to receive commands!
```

### Arrêter le bot

Utilise `Ctrl+C` pour arrêter le bot gracieusement.

---

## Architecture

### Structure des fichiers

```
src/lib/discord/
├── bot-client.ts              # Client Discord singleton
├── config.ts                  # Configuration (rôles, couleurs)
└── commands/
    ├── handler.ts             # Gestionnaire principal des commandes
    ├── register-commands.ts   # Définition des commandes slash
    ├── help.ts                # Commande /help
    ├── status.ts              # Commande /status
    └── upgrade.ts             # Commande /upgrade

scripts/
└── start-discord-bot.ts       # Script standalone pour démarrer le bot

app/api/discord/
└── init/route.ts              # API route pour initialiser le bot
```

### Fonctionnement

1. **Initialisation** : Le bot se connecte à Discord avec le token fourni
2. **Enregistrement des commandes** : Les commandes slash sont enregistrées sur le serveur
3. **Écoute des interactions** : Le bot écoute les événements `interactionCreate`
4. **Traitement des commandes** : Chaque commande est routée vers son handler spécifique
5. **Réponse** : Le bot répond avec un embed formaté (éphémère = visible uniquement par l'utilisateur)

### Rôles Discord

Le bot peut assigner automatiquement des rôles selon le plan de l'utilisateur :

| Plan  | Rôle Discord     | Couleur |
|-------|------------------|---------|
| FREE  | Free Member      | Gris    |
| PRO   | Pro Trader       | Amber   |
| ULTRA | Ultra Trader     | Violet  |

*(Feature à implémenter : assignation automatique après paiement)*

---

## Troubleshooting

### Le bot ne démarre pas

**Erreur** : `Discord bot is disabled`

**Solution** : Vérifier que `DISCORD_BOT_ENABLED=true` dans `.env.local`

---

**Erreur** : `Invalid token`

**Solution** : Vérifier que `DISCORD_BOT_TOKEN` est correct dans `.env.local`

---

### Les commandes slash n'apparaissent pas

**Cause** : Les commandes ne sont pas enregistrées sur le serveur Discord.

**Solutions** :

1. Redémarrer le bot (les commandes sont enregistrées au démarrage)
2. Attendre quelques minutes (la propagation peut prendre jusqu'à 1h pour les commandes globales)
3. Vérifier les logs pour les erreurs d'enregistrement

---

### `/status` retourne "Compte non trouvé"

**Cause** : L'utilisateur n'a pas lié son compte Discord à MyCryptoPilot.

**Solution** :

1. L'utilisateur doit se connecter au site MyCryptoPilot avec Discord OAuth
2. Le champ `discordId` doit être rempli dans la table `user` de la DB
3. Relancer la commande `/status`

**Workaround temporaire (dev)** :

```sql
-- Lier manuellement un Discord ID à un utilisateur
UPDATE "user"
SET "discordId" = 'DISCORD_USER_ID_HERE'
WHERE email = 'user@example.com';
```

---

### Le bot se déconnecte fréquemment

**Cause** : Problème de réseau ou Intents manquants.

**Solutions** :

1. Vérifier que les **Gateway Intents** sont activés dans le Developer Portal
2. Vérifier la connexion internet
3. Consulter les logs pour plus de détails

---

## Prochaines étapes

- [ ] Implémenter l'assignation automatique des rôles Discord après paiement
- [ ] Ajouter la commande `/signals` pour afficher les signaux récents
- [ ] Créer un webhook pour notifier les nouveaux signaux dans un channel Discord
- [ ] Implémenter l'authentification Discord OAuth sur le site

---

## Support

Pour toute question ou problème, ouvre une issue sur GitHub ou contacte l'équipe MyCryptoPilot.

**Liens utiles** :

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Better Auth Discord Provider](https://www.better-auth.com/docs/authentication/social)
