# Database Architecture - MyCryptoPilot

**Dernière mise à jour**: 11 octobre 2025

## Vue d'ensemble

MyCryptoPilot utilise PostgreSQL (Neon) avec Prisma ORM. La structure étend le template NOW.TS avec 5 modèles spécifiques au trading crypto.

## État des Migrations

✅ **6 migrations appliquées avec succès** (11 octobre 2025)

```
20250806031537_initail_migration                        ✅
20250813011134_org_move_to_stirpe_to_org_level          ✅
20250813021925_admin_add_admin_control_of_better_auth   ✅
20251003143237_add_mycryptopilot_models                 ✅
20251010090500_add_user_plan_and_discord_fields         ✅
20251011??????_migration_6                              ✅
```

**Vérification**:

```bash
npx prisma migrate status
# Database schema is up to date! ✅
```

---

## Schémas Prisma

### 1. User (Extended)

**Fichier**: `prisma/schema/better-auth.prisma`

```prisma
model User {
  // ... Better Auth base fields (id, email, name, etc.)

  // MyCryptoPilot extensions
  userRole         UserRole         @default(USER)
  planName         String?          // "free", "pro", "ultra"
  planExpiresAt    DateTime?
  dailySignalsUsed Int              @default(0)
  lastSignalReset  DateTime         @default(now())
  discordId        String?          @unique
  discordUsername  String?

  // Relations
  traderProfile    TraderProfile?
  following        Follow[]         @relation("UserFollowing")
  cryptoAddresses  CryptoAddress[]
  cryptoPayments   CryptoPayment[]
}

enum UserRole {
  USER
  TRADER
  BOTH
}
```

**Plan par défaut**: Géré par Better Auth hook (voir [`DATABASE.md#Better-Auth-Hook`](#better-auth-hook))

---

### 2. TraderProfile

Profil public des traders vérifiés.

```prisma
model TraderProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  bio           String?  @db.Text
  verified      Boolean  @default(false)
  statsJson     Json     // { winrate, payoff, totalSignals, followers, ... }

  // Relations
  signals       Signal[]
  followers     Follow[] @relation("TraderFollowers")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**statsJson structure**:

```typescript
{
  winrate: number;        // 0-100 (%)
  payoff: number;         // Ratio gains/pertes moyen
  totalSignals: number;
  activeSignals: number;
  followers: number;
  totalVolume?: number;   // Volume cumulé (USD)
}
```

---

### 3. Signal

Signaux de trading publiés par les traders.

```prisma
model Signal {
  id            String         @id @default(cuid())
  traderId      String
  trader        TraderProfile  @relation(fields: [traderId], references: [id], onDelete: Cascade)

  asset         String         // "BTC", "ETH", etc.
  status        SignalStatus   @default(ACTIVE)
  payloadJson   Json           // TradingCard structure
  payloadHash   String         // SHA-256 hash (immutabilité)

  publishedAt   DateTime       @default(now())
  closedAt      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([traderId, status])
  @@index([asset, status])
  @@index([publishedAt])
}

enum SignalStatus {
  ACTIVE
  TP_HIT
  INVALIDATED
}
```

**payloadJson structure** (TradingCard):

```typescript
{
  instrumentType: "SPOT" | "PERP";
  bias: "LONG" | "SHORT";
  entry: number;
  invalidation: number;
  tps: number[];          // Take-profit levels
  leverageBand: string;   // "1x-3x", "5x-10x", etc.
  risk: 1 | 2 | 3 | 4 | 5;
  confidence: number;     // 0-100
  rationales: string[];   // Raisons du signal
  regime: string;         // "Trending", "Ranging", etc.
  managedBy: "AI" | "HUMAN";
  version: string;        // Format version
}
```

**Documentation**: Voir [`.claude/docs/TRADING-SYSTEM.md`](.claude/docs/TRADING-SYSTEM.md)

---

### 4. Follow

Relation follower → trader.

```prisma
model Follow {
  id          String        @id @default(cuid())
  followerId  String
  follower    User          @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  traderId    String
  trader      TraderProfile @relation("TraderFollowers", fields: [traderId], references: [id], onDelete: Cascade)

  createdAt   DateTime      @default(now())

  @@unique([followerId, traderId])
  @@index([followerId])
  @@index([traderId])
}
```

**Limites par plan**:

- FREE: 1 trader max
- PRO: 5 traders max
- ULTRA: illimité

---

### 5. CryptoAddress

Adresses crypto générées pour les paiements (HD wallet).

```prisma
model CryptoAddress {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  network         String   // "BASE" | "TRON"
  address         String   @unique
  derivationIndex Int      // Index HD wallet (m/44'/60'/0'/0/{index})

  expiresAt       DateTime // 15 min expiration
  createdAt       DateTime @default(now())

  @@unique([userId, network])
  @@index([address])
  @@index([expiresAt])
}
```

**Génération**: Voir [`.claude/docs/CRYPTO-PAYMENTS.md`](.claude/docs/CRYPTO-PAYMENTS.md)

---

### 6. CryptoPayment

Paiements crypto détectés on-chain.

```prisma
model CryptoPayment {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan            String        // "pro" | "ultra"
  network         String        // "BASE" | "TRON"
  currency        String        // "USDC" | "USDT"

  amountToken     String        // Montant en token (eg. "49.50")
  amountUSD       String        // Montant en USD (eg. "49.50")

  txHash          String        @unique
  confirmations   Int           @default(0)
  status          PaymentStatus @default(CONFIRMED)

  daysGranted     Int           // Jours d'abonnement accordés (pro-rata support)
  confirmedAt     DateTime
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId, status])
  @@index([txHash])
}

enum PaymentStatus {
  CONFIRMED
}
```

---

### 7. Subscription (Organization)

**Fichier**: `prisma/schema/schema.prisma`

```prisma
model Organization {
  // ... NOW.TS base fields

  subscriptions Subscription[]
}

model Subscription {
  id              String              @id @default(cuid())
  organizationId  String
  organization    Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  plan            String              // "free", "pro", "ultra"
  status          SubscriptionStatus  @default(ACTIVE)

  periodStart     DateTime
  periodEnd       DateTime

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([organizationId])
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
}
```

**Note**: MyCryptoPilot utilise le pattern 1:1 (1 Organization = 1 User) pour compatibilité Better Auth.

---

## Better Auth Hook

**Fichier**: `src/lib/auth.ts` (lignes 61-73)

Chaque nouveau user reçoit automatiquement le plan FREE:

```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user, _req) => {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            planName: "free",
            // planExpiresAt is null for free plan (no expiration)
          },
        });
        logger.info(`User ${user.id} initialized with FREE plan`);
      };
    }
  }
}
```

**Documentation**: Voir [`.claude/docs/SUBSCRIPTIONS.md`](.claude/docs/SUBSCRIPTIONS.md)

---

## Queries Patterns

### Trader Queries

**Fichier**: `src/features/trader/trader-queries.ts`

```typescript
// Get trader profile by user ID
export const getTraderProfileByUserId = async (
  userId: string,
): Promise<TraderProfile | null> => {
  return prisma.traderProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
};

// Count followers
export const countTraderFollowers = async (
  traderId: string,
): Promise<number> => {
  return prisma.follow.count({
    where: { traderId },
  });
};

// Search traders (marketplace)
export const searchTraders = async (params: {
  search?: string;
  verified?: boolean;
  sortBy?: "winrate" | "followers" | "signals" | "recent";
  cursor?: string;
  limit?: number;
}) => {
  // Implementation with Prisma pagination...
};
```

### Signal Queries

**Fichier**: `src/features/signal/signal-queries.ts`

```typescript
// Get active signals by trader
export const getActiveSignalsByTrader = async (traderId: string) => {
  return prisma.signal.findMany({
    where: {
      traderId,
      status: "ACTIVE",
    },
    orderBy: { publishedAt: "desc" },
  });
};

// Count signals
export const countActiveSignalsByTrader = async (
  traderId: string,
): Promise<number> => {
  return prisma.signal.count({
    where: { traderId, status: "ACTIVE" },
  });
};
```

### Follow Queries

**Fichier**: `src/features/follow/follow-queries.ts`

```typescript
// Check if user follows trader
export const isFollowingTrader = async (
  followerId: string,
  traderId: string,
): Promise<boolean> => {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_traderId: { followerId, traderId },
    },
  });
  return !!follow;
};

// Get followed traders
export const getFollowedTraders = async (userId: string) => {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      trader: {
        include: { user: true },
      },
    },
  });
};
```

---

## Database Hooks

### User Creation Setup

**Fichier**: `src/lib/auth/auth-config-setup.ts`

Better Auth hooks gèrent:

- ✅ Création organization 1:1
- ✅ Assignation plan FREE par défaut (hook dans `auth.ts`)
- ✅ Initialization user fields

---

## Seeding

**Fichier**: `prisma/seed.ts`

```bash
pnpm prisma:seed
```

Seeds:

- Admin user
- Sample traders (3-5)
- Sample signals (10-20)
- Sample follows

---

## Migrations

### Créer une nouvelle migration

```bash
npx prisma migrate dev --name descriptive_name
```

### Appliquer les migrations

```bash
npx prisma migrate deploy
```

### Vérifier le statut

```bash
npx prisma migrate status
```

---

## Performance

### Indexes créés

- `Signal`: `[traderId, status]`, `[asset, status]`, `[publishedAt]`
- `Follow`: `[followerId]`, `[traderId]`
- `CryptoAddress`: `[address]`, `[expiresAt]`
- `CryptoPayment`: `[userId, status]`, `[txHash]`

### Relations optimisées

- Cascade deletes pour cleanup automatique
- Unique constraints sur les relations 1:1

---

## Fichiers Importants

- `prisma/schema/schema.prisma` - Main schema
- `prisma/schema/better-auth.prisma` - Auth schema + User extensions
- `prisma/migrations/` - Migration history
- `src/lib/prisma.ts` - Prisma client instance
- `src/generated/prisma/` - Generated client

---

## Notes Techniques

1. **Client Prisma**: Généré dans `src/generated/prisma` (custom output)
2. **Relations**: Cascade delete pour éviter orphaned records
3. **Json fields**: Utilisés pour flexibility (statsJson, payloadJson)
4. **Indexes**: Optimisés pour queries fréquentes (trader search, signal feed)
5. **Better Auth**: Extensions User dans better-auth.prisma

---

## Prochaines Étapes

- [ ] Ajouter modèle `TradingJournal` (Phase 5)
- [ ] Ajouter modèle `RiskCalculation` (Phase 5)
- [ ] Indexes additionnels si performance issues
- [ ] Consider partitioning pour signals table (scaling)
