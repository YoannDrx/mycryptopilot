# User Lifecycle Management - Ultrathink

**Date**: 13 octobre 2025
**Status**: 🚧 Planning - Ready to implement

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Analyse du Flow Actuel](#analyse-du-flow-actuel)
3. [Problèmes Identifiés](#problèmes-identifiés)
4. [Solution Proposée](#solution-proposée)
5. [Plan d'Implémentation](#plan-dimplémentation)

---

## Vue d'ensemble

Ce document analyse deux aspects critiques du lifecycle utilisateur :

1. **Suppression de compte complète** avec gestion Discord
2. **Email de bienvenue** envoyé uniquement à la première connexion

### Objectifs

- ✅ Déconnexion automatique à la suppression
- ✅ Email de confirmation après suppression réussie
- ✅ Retrait des rôles Discord et accès aux channels privés
- ✅ Email de bienvenue Discord envoyé UNE SEULE FOIS (première connexion)
- ✅ Feature flag `isFirstConnection` pour tracking

---

## Analyse du Flow Actuel

### 1. Suppression de Compte (`/account/danger`)

**Flow actuel** (`src/lib/auth.ts:235-254`) :

```
User clique "Delete Account"
  ↓
authClient.deleteUser() appelé
  ↓
Better Auth envoie email de confirmation
  ↓
User clique sur lien dans email
  ↓
Compte supprimé en base (cascade Prisma)
  ↓
Redirect vers /auth/goodbye
```

**Problèmes** :
- ❌ Pas de déconnexion automatique
- ❌ Pas d'email de confirmation finale
- ❌ Discord ID reste en base (`discordId` field)
- ❌ User reste dans le serveur Discord avec ses rôles
- ❌ Accès aux channels privés non révoqués

### 2. Email de Bienvenue Discord

**Flow actuel** (`src/lib/auth.ts:85-96`) :

```
User signup
  ↓
Hook user.afterCreate
  ↓
sendDiscordInviteEmail() appelé SYSTÉMATIQUEMENT
  ↓
Email envoyé
```

**Problème** :
- ❌ Email envoyé à CHAQUE signup
- ❌ Pas de distinction "première connexion"
- ❌ Si user se reconnecte avec OAuth, pas d'email

---

## Problèmes Identifiés

### 🔴 Critique (Impact UX majeur)

1. **Discord Ghost Users**
   - Users supprimés gardent accès au serveur Discord
   - Rôles premium non révoqués (accès channels payants)
   - Discord ID orphelin en base

2. **Session Zombie**
   - User supprime son compte mais reste connecté
   - Peut encore accéder à l'app
   - Session invalidée seulement à l'expiration

3. **Email Spam**
   - Email Discord envoyé à chaque signup (même si test)
   - Pas de gestion première connexion

### 🟡 Important (Impact fonctionnel)

4. **Pas de Feedback Final**
   - User ne reçoit pas de confirmation de suppression
   - Incertitude : "Mon compte est-il vraiment supprimé ?"

5. **Données Discord Orphelines**
   - `discordId` reste en base après suppression
   - Possible conflit si même Discord ID réutilisé

---

## Solution Proposée

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LIFECYCLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SIGNUP/FIRST LOGIN                                      │
│     ├─ Create user with isFirstConnection=true             │
│     ├─ Send Discord invite email (only if first)           │
│     └─ Set isFirstConnection=false after email             │
│                                                              │
│  2. ACCOUNT DELETION                                        │
│     ├─ User clicks "Delete Account"                         │
│     ├─ Send email confirmation                              │
│     ├─ User confirms via email link                         │
│     ├─ Execute deletion flow:                               │
│     │   ├─ Revoke Discord roles & access                   │
│     │   ├─ Invalidate all sessions (logout)                │
│     │   ├─ Delete user data (cascade)                      │
│     │   ├─ Send goodbye email                              │
│     │   └─ Redirect to /auth/goodbye                       │
│     └─ Complete                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Feature 1: Email Bienvenue (Première Connexion)

#### Migration Prisma

```prisma
model User {
  // ... existing fields
  isFirstConnection Boolean @default(true)
  // ...
}
```

#### Logique

```typescript
// Hook user.afterCreate (signup)
if (user.isFirstConnection) {
  await sendDiscordInviteEmail(user.email, user.name);
  await prisma.user.update({
    where: { id: user.id },
    data: { isFirstConnection: false }
  });
}

// Hook session.afterCreate (login)
if (user.isFirstConnection) {
  await sendDiscordInviteEmail(user.email, user.name);
  await prisma.user.update({
    where: { id: user.id },
    data: { isFirstConnection: false }
  });
}
```

### Feature 2: Suppression Complète avec Discord

#### Étape 1: Endpoint API Custom

Créer `/app/api/auth/complete-delete/route.ts` :

```typescript
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removeUserFromDiscord } from '@/lib/discord/user-management';
import { sendGoodbyeEmail } from '@/lib/mail/goodbye-email';

export const POST = auth.api.handler(async (req, ctx) => {
  const userId = ctx.user?.id;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Get user data before deletion
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      discordId: true,
      planName: true
    }
  });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // 2. Remove Discord access (if linked)
  if (user.discordId) {
    await removeUserFromDiscord(user.discordId);
  }

  // 3. Invalidate all sessions (logout)
  await prisma.session.deleteMany({
    where: { userId }
  });

  // 4. Delete user (cascade handles related data)
  await prisma.user.delete({
    where: { id: userId }
  });

  // 5. Send goodbye email
  await sendGoodbyeEmail(user.email, user.name);

  return Response.json({ success: true });
});
```

#### Étape 2: Discord User Management

Créer `/src/lib/discord/user-management.ts` :

```typescript
import { discordBot } from './bot-client';
import { logger } from '../logger';
import { env } from '../env';

/**
 * Retirer un user du Discord complètement
 * - Retirer tous les rôles
 * - Optionnel: Kick du serveur
 */
export async function removeUserFromDiscord(discordId: string): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client || !env.DISCORD_GUILD_ID) {
    logger.warn('Discord bot not configured, skipping user removal');
    return false;
  }

  try {
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId).catch(() => null);

    if (!member) {
      logger.info(`Discord user ${discordId} not found in guild, already removed`);
      return true;
    }

    // Option 1: Retirer tous les rôles (user reste dans le serveur mais sans accès)
    logger.info(`Removing all roles from Discord user ${discordId}...`);
    await member.roles.set([], 'User account deleted from MyCryptoPilot');

    // Option 2: Kick du serveur (plus radical)
    // await member.kick('User account deleted from MyCryptoPilot');

    logger.info(`✅ Discord access revoked for user ${discordId}`);
    return true;

  } catch (error) {
    logger.error('Error removing user from Discord:', error);
    return false;
  }
}

/**
 * Révoquer l'accès aux channels privés d'un trader
 * Utilisé quand un user unfollow un trader
 */
export async function revokePrivateChannelAccess(
  discordId: string,
  traderId: string
): Promise<boolean> {
  // TODO: Implémenter quand les channels privés par trader seront créés
  // Pour l'instant, les channels sont publics (FREE/PRO/ULTRA)
  logger.info(`Private channel access revoked for ${discordId} from trader ${traderId}`);
  return true;
}
```

#### Étape 3: Goodbye Email

Créer `/emails/goodbye.tsx` :

```tsx
import { SiteConfig } from "@/site-config";
import { Heading, Preview, Text } from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type GoodbyeEmailProps = {
  userName: string;
};

export function GoodbyeEmail({ userName }: GoodbyeEmailProps) {
  return (
    <EmailLayout>
      <Preview>Your account has been deleted - {SiteConfig.title}</Preview>

      <Heading className="text-2xl font-bold text-gray-900">
        Goodbye {userName} 👋
      </Heading>

      <Text className="text-base text-gray-700">
        Your account has been successfully deleted from {SiteConfig.title}.
      </Text>

      <Text className="text-base text-gray-700">
        All your personal data, trading signals, and subscription information
        have been permanently removed from our systems.
      </Text>

      <Text className="text-base text-gray-700">
        If you had a Discord account linked, your access to premium channels
        has been revoked.
      </Text>

      <Text className="text-base text-gray-700">
        We're sad to see you go, but we hope you had a great experience with us.
        You're always welcome to come back! 🚀
      </Text>

      <Text className="text-sm text-gray-500">
        Questions? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>
    </EmailLayout>
  );
}

export default GoodbyeEmail;
```

Créer `/src/lib/mail/goodbye-email.ts` :

```typescript
import { resend } from './resend';
import { env } from '../env';
import GoodbyeEmail from '@email/goodbye';
import { logger } from '../logger';

export async function sendGoodbyeEmail(
  userEmail: string,
  userName: string
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: userEmail,
      subject: 'Your account has been deleted - MyCryptoPilot',
      react: GoodbyeEmail({ userName: userName || userEmail.split('@')[0] })
    });

    if (error) {
      logger.error('Error sending goodbye email:', error);
      return false;
    }

    logger.info(`✅ Goodbye email sent to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error('Exception in sendGoodbyeEmail:', error);
    return false;
  }
}
```

#### Étape 4: Modifier Better Auth Config

Dans `src/lib/auth.ts`, modifier `deleteUser` :

```typescript
deleteUser: {
  enabled: true,
  sendDeleteAccountVerification: async ({ user, token }) => {
    // Email de confirmation AVANT suppression (existant)
    const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackURL=/api/auth/complete-delete`;
    await sendEmail({
      to: user.email,
      subject: "Delete your account",
      html: MarkdownEmail({
        preview: `Delete your account from ${SiteConfig.title}`,
        markdown: `
        Hello,

        You requested to delete your account.

        [Click here to confirm account deletion](${url})

        **What will happen:**
        - Your account will be permanently deleted
        - All your data will be removed
        - Your Discord access will be revoked
        - You will receive a confirmation email
        `,
      }),
    });
  },
}
```

---

## Plan d'Implémentation

### Phase 1: Email Bienvenue (Première Connexion) ⏱️ 30min

**Priorité**: 🟡 Medium
**Complexité**: ⭐ Facile

1. **Migration Prisma** (5min)
   - Ajouter champ `isFirstConnection Boolean @default(true)`
   - Run `npx prisma migrate dev --name add-first-connection-flag`

2. **Modifier Hook Signup** (10min)
   - Dans `src/lib/auth.ts`, hook `user.afterCreate`
   - Vérifier `isFirstConnection` avant envoi email
   - Update field après envoi

3. **Ajouter Hook Login** (10min)
   - Dans `src/lib/auth.ts`, ajouter hook `session.afterCreate`
   - Même logique que signup

4. **Tester** (5min)
   - Signup → email reçu, flag à false
   - Re-signup même email → pas d'email
   - Login OAuth première fois → email reçu

### Phase 2: Suppression Complète (Discord + Email) ⏱️ 2h

**Priorité**: 🔴 Haute
**Complexité**: ⭐⭐⭐ Difficile

1. **Discord User Management** (45min)
   - Créer `/src/lib/discord/user-management.ts`
   - Implémenter `removeUserFromDiscord()`
   - Implémenter `revokePrivateChannelAccess()` (stub pour l'instant)
   - Tester manuellement avec un compte test

2. **Goodbye Email** (30min)
   - Créer template `/emails/goodbye.tsx`
   - Créer helper `/src/lib/mail/goodbye-email.ts`
   - Tester avec `pnpm email`

3. **Complete Delete Endpoint** (30min)
   - Créer `/app/api/auth/complete-delete/route.ts`
   - Implémenter flow complet
   - Gérer erreurs et edge cases

4. **Modifier Better Auth Config** (15min)
   - Update `deleteUser.sendDeleteAccountVerification`
   - Changer `callbackURL` pour pointer vers `/api/auth/complete-delete`

5. **Tester E2E** (15min)
   - Créer compte test
   - Linker Discord
   - Demander suppression
   - Vérifier email confirmation
   - Cliquer sur lien
   - Vérifier :
     - ✅ Déconnexion immédiate
     - ✅ Compte supprimé en base
     - ✅ Discord roles retirés
     - ✅ Goodbye email reçu

### Phase 3: Documentation & Edge Cases ⏱️ 30min

**Priorité**: 🟢 Basse
**Complexité**: ⭐ Facile

1. **Edge Cases à Gérer** (20min)
   - User sans Discord lié → skip Discord cleanup
   - Discord bot offline → log error mais continuer suppression
   - Email fail → log error mais continuer suppression
   - Multiple sessions → toutes invalidées

2. **Update Documentation** (10min)
   - Ajouter flow dans `.claude/docs/TRADING-SYSTEM.md`
   - Update ENV_CHECKLIST si besoin

---

## Checklist de Validation

### ✅ Email Bienvenue

- [ ] Migration `isFirstConnection` appliquée
- [ ] Signup → email envoyé une seule fois
- [ ] Login OAuth première fois → email envoyé
- [ ] Reconnexion → pas d'email
- [ ] Flag correctement mis à jour en base

### ✅ Suppression Complète

- [ ] User clique "Delete" → email confirmation
- [ ] User confirme → flow de suppression démarre
- [ ] Discord roles retirés (si lié)
- [ ] Toutes les sessions invalidées (déconnexion)
- [ ] User supprimé en base (cascade ok)
- [ ] Goodbye email envoyé
- [ ] Redirect vers `/auth/goodbye`

### ✅ Edge Cases

- [ ] Suppression sans Discord lié → ok
- [ ] Suppression avec Discord bot offline → ok (logged)
- [ ] Goodbye email fail → ok (logged)
- [ ] Multiple sessions → toutes invalidées

---

## Notes Techniques

### Discord Bot Permissions Required

Pour `removeUserFromDiscord()` :
- `MANAGE_ROLES` : retirer les rôles
- `KICK_MEMBERS` : si on veut kick (optionnel)

### Prisma Cascade

Les relations suivantes ont déjà `onDelete: Cascade` :
- `Session` → `User`
- `Account` → `User`
- `TraderProfile` → `User`
- `Follow` → `User`
- `CryptoAddress` → `User`
- `CryptoPayment` → `User`

Donc la suppression du User suffit pour tout nettoyer.

### Better Auth Tokens

Le token de confirmation de suppression est valide pendant **24h** par défaut.
Si user ne confirme pas, le compte n'est pas supprimé.

---

## Prochaines Étapes

1. ✅ **Valider cette analyse** avec l'équipe
2. 🚧 **Implémenter Phase 1** (email bienvenue)
3. 🚧 **Implémenter Phase 2** (suppression complète)
4. 🚧 **Tests E2E**
5. 🚧 **Déploiement progressif**

---

**Document créé le**: 13 octobre 2025
**Auteur**: Claude Code
**Status**: 📋 Prêt pour implémentation
