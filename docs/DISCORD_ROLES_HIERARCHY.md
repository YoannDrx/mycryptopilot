# 🎭 Discord Roles Hierarchy - MyCryptoPilot

Ce document explique la hiérarchie des rôles Discord et leurs permissions.

---

## 📊 Hiérarchie des Rôles

```
🚀 Ultra Trader (Niveau 2)
   ↓ hérite de
💎 Pro Trader (Niveau 1)
   ↓ hérite de
🆓 Free Member (Niveau 0)
```

### Principe

Chaque rôle supérieur **hérite automatiquement** des permissions du rôle inférieur, plus des permissions additionnelles.

---

## 🔒 Permissions par Rôle

### 🆓 Free Member (Niveau 0)

**Permissions de base** :

- ✅ Voir les channels publics
- ✅ Envoyer des messages
- ✅ Lire l'historique des messages
- ✅ Utiliser les commandes bot (`/help`, `/status`, `/upgrade`)

**Limitations** :

- ❌ Accès limité à 5 signaux/jour
- ❌ Peut suivre 1 seul trader
- ❌ Pas d'accès aux channels premium
- ❌ Pas de notifications DM

---

### 💎 Pro Trader (Niveau 1)

**Hérite de Free Member +** :

- ✅ Utiliser des emojis externes
- ✅ Attacher des fichiers
- ✅ Intégrer des liens (preview)
- ✅ Ajouter des réactions
- ✅ Accès au channel `#pro-signals`
- ✅ **50 signaux/jour**
- ✅ Peut suivre **jusqu'à 5 traders**
- ✅ **Notifications DM** pour les nouveaux signaux
- ✅ Utiliser `/follow @trader`

---

### 🚀 Ultra Trader (Niveau 2)

**Hérite de Pro Trader + Free Member +** :

- ✅ Créer des threads privés
- ✅ Accès aux channels `#ultra-lounge` et `#strategy-talks`
- ✅ **Signaux illimités**
- ✅ Peut suivre **tous les traders**
- ✅ **Notifications DM prioritaires**
- ✅ Badge "Ultra" sur le profil
- ✅ Accès anticipé aux nouvelles features

**Permissions désactivées par défaut** (pour éviter abus) :

- ❌ Mentionner @everyone (spam)
- ❌ Gérer les messages des autres

---

## 🎨 Couleurs des Rôles

| Rôle         | Couleur | Code Hex  |
| ------------ | ------- | --------- |
| Free Member  | Gris    | `#6B7280` |
| Pro Trader   | Amber   | `#F59E0B` |
| Ultra Trader | Violet  | `#8B5CF6` |

---

## 🔄 Assignation Automatique

Les rôles sont assignés automatiquement dans les cas suivants :

### 1. Connexion via Discord OAuth

Lorsqu'un utilisateur se connecte sur le site avec Discord :

1. Son `discordId` est automatiquement lié à son compte
2. Le rôle correspondant à son plan est assigné immédiatement
3. Les anciens rôles MyCryptoPilot sont retirés

### 2. Mise à jour du plan

Lorsqu'un utilisateur achète un plan (Pro ou Ultra) :

1. Son plan est mis à jour dans la DB
2. Une action serveur appelle `updateDiscordRoleAction`
3. Le nouveau rôle est assigné sur Discord
4. L'utilisateur reçoit une notification DM

### 3. Expiration du plan

Lorsqu'un plan expire :

1. Un cron job vérifie les plans expirés
2. Le plan est réinitialisé à "free"
3. Le rôle Discord est rétrogradé automatiquement
4. L'utilisateur reçoit une notification

---

## 🏗️ Structure des Channels

### Channels Publics (tous les rôles)

- `#general` - Discussion générale
- `#announcements` - Annonces officielles
- `#signals` - Signaux publics (accès en lecture seule pour Free)

### Channels Pro (`@Pro Trader` requis)

- `#pro-signals` - Signaux détaillés pour Pro
- `#support-pro` - Support dédié Pro

### Channels Ultra (`@Ultra Trader` requis)

- `#ultra-lounge` - Salon privé Ultra
- `#strategy-talks` - Discussions stratégies avancées
- `#alpha-features` - Preview des nouvelles features

---

## 🛠️ Gestion Manuelle des Rôles

### Assigner un rôle manuellement

```typescript
import { assignRoleToUser } from "@/lib/discord/roles";

await assignRoleToUser("discordUserId", "pro");
```

### Retirer tous les rôles

```typescript
import { removeAllRolesFromUser } from "@/lib/discord/roles";

await removeAllRolesFromUser("discordUserId");
```

---

## 🧪 Tests

Pour tester la hiérarchie des rôles :

1. **Créer 3 comptes test** (Free, Pro, Ultra)
2. **Vérifier les permissions** :
   - Free : Peut seulement voir #signals (lecture)
   - Pro : Peut écrire dans #pro-signals
   - Ultra : Peut créer des threads dans #ultra-lounge
3. **Vérifier l'héritage** :
   - Pro doit pouvoir faire tout ce que Free fait
   - Ultra doit pouvoir faire tout ce que Pro + Free font

---

## 📝 Notes Techniques

### Position des Rôles

Les rôles sont positionnés dans cet ordre (du plus haut au plus bas) :

1. **Ultra Trader** (position 3)
2. **Pro Trader** (position 2)
3. **Free Member** (position 1)
4. **@everyone** (position 0)

Discord utilise la position pour déterminer la hiérarchie : **plus la position est élevée, plus le rôle a de pouvoir**.

### Hoist

Le paramètre `hoist: true` affiche les membres avec le rôle séparément dans la sidebar Discord, ce qui permet de voir rapidement qui est Pro/Ultra.

### Mentionable

Les rôles ne sont **pas mentionnables** par défaut (`mentionable: false`) pour éviter le spam de `@Pro Trader` ou `@Ultra Trader`.

---

## 🚀 Prochaines Améliorations

- [ ] Rôle temporaire "Trial" (7 jours Pro gratuit)
- [ ] Badges personnalisés pour traders vérifiés
- [ ] Rôle "VIP" pour les gros contributeurs
- [ ] Permissions granulaires par channel
- [ ] Auto-role basé sur l'activité (messages, reactions)

---

## 📚 Références

- [Discord.js Roles Guide](https://discordjs.guide/popular-topics/permissions.html)
- [Discord Permissions Calculator](https://discordapi.com/permissions.html)
- [Better Auth Discord Provider](https://www.better-auth.com/docs/authentication/social)
