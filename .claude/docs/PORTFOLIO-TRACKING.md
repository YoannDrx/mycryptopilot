# Portfolio Tracking & Verified Stats - Documentation Technique

**Issue**: #66
**Branche**: `feature/66-portfolio-tracking`
**Date création**: 22 octobre 2025
**Statut**: Semaine 1 complétée (DB + Services + Tests)

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture DB](#architecture-db)
3. [Services Backend](#services-backend)
4. [Sécurité](#sécurité)
5. [Configuration](#configuration)
6. [Tests](#tests)
7. [Roadmap](#roadmap)

---

## Vue d'ensemble

### Objectif

Permettre aux traders de connecter leurs comptes Binance en **read-only** pour sync automatique des trades et affichage de stats vérifiées publiques.

### Bénéfices Business

- **+60% revenue mensuel estimé** (+$9,830/mois)
- **Crédibilité traders** : Stats vérifiées on-chain
- **Conversion Free → Pro** : Stats verified comme incentive
- **Différenciation marché** : Unique dans l'écosystème

### Décisions clés (User Research)

- ✅ **Historique sync**: 30 jours (suffisant pour stats récentes)
- ✅ **Notifications erreurs**: Email immédiat uniquement
- ✅ **Privacy**: Tout public par défaut (max transparence)
- ✅ **Gating Free users**: Preview winrate only (équilibre conversion)

---

## Architecture DB

### Migration

**Fichier**: `prisma/migrations/20251022143912_add_portfolio_tracking_models/migration.sql`

### 3 Nouveaux Modèles

#### 1. ExchangeConnection

Store les connexions exchange avec API keys encryptées.

```prisma
model ExchangeConnection {
  id                 String          @id @default(cuid())
  traderProfileId    String
  trader             TraderProfile   @relation(fields: [traderProfileId], references: [id], onDelete: Cascade)
  exchange           Exchange        // BINANCE
  encryptedApiKey    String          @db.Text
  encryptedSecretKey String          @db.Text
  keyIv              String          // Initialization Vector (16 bytes hex)
  keyTag             String          // Auth Tag (16 bytes hex)
  isActive           Boolean         @default(true)
  lastSyncedAt       DateTime?
  lastSyncError      String?         @db.Text
  nextSyncAt         DateTime?       // Throttling: PRO (5min), ULTRA (1min)
  trades             ExchangeTrade[]
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@unique([traderProfileId, exchange])
  @@index([traderProfileId])
  @@index([isActive, nextSyncAt])
  @@map("exchange_connection")
}
```

**Contraintes**:
- 1 connexion par exchange par trader
- API keys TOUJOURS encryptées (AES-256-GCM)
- Throttling via `nextSyncAt` (gating par plan)

#### 2. ExchangeTrade

Store tous les trades importés.

```prisma
model ExchangeTrade {
  id              String             @id @default(cuid())
  connectionId    String
  connection      ExchangeConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  externalOrderId String             @unique   // Binance order ID (idempotence)
  symbol          String                      // BTC/USDT, ETH/USDT, etc.
  side            TradeSide                   // BUY or SELL
  type            OrderType                   // MARKET, LIMIT, etc.
  quantity        Decimal            @db.Decimal(20, 8)
  price           Decimal            @db.Decimal(20, 8)
  quoteQuantity   Decimal            @db.Decimal(20, 8)  // Total in USDT
  fee             Decimal            @db.Decimal(20, 8)
  feeAsset        String                                 // BNB, USDT, etc.
  realizedPnl     Decimal?           @db.Decimal(20, 8)  // Futures only
  executedAt      DateTime
  createdAt       DateTime           @default(now())

  @@index([connectionId, executedAt])
  @@index([symbol])
  @@index([executedAt])
  @@map("exchange_trade")
}
```

**Features**:
- **Idempotence**: `externalOrderId` unique (pas de doublons)
- **Spot + Futures**: `realizedPnl` nullable (futures only)
- **Indexes optimisés**: Queries par connexion + date

#### 3. TraderPerformanceSnapshot

Cache des stats précalculées (4 périodes).

```prisma
model TraderPerformanceSnapshot {
  id              String            @id @default(cuid())
  traderProfileId String
  trader          TraderProfile     @relation(fields: [traderProfileId], references: [id], onDelete: Cascade)
  period          PerformancePeriod // ALL_TIME, LAST_30D, LAST_90D, LAST_365D

  // Basic stats
  totalTrades     Int
  winningTrades   Int
  losingTrades    Int
  winrate         Decimal           @db.Decimal(5, 2)   // 0.00 - 100.00

  // P&L
  totalProfits    Decimal           @db.Decimal(20, 8)
  totalLosses     Decimal           @db.Decimal(20, 8)
  netPnl          Decimal           @db.Decimal(20, 8)

  // Advanced metrics
  profitFactor    Decimal           @db.Decimal(10, 4)  // totalProfits / totalLosses
  sharpeRatio     Decimal?          @db.Decimal(10, 4)  // Risk-adjusted returns
  sortinoRatio    Decimal?          @db.Decimal(10, 4)  // Downside risk only
  maxDrawdown     Decimal           @db.Decimal(10, 4)  // Peak-to-trough %

  // Win/Loss analysis
  averageWin      Decimal           @db.Decimal(20, 8)
  averageLoss     Decimal           @db.Decimal(20, 8)
  largestWin      Decimal           @db.Decimal(20, 8)
  largestLoss     Decimal           @db.Decimal(20, 8)

  calculatedAt    DateTime
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([traderProfileId, period])
  @@index([traderProfileId])
  @@index([calculatedAt])
  @@map("trader_performance_snapshot")
}
```

**Pourquoi un cache ?**
- Calculs expensive (Sharpe, Sortino, MDD) = lents
- Recalculés après chaque sync (async background job)
- Queries ultra-rapides (1 row = toutes les stats)

### Enums

```prisma
enum Exchange {
  BINANCE
  // BYBIT (Phase 4 future)
}

enum TradeSide {
  BUY
  SELL
}

enum OrderType {
  MARKET
  LIMIT
  STOP_LOSS
  STOP_LOSS_LIMIT
  TAKE_PROFIT
  TAKE_PROFIT_LIMIT
}

enum PerformancePeriod {
  ALL_TIME
  LAST_30D
  LAST_90D
  LAST_365D
}
```

---

## Services Backend

### 1. EncryptionService

**Fichier**: `src/lib/crypto/encryption-service.ts`

#### Algorithme: AES-256-GCM

- **Cipher**: `aes-256-gcm` (authenticated encryption)
- **Key**: 32 bytes dérivés de `ENCRYPTION_SECRET`
- **IV**: 16 bytes random (unique par encryption)
- **Auth Tag**: 16 bytes (vérification intégrité)

#### API

```typescript
// Encrypt
type EncryptedData = {
  encrypted: string; // Hex-encoded
  iv: string;        // Hex-encoded (16 bytes = 32 chars)
  tag: string;       // Hex-encoded (16 bytes = 32 chars)
};

encryptApiKey(plaintext: string): EncryptedData

// Decrypt
decryptApiKey(
  encrypted: string,
  iv: string,
  tag: string
): string

// Health check
verifyEncryptionSetup(): boolean
```

#### Sécurité

- ✅ **IV unique**: Randomisé à chaque encryption (pas de pattern)
- ✅ **Auth tag**: Détecte toute modification des données
- ✅ **Jamais logguer**: Keys encryptées ou décryptées
- ✅ **Key rotation**: Possible via re-encryption batch job

#### Exemple d'usage

```typescript
const encrypted = encryptApiKey("my-binance-api-key");
// encrypted = {
//   encrypted: "a3f2c1...",
//   iv: "1a2b3c4d...",
//   tag: "9z8y7x6w..."
// }

await prisma.exchangeConnection.create({
  data: {
    traderProfileId: trader.id,
    exchange: "BINANCE",
    encryptedApiKey: encrypted.encrypted,
    encryptedSecretKey: encryptedSecret.encrypted,
    keyIv: encrypted.iv,
    keyTag: encrypted.tag,
  },
});

// Later: decrypt
const connection = await prisma.exchangeConnection.findUnique({...});
const apiKey = decryptApiKey(
  connection.encryptedApiKey,
  connection.keyIv,
  connection.keyTag
);
```

---

### 2. BinanceService

**Fichier**: `src/lib/exchange/binance-service.ts`

#### Integration ccxt

```typescript
import ccxt from "ccxt";

class BinanceService {
  private exchange: InstanceType<typeof ccxt.binance>;

  constructor(apiKey: string, secretKey: string) {
    this.exchange = new ccxt.binance({
      apiKey,
      secret: secretKey,
      enableRateLimit: true,  // Automatic rate limiting
      options: {
        defaultType: "spot",
      },
    });
  }
}
```

#### API

##### validateApiKeys()

Valide les keys + vérifie read-only permissions.

```typescript
type ValidationResult = {
  isValid: boolean;
  isReadOnly: boolean;
  hasSpotEnabled: boolean;
  hasFuturesEnabled: boolean;
  errorMessage?: string;
};

async validateApiKeys(): Promise<ValidationResult>
```

**Checks**:
1. Keys valides (authentication test via `fetchBalance`)
2. Read-only enforcement (call `sapiGetAccountApiRestrictions`)
3. Spot enabled (toujours true si keys valides)
4. Futures enabled (optionnel)

**Error handling**:
- Invalid API keys → `errorMessage: "Invalid API keys"`
- IP not whitelisted → `errorMessage: "IP address not whitelisted"`

##### fetchRecentTrades()

Fetch trades spot + futures depuis une date.

```typescript
type BinanceTrade = {
  externalOrderId: string;
  symbol: string;
  side: TradeSide;
  type: OrderType;
  quantity: number;
  price: number;
  quoteQuantity: number;
  fee: number;
  feeAsset: string;
  realizedPnl: number | null;
  executedAt: Date;
};

async fetchRecentTrades(
  daysSince = 30,
  sinceDate?: Date
): Promise<BinanceTrade[]>
```

**Algorithme**:
1. Load all markets (spot + futures)
2. For each market, call `fetchMyTrades(symbol, sinceTimestamp)`
3. Map ccxt format → internal `BinanceTrade`
4. Merge spot + futures
5. Sort by `executedAt` desc

**Rate limiting**: Géré automatiquement par ccxt (`enableRateLimit: true`)

#### Usage Example

```typescript
const binance = new BinanceService(apiKey, secretKey);

// Validate
const validation = await binance.validateApiKeys();
if (!validation.isValid) {
  throw new Error(validation.errorMessage);
}
if (!validation.isReadOnly) {
  throw new Error("API keys must be read-only");
}

// Fetch trades
const trades = await binance.fetchRecentTrades(30); // Last 30 days
console.log(`Fetched ${trades.length} trades`);

// Cleanup
await binance.close();
```

---

## Sécurité

### Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **API keys leak** | CRITIQUE | AES-256-GCM encryption + never log |
| **Write permissions abuse** | CRITIQUE | Strict read-only validation |
| **Data tampering** | HIGH | Auth tag verification (GCM mode) |
| **Binance API changes** | HIGH | ccxt abstraction + version pinning |
| **Sync failures** | MEDIUM | Retry logic + email notifications |
| **DB performance** | MEDIUM | Indexes + caching snapshots |

### Best Practices

#### 1. API Keys Storage

- ✅ **NEVER store plaintext**
- ✅ **AES-256-GCM encryption**
- ✅ **IV unique par encryption**
- ✅ **Auth tag pour intégrité**
- ✅ **Key rotation possible** (re-encrypt batch)

#### 2. Read-Only Enforcement

```typescript
// Validation stricte
const restrictions = await exchange.sapiGetAccountApiRestrictions();
const isReadOnly =
  !restrictions.enableSpotAndMarginTrading &&
  !restrictions.enableFutures &&
  !restrictions.enableWithdrawals;

if (!isReadOnly) {
  throw new Error("API keys must be read-only");
}
```

#### 3. Error Handling

- ❌ **NEVER log API keys** (même encryptées)
- ✅ **Log errors uniquement** (pas de données sensibles)
- ✅ **Email immédiat** si keys invalides
- ✅ **Store lastSyncError** en DB pour debug

#### 4. Rate Limiting

- ✅ **ccxt automatic rate limiting** (`enableRateLimit: true`)
- ✅ **Exponential backoff** sur erreurs
- ✅ **Max 10 connexions concurrent** (cron)
- ✅ **Throttling par plan** (PRO 5min, ULTRA 1min)

---

## Configuration

### Environment Variables

#### `.env.local` (Development)

```bash
# Encryption for sensitive data (API keys)
# CRITICAL: Must be 32+ characters
ENCRYPTION_SECRET="your-secure-32-char-random-key-here-min-32-chars"
```

**Générer une clé sécurisée**:

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32
```

#### Validation

La variable est validée dans `src/lib/env.ts`:

```typescript
env: {
  ENCRYPTION_SECRET: z.string().min(32),
  // ...
}
```

**Erreur si non configuré**:
```
ENCRYPTION_SECRET not configured in environment variables
```

**Erreur si trop court**:
```
ENCRYPTION_SECRET must be at least 32 characters (got {length})
```

---

## Tests

### EncryptionService Tests

**Fichier**: `__tests__/crypto/encryption-service.test.ts`

#### Coverage: 20 tests

**Categories**:
1. **encryptApiKey** (5 tests)
   - Encrypt plaintext
   - Different IVs for same plaintext
   - Empty string
   - Long strings (1000 chars)
   - Special characters

2. **decryptApiKey** (7 tests)
   - Decrypt encrypted data
   - Empty string round-trip
   - Long strings round-trip
   - Special characters round-trip
   - Wrong IV → error
   - Wrong tag (tampering) → error
   - Wrong encrypted data → error

3. **verifyEncryptionSetup** (2 tests)
   - Encryption cycle works
   - Multiple verifications consistent

4. **Security properties** (5 tests)
   - Unique IV per encryption
   - Different ciphertext same plaintext
   - Detect data tampering
   - IV is 16 bytes (32 hex chars)
   - Auth tag is 16 bytes (32 hex chars)

5. **Real-world scenarios** (3 tests)
   - Binance API keys encryption/decryption
   - Multiple sequential encryptions
   - Concurrent encryptions (100 keys)

#### Run Tests

```bash
# Single file
pnpm test __tests__/crypto/encryption-service.test.ts

# All tests
pnpm test:ci
```

**Note**: Tests require `ENCRYPTION_SECRET` in `.env.local`.

---

## Roadmap

### ✅ Semaine 1: DB + Encryption + Binance API (COMPLETED)

- ✅ DB models + migration
- ✅ EncryptionService (AES-256-GCM)
- ✅ BinanceService (validate + fetchTrades)
- ✅ Tests unitaires (20 tests)
- ✅ Documentation

### 🚀 Semaine 2: API Routes + Sync Engine (NEXT)

**Jour 1-2: API Routes**
- `POST /api/exchange/connect` - Validate + encrypt + store
- `GET /api/exchange/status/:id` - Connection status
- `POST /api/exchange/disconnect` - Soft delete
- `POST /api/exchange/sync/:id` - Force manual sync
- Gating par plan (FREE bloqué, PRO 1 connexion, ULTRA 3)

**Jour 3-4: Sync Service + Performance Calculator**
- `syncConnectionTrades()` - Decrypt + fetch + upsert
- `recalculatePerformanceSnapshots()` - 4 périodes
- Performance metrics algorithms:
  - Winrate, profit factor, avg win/loss
  - Sharpe ratio (risk-adjusted returns)
  - Sortino ratio (downside risk only)
  - Max drawdown (peak-to-trough)
- Error handling + email notifications

**Jour 5: Cron Job**
- Route `/api/cron/sync-exchanges`
- Batch processing (max 10 concurrent)
- Throttling PRO (5min) vs ULTRA (1min)
- Vercel cron config (`vercel.json`)

### 📅 Semaine 3: UI Components + Public Stats

**Jour 1-2: Dashboard Trader - Onglet Portfolio**
- `ExchangeConnectionCard` (status, last sync, total trades)
- `ConnectExchangeModal` (form + validation)
- `PerformanceOverview` (6 metric cards)
- Error states (sync failures, API keys invalides)

**Jour 3-4: Charts + Tables**
- `EquityCurveChart` (Recharts line chart)
- `TradesTable` (pagination, filtres, export CSV)
- Period selector (ALL_TIME, 30D, 90D, 365D)
- Responsive design

**Jour 5: Public Profile - Verified Stats Tab**
- `VerifiedBadge` component
- `VerifiedStatsTab` (gating Free users)
- Preview winrate only pour Free
- Full stats pour Pro/Ultra
- Upsell modal

---

## Gating par Plan

| Feature | FREE | PRO ($49) | ULTRA ($99) |
|---------|------|-----------|-------------|
| **Connexions** | ❌ 0 | ✅ 1 | ✅ 3 |
| **Sync interval** | - | 5 min | 1 min |
| **Historique** | - | 30 jours | 30 jours |
| **Voir stats verified** | ⚠️ Winrate only | ✅ Full | ✅ Full |
| **Export CSV** | ❌ | ✅ | ✅ |

**Upsell flows**:
1. Free user try connect → modal "Upgrade to Pro ($49/mo)"
2. Free user view verified stats → blur + modal
3. Pro user try 2nd connection → modal "Upgrade to Ultra ($99/mo)"

---

## Success Metrics (1 mois post-launch)

- ✅ **20+ traders** with active Binance connection
- ✅ **10+ traders** avec badge "Verified"
- ✅ **<5% sync error rate** (stability)
- ✅ **+30% conversions** Free → Pro (verified stats incentive)
- ✅ **0 security incidents** (API keys leak)

---

## Files Structure

```
mycryptopilot/
├── prisma/
│   ├── schema.prisma                           # +3 modèles, +4 enums
│   └── migrations/
│       └── 20251022143912_add_portfolio_tracking_models/
│           └── migration.sql                   # Migration appliquée ✅
├── src/
│   ├── lib/
│   │   ├── crypto/
│   │   │   └── encryption-service.ts           # AES-256-GCM ✅
│   │   ├── exchange/
│   │   │   └── binance-service.ts              # ccxt integration ✅
│   │   └── env.ts                              # +1 env var (ENCRYPTION_SECRET)
│   └── generated/
│       └── prisma/                             # Generated types ✅
└── __tests__/
    └── crypto/
        └── encryption-service.test.ts          # 20 tests ✅
```

---

## Dependencies

```json
{
  "dependencies": {
    "ccxt": "^4.5.12"  // ✅ Installé
  }
}
```

---

## Notes de Développement

### Points d'attention

1. **Bybit Phase 4** (pas MVP) - On commence Binance uniquement
2. **WebSocket real-time** (pas MVP) - Sync cron 5min suffisant
3. **Tax reports** (pas MVP) - Export CSV basique suffit
4. **Historique illimité** (pas MVP) - 30 jours initial OK

### Troubleshooting

#### Tests fail: ENCRYPTION_SECRET not configured

**Solution**: Ajouter dans `.env.local`:
```bash
ENCRYPTION_SECRET="your-32-char-key-here-min-32chars"
```

#### Binance API errors: Invalid API-key

**Causes**:
1. Keys incorrectes
2. IP non whitelistée (si restriction IP activée)
3. Keys expirées

**Solution**:
```typescript
const validation = await binance.validateApiKeys();
console.log(validation.errorMessage); // Debug
```

#### Sync failures: Rate limit exceeded

**Cause**: Trop de requests Binance API

**Solution**: ccxt gère automatiquement (`enableRateLimit: true`)

---

**Fin de documentation - Semaine 1 complétée** ✅
