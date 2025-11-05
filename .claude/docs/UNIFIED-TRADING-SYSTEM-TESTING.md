# Guide de Test - Unified Trading System

**Documentation complète des tests pour le système de trading unifié (Phases 1-3)**

**Dernière mise à jour**: 1 novembre 2025

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Setup Environnement](#setup-environnement)
3. [Tests Manuels - Manual Trades](#tests-manuels---manual-trades)
4. [Tests Manuels - Exchange Integration](#tests-manuels---exchange-integration)
5. [Tests Manuels - Fill Aggregation](#tests-manuels---fill-aggregation)
6. [Tests Manuels - UnrealizedPnL](#tests-manuels---unrealizedpnl)
7. [Tests Automatisés](#tests-automatisés)
8. [Scénarios Complexes](#scénarios-complexes)
9. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Le **Unified Trading System** (Phases 1-3) unifie trois sources de trades:

1. **Manual Trades** (source: `MANUAL`) - Trades saisis manuellement
2. **Exchange Trades** (source: `BINANCE`, `BYBIT`) - Trades automatiquement synchronisés depuis les exchanges
3. **Copy Trades** (source: `COPY`) - Trades copiés depuis des traders suivis

### Composants Testés

- ✅ **Manual Trade Service** - Création/modification trades manuels
- ✅ **Fill Aggregation Service** - Conversion `ExchangeTrade` → `TraderTrade` avec sessions
- ✅ **Unrealized PnL Service** - Calcul PnL temps réel pour positions ouvertes
- ✅ **Performance Calculator** - 15 métriques de performance
- ✅ **Copy Trading Service** - Copie automatique de signaux

### Corrections Appliquées (Codex Review)

Les 7 issues critiques identifiées par Codex ont été corrigées:

1. ✅ `aggregateTraderFills` retourne nullable (`TraderTrade | null`)
2. ✅ `totalQuantity` préservé pour positions fermées (max(totalBuys, totalSells))
3. ✅ PnL calculé pour status `PARTIAL` (pas seulement `CLOSED`)
4. ✅ Sessions ne fusionnent plus BUY et SELL (check `side` ajouté)
5. ✅ `CopyStatus.CLOSED` ajouté à l'enum
6. ✅ `takeProfit` typé avec `TakeProfitLevel[]` (structured format)
7. 🚧 UI Integration (hors scope pour ce guide de test)

---

## Setup Environnement

### 1. Variables d'Environnement Requises

Copie `.env.example` vers `.env.local`:

```bash
cp .env.example .env.local
```

#### Variables Critiques pour Testing

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Auth (REQUIRED)
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"

# Encryption (REQUIRED pour Exchange Integration)
ENCRYPTION_SECRET="$(openssl rand -hex 32)"

# Exchange API Keys (REQUIRED pour testing Binance/Bybit)
# ⚠️  IMPORTANT: Utilise des clés READ-ONLY testnet!
BINANCE_USER_API_KEY="your_binance_testnet_key"
BINANCE_USER_SECRET_KEY="your_binance_testnet_secret"
BYBIT_USER_API_KEY="your_bybit_testnet_key"
BYBIT_USER_SECRET_KEY="your_bybit_testnet_secret"

# Redis (OPTIONAL - pour cache UnrealizedPnL)
# Si absent, le système fonctionne sans cache
REDIS_URL="redis://localhost:6379"

# Email (OPTIONAL - pour notifications sync failures)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@mycryptopilot.app"
```

#### Comment Obtenir les Clés Testnet

**Binance Testnet**:
1. Va sur https://testnet.binance.vision/
2. Connecte-toi avec GitHub
3. Crée une API Key avec permissions READ-ONLY
4. Copie la clé dans `.env.local`

**Bybit Testnet**:
1. Va sur https://testnet.bybit.com/
2. Crée un compte testnet
3. Va dans API Management
4. Crée une API Key READ-ONLY
5. Copie la clé dans `.env.local`

### 2. Base de Données

#### Migrations

Applique toutes les migrations:

```bash
# Vérifie le statut
npx prisma migrate status

# Applique les migrations en attente
npx prisma migrate deploy

# Génère le client Prisma
npx prisma generate
```

#### Vérification Migration CopyStatus

Vérifie que `CopyStatus.CLOSED` existe:

```bash
npx prisma studio
```

Ouvre la table `CopyTrade` et vérifie que le champ `status` accepte: `PENDING`, `EXECUTED`, `CLOSED`, `FAILED`, `CANCELLED`.

#### Seed Data (Optional)

Pour tester avec données réalistes:

```bash
pnpm prisma:seed
```

Cela crée:
- 3 utilisateurs (free, pro, ultra)
- 3 traders vérifiés
- 50+ trades historiques
- Performance snapshots

### 3. Redis (Optional)

Si tu veux tester le cache UnrealizedPnL:

```bash
# Installation locale (macOS)
brew install redis
brew services start redis

# Vérification
redis-cli ping
# Devrait retourner: PONG
```

Si Redis n'est pas disponible, le système fonctionne quand même (calcul sans cache).

### 4. Lancement Dev Server

```bash
pnpm dev
```

Ouvre http://localhost:3000

### 5. Outils de Diagnostic

#### Script Vérification Encryption

Diagnostic des clés API encryptées:

```bash
npx tsx scripts/verify-encryption.ts
```

Ce script vérifie:
- ✅ `ENCRYPTION_SECRET` configuré
- ✅ Cycle encryption/decryption fonctionne
- ✅ Connections existantes se décryptent correctement
- ❌ Identifie les connections avec erreurs "Data integrity check failed"

**Résultat attendu**:
```
🔐 Encryption Verification Tool
================================

1️⃣ Checking ENCRYPTION_SECRET environment variable...
✅ ENCRYPTION_SECRET is set (64 characters)

2️⃣ Testing encryption/decryption cycle...
✅ Encryption/decryption cycle works correctly

3️⃣ Testing with realistic API key format...
   Encrypted data length: 112
   IV length: 32
   Auth tag length: 32
✅ Realistic API key encryption works correctly

4️⃣ Checking existing encrypted exchange connections...
📊 Found 2 exchange connection(s) (showing last 10):

   Connection ID: conn_123
   Exchange: BINANCE
   User: John Doe (john@example.com)
   Trader: ProTrader
   Active: ✅
   🔓 Decryption: ✅ SUCCESS (key length: 64)
```

**Si erreur de décryption**:
```
   🔓 Decryption: ❌ FAILED
      Error: Decryption failed: Data integrity check failed (possible tampering)
      💡 This error means the ENCRYPTION_SECRET used to encrypt
         this data is different from your current secret.
         You need to reconnect this exchange with new API keys.
```

**Action**: Reconnecte l'exchange depuis `/orgs/[orgSlug]/account/exchanges`.

---

## Tests Manuels - Manual Trades

### Test 1: Créer un Trade Manuel avec TPs Structurés

**Objectif**: Vérifier que `takeProfit` supporte les 2 formats (simple numbers + structured).

**Pré-requis**:
- 1 TraderProfile créé
- User connecté

**Steps**:

1. **Navigue vers le formulaire de création de trade manuel**:
   ```
   /orgs/[orgSlug]/dashboard/trader/trades/new
   ```

2. **Remplis le formulaire**:
   - Symbol: `BTC/USDT`
   - Side: `BUY` (LONG)
   - Entry Price: `50000`
   - Quantity: `0.1`
   - Stop Loss: `48000`
   - Take Profit 1: `52000` (price), `50` (percentage)
   - Take Profit 2: `54000` (price), `50` (percentage)

3. **Soumets le formulaire**

4. **Vérifie dans DB (Prisma Studio)**:
   ```bash
   npx prisma studio
   ```

   Ouvre `TraderTrade`, trouve le trade créé:
   ```json
   {
     "symbol": "BTC/USDT",
     "side": "BUY",
     "source": "MANUAL",
     "status": "OPEN",
     "averageEntry": 50000,
     "stopLoss": 48000,
     "takeProfit": [
       { "price": 52000, "percentage": 50, "hit": false },
       { "price": 54000, "percentage": 50, "hit": false }
     ]
   }
   ```

✅ **Succès**: `takeProfit` est un array de `TakeProfitLevel` objects (pas juste `number[]`).

### Test 2: Modification Trade Manuel

**Objectif**: Mettre à jour un trade existant (nouveau TP, notes).

**Steps**:

1. Crée un trade manuel (voir Test 1)

2. Navigue vers l'édition:
   ```
   /orgs/[orgSlug]/dashboard/trader/trades/[tradeId]/edit
   ```

3. Modifie:
   - Ajoute TP3: `56000` (100% remaining)
   - Notes: `"Added third TP target"`

4. Vérifie dans DB:
   ```json
   {
     "takeProfit": [
       { "price": 52000, "percentage": 33.33, "hit": false },
       { "price": 54000, "percentage": 33.33, "hit": false },
       { "price": 56000, "percentage": 33.34, "hit": false }
     ],
     "notes": "Added third TP target"
   }
   ```

✅ **Succès**: Les TPs sont re-normalisés (percentages équilibrés).

### Test 3: Fermer un Trade Manuel

**Objectif**: Calculer realized PnL correctement.

**Steps**:

1. Crée un trade manuel LONG:
   - Entry: `50000`, Quantity: `0.1`

2. Ferme le trade via UI ou API:
   ```
   POST /api/trades/[tradeId]/close
   {
     "exitPrice": 52000
   }
   ```

3. Vérifie dans DB:
   ```json
   {
     "status": "CLOSED",
     "averageExit": 52000,
     "realizedPnl": 200,  // (52000 - 50000) * 0.1 = 200
     "closedAt": "2025-11-01T12:00:00Z"
   }
   ```

✅ **Succès**: PnL calculé = `(exit - entry) * quantity` pour LONG.

### Test 4: Validation Stop Loss / Take Profit

**Objectif**: Empêcher des TP/SL invalides (TP below entry pour LONG, etc.).

**Steps**:

1. Essaie de créer un LONG trade avec TP invalide:
   ```json
   {
     "side": "BUY",
     "entryPrice": 50000,
     "takeProfits": [48000]  // ❌ TP below entry for LONG
   }
   ```

2. Vérifie que l'erreur est retournée:
   ```
   ❌ Error: Take profit levels must be above entry price for long trades
   ```

3. Essaie SL invalide pour LONG:
   ```json
   {
     "side": "BUY",
     "entryPrice": 50000,
     "stopLoss": 52000  // ❌ SL above entry for LONG
   }
   ```

4. Vérifie l'erreur:
   ```
   ❌ Error: Stop loss must be below entry price for long trades
   ```

✅ **Succès**: Validation empêche les TP/SL illogiques.

---

## Tests Manuels - Exchange Integration

### Test 5: Connecter Binance Exchange

**Objectif**: Valider API keys + créer `ExchangeConnection` encryptée.

**Pré-requis**:
- `ENCRYPTION_SECRET` configuré
- `BINANCE_USER_API_KEY` + `BINANCE_USER_SECRET_KEY` configurés
- User avec plan PRO (1 exchange connection)

**Steps**:

1. Navigue vers exchanges:
   ```
   /orgs/[orgSlug]/account/exchanges
   ```

2. Clique "Connect Binance"

3. Entre les clés API testnet:
   - API Key: `your_binance_testnet_key`
   - Secret Key: `your_binance_testnet_secret`

4. Clique "Validate & Connect"

5. **Vérifications Backend**:

   a. L'API route `/api/exchange/connect` appelle `validateBinanceCredentials()`:
   ```typescript
   // Devrait retourner { valid: true, accountInfo: {...} }
   ```

   b. Vérifie dans DB (ExchangeConnection):
   ```json
   {
     "exchange": "BINANCE",
     "isActive": true,
     "encryptedApiKey": "hex_encrypted_data...",
     "keyIv": "hex_iv...",
     "keyTag": "hex_auth_tag...",
     "lastSyncAt": "2025-11-01T12:00:00Z"
   }
   ```

   c. Vérifie que le TraderProfile est maintenant `verified`:
   ```json
   {
     "verified": true,
     "verifiedAt": "2025-11-01T12:00:00Z"
   }
   ```

6. **Test Decryption**:

   Run le script:
   ```bash
   npx tsx scripts/verify-encryption.ts
   ```

   Vérifie que la connection se décrypte ✅.

✅ **Succès**: Binance connecté, clés encryptées, trader vérifié.

### Test 6: Sync Manual Binance

**Objectif**: Récupérer les trades Binance et créer `ExchangeTrade` records.

**Steps**:

1. Depuis `/orgs/[orgSlug]/account/exchanges`, clique **"Sync Now"**

2. Le système appelle:
   ```typescript
   syncExchangeTrades(connectionId)
   ```

3. **Vérifications**:

   a. Check logs console:
   ```
   Syncing Binance trades for connection: conn_123
   Fetched 15 trades from Binance
   Created 15 ExchangeTrade records
   ```

   b. Vérifie dans DB (`ExchangeTrade` table):
   ```json
   {
     "connectionId": "conn_123",
     "externalOrderId": "28457",
     "symbol": "BTCUSDT",
     "side": "BUY",
     "type": "MARKET",
     "quantity": 0.001,
     "price": 50000,
     "realizedPnl": 0,
     "executedAt": "2025-11-01T10:00:00Z"
   }
   ```

   c. Vérifie que `lastSyncAt` a été mis à jour:
   ```json
   {
     "lastSyncAt": "2025-11-01T12:05:00Z"
   }
   ```

✅ **Succès**: Trades Binance synchronisés dans `ExchangeTrade`.

### Test 7: Automatic Sync (Cron Job)

**Objectif**: Vérifier que le cron job sync automatiquement toutes les 5 minutes.

**Pré-requis**:
- `CRON_SECRET` configuré
- Vercel cron configuré dans `vercel.json`

**Steps (Production)**:

1. Déploie sur Vercel avec cron activé

2. Attends 5 minutes

3. Check Vercel Logs:
   ```
   [Cron] Syncing 3 active exchange connections
   [Cron] Synced conn_123: 5 new trades
   [Cron] Synced conn_456: 0 new trades
   ```

**Steps (Local Testing)**:

1. Appelle manuellement le cron endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/cron/sync-exchanges \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. Vérifie la réponse:
   ```json
   {
     "success": true,
     "synced": 3,
     "newTrades": 5
   }
   ```

✅ **Succès**: Cron job sync les exchanges automatiquement.

### Test 8: Decryption Error Handling

**Objectif**: Tester le cas où `ENCRYPTION_SECRET` a changé.

**Steps**:

1. Connecte Binance (voir Test 5)

2. **Change** `ENCRYPTION_SECRET` dans `.env.local`:
   ```bash
   ENCRYPTION_SECRET="$(openssl rand -hex 32)"  # Nouveau secret!
   ```

3. Restart dev server

4. Essaie de sync:
   ```
   POST /api/exchange/sync
   ```

5. **Vérifie l'erreur**:
   ```json
   {
     "error": "Decryption failed: Data integrity check failed (possible tampering)"
   }
   ```

6. **Vérifie que l'email a été envoyé** (si Resend configuré):
   - Subject: `⚠️ Échec de synchronisation BINANCE`
   - Body contient: `"Data integrity check failed"`
   - Lien: `/orgs/[orgSlug]/account/exchanges`

7. **Run diagnostic script**:
   ```bash
   npx tsx scripts/verify-encryption.ts
   ```

   Output attendu:
   ```
   🔓 Decryption: ❌ FAILED
      Error: Data integrity check failed
      💡 ENCRYPTION_SECRET changed - reconnect exchange
   ```

✅ **Succès**: Erreur détectée, email envoyé, diagnostic clair.

---

## Tests Manuels - Fill Aggregation

### Test 9: Agréger Fills en TraderTrade (Session Detection)

**Objectif**: Vérifier que `aggregateTraderFills()` détecte les sessions et crée `TraderTrade`.

**Pré-requis**:
- Binance connecté + synced (au moins 10 trades BTCUSDT)

**Steps**:

1. Run aggregation pour un trader:
   ```bash
   npx tsx scripts/aggregate-fills.ts --traderId=trader_123
   ```

2. **Vérifications**:

   a. Check console output:
   ```
   Processing 50 fills for trader: trader_123
   Detected 3 trading sessions
   Created 3 TraderTrade records
   ```

   b. Vérifie dans DB (`TraderTrade` table):
   ```json
   {
     "source": "BINANCE",
     "symbol": "BTC/USDT",
     "side": "BUY",
     "status": "CLOSED",
     "totalQuantity": 0.5,  // ✅ max(totalBuys, totalSells) pour CLOSED
     "averageEntry": 49800,
     "averageExit": 50200,
     "realizedPnl": 200,  // ✅ Calculé pour CLOSED
     "openedAt": "2025-11-01T08:00:00Z",
     "closedAt": "2025-11-01T09:00:00Z"
   }
   ```

   c. Vérifie qu'il n'y a **PAS** de fusion BUY/SELL (bug fix #4):
   - Compte les TraderTrade BUY: `X`
   - Compte les TraderTrade SELL: `Y`
   - Total `TraderTrade` = `X + Y` (pas moins!)

✅ **Succès**: Sessions détectées, TPs créés, BUY/SELL séparés.

### Test 10: Position Size Preservation (CLOSED Trades)

**Objectif**: Vérifier que `totalQuantity` préserve la taille pour trades fermés.

**Pré-requis**:
- Au moins 1 session CLOSED dans la DB

**Steps**:

1. Trouve un trade CLOSED dans Prisma Studio

2. Vérifie `totalQuantity`:
   ```sql
   SELECT id, status, totalQuantity FROM "TraderTrade"
   WHERE status = 'CLOSED' AND source = 'BINANCE'
   LIMIT 1;
   ```

3. **Calcul Attendu**:
   ```typescript
   // Si fills:
   // - BUY 0.3 BTC
   // - BUY 0.2 BTC
   // - SELL 0.5 BTC (closes position)

   totalBuys = 0.5
   totalSells = 0.5
   totalQuantity = max(0.5, 0.5) = 0.5  // ✅ Position size preserved
   ```

4. **Avant le fix (bug)**:
   ```typescript
   netQuantity = 0.5 - 0.5 = 0
   totalQuantity = abs(0) = 0  // ❌ Size lost!
   ```

✅ **Succès**: `totalQuantity` = 0.5 (pas 0).

### Test 11: PnL pour Status PARTIAL

**Objectif**: Vérifier que `realizedPnl` est calculé pour PARTIAL (pas seulement CLOSED).

**Pré-requis**:
- Crée une session PARTIAL manuellement

**Steps**:

1. Insert des fills qui créent un PARTIAL:
   ```sql
   -- Session: BUY 1 BTC @ 50000, SELL 0.5 BTC @ 52000
   INSERT INTO "ExchangeTrade" (...)
   VALUES (BUY, 1.0, 50000), (SELL, 0.5, 52000);
   ```

2. Run aggregation:
   ```bash
   npx tsx scripts/aggregate-fills.ts --traderId=trader_123
   ```

3. Vérifie dans DB:
   ```json
   {
     "status": "PARTIAL",
     "totalQuantity": 0.5,  // 1 - 0.5 = 0.5 remaining
     "realizedPnl": 1000,   // ✅ Calculated! (52000 - 50000) * 0.5
     "averageExit": 52000
   }
   ```

✅ **Succès**: `realizedPnl` non-null pour PARTIAL.

### Test 12: Null Aggregation Result

**Objectif**: Vérifier que `aggregateTraderFills()` retourne `{ traderTrade: null }` si aucun fill.

**Steps**:

1. Appelle aggregation pour un trader sans fills:
   ```typescript
   const result = await aggregateTraderFills(traderProfileId);
   ```

2. Vérifie:
   ```typescript
   expect(result.traderTrade).toBeNull();  // ✅ Clean nullable
   expect(result.fillsProcessed).toBe(0);
   expect(result.sessionsCreated).toBe(0);
   ```

✅ **Succès**: Pas d'erreur de cast, retourne null proprement.

---

## Tests Manuels - UnrealizedPnL

### Test 13: Calculer Unrealized PnL pour Position Ouverte

**Objectif**: Tester `calculateUnrealizedPnL()` avec un trade OPEN.

**Pré-requis**:
- Redis running (optionnel)
- 1 TraderTrade avec `status: OPEN`

**Steps**:

1. **API Call**:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/[tradeId]
   ```

2. **Vérifie la réponse**:
   ```json
   {
     "tradeId": "trade_123",
     "symbol": "BTC/USDT",
     "side": "BUY",
     "quantity": 0.1,
     "entryPrice": 50000,
     "currentPrice": 51000,  // Fetched from market
     "unrealizedPnl": 100,   // (51000 - 50000) * 0.1 = 100
     "unrealizedPnlPercent": 2.0,  // ((51000 - 50000) / 50000) * 100
     "fromCache": false
   }
   ```

3. **Re-call immédiatement**:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/[tradeId]
   ```

4. Vérifie que `fromCache: true` (si Redis configuré).

✅ **Succès**: PnL calculé correctement, cache fonctionne.

### Test 14: Batch Unrealized PnL (Multiple Positions)

**Objectif**: Tester `calculateUnrealizedPnLBatch()` pour plusieurs trades.

**Steps**:

1. **API Call**:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/batch \
     -H "Content-Type: application/json" \
     -d '{"tradeIds": ["trade_1", "trade_2", "trade_3"]}'
   ```

2. **Vérifie la réponse**:
   ```json
   [
     {
       "tradeId": "trade_1",
       "unrealizedPnl": 100,
       "fromCache": false
     },
     {
       "tradeId": "trade_2",
       "unrealizedPnl": -50,
       "fromCache": true
     },
     {
       "tradeId": "trade_3",
       "unrealizedPnl": 200,
       "fromCache": false
     }
   ]
   ```

3. **Vérifications**:
   - Total Unrealized PnL: `100 + (-50) + 200 = 250`
   - Mix de cache hits (true) et fresh calculations (false)

✅ **Succès**: Batch calculation avec cache partiel.

### Test 15: Total Unrealized PnL pour Trader

**Objectif**: Agréger PnL de toutes les positions ouvertes.

**Steps**:

1. **API Call**:
   ```bash
   curl http://localhost:3000/api/pnl/trader/[traderProfileId]
   ```

2. **Vérifie la réponse**:
   ```json
   {
     "totalUnrealizedPnl": 350,
     "openPositionsCount": 5,
     "positivePnlCount": 3,
     "negativePnlCount": 2,
     "positions": [
       { "tradeId": "trade_1", "unrealizedPnl": 100 },
       { "tradeId": "trade_2", "unrealizedPnl": -50 },
       { "tradeId": "trade_3", "unrealizedPnl": 200 },
       { "tradeId": "trade_4", "unrealizedPnl": 150 },
       { "tradeId": "trade_5", "unrealizedPnl": -50 }
     ]
   }
   ```

3. **Calcul Manuel**:
   ```
   Total = 100 + (-50) + 200 + 150 + (-50) = 350 ✅
   Positive = 3 (trade_1, trade_3, trade_4) ✅
   Negative = 2 (trade_2, trade_5) ✅
   ```

✅ **Succès**: Agrégation correcte pour tout le portfolio.

### Test 16: PnL Cache Expiration

**Objectif**: Vérifier que le cache Redis expire après 1 minute.

**Pré-requis**:
- Redis configuré
- Cache TTL = 60 secondes (default)

**Steps**:

1. Appelle PnL:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/[tradeId]
   ```

2. Vérifie:
   ```json
   { "fromCache": false }  // Fresh calculation
   ```

3. **Re-call dans 30 secondes**:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/[tradeId]
   ```

4. Vérifie:
   ```json
   { "fromCache": true }  // Cache hit
   ```

5. **Attends 2 minutes**, puis re-call:
   ```bash
   curl http://localhost:3000/api/pnl/unrealized/[tradeId]
   ```

6. Vérifie:
   ```json
   { "fromCache": false }  // Cache expired, fresh calculation
   ```

✅ **Succès**: Cache expire après 60 secondes.

---

## Tests Automatisés

### Unit Tests (Vitest)

#### Test 17: Run Performance Calculator Tests

**Objectif**: Vérifier les 15 métriques de performance.

```bash
pnpm test __tests__/lib/exchange/performance-calculator.test.ts
```

**Sections testées**:
- ✅ Basic Metrics (winrate, totalTrades)
- ✅ Net PnL (totalProfits, totalLosses)
- ✅ Profit Factor
- ✅ Average Win/Loss
- ✅ Largest Win/Loss
- ✅ Max Drawdown
- ✅ Sharpe Ratio
- ✅ Sortino Ratio
- ✅ Time Period Filtering (LAST_30D, LAST_90D, LAST_365D, ALL_TIME)

**Output attendu**:
```
 ✓ __tests__/lib/exchange/performance-calculator.test.ts (35 tests) 1250ms
   ✓ calculatePerformanceMetrics - Basic Metrics (4)
   ✓ calculatePerformanceMetrics - Net PnL (3)
   ✓ calculatePerformanceMetrics - Profit Factor (3)
   ✓ calculatePerformanceMetrics - Average Win/Loss (3)
   ✓ calculatePerformanceMetrics - Largest Win/Loss (3)
   ✓ calculatePerformanceMetrics - Max Drawdown (3)
   ✓ calculatePerformanceMetrics - Sharpe Ratio (4)
   ✓ calculatePerformanceMetrics - Sortino Ratio (3)
   ✓ calculatePerformanceMetrics - Time Period Filtering (5)
   ✓ calculatePerformanceMetrics - Complete Metrics (1)
   ✓ calculatePerformanceMetrics - Real-world Scenarios (3)

Test Files  1 passed (1)
     Tests  35 passed (35)
```

#### Test 18: Run Encryption Service Tests

```bash
pnpm test __tests__/crypto/encryption-service.test.ts
```

**Vérifie**:
- ✅ AES-256-GCM encryption/decryption
- ✅ IV generation (unique per encryption)
- ✅ Auth tag verification
- ✅ Decryption avec mauvais secret → Error

### E2E Tests (Playwright)

#### Test 19: Run Portfolio Tracking E2E

```bash
pnpm test:e2e e2e/portfolio-tracking.spec.ts
```

**Scénarios testés**:
- ✅ Complete flow: connect → view stats → disconnect
- ✅ Manual sync triggers trade fetching
- ✅ Displays performance stats for all 4 periods
- ✅ Displays 15 performance metrics for PRO users
- ✅ FREE users can only preview winrate + see upgrade CTA
- ✅ FREE users cannot connect exchanges (0 connections limit)
- ✅ Trader becomes verified when connecting first exchange
- ✅ Trader loses verified badge when disconnecting last exchange

**Output attendu**:
```
Running 8 tests using 4 workers

  ✓ 1 portfolio-tracking.spec.ts:10:5 › Portfolio Tracking - Connection Flow › complete flow (15s)
  ✓ 2 portfolio-tracking.spec.ts:106:5 › Portfolio Tracking - Connection Flow › manual sync triggers (3s)
  ✓ 3 portfolio-tracking.spec.ts:156:5 › Portfolio Tracking - Performance Stats › displays performance stats (5s)
  ✓ 4 portfolio-tracking.spec.ts:218:5 › Portfolio Tracking - Performance Stats › displays 15 metrics (4s)
  ✓ 5 portfolio-tracking.spec.ts:273:5 › Portfolio Tracking - Free User Gating › FREE users preview only (6s)
  ✓ 6 portfolio-tracking.spec.ts:338:5 › Portfolio Tracking - Free User Gating › cannot connect exchanges (2s)
  ✓ 7 portfolio-tracking.spec.ts:376:5 › Portfolio Tracking - Verified Badge › becomes verified (4s)
  ✓ 8 portfolio-tracking.spec.ts:430:5 › Portfolio Tracking - Verified Badge › loses verified (5s)

  8 passed (44s)
```

#### Test 20: Run All E2E Tests

Pour tester l'intégralité du système:

```bash
pnpm test:e2e:ci
```

Cela exécute tous les tests E2E (20+ fichiers):
- ✅ Signup / Login / Password Reset
- ✅ Trader Profile Creation
- ✅ Signal Creation & Expiration
- ✅ Follow/Unfollow
- ✅ Crypto Checkout
- ✅ Subscription Activation
- ✅ Portfolio Tracking
- ✅ Signals Feed Filters
- ✅ Plan Limits

---

## Scénarios Complexes

### Scénario 1: Mixed Fills (BUY + SELL dans même session)

**Contexte**: Un trader scalpe BTCUSDT avec multiples entrées/sorties.

**Fills**:
```
10:00 - BUY 0.5 BTC @ 50000 (entry)
10:05 - BUY 0.5 BTC @ 49800 (add to position)
10:10 - SELL 0.3 BTC @ 50500 (partial close)
10:15 - SELL 0.7 BTC @ 50600 (full close)
```

**Résultat Attendu**:

```json
{
  "status": "CLOSED",
  "side": "BUY",  // Session is BUY-initiated
  "totalQuantity": 1.0,  // max(totalBuys=1.0, totalSells=1.0)
  "averageEntry": 49900,  // (50000*0.5 + 49800*0.5) / 1.0
  "averageExit": 50560,   // (50500*0.3 + 50600*0.7) / 1.0
  "realizedPnl": 660,     // (50560 - 49900) * 1.0
  "openedAt": "2025-11-01T10:00:00Z",
  "closedAt": "2025-11-01T10:15:00Z"
}
```

**Test**:

1. Insert les fills dans `ExchangeTrade`
2. Run aggregation
3. Vérifie le `TraderTrade` créé

✅ **Succès**: Session détectée, PnL calculé avec weighted averages.

### Scénario 2: Opposite Fills (BUY session puis SELL session)

**Contexte**: Trader close un LONG puis ouvre un SHORT.

**Fills**:
```
Day 1:
10:00 - BUY 1.0 BTC @ 50000
11:00 - SELL 1.0 BTC @ 51000  (closes LONG)

Day 2:
14:00 - SELL 1.0 BTC @ 52000  (opens SHORT)
15:00 - BUY 1.0 BTC @ 51500   (closes SHORT)
```

**Résultat Attendu**: **2 TraderTrade** (pas 1!)

```json
[
  {
    "id": "trade_1",
    "side": "BUY",
    "status": "CLOSED",
    "totalQuantity": 1.0,
    "realizedPnl": 1000  // (51000 - 50000) * 1.0
  },
  {
    "id": "trade_2",
    "side": "SELL",
    "status": "CLOSED",
    "totalQuantity": 1.0,
    "realizedPnl": 500  // (52000 - 51500) * 1.0
  }
]
```

**Avant le fix (bug #4)**: Les fills auraient pu fusionner en 1 TraderTrade incorrect.

**Test**:

1. Insert fills
2. Run aggregation
3. Vérifie `COUNT(*) = 2` dans `TraderTrade`
4. Vérifie `side` différents (BUY vs SELL)

✅ **Succès**: Sessions séparées, pas de fusion BUY/SELL.

### Scénario 3: Decryption Failure Recovery

**Contexte**: User a changé `ENCRYPTION_SECRET` par erreur.

**Steps Recovery**:

1. **Détection**:
   - User reçoit email: "⚠️ Échec de synchronisation BINANCE"
   - Error: "Data integrity check failed"

2. **Diagnostic**:
   ```bash
   npx tsx scripts/verify-encryption.ts
   ```

   Output:
   ```
   🔓 Decryption: ❌ FAILED
      💡 ENCRYPTION_SECRET changed - reconnect exchange
   ```

3. **Fix**:
   - User navigue vers `/orgs/[orgSlug]/account/exchanges`
   - Clique "Disconnect" sur Binance
   - Reconnecte avec les mêmes API keys (ré-encrypte avec nouveau secret)

4. **Vérification**:
   ```bash
   npx tsx scripts/verify-encryption.ts
   ```

   Output:
   ```
   🔓 Decryption: ✅ SUCCESS (key length: 64)
   ```

✅ **Succès**: Connection rétablie après changement de secret.

### Scénario 4: Multiple Exchanges (Binance + Bybit)

**Contexte**: Trader ULTRA avec 2 exchanges connectés.

**Setup**:

1. Connecte Binance (voir Test 5)
2. Connecte Bybit:
   - API Key: `bybit_testnet_key`
   - Secret: `bybit_testnet_secret`

**Fill Aggregation**:

- Binance trades → `TraderTrade` avec `source: "BINANCE"`
- Bybit trades → `TraderTrade` avec `source: "BYBIT"`

**Performance Metrics**:

Calcul global combine les 2 exchanges:

```typescript
const binanceTrades = await prisma.traderTrade.findMany({
  where: { traderProfileId, source: "BINANCE" }
});

const bybitTrades = await prisma.traderTrade.findMany({
  where: { traderProfileId, source: "BYBIT" }
});

const allTrades = [...binanceTrades, ...bybitTrades];
const metrics = calculatePerformanceMetrics(allTrades, "ALL_TIME");
```

**Résultat**: 1 dashboard unifié avec métriques multi-exchanges.

✅ **Succès**: Multi-exchange tracking fonctionne.

---

## Troubleshooting

### Issue 1: "Data integrity check failed"

**Symptôme**:
```
Error: Decryption failed: Data integrity check failed (possible tampering)
```

**Causes**:
1. `ENCRYPTION_SECRET` a changé depuis l'encryption
2. Encrypted data/IV/tag corrompu dans DB
3. Wrong environment (dev secret sur prod data)

**Diagnostic**:
```bash
npx tsx scripts/verify-encryption.ts
```

**Fix**:
1. Si secret a changé: Reconnecte l'exchange (re-encrypte avec nouveau secret)
2. Si data corrompu: Delete connection et reconnecte
3. Si wrong env: Utilise le bon `ENCRYPTION_SECRET`

### Issue 2: "totalQuantity = 0 pour trades fermés"

**Symptôme**: Trades CLOSED ont `totalQuantity: 0` dans DB.

**Cause**: Bug fix #2 pas appliqué (utilise `abs(netQuantity)` au lieu de `max(totalBuys, totalSells)`).

**Fix**: Upgrade vers version avec `calculatePositionSize()` fonction (commit: XXX).

**Vérification**:
```bash
grep -n "calculatePositionSize" src/lib/trading/fill-aggregation.service.ts
```

Devrait retourner lignes 37-53.

### Issue 3: "BUY et SELL fusionnés en 1 trade"

**Symptôme**: TraderTrade combine des fills BUY et SELL dans une session incorrecte.

**Cause**: Bug fix #4 pas appliqué (pas de check `side` dans `findMatchingTraderTrade`).

**Fix**: Vérifie ligne 225 dans `fill-aggregation.service.ts`:

```typescript
where: {
  traderProfileId,
  symbol: session.symbol,
  instrumentType: session.instrumentType,
  side: session.side,  // ✅ DOIT être présent!
  status: { in: ["OPEN", "PARTIAL"] },
}
```

**Vérification**:
```bash
grep -A 5 "findMatchingTraderTrade" src/lib/trading/fill-aggregation.service.ts | grep "side:"
```

Devrait afficher: `side: session.side,`

### Issue 4: "takeProfits not an array"

**Symptôme**:
```
TypeError: takeProfits.map is not a function
```

**Cause**: `takeProfit` stocké en DB est `null` ou pas parsé correctement.

**Fix**: Utilise `parseTakeProfits()` helper:

```typescript
import { parseTakeProfits } from "@/lib/trading/types";

const trade = await prisma.traderTrade.findUnique({ where: { id } });
const tps = parseTakeProfits(trade.takeProfit);  // ✅ Always returns TakeProfitLevel[] | null
```

### Issue 5: "Redis connection refused"

**Symptôme**:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Cause**: Redis pas running (cache UnrealizedPnL).

**Fix (option 1 - Start Redis)**:
```bash
brew services start redis
```

**Fix (option 2 - Disable Redis)**:
Remove `REDIS_URL` from `.env.local` → système fonctionne sans cache.

**Vérification**:
```typescript
// UnrealizedPnL service gracefully handles missing Redis
if (!redisClient) {
  logger.warn("Redis not available, PnL will not be cached");
  return calculateFresh();  // ✅ Works without cache
}
```

### Issue 6: "Email route 404"

**Symptôme**: Clic sur "Voir mes exchanges" dans email → 404.

**Cause**: Email template utilise `/orgs/account/exchanges` au lieu de `/orgs/[orgSlug]/account/exchanges`.

**Fix**: Vérifie `emails/exchange-sync-failure.tsx` ligne 34-36:

```typescript
const exchangesUrl = orgSlug
  ? `${SiteConfig.prodUrl}/orgs/${orgSlug}/account/exchanges`
  : `${SiteConfig.prodUrl}/login`;  // Fallback
```

**Vérification**: Vérifie que `orgSlug` est passé en prop (ligne 17):

```typescript
type ExchangeSyncFailureEmailProps = {
  orgSlug: string | null;  // ✅ DOIT être présent
  // ...
};
```

---

## Commandes Utiles

### Database

```bash
# Vérifier status migrations
npx prisma migrate status

# Appliquer migrations
npx prisma migrate deploy

# Générer client Prisma
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio

# Seed database
pnpm prisma:seed
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm test

# Run specific test file
pnpm test __tests__/lib/exchange/performance-calculator.test.ts

# Run E2E tests (Playwright)
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e e2e/portfolio-tracking.spec.ts

# Run E2E in UI mode (debug)
pnpm test:e2e:ui
```

### Diagnostics

```bash
# Vérifier encryption setup
npx tsx scripts/verify-encryption.ts

# Run fill aggregation (manual)
npx tsx scripts/aggregate-fills.ts --traderId=trader_123

# Check Redis connection
redis-cli ping
```

### Development

```bash
# Start dev server
pnpm dev

# Type check
pnpm ts

# Lint
pnpm lint

# Clean (lint + type check + format)
pnpm clean
```

---

## Checklist Pré-Production

Avant de déployer en production:

- [ ] Toutes les migrations appliquées (`npx prisma migrate status`)
- [ ] `ENCRYPTION_SECRET` configuré et **jamais changé** en prod
- [ ] Binance/Bybit API keys MAINNET (pas testnet)
- [ ] `CRYPTO_NETWORK="mainnet"` (pas "testnet")
- [ ] Cron job configuré dans `vercel.json` avec `CRON_SECRET`
- [ ] Redis configuré (optionnel mais recommandé pour cache PnL)
- [ ] Resend API key configuré (pour email notifications)
- [ ] Discord webhook configuré (optionnel)
- [ ] Tests E2E passent (`pnpm test:e2e:ci`)
- [ ] Tests unitaires passent (`pnpm test:ci`)
- [ ] Encryption diagnostic passe (`npx tsx scripts/verify-encryption.ts`)

---

## Support

**Questions?** Check:
- [`.claude/CLAUDE.md`](../CLAUDE.md) - Instructions principales
- [`.claude/docs/TRADING-SYSTEM.md`](./TRADING-SYSTEM.md) - Détails système trading
- [`.claude/docs/DATABASE.md`](./DATABASE.md) - Schémas DB + relations
- [`.claude/docs/CRYPTO-PAYMENTS.md`](./CRYPTO-PAYMENTS.md) - HD wallet + encryption

**Bugs?** Ouvre une issue GitHub avec:
- Steps to reproduce
- Expected vs actual behavior
- Logs / screenshots
- Environnement (dev/prod, Node version, etc.)

---

## Tests Copy Trading avec Binance

### 📋 Vue d'ensemble

Le système de Copy Trading permet aux utilisateurs de répliquer les trades des traders qu'ils suivent, soit manuellement (journal), soit automatiquement (exécution via API).

**Modes disponibles**:
- **MANUAL**: User copie le signal dans son journal personnel, track entry/exit manuellement
- **AUTO**: Exécution automatique via l'API Binance/Bybit de l'utilisateur

**Tests à effectuer**:
1. Copy Trading MANUAL (SPOT)
2. Copy Trading AUTO (SPOT)
3. Copy Trading FUTURES (avec leverage)
4. Circuit Breakers (sécurité)

---

### Setup Binance Testnet

#### Étape 1: Créer un Compte Testnet

1. Va sur https://testnet.binance.vision/
2. Connecte-toi avec GitHub
3. Note ton UID Testnet

#### Étape 2: Générer API Keys

**Pour le Trader** (READ + WRITE):
1. Dashboard → API Management
2. Create API Key → Label: "Trader Test"
3. Permissions:
   - ✅ Enable Spot & Margin Trading
   - ✅ Enable Futures
   - ❌ Enable Withdrawals (pas nécessaire)
4. Copie API Key + Secret Key
5. Whitelist IP (optionnel, recommandé: ton IP publique)

**Pour l'User** (READ + WRITE):
1. Même processus, Label: "User Test"
2. Permissions identiques au trader

#### Étape 3: Variables d'Environnement

Ajoute dans `.env.local`:

```bash
# Encryption
ENCRYPTION_SECRET="$(openssl rand -hex 32)"

# Trader connection
BINANCE_TRADER_API_KEY="trader_testnet_api_key"
BINANCE_TRADER_SECRET="trader_testnet_secret"

# User connection (pour copy trading)
BINANCE_USER_API_KEY="user_testnet_api_key"
BINANCE_USER_SECRET="user_testnet_secret"

# Database
DATABASE_URL="postgresql://..."
```

#### Étape 4: Seed Database

```bash
# Créer un trader profile
npx prisma studio

# Ajouter manuellement:
# 1. User (trader) avec planName="ultra", role="TRADER"
# 2. TraderProfile pour ce user, verified=true
# 3. User (follower) avec planName="pro"
# 4. Follow relation: followerId=user2, traderId=user1, status="ACTIVE"
```

---

### Test 1: Copy Trading MANUAL (SPOT)

**Objectif**: Copier un signal dans le journal personnel sans exécution automatique

#### Steps

**1. Trader crée un signal**:

Navigue vers `/orgs/[orgSlug]/dashboard/trader/signals/new` et crée un signal:
- Symbol: `BTC/USDT`
- Side: `LONG`
- Entry Price: `50000`
- Stop Loss: `48000`
- Take Profit 1: `52000` (50%)
- Take Profit 2: `54000` (50%)
- Confidence: HIGH
- Risk: MEDIUM

**2. User voit le signal dans son feed**:

Navigue vers `/orgs/[orgSlug]/dashboard`:
- Le signal doit apparaître dans le feed
- Bouton "Copy" visible si user est PRO/ULTRA

**3. User clique "Copy"**:

Le `CopyTradeDialog` s'ouvre:
- Choix du mode: MANUAL ou AUTO
- Sélectionne **MANUAL**
- Entry price pré-rempli: `50000`
- Quantité: User peut ajuster (ex: `0.01 BTC`)
- Click "Copy to Journal"

**4. Vérifications DB** (Prisma Studio):

```sql
SELECT * FROM "CopyTrade"
WHERE userId = 'user_id'
AND originalTradeId = 'signal.linkedTradeId';

-- Devrait afficher:
{
  "id": "copy_xxx",
  "userId": "user_xxx",
  "originalTradeId": "trade_xxx",
  "mode": "MANUAL",
  "status": "PENDING",
  "manualEntry": 50000,
  "manualExit": null,
  "manualPnl": null,
  "notes": "",
  "stopLoss": 48000,
  "takeProfit": [
    {"price": 52000, "percentage": 50, "hit": false},
    {"price": 54000, "percentage": 50, "hit": false}
  ]
}
```

**5. User ferme manuellement le trade**:

User navigue vers son journal → Edit copy trade:
- Set `manualExit`: `52000`
- `manualPnl` calculé automatiquement: `(52000 - 50000) * 0.01 = 20 USD`
- Status → `CLOSED`

**Résultat attendu**:
✅ CopyTrade créé en mode MANUAL
✅ User track son trade manuellement
✅ Aucune exécution réelle sur Binance
✅ PnL calculé correctement

---

### Test 2: Copy Trading AUTO (SPOT)

**Objectif**: Exécution automatique du copy sur l'exchange de l'utilisateur

#### Steps

**1. User connecte son API Binance**:

```typescript
POST /api/user-exchange/connect
{
  "exchange": "BINANCE",
  "apiKey": "user_testnet_api_key",
  "secretKey": "user_testnet_secret",
  "mode": "AUTO"
}
```

**2. Validation backend**:

Le service `UserExchangeConnectionService` :
- Encrypt les keys (AES-256-GCM)
- Test credentials avec `validateApiKeys()`
- Store dans DB avec `isActive = true`

Vérifications DB:

```sql
SELECT * FROM "UserExchangeConnection" WHERE userId = 'user_id';

-- Devrait afficher:
{
  "exchange": "BINANCE",
  "encryptedApiKey": "hex_encrypted...",
  "encryptedSecretKey": "hex_encrypted...",
  "keyIv": "hex_iv...",
  "keyTag": "hex_tag...",
  "mode": "AUTO",
  "isActive": true
}
```

**3. Trader crée un signal** (identique au Test 1)

**4. Auto-execution**:

Le `CopyTradeService` détecte le nouveau signal et exécute:

```typescript
// Backend automatique
const userConnection = await getUserConnectionForExchange(userId, 'BINANCE');
const decryptedCreds = await getDecryptedCredentials(userConnection);

// Create Binance order
const exchange = new ccxt.binance({
  apiKey: decryptedCreds.apiKey,
  secret: decryptedCreds.secretKey,
});

const order = await exchange.createMarketBuyOrder(
  'BTC/USDT',
  quantity
);
```

**5. Vérifications DB**:

```sql
SELECT * FROM "CopyTrade" WHERE mode = 'AUTO';

-- Devrait afficher:
{
  "mode": "AUTO",
  "status": "EXECUTED",
  "executedPrice": 50005.5,  // Prix réel Binance
  "executedQuantity": 0.01,
  "slippage": 5.5,           // Différence avec signal (50005.5 - 50000)
  "exchangeOrderId": "28457", // Binance order ID
  "executedAt": "2025-11-04T10:00:00Z"
}
```

**6. Vérification Binance Testnet**:

Dashboard Binance Testnet → Orders History:
- Devrait afficher l'ordre BUY exécuté
- Symbol: BTC/USDT
- Quantity: 0.01
- Status: FILLED

**7. Trader close le trade**:

Trader ferme son `TraderTrade` → Trigger automatique:

```typescript
// Backend
await closeOriginalTradeCopies(traderTrade.id, averageExit);

// Execute SELL order pour user
const sellOrder = await exchange.createMarketSellOrder(
  'BTC/USDT',
  executedQuantity
);
```

**8. Vérifications finales**:

```sql
SELECT * FROM "CopyTrade" WHERE id = 'copy_xxx';

-- Devrait afficher:
{
  "status": "CLOSED",
  "manualExit": 52000,
  "manualPnl": 194.5,  // (52000 - 50005.5) * 0.01 = 19.945 - fees
  "closedAt": "2025-11-04T11:00:00Z"
}
```

**Résultat attendu**:
✅ Ordre BUY exécuté automatiquement sur Binance user
✅ CopyTrade.status = EXECUTED
✅ Slippage tracked (différence prix signal vs exécution)
✅ Ordre SELL automatique quand trader close
✅ PnL final calculé avec prix réels

---

### Test 3: Copy Trading FUTURES (avec Leverage)

**Objectif**: Tester le copy trading avec effet de levier

#### Différences avec SPOT

**1. Leverage (effet de levier)**:

```typescript
// Signal FUTURES
{
  "instrumentType": "FUTURES",
  "symbol": "BTCUSDT",  // Pas de "/" pour futures
  "leverage": 10,
  "side": "LONG"
}
```

**2. Position Sizing**:

```typescript
// SPOT
const spotQuantity = userCapital / entryPrice;
// Ex: $1000 / $50000 = 0.02 BTC

// FUTURES
const futuresQuantity = (userCapital * leverage) / entryPrice;
// Ex: ($1000 * 10) / $50000 = 0.2 BTC (10x plus grand!)
```

**3. Marginal Requirements**:

```typescript
// Vérifier balance suffisante
const requiredMargin = positionValue / leverage;
const userBalance = await exchange.fetchBalance();

if (userBalance.free['USDT'] < requiredMargin) {
  throw new Error('Insufficient margin');
}
```

**4. Liquidation Price**:

```typescript
// LONG
const liquidationPrice = entryPrice * (1 - 1/leverage);
// Ex: 50000 * (1 - 1/10) = 45000

// SHORT
const liquidationPrice = entryPrice * (1 + 1/leverage);
// Ex: 50000 * (1 + 1/10) = 55000
```

#### Steps Test FUTURES

**1. User connect Binance avec Futures enabled**:

Verify API permissions include Futures trading.

**2. Trader crée signal FUTURES**:

- Symbol: `BTCUSDT`
- Instrument: `FUTURES`
- Leverage: `5x`
- Side: `LONG`
- Entry: `50000`
- Stop Loss: `48000`

**3. Auto-execution sur Binance Futures**:

```typescript
// Backend
const exchange = new ccxt.binance({
  apiKey: decryptedCreds.apiKey,
  secret: decryptedCreds.secretKey,
  options: {
    defaultType: 'future',  // Important!
  }
});

// Set leverage
await exchange.fapiPrivatePostLeverage({
  symbol: 'BTCUSDT',
  leverage: 5,
});

// Open position
const order = await exchange.createMarketBuyOrder(
  'BTC/USDT',
  quantity,
  { reduceOnly: false }
);
```

**4. Vérifier position ouverte**:

```typescript
const positions = await exchange.fetchPositions(['BTC/USDT']);
console.log(positions[0]);

// Devrait afficher:
{
  symbol: 'BTC/USDT',
  side: 'long',
  contracts: 0.2,
  notional: 10000,  // 0.2 * 50000
  leverage: 5,
  entryPrice: 50000,
  markPrice: 50100,
  liquidationPrice: 40000,  // Approximatif avec 5x
  unrealizedPnl: 20,        // (50100 - 50000) * 0.2
}
```

**5. Close position quand trader close**:

```typescript
// Trigger auto
const closeOrder = await exchange.createMarketSellOrder(
  'BTC/USDT',
  position.contracts,
  { reduceOnly: true }  // Important pour Futures!
);
```

**6. Vérifications PnL**:

```sql
SELECT * FROM "CopyTrade" WHERE originalTradeId = 'trade_xxx';

-- PnL avec leverage
{
  "executedPrice": 50000,
  "manualExit": 52000,
  "executedQuantity": 0.2,
  "manualPnl": 400,  // (52000 - 50000) * 0.2 = 400 USD (5x le PnL SPOT!)
  "leverage": 5
}
```

**Résultat attendu**:
✅ Position FUTURES ouverte avec leverage 5x
✅ Quantité 5x plus grande que SPOT
✅ PnL amplifié par le leverage
✅ Liquidation price calculé et tracké
✅ Close avec `reduceOnly: true`

---

### Test 4: Circuit Breakers (Sécurité)

**Objectif**: Vérifier les limites de sécurité pour copy trading

#### Scénario 1: Max Position Size

**Configuration**:

```typescript
// copy-trade.service.ts
const MAX_COPY_VALUE_USD = 1000;  // $1000 max par copy

// Si signal = $5000
const userQuantity = Math.min(
  signalQuantity * copyRatio,
  MAX_COPY_VALUE_USD / entryPrice
);
```

**Test**:

1. Trader crée signal: Entry `50000`, Quantity `0.1 BTC` (= $5000)
2. User copie avec `copyRatio = 1` (100%)
3. Backend calcule: `min(0.1, 1000/50000) = min(0.1, 0.02) = 0.02 BTC`

**Vérifications**:

```sql
SELECT * FROM "CopyTrade" WHERE userId = 'user_id';

-- executedQuantity devrait être 0.02, pas 0.1
{
  "executedQuantity": 0.02,
  "notes": "Position size limited to $1000 max"
}
```

**Résultat attendu**:
✅ Copy refusé si > $1000
✅ Quantity ajustée automatiquement
✅ User notifié de la limitation

#### Scénario 2: Max Daily Trades

**Configuration**:

```typescript
const MAX_DAILY_COPIES = 10;

const todayCopies = await prisma.copyTrade.count({
  where: {
    userId: user.id,
    createdAt: { gte: startOfDay(new Date()) }
  }
});

if (todayCopies >= MAX_DAILY_COPIES) {
  throw new Error('Daily copy limit reached (10/day)');
}
```

**Test**:

1. User copie 10 signaux dans la journée
2. Essaie de copier le 11ème

**Résultat attendu**:
✅ 11ème copy refusé
✅ Error message: "Daily limit reached"
✅ Compteur reset à minuit UTC

#### Scénario 3: Stop Loss Automatique

**Configuration**:

```typescript
// User settings
const userMaxLoss = 500;  // $500 max loss

// Monitorer les copies
const totalLoss = await calculateUserLosses(userId, 'today');

if (totalLoss > userMaxLoss) {
  await disableAutoCopy(userId);
  await sendAlert(user.email, 'Max loss reached: auto-copy disabled');
}
```

**Test**:

1. User active AUTO mode
2. Copy 3 trades qui perdent chacun $200 (total = $600)
3. Backend détecte `$600 > $500`

**Résultat attendu**:
✅ Auto-copy désactivé automatiquement
✅ Email envoyé à l'user
✅ Futures copies en mode MANUAL uniquement

---

### Checklist Tests Copy Trading

#### Setup ✅
- [ ] Binance Testnet account créé
- [ ] API keys générées (trader + user)
- [ ] `.env.local` configuré
- [ ] Database seed (TraderProfile + Follow)

#### Test MANUAL ✅
- [ ] Signal créé par trader
- [ ] Copy button visible pour user PRO
- [ ] CopyTrade créé en mode MANUAL
- [ ] User track entry/exit manuellement
- [ ] PnL calculé correctement

#### Test AUTO SPOT ✅
- [ ] User connecte API Binance
- [ ] Credentials encryptées en DB
- [ ] Signal → ordre BUY automatique
- [ ] Order visible sur Binance Testnet
- [ ] Slippage tracké
- [ ] Trader close → ordre SELL automatique
- [ ] PnL final correct

#### Test FUTURES ✅
- [ ] Signal FUTURES avec leverage
- [ ] Position sizing correct (× leverage)
- [ ] Position ouverte sur Binance Futures
- [ ] Liquidation price calculé
- [ ] PnL amplifié par leverage
- [ ] Close avec `reduceOnly: true`

#### Circuit Breakers ✅
- [ ] Max position size enforced ($1000)
- [ ] Max daily copies enforced (10/day)
- [ ] Stop loss auto-disable
- [ ] Email alerts fonctionnent

---

### Troubleshooting Copy Trading

#### Issue: "Insufficient funds"

**Cause**: User balance insuffisante

**Solution**:
1. Ajoute des fonds Testnet: https://testnet.binance.vision/ → Faucet
2. Vérifie balance: `exchange.fetchBalance()`
3. Ajuste quantity du copy

#### Issue: "Invalid API keys"

**Cause**: Keys incorrectes ou expirées

**Solution**:
1. Regenerate keys sur Binance Testnet
2. Update `.env.local`
3. Reconnecte via `/api/user-exchange/connect`

#### Issue: "Order would trigger immediately"

**Cause**: Prix marché trop proche du stop loss

**Solution**:
1. Ajuste stop loss du signal
2. Ou: ignore stop loss pour ce copy

#### Issue: "Leverage not set"

**Cause**: Leverage pas configuré pour Futures

**Solution**:
```typescript
await exchange.fapiPrivatePostLeverage({
  symbol: 'BTCUSDT',
  leverage: 5,
});
```

---

## 🔗 Ressources Additionnelles

**Binance Testnet**:
- Dashboard: https://testnet.binance.vision/
- API Docs: https://binance-docs.github.io/apidocs/spot/en/
- Futures Docs: https://binance-docs.github.io/apidocs/futures/en/

**CCXT Documentation**:
- Main docs: https://docs.ccxt.com/
- Binance methods: https://docs.ccxt.com/en/latest/manual.html#binance

**Encryption Reference**:
- AES-256-GCM: Voir `src/lib/crypto/encryption-service.ts`
- Key management: `.claude/docs/CRYPTO-PAYMENTS.md`

---

**End of Unified Trading System Testing Guide** 🎯
