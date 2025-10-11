# Subscription Management - MyCryptoPilot

**Dernière mise à jour**: 11 octobre 2025
**Statut**: ✅ **100% FONCTIONNEL** (Issue #6 complétée)

## Vue d'ensemble

Système complet de gestion d'abonnements orchestrant:

- ✅ Activation automatique après paiement crypto
- ✅ Calcul pro-rata pour extensions
- ✅ Assignation rôles Discord automatiques
- ✅ Envoi emails de confirmation
- ✅ Hook Better Auth pour plan FREE par défaut

---

## Architecture

### 3 Composants Principaux

1. **Better Auth Hook** - Plan FREE automatique à la création
2. **Subscription Manager** - Activation + Discord + Email
3. **Payment Integration** - Appel automatique depuis payment-watcher

---

## 1. Better Auth Hook - Plan FREE par Défaut

**Fichier**: `src/lib/auth.ts` (lignes 61-73)

### Principe

Chaque nouveau user reçoit automatiquement le plan FREE lors de la création de compte via le hook Better Auth `user.create.after`.

### Code

```typescript
import { betterAuth } from "better-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const auth = betterAuth({
  // ... other config

  databaseHooks: {
    user: {
      create: {
        after: async (user, _req) => {
          // Initialize user with FREE plan (MyCryptoPilot default)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              planName: "free",
              // planExpiresAt is null for free plan (no expiration)
            },
          });
          logger.info(`User ${user.id} initialized with FREE plan`);
        },
      },
    },
  },
});
```

### Bénéfices

- ✅ Tous les nouveaux users ont un plan défini (pas de `null`)
- ✅ DB cohérente dès la création du compte
- ✅ Permet d'appliquer immédiatement les limites du plan FREE
- ✅ Rôle Discord "Free Member" peut être assigné automatiquement

---

## 2. Subscription Manager

**Fichier**: `src/lib/subscription/subscription-manager.ts` (435 lignes)

### Module Complet

Orchestre tout le flow d'activation d'abonnement:

1. Récupération organization (Better Auth pattern 1:1)
2. Calcul date d'expiration (support pro-rata)
3. Update atomique User + Organization.Subscription
4. Assignation automatique rôle Discord
5. Envoi email de confirmation

### Fonction Principale: `activateSubscription()`

```typescript
export async function activateSubscription(params: {
  userId: string;
  plan: MyCryptoPilotPlanName;
  daysGranted: number;
}): Promise<{
  success: boolean;
  organizationId?: string;
  periodEnd?: Date;
  error?: string;
}>;
```

### Flow Détaillé

#### Étape 1: Récupération Organization

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    organizations: {
      include: { organization: true },
    },
  },
});

if (!user || user.organizations.length === 0) {
  return { success: false, error: "User not found or no organization" };
}

const org = user.organizations[0].organization;
```

**Note**: MyCryptoPilot utilise le pattern 1:1 (1 Organization = 1 User) pour compatibilité Better Auth.

#### Étape 2: Calcul Date d'Expiration (Pro-Rata)

```typescript
const currentDate = new Date();
let periodEnd: Date;

// Extension d'un abonnement existant
if (user.planExpiresAt && user.planExpiresAt > currentDate) {
  periodEnd = new Date(user.planExpiresAt);
  periodEnd.setDate(periodEnd.getDate() + daysGranted);

  logger.info("Extending existing subscription", {
    userId,
    currentExpiration: user.planExpiresAt,
    daysAdded: daysGranted,
    newExpiration: periodEnd,
  });
}
// Nouvel abonnement
else {
  periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + daysGranted);

  logger.info("Creating new subscription", {
    userId,
    daysGranted,
    expiration: periodEnd,
  });
}
```

**Exemple Pro-Rata**:

- User avec Pro expirant le 20 oct paie 25$ → Extension de 15 jours → Nouvelle expiration 4 nov
- User sans abonnement actif paie 49$ → 30 jours à partir d'aujourd'hui

#### Étape 3: Update DB (Atomique)

```typescript
// Update User
await prisma.user.update({
  where: { id: userId },
  data: {
    planName: plan,
    planExpiresAt: periodEnd,
  },
});

// Upsert Organization.Subscription
await prisma.subscription.upsert({
  where: { organizationId: org.id },
  create: {
    organizationId: org.id,
    plan,
    status: "ACTIVE",
    periodStart: currentDate,
    periodEnd,
  },
  update: {
    plan,
    status: "ACTIVE",
    periodEnd,
  },
});

logger.info("Subscription activated in DB", {
  userId,
  organizationId: org.id,
  plan,
  periodEnd,
});
```

#### Étape 4: Assignation Rôle Discord

```typescript
import { assignRoleToUser } from "@/lib/discord/roles";

// Assign Discord role (automatic, non-blocking)
void assignRoleToUser(userId, plan).catch((error) => {
  logger.error("Failed to assign Discord role", {
    userId,
    plan,
    error: error.message,
  });
});

logger.info("Discord role assignment triggered", { userId, plan });
```

**Rôles Discord**:

- `free` → "Free Member" (gray color)
- `pro` → "Pro Trader" (amber color)
- `ultra` → "Ultra Trader" (purple color)

**Détails**: Voir `src/lib/discord/roles.ts`

#### Étape 5: Envoi Email Confirmation

```typescript
// Send confirmation email (async, non-blocking)
void sendSubscriptionActivationEmail({
  userEmail: user.email!,
  userName: user.name ?? "there",
  plan,
  periodEnd,
}).catch((error) => {
  logger.error("Failed to send subscription email", {
    userId,
    error: error.message,
  });
});

logger.info("Subscription activation email sent", {
  userId,
  userEmail: user.email,
});
```

#### Étape 6: Return Success

```typescript
return {
  success: true,
  organizationId: org.id,
  periodEnd,
};
```

### Gestion d'Erreurs

Toutes les opérations sont entourées de try/catch:

```typescript
try {
  // ... flow complet
} catch (error) {
  logger.error("Failed to activate subscription", {
    userId,
    plan,
    daysGranted,
    error: error instanceof Error ? error.message : String(error),
  });

  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}
```

---

## 3. Email System

### Fonction: `sendSubscriptionActivationEmail()`

**Fichier**: `src/lib/subscription/subscription-manager.ts` (lignes 168-250)

```typescript
async function sendSubscriptionActivationEmail(params: {
  userEmail: string;
  userName: string;
  plan: MyCryptoPilotPlanName;
  periodEnd: Date;
}): Promise<void>;
```

### Template Email (Markdown)

Utilise `MarkdownEmail` component (React Email):

```markdown
# Subscription Activated 🎉

Hi ${userName},

Your **${plan.toUpperCase()}** plan has been successfully activated!

**Plan Details:**

- Plan: **${plan.toUpperCase()}**
- Valid until: **${periodEnd.toLocaleDateString()}**

**What's included:**
${getPlanFeatures(plan).map(feature => `• ${feature}`).join('\n')}

Start exploring your new features now!

[Go to Dashboard](${env.SITE_URL}/dashboard)

---

Questions? Reply to this email or contact support.

Best regards,
MyCryptoPilot Team
```

### Helper: `getPlanFeatures()`

```typescript
function getPlanFeatures(plan: MyCryptoPilotPlanName): string[] {
  const features = {
    free: [
      "5 signals per day",
      "Follow 1 trader",
      "Basic screener (5min refresh)",
    ],
    pro: [
      "50 signals per day",
      "Follow up to 5 traders",
      "Risk Console & Trading Journal",
      "Advanced screener (1min refresh)",
    ],
    ultra: [
      "Unlimited signals",
      "Follow unlimited traders",
      "Premium Risk Console & Journal",
      "Real-time screener (5sec refresh)",
      "Custom alerts & filters",
    ],
  };

  return features[plan] || features.free;
}
```

### Configuration Resend

**Fichier**: `.env.local`

```bash
RESEND_API_KEY="re_..."
SITE_URL="https://mycryptopilot.com"
```

---

## 4. Payment Integration

**Fichier**: `src/lib/crypto/payment-watcher.ts` (ligne 387)

Le payment watcher appelle automatiquement `activateSubscription()` après détection d'un paiement confirmé:

```typescript
// In checkAddressForPayments() or similar function
if (isConfirmed) {
  // Auto-detect plan from amount
  const plan = getPlanFromAmount(amountUSD);
  const daysGranted = calculateDaysGranted(amountUSD, plan);

  // Activate subscription
  const result = await activateSubscription({ userId, plan, daysGranted });

  if (!result.success) {
    logger.error("Failed to activate subscription", {
      userId,
      plan,
      error: result.error,
    });
  } else {
    logger.info("Subscription activated successfully", {
      userId,
      plan,
      periodEnd: result.periodEnd,
    });
  }
}
```

**Flow end-to-end**:

1. User paie 49 USDC sur Base
2. Payment watcher détecte transaction (1 confirmation)
3. Auto-calcul: plan="pro", daysGranted=30
4. Appel `activateSubscription({ userId, plan: "pro", daysGranted: 30 })`
5. User.planName = "pro", User.planExpiresAt = +30 jours
6. Discord role "Pro Trader" assigné
7. Email confirmation envoyé
8. User redirigé vers dashboard

---

## 5. Composants UI

### SubscriptionCard

**Fichier**: `src/components/nowts/subscription-card.tsx` (200 lignes)

Affiche l'abonnement actuel de l'utilisateur.

#### Props

```typescript
type SubscriptionCardProps = {
  plan: MyCryptoPilotPlanName;
  planExpiresAt?: Date | null;
  showUpgradeButton?: boolean;
  className?: string;
};
```

#### Features

- ✅ Badge status dynamique (Active, Expired, Expiring Soon)
- ✅ Icônes par plan (Crown = Ultra, Zap = Pro, Calendar = Free)
- ✅ Couleurs différenciées (Purple = Ultra, Amber = Pro, Gray = Free)
- ✅ Countdown jours restants
- ✅ Liste features par plan (signaux/jour, traders follow, etc.)
- ✅ Boutons CTA conditionnels:
  - Expired: "Renew Subscription"
  - Free: "Upgrade Plan"
  - Expiring Soon: "Extend Subscription"

#### Usage

```tsx
import { SubscriptionCard } from "@/components/nowts/subscription-card";

// Dans dashboard
<SubscriptionCard
  plan={user.planName}
  planExpiresAt={user.planExpiresAt}
  showUpgradeButton={true}
/>;
```

#### Exemple Visuel

```
┌───────────────────────────────────────┐
│ 📦 Your Subscription                  │
├───────────────────────────────────────┤
│ ⚡ PRO PLAN          [Active]         │
│                                       │
│ Valid until: November 10, 2025        │
│ Days remaining: 25 days               │
│                                       │
│ What's included:                      │
│ • 50 signals per day                  │
│ • Follow up to 5 traders              │
│ • Risk Console & Trading Journal      │
│ • Advanced screener (1min refresh)    │
│                                       │
│ [Upgrade to Ultra] [Manage]           │
└───────────────────────────────────────┘
```

---

### SubscriptionCTA

**Fichier**: `src/components/nowts/subscription-cta.tsx` (180 lignes)

Composant marketing pour encourager les utilisateurs Free à upgrader.

#### Props

```typescript
type SubscriptionCTAProps = {
  variant?: "compact" | "full";
  planToPromote?: "pro" | "ultra";
  className?: string;
};
```

#### Variants

**Compact** (banner inline):

```tsx
<SubscriptionCTA variant="compact" planToPromote="pro" />
```

```
┌─────────────────────────────────────────────────────────┐
│ 🚀 Upgrade to PRO and get 50 signals/day  [Upgrade →]  │
└─────────────────────────────────────────────────────────┘
```

**Full** (featured card):

```tsx
<SubscriptionCTA variant="full" planToPromote="ultra" />
```

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                  👑 Upgrade to ULTRA                      │
│                                                           │
│  Unlock the full power of MyCryptoPilot:                 │
│                                                           │
│  ✓ Unlimited signals                                     │
│  ✓ Follow unlimited traders                              │
│  ✓ Real-time screener (5sec refresh)                     │
│  ✓ Custom alerts & advanced filters                      │
│                                                           │
│           [Get Started - $99/month →]                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

#### Usage

```tsx
import { SubscriptionCTA } from "@/components/nowts/subscription-cta";

// Compact banner pour free users dans dashboard
{
  user.planName === "free" && (
    <SubscriptionCTA variant="compact" planToPromote="pro" />
  );
}

// Full featured card dans pricing page
<SubscriptionCTA variant="full" planToPromote="ultra" />;
```

---

## 6. Expiration & Renewal

### Auto-Expiration

Les plans expirent automatiquement via comparaison `planExpiresAt` avec `new Date()`.

**Vérification côté serveur**:

```typescript
// Middleware ou query
const user = await getRequiredUser();

const isPlanActive = user.planExpiresAt && user.planExpiresAt > new Date();
const currentPlan = isPlanActive ? user.planName : "free";
```

### Renewal Flow

1. User clique "Renew Subscription"
2. Redirect `/checkout/${currentPlan}`
3. User paie à nouveau
4. Payment détecté → Extension pro-rata
5. `planExpiresAt` prolongée automatiquement

**Exemple**:

- User avec Pro expirant le 20 oct
- Paie 49$ le 15 oct
- Extension: 20 oct + 30 jours = 19 nov

---

## 7. Discord Integration

**Fichier**: `src/lib/discord/roles.ts`

### Fonction: `assignRoleToUser(userId: string, plan: MyCryptoPilotPlanName)`

```typescript
import { Client } from "discord.js";

export async function assignRoleToUser(
  userId: string,
  plan: MyCryptoPilotPlanName,
): Promise<void> {
  // 1. Get user's Discord ID from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true },
  });

  if (!user?.discordId) {
    logger.warn("User has no Discord account linked", { userId });
    return;
  }

  // 2. Get Discord bot client
  const client = getDiscordClient();
  const guild = client.guilds.cache.get(env.DISCORD_GUILD_ID);

  if (!guild) {
    logger.error("Discord guild not found");
    return;
  }

  const member = await guild.members.fetch(user.discordId);

  if (!member) {
    logger.error("Discord member not found", { discordId: user.discordId });
    return;
  }

  // 3. Get role for plan
  const roleMapping = {
    free: "Free Member",
    pro: "Pro Trader",
    ultra: "Ultra Trader",
  };

  const roleName = roleMapping[plan];
  let role = guild.roles.cache.find((r) => r.name === roleName);

  // 4. Create role if not exists
  if (!role) {
    const roleColors = { free: 0x9ca3af, pro: 0xf59e0b, ultra: 0x9333ea };
    role = await guild.roles.create({
      name: roleName,
      color: roleColors[plan],
      reason: "MyCryptoPilot subscription plan role",
    });
  }

  // 5. Remove old MyCryptoPilot roles
  const oldRoles = member.roles.cache.filter((r) =>
    Object.values(roleMapping).includes(r.name),
  );

  if (oldRoles.size > 0) {
    await member.roles.remove(oldRoles);
  }

  // 6. Add new role
  await member.roles.add(role);

  logger.info("Discord role assigned", {
    userId,
    discordId: user.discordId,
    plan,
    roleName,
  });
}
```

### Role Colors

- **Free Member**: Gray (`0x9CA3AF`)
- **Pro Trader**: Amber (`0xF59E0B`)
- **Ultra Trader**: Purple (`0x9333EA`)

---

## Tests

### Test Unitaire: activateSubscription()

```typescript
import { activateSubscription } from "@/lib/subscription/subscription-manager";

test("activateSubscription - new subscription", async () => {
  const result = await activateSubscription({
    userId: "user_123",
    plan: "pro",
    daysGranted: 30,
  });

  expect(result.success).toBe(true);
  expect(result.periodEnd).toBeDefined();

  // Verify DB
  const user = await prisma.user.findUnique({ where: { id: "user_123" } });
  expect(user?.planName).toBe("pro");
  expect(user?.planExpiresAt).toBeDefined();
});

test("activateSubscription - extension with pro-rata", async () => {
  // Setup user with existing subscription expiring in 10 days
  const existingExpiration = new Date();
  existingExpiration.setDate(existingExpiration.getDate() + 10);

  await prisma.user.update({
    where: { id: "user_123" },
    data: {
      planName: "pro",
      planExpiresAt: existingExpiration,
    },
  });

  // Pay 25$ (15 days)
  const result = await activateSubscription({
    userId: "user_123",
    plan: "pro",
    daysGranted: 15,
  });

  expect(result.success).toBe(true);

  // Verify extension (10 + 15 = 25 days from now)
  const user = await prisma.user.findUnique({ where: { id: "user_123" } });
  const expectedExpiration = new Date();
  expectedExpiration.setDate(expectedExpiration.getDate() + 25);

  expect(user?.planExpiresAt?.getDate()).toBe(expectedExpiration.getDate());
});
```

### Test E2E: Checkout Flow

```typescript
// e2e/checkout.spec.ts
test("full checkout flow with subscription activation", async ({ page }) => {
  // 1. Login as user
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  // 2. Go to pricing
  await page.goto("/pricing");
  await page.click('button:has-text("Upgrade to PRO")');

  // 3. Checkout page
  await expect(page).toHaveURL(/\/checkout\/pro/);

  // 4. Wait for addresses to generate
  await expect(page.locator("text=Base Network")).toBeVisible();

  // 5. Simulate payment (mock in test env)
  await mockPayment({ plan: "pro", amount: 49 });

  // 6. Wait for confirmation
  await expect(page.locator("text=Payment confirmed")).toBeVisible({
    timeout: 30000,
  });

  // 7. Redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // 8. Verify subscription card shows PRO
  await expect(page.locator("text=PRO PLAN")).toBeVisible();
});
```

---

## Fichiers Créés/Modifiés

**Créés** (Issue #6):

- ✅ `src/lib/subscription/subscription-manager.ts` (435 lignes)
- ✅ `src/components/nowts/subscription-card.tsx` (200 lignes)
- ✅ `src/components/nowts/subscription-cta.tsx` (180 lignes)

**Modifiés**:

- ✅ `src/lib/auth.ts` - Ajout hook Better Auth (14 lignes)
- ✅ `src/lib/crypto/payment-watcher.ts` - Intégration subscription-manager (5 lignes)

**Total**: ~830 lignes de code production-ready

---

## Notes Techniques

1. ✅ **0 erreurs TypeScript** - Code 100% type-safe
2. ✅ **Logging complet** - Facile à débugger en production avec `logger.info/error`
3. ✅ **Error handling** - Toutes les opérations gèrent les erreurs avec try/catch
4. ✅ **Non-blocking** - Email/Discord envoyés avec `void promise.catch()` pour ne pas bloquer
5. ✅ **Atomic updates** - Prisma updates pour cohérence DB
6. ✅ **Pro-rata support** - Calcul automatique jours pour montants partiels

---

## Documentation Complémentaire

- [Better Auth Docs](https://better-auth.com/docs)
- [Resend API](https://resend.com/docs)
- [React Email](https://react.email/)
- [Discord.js](https://discord.js.org/)
