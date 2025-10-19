# Exchange Portfolio Tracking & Verified Stats - MyCryptoPilot

**Dernière mise à jour**: 19 octobre 2025
**Statut**: 📋 Planification (Issue GitHub à créer)
**Complexité**: 🔴 Élevée (10 semaines, feature majeure)
**Impact Business**: 💰 +60% revenue estimé

---

## 📋 Table des Matières

1. [Vision Stratégique](#vision-stratégique)
2. [Proposition de Valeur](#proposition-de-valeur)
3. [Architecture Technique](#architecture-technique)
4. [UI/UX Features](#uiux-features)
5. [Monétisation](#monétisation)
6. [Analytics Uniques](#analytics-uniques)
7. [Roadmap Implémentation](#roadmap-implémentation)
8. [Risques & Mitigation](#risques--mitigation)
9. [Recommandations](#recommandations)

---

## 🎯 Vision Stratégique

### Contexte

Actuellement, les traders sur MyCryptoPilot créent manuellement leurs signaux et self-reportent leurs statistiques. Cela crée plusieurs problèmes:

**Problèmes identifiés:**
- ❌ Stats non vérifiables (trust issues)
- ❌ Effort manuel important (friction)
- ❌ Pas de preuve on-chain
- ❌ Difficile de comparer traders objectivement
- ❌ Risk de fraude (fake stats)

### Solution Proposée

**Exchange Portfolio Tracking**: Connexion read-only aux exchanges (Binance, Bybit) pour import automatique des trades et génération de stats vérifiées.

**AVANT** (système actuel):
```
Trader → Crée signal manuellement → Paste screenshot chart
                                   ↓
                              Stats manuelles
                              (self-reported)
```

**APRÈS** (avec tracking):
```
Trader → Trade sur Binance/Bybit → Auto-sync MyCryptoPilot
                                   ↓
                            Stats vérifiées ✓
                            Preuves on-chain ✓
                            Analytics auto ✓
```

### Différenciation vs Concurrents

**3Commas/Wundertrading**: Focus automation, UI complexe
**MyCryptoPilot**: Focus social proof + simplicity + transparency

**Nos Unique Value Props:**
1. **Social Trading Context**: Stats pas juste pour le trader, mais pour prouver crédibilité aux followers
2. **Signal Correlation**: Compare signaux publiés vs trades réels (unique!)
3. **Verified Trader Program**: Badge trust automatique basé sur volume/consistency
4. **Educational Focus**: Users apprennent en analysant trades de winners vérifiés

---

## 💡 Proposition de Valeur

### Pour les Traders

#### 1. Trading Journal Automatique
```
✅ Plus de saisie manuelle
✅ Import trades temps réel (ou toutes les 5min)
✅ Analytics avancées automatiques (Sharpe, Sortino, MDD)
✅ Tax reports automatiques (export CSV)
✅ Performance tracking vs BTC benchmark
```

**Bénéfice**: Économie de 2-3h/semaine de journaling manuel

#### 2. Social Proof Automatique
```
✅ Winrate vérifié on-chain
✅ Badge "Verified Stats" ✓
✅ Transparence totale pour followers
✅ Confiance maximale = plus de followers
```

**Bénéfice**: +40% followers estimé (trust factor)

#### 3. Dashboard Pro-Grade
```
✅ Equity curve real-time
✅ Risk metrics live (Sharpe, Sortino, MDD)
✅ Best/Worst trades highlights
✅ Correlations multi-assets
✅ Trading hours heatmap
```

**Bénéfice**: Insights pour améliorer performance

### Pour les Users (Followers)

#### 1. Transparence Totale
```
✅ Voir les VRAIS trades du trader
✅ Stats impossibles à falsifier
✅ Performance history complète
✅ Drawdowns visibles (risk transparency)
```

**Bénéfice**: Décisions informées, zéro bullshit

#### 2. Better Trader Selection
```
✅ Comparer traders avec vraies metrics
✅ Voir corrélation signaux vs trades réels
✅ Identifier les meilleurs moments pour follow
✅ Risk assessment précis avant de follow
```

**Bénéfice**: ROI followers amélioré

#### 3. Educational Value
```
✅ Étudier les setups gagnants des pros
✅ Analyser leurs exits (TP/SL management)
✅ Comprendre leur risk management
✅ Learn by example concret
```

**Bénéfice**: Amélioration compétences trading

---

## 🏗️ Architecture Technique

### Stack Technologique

**APIs Exchange:**
- Binance: REST API v3 (Spot) + Futures API v1
- Bybit: V5 Unified Trading Account API

**Backend:**
- Node.js + TypeScript
- Prisma ORM
- Cron jobs (BullMQ ou node-cron)
- Encryption: crypto module (AES-256-GCM)

**Frontend:**
- React components (existing stack)
- Recharts pour visualizations
- TanStack Query pour data fetching

### Modèles de Données

#### 1. ExchangeConnection

Stocke les connexions API des traders à leurs exchanges.

```prisma
model ExchangeConnection {
  id            String          @id @default(cuid())
  userId        String
  exchange      ExchangeType    // BINANCE, BYBIT

  // API Keys (ENCRYPTED!)
  apiKey        String          @encrypted // ⚠️ AES-256-GCM encryption
  apiSecret     String          @encrypted

  // Métadonnées
  label         String?         // "Mon compte principal"

  // Permissions (read-only strict!)
  canReadSpot      Boolean      @default(true)
  canReadFutures   Boolean      @default(true)
  canTrade         Boolean      @default(false) // ❌ JAMAIS activé

  // Sync status
  isActive         Boolean      @default(true)
  lastSyncAt       DateTime?
  lastSyncError    String?
  syncIntervalMin  Int          @default(5) // 5 minutes pour Free/Pro, 1 min pour Ultra

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  // Relations
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades           ExchangeTrade[]

  @@unique([userId, exchange])
  @@index([userId])
  @@index([isActive])
  @@map("exchange_connection")
}

enum ExchangeType {
  BINANCE
  BYBIT
}
```

**Notes importantes:**
- ⚠️ **Encryption obligatoire**: API keys/secrets JAMAIS en clair dans DB
- ⚠️ **Read-only strict**: `canTrade` toujours `false` (zéro risque)
- ⚠️ **Un exchange par user**: `@@unique([userId, exchange])`

#### 2. ExchangeTrade

Stocke tous les trades importés depuis les exchanges.

```prisma
model ExchangeTrade {
  id                String          @id @default(cuid())
  connectionId      String

  // Trade identification
  exchange          ExchangeType
  symbol            String          // "BTCUSDT", "ETHUSDT"
  category          TradeCategory   // SPOT, FUTURES, MARGIN

  // Order details
  side              TradeSide       // BUY, SELL
  type              OrderType       // MARKET, LIMIT, STOP_MARKET, etc.

  // Prices & Quantities (precision Decimal pour crypto)
  entryPrice        Decimal         @db.Decimal(18, 8)
  exitPrice         Decimal?        @db.Decimal(18, 8)
  quantity          Decimal         @db.Decimal(18, 8)
  quoteQuantity     Decimal         @db.Decimal(18, 8) // En USDT généralement

  // Futures specific
  leverage          Int?
  positionSide      String?         // "LONG", "SHORT" (Binance hedge mode)

  // P&L calculations
  realizedPnl       Decimal?        @db.Decimal(18, 4)
  realizedPnlPercent Decimal?       @db.Decimal(8, 4)
  fees              Decimal?        @db.Decimal(18, 8)

  // Status & Lifecycle
  status            TradeStatus     // OPEN, CLOSED, CANCELLED, REJECTED
  openedAt          DateTime
  closedAt          DateTime?

  // Exchange references (pour idempotence)
  externalOrderId   String          // Binance/Bybit order ID
  externalTradeId   String?         // Binance/Bybit trade ID

  // Analytics calculés (cache)
  holdingTimeHours  Int?            // Durée du trade
  riskRewardRatio   Decimal?        @db.Decimal(8, 4) // RR ratio

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Relations
  connection        ExchangeConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@unique([connectionId, externalOrderId])
  @@index([connectionId, status])
  @@index([symbol])
  @@index([openedAt])
  @@index([closedAt])
  @@map("exchange_trade")
}

enum TradeSide {
  BUY
  SELL
}

enum OrderType {
  MARKET
  LIMIT
  STOP_MARKET
  STOP_LIMIT
  TAKE_PROFIT_MARKET
  TAKE_PROFIT_LIMIT
  TRAILING_STOP_MARKET
}

enum TradeCategory {
  SPOT
  FUTURES
  MARGIN
}

enum TradeStatus {
  OPEN
  CLOSED
  CANCELLED
  REJECTED
  EXPIRED
}
```

**Notes:**
- ⚠️ **Idempotence**: `@@unique([connectionId, externalOrderId])` évite doublons
- ⚠️ **Precision**: Decimal pour montants crypto (float = erreurs arrondis)
- 📊 **Analytics cache**: RR ratio, holding time calculés et stockés

#### 3. TraderPerformanceSnapshot

Stats précalculées par période pour performance (évite calculs lourds à chaque requête).

```prisma
model TraderPerformanceSnapshot {
  id                String      @id @default(cuid())
  userId            String
  exchange          ExchangeType

  // Période
  period            Period      // DAY, WEEK, MONTH, QUARTER, YEAR, ALL_TIME
  periodStart       DateTime
  periodEnd         DateTime

  // Stats globales
  totalTrades       Int         @default(0)
  winningTrades     Int         @default(0)
  losingTrades      Int         @default(0)
  breakEvenTrades   Int         @default(0)
  winRate           Decimal     @db.Decimal(5, 2) // 68.50%

  // P&L
  totalPnl          Decimal     @db.Decimal(18, 4)
  totalPnlPercent   Decimal     @db.Decimal(8, 4)
  bestTrade         Decimal?    @db.Decimal(18, 4)
  worstTrade        Decimal?    @db.Decimal(18, 4)

  // Risk metrics (pro-grade)
  profitFactor      Decimal?    @db.Decimal(8, 4) // Gross profit / Gross loss
  sharpeRatio       Decimal?    @db.Decimal(8, 4) // Annualisé
  sortinoRatio      Decimal?    @db.Decimal(8, 4) // Sharpe mais downside deviation only
  maxDrawdown       Decimal?    @db.Decimal(18, 4) // Valeur absolue
  maxDrawdownPercent Decimal?   @db.Decimal(8, 4) // Pourcentage
  calmarRatio       Decimal?    @db.Decimal(8, 4) // Annual return / Max DD

  // Moyennes
  avgWinSize        Decimal?    @db.Decimal(18, 4)
  avgLossSize       Decimal?    @db.Decimal(18, 4)
  avgRR             Decimal?    @db.Decimal(8, 4) // Risk-Reward ratio moyen
  avgHoldingHours   Decimal?    @db.Decimal(8, 2)

  // Volume & Fees
  totalVolume       Decimal     @db.Decimal(18, 2) // En USD
  totalFees         Decimal?    @db.Decimal(18, 4)

  // Metadata
  calculatedAt      DateTime    @default(now())

  // Relations
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, exchange, period, periodStart])
  @@index([userId, period])
  @@index([calculatedAt])
  @@map("trader_performance_snapshot")
}

enum Period {
  DAY
  WEEK
  MONTH
  QUARTER
  YEAR
  ALL_TIME
}
```

**Notes:**
- 📊 **Cache intelligent**: Recalculé seulement quand nouveaux trades
- ⚡ **Performance**: Requêtes ultra-rapides (pas de calculs runtime)
- 📈 **Metrics pro**: Sharpe, Sortino, Calmar pour traders sérieux

### Services Backend

#### 1. ExchangeService - Abstraction multi-exchange

Interface commune pour tous les exchanges, facilite ajout futurs exchanges.

```typescript
// src/lib/exchange/exchange-service.ts

export interface IExchangeService {
  /**
   * Validate API keys (test connection)
   */
  validateApiKeys(apiKey: string, apiSecret: string): Promise<{
    valid: boolean
    permissions: {
      spot: boolean
      futures: boolean
      canTrade: boolean
    }
    error?: string
  }>

  /**
   * Fetch trades history
   */
  getTradesHistory(params: {
    apiKey: string
    apiSecret: string
    symbol?: string
    category?: 'SPOT' | 'FUTURES'
    startTime?: Date
    endTime?: Date
    limit?: number
  }): Promise<ExchangeTrade[]>

  /**
   * Get open positions (Futures only)
   */
  getOpenPositions(params: {
    apiKey: string
    apiSecret: string
  }): Promise<Position[]>

  /**
   * Get account info (balance, permissions)
   */
  getAccountInfo(params: {
    apiKey: string
    apiSecret: string
  }): Promise<AccountInfo>
}

/**
 * Binance implementation
 */
export class BinanceService implements IExchangeService {
  private spotClient: Spot
  private futuresClient: USDMClient

  constructor() {
    this.spotClient = new Spot()
    this.futuresClient = new USDMClient()
  }

  async validateApiKeys(apiKey: string, apiSecret: string) {
    try {
      const client = new Spot(apiKey, apiSecret)
      const account = await client.account()

      // Check permissions
      const permissions = {
        spot: account.permissions.includes('SPOT'),
        futures: account.permissions.includes('FUTURES'),
        canTrade: account.permissions.includes('TRADE')
      }

      return { valid: true, permissions }
    } catch (error) {
      return {
        valid: false,
        permissions: { spot: false, futures: false, canTrade: false },
        error: error.message
      }
    }
  }

  async getTradesHistory(params) {
    const { apiKey, apiSecret, symbol, category, startTime, endTime, limit = 1000 } = params

    if (category === 'SPOT' || !category) {
      // Spot trades
      const client = new Spot(apiKey, apiSecret)
      const trades = await client.myTrades(symbol, {
        startTime: startTime?.getTime(),
        endTime: endTime?.getTime(),
        limit
      })

      return trades.map(this.mapSpotTrade)
    }

    if (category === 'FUTURES') {
      // Futures trades
      const client = new USDMClient({ api_key: apiKey, api_secret: apiSecret })
      const trades = await client.getUserTrades({
        symbol,
        startTime: startTime?.getTime(),
        endTime: endTime?.getTime(),
        limit
      })

      return trades.map(this.mapFuturesTrade)
    }
  }

  private mapSpotTrade(trade: BinanceSpotTrade): ExchangeTrade {
    return {
      exchange: 'BINANCE',
      symbol: trade.symbol,
      category: 'SPOT',
      side: trade.isBuyer ? 'BUY' : 'SELL',
      type: 'MARKET', // Binance ne retourne pas le type dans myTrades
      entryPrice: parseFloat(trade.price),
      quantity: parseFloat(trade.qty),
      quoteQuantity: parseFloat(trade.quoteQty),
      fees: parseFloat(trade.commission),
      status: 'CLOSED',
      openedAt: new Date(trade.time),
      closedAt: new Date(trade.time),
      externalOrderId: trade.orderId.toString(),
      externalTradeId: trade.id.toString()
    }
  }

  private mapFuturesTrade(trade: BinanceFuturesTrade): ExchangeTrade {
    return {
      exchange: 'BINANCE',
      symbol: trade.symbol,
      category: 'FUTURES',
      side: trade.side === 'BUY' ? 'BUY' : 'SELL',
      type: trade.type as OrderType,
      entryPrice: parseFloat(trade.price),
      quantity: parseFloat(trade.qty),
      quoteQuantity: parseFloat(trade.quoteQty),
      leverage: null, // Pas disponible dans trade history
      positionSide: trade.positionSide,
      realizedPnl: parseFloat(trade.realizedPnl),
      fees: parseFloat(trade.commission),
      status: 'CLOSED',
      openedAt: new Date(trade.time),
      closedAt: new Date(trade.time),
      externalOrderId: trade.orderId.toString(),
      externalTradeId: trade.id.toString()
    }
  }
}

/**
 * Bybit implementation
 */
export class BybitService implements IExchangeService {
  private client: RestClientV5

  constructor() {
    this.client = new RestClientV5()
  }

  async validateApiKeys(apiKey: string, apiSecret: string) {
    try {
      const client = new RestClientV5({ key: apiKey, secret: apiSecret })
      const { result } = await client.getWalletBalance({ accountType: 'UNIFIED' })

      return {
        valid: true,
        permissions: {
          spot: true, // Unified account
          futures: true,
          canTrade: false // On check jamais les perms trade
        }
      }
    } catch (error) {
      return {
        valid: false,
        permissions: { spot: false, futures: false, canTrade: false },
        error: error.message
      }
    }
  }

  async getTradesHistory(params) {
    const { apiKey, apiSecret, symbol, category, startTime, endTime, limit = 1000 } = params

    const client = new RestClientV5({ key: apiKey, secret: apiSecret })

    const { result } = await client.getHistoricOrders({
      category: category === 'SPOT' ? 'spot' : 'linear', // USDT perp
      symbol,
      startTime: startTime?.getTime(),
      endTime: endTime?.getTime(),
      limit
    })

    return result.list.map(this.mapBybitTrade)
  }

  private mapBybitTrade(trade: BybitTrade): ExchangeTrade {
    return {
      exchange: 'BYBIT',
      symbol: trade.symbol,
      category: trade.category === 'spot' ? 'SPOT' : 'FUTURES',
      side: trade.side === 'Buy' ? 'BUY' : 'SELL',
      type: trade.orderType as OrderType,
      entryPrice: parseFloat(trade.avgPrice),
      quantity: parseFloat(trade.qty),
      quoteQuantity: parseFloat(trade.cumExecValue),
      fees: parseFloat(trade.cumExecFee),
      status: this.mapBybitStatus(trade.orderStatus),
      openedAt: new Date(trade.createdTime),
      closedAt: new Date(trade.updatedTime),
      externalOrderId: trade.orderId,
      externalTradeId: trade.orderId // Bybit utilise orderId
    }
  }

  private mapBybitStatus(status: string): TradeStatus {
    switch (status) {
      case 'Filled': return 'CLOSED'
      case 'New': case 'PartiallyFilled': return 'OPEN'
      case 'Cancelled': return 'CANCELLED'
      case 'Rejected': return 'REJECTED'
      default: return 'CLOSED'
    }
  }
}

/**
 * Factory
 */
export function createExchangeService(exchange: ExchangeType): IExchangeService {
  switch (exchange) {
    case 'BINANCE':
      return new BinanceService()
    case 'BYBIT':
      return new BybitService()
    default:
      throw new Error(`Unsupported exchange: ${exchange}`)
  }
}
```

#### 2. TradeSyncService - Synchronisation trades

Service principal pour fetch et sync trades depuis exchanges.

```typescript
// src/lib/exchange/trade-sync-service.ts

export class TradeSyncService {
  /**
   * Sync trades pour une connexion
   */
  async syncTradesForConnection(connectionId: string): Promise<{
    success: boolean
    tradesCount: number
    error?: string
  }> {
    const connection = await prisma.exchangeConnection.findUnique({
      where: { id: connectionId },
      include: { user: true }
    })

    if (!connection || !connection.isActive) {
      return { success: false, tradesCount: 0, error: 'Connection inactive' }
    }

    const service = createExchangeService(connection.exchange)

    try {
      // Décrypter API keys
      const apiKey = decrypt(connection.apiKey)
      const apiSecret = decrypt(connection.apiSecret)

      // Déterminer période de sync
      const startTime = connection.lastSyncAt
        ? connection.lastSyncAt
        : subDays(new Date(), 90) // 90 jours max initial

      const endTime = new Date()

      logger.info(`Syncing trades for connection ${connectionId} from ${startTime} to ${endTime}`)

      // Fetch Spot trades
      const spotTrades = await service.getTradesHistory({
        apiKey,
        apiSecret,
        category: 'SPOT',
        startTime,
        endTime,
        limit: 1000
      })

      // Fetch Futures trades (si permission)
      let futuresTrades = []
      if (connection.canReadFutures) {
        futuresTrades = await service.getTradesHistory({
          apiKey,
          apiSecret,
          category: 'FUTURES',
          startTime,
          endTime,
          limit: 1000
        })
      }

      const allTrades = [...spotTrades, ...futuresTrades]

      // Upsert trades (idempotent)
      let insertedCount = 0
      for (const trade of allTrades) {
        const result = await prisma.exchangeTrade.upsert({
          where: {
            connectionId_externalOrderId: {
              connectionId,
              externalOrderId: trade.externalOrderId
            }
          },
          create: {
            connectionId,
            ...trade
          },
          update: {
            ...trade,
            updatedAt: new Date()
          }
        })

        if (result) insertedCount++
      }

      // Update connection sync status
      await prisma.exchangeConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: endTime,
          lastSyncError: null
        }
      })

      // Recalculer les stats
      await this.recalculateStats(connection.userId, connection.exchange)

      logger.info(`Synced ${insertedCount} trades for connection ${connectionId}`)

      return { success: true, tradesCount: insertedCount }

    } catch (error) {
      logger.error(`Sync failed for connection ${connectionId}:`, error)

      // Update error status
      await prisma.exchangeConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncError: error.message
        }
      })

      return { success: false, tradesCount: 0, error: error.message }
    }
  }

  /**
   * Recalculer stats pour un user/exchange
   */
  async recalculateStats(userId: string, exchange: ExchangeType) {
    const periods: Period[] = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'ALL_TIME']

    for (const period of periods) {
      const { start, end } = getPeriodDates(period)

      // Fetch closed trades dans la période
      const trades = await prisma.exchangeTrade.findMany({
        where: {
          connection: { userId, exchange },
          status: 'CLOSED',
          closedAt: {
            gte: start,
            lte: end
          }
        },
        orderBy: { closedAt: 'asc' }
      })

      if (trades.length === 0) continue

      // Calculate stats
      const stats = calculateTradeStatistics(trades)

      // Upsert snapshot
      await prisma.traderPerformanceSnapshot.upsert({
        where: {
          userId_exchange_period_periodStart: {
            userId,
            exchange,
            period,
            periodStart: start
          }
        },
        create: {
          userId,
          exchange,
          period,
          periodStart: start,
          periodEnd: end,
          ...stats,
          calculatedAt: new Date()
        },
        update: {
          ...stats,
          calculatedAt: new Date()
        }
      })
    }

    logger.info(`Recalculated stats for user ${userId} on ${exchange}`)
  }
}

/**
 * Helper: Calculate statistics from trades
 */
function calculateTradeStatistics(trades: ExchangeTrade[]) {
  const wins = trades.filter(t => (t.realizedPnl ?? 0) > 0)
  const losses = trades.filter(t => (t.realizedPnl ?? 0) < 0)
  const breakEvens = trades.filter(t => (t.realizedPnl ?? 0) === 0)

  const totalPnl = trades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0)
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0

  // Gross profit/loss
  const grossProfit = wins.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null

  // Returns array (for Sharpe/Sortino)
  const returns = trades.map(t => t.realizedPnlPercent ?? 0)
  const avgReturn = mean(returns)
  const stdDev = standardDeviation(returns)

  // Sharpe Ratio (annualisé, assume 0% risk-free rate)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : null

  // Sortino Ratio (downside deviation only)
  const downsideReturns = returns.filter(r => r < 0)
  const downsideStdDev = standardDeviation(downsideReturns)
  const sortinoRatio = downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(365) : null

  // Max Drawdown
  const drawdowns = calculateDrawdowns(trades)
  const maxDrawdown = Math.min(...drawdowns, 0)
  const maxDrawdownPercent = maxDrawdown // Already in percent

  // Calmar Ratio (annual return / max DD)
  const annualReturn = avgReturn * 365 // Simplistic
  const calmarRatio = maxDrawdown < 0 ? annualReturn / Math.abs(maxDrawdown) : null

  // Best/Worst trades
  const bestTrade = wins.length > 0 ? Math.max(...wins.map(t => t.realizedPnl ?? 0)) : null
  const worstTrade = losses.length > 0 ? Math.min(...losses.map(t => t.realizedPnl ?? 0)) : null

  // Averages
  const avgWinSize = wins.length > 0 ? grossProfit / wins.length : null
  const avgLossSize = losses.length > 0 ? grossLoss / losses.length : null
  const avgRR = avgWinSize && avgLossSize ? avgWinSize / avgLossSize : null

  const holdingTimes = trades.map(t => t.holdingTimeHours ?? 0).filter(h => h > 0)
  const avgHoldingHours = holdingTimes.length > 0 ? mean(holdingTimes) : null

  // Volume & fees
  const totalVolume = trades.reduce((sum, t) => sum + (t.quoteQuantity ?? 0), 0)
  const totalFees = trades.reduce((sum, t) => sum + (t.fees ?? 0), 0)

  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakEvenTrades: breakEvens.length,
    winRate,
    totalPnl,
    totalPnlPercent: avgReturn * 100, // Approximate
    bestTrade,
    worstTrade,
    profitFactor,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    maxDrawdownPercent,
    calmarRatio,
    avgWinSize,
    avgLossSize,
    avgRR,
    avgHoldingHours,
    totalVolume,
    totalFees
  }
}

/**
 * Helper: Calculate drawdowns
 */
function calculateDrawdowns(trades: ExchangeTrade[]): number[] {
  let peak = 0
  let currentEquity = 0
  const drawdowns: number[] = []

  for (const trade of trades) {
    currentEquity += trade.realizedPnl ?? 0

    if (currentEquity > peak) {
      peak = currentEquity
    }

    const drawdown = peak > 0 ? ((currentEquity - peak) / peak) * 100 : 0
    drawdowns.push(drawdown)
  }

  return drawdowns
}

/**
 * Helper: Get period dates
 */
function getPeriodDates(period: Period): { start: Date; end: Date } {
  const end = new Date()
  let start: Date

  switch (period) {
    case 'DAY':
      start = startOfDay(end)
      break
    case 'WEEK':
      start = startOfWeek(end)
      break
    case 'MONTH':
      start = startOfMonth(end)
      break
    case 'QUARTER':
      start = startOfQuarter(end)
      break
    case 'YEAR':
      start = startOfYear(end)
      break
    case 'ALL_TIME':
      start = new Date(0) // Epoch
      break
  }

  return { start, end }
}

// Stats helpers
function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function standardDeviation(arr: number[]): number {
  const avg = mean(arr)
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}
```

#### 3. EncryptionService - Sécurité API keys

**CRITIQUE**: API keys JAMAIS en clair dans DB.

```typescript
// src/lib/crypto/encryption-service.ts

import crypto from 'crypto'
import { env } from '@/lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const ITERATIONS = 100000

/**
 * Derive encryption key from master secret
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    env.ENCRYPTION_MASTER_KEY, // ⚠️ Must be in env vars
    salt,
    ITERATIONS,
    32, // 256 bits
    'sha512'
  )
}

/**
 * Encrypt sensitive data (API keys)
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  // Format: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':')

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }

  const salt = Buffer.from(parts[0], 'hex')
  const iv = Buffer.from(parts[1], 'hex')
  const tag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]

  const key = deriveKey(salt)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Test encryption (dev only)
 */
export function testEncryption() {
  const testKey = 'test-api-key-12345'
  const encrypted = encrypt(testKey)
  const decrypted = decrypt(encrypted)

  console.log('Original:', testKey)
  console.log('Encrypted:', encrypted)
  console.log('Decrypted:', decrypted)
  console.log('Match:', testKey === decrypted)
}
```

**Variables d'environnement requises:**
```bash
# .env (NEVER commit this!)
ENCRYPTION_MASTER_KEY="your-very-long-random-secret-at-least-32-chars"
```

#### 4. Cron Job - Sync automatique

```typescript
// src/lib/cron/sync-exchanges.ts

import { CronJob } from 'cron'
import { TradeSyncService } from '@/lib/exchange/trade-sync-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { chunk } from 'lodash'

const syncService = new TradeSyncService()

/**
 * Sync all active connections
 * Runs every 5 minutes
 */
export const syncExchangesJob = new CronJob(
  '*/5 * * * *', // Every 5 minutes
  async () => {
    logger.info('Starting exchange sync cron job')

    try {
      // Fetch active connections
      const connections = await prisma.exchangeConnection.findMany({
        where: {
          isActive: true,
          user: {
            // Only traders
            traderProfile: { isNot: null }
          }
        },
        include: {
          user: {
            select: { id: true, planName: true }
          }
        }
      })

      logger.info(`Found ${connections.length} active connections to sync`)

      // Sync en parallèle (max 10 concurrent pour rate limits)
      const batches = chunk(connections, 10)

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(conn =>
            syncService.syncTradesForConnection(conn.id)
              .catch(err => {
                logger.error(`Sync failed for connection ${conn.id}:`, err)
                return { success: false, tradesCount: 0, error: err.message }
              })
          )
        )

        // Wait 1s between batches (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      logger.info('Exchange sync cron job completed')

    } catch (error) {
      logger.error('Exchange sync cron job failed:', error)
    }
  },
  null, // onComplete
  false, // start immediately
  'UTC' // timezone
)

/**
 * Start cron job
 */
export function startExchangeSyncCron() {
  syncExchangesJob.start()
  logger.info('Exchange sync cron job started (every 5 minutes)')
}
```

**Intégration dans app:**
```typescript
// src/app.ts (ou server startup)
import { startExchangeSyncCron } from '@/lib/cron/sync-exchanges'

// Au démarrage serveur
startExchangeSyncCron()
```

---

## 🎨 UI/UX Features

### Dashboard Trader - Nouvel Onglet "Portfolio"

Page: `app/orgs/[orgSlug]/(navigation)/(trading)/dashboard/trader/portfolio/page.tsx`

#### Layout général

```tsx
export default async function TraderPortfolioPage() {
  const user = await getRequiredUser()
  const traderProfile = await getTraderProfileByUserId(user.id)

  if (!traderProfile) redirect('/account/become-trader')

  // Fetch connections
  const connections = await prisma.exchangeConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch latest stats (ALL_TIME period)
  const stats = await prisma.traderPerformanceSnapshot.findFirst({
    where: {
      userId: user.id,
      period: 'ALL_TIME'
    },
    orderBy: { calculatedAt: 'desc' }
  })

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Portfolio Tracking"
        description="Connect your exchange accounts and track your trading performance"
      />

      {/* Section 1: Connections */}
      <ExchangeConnectionsCard connections={connections} />

      {/* Section 2: Performance Overview (si au moins 1 connexion) */}
      {connections.length > 0 && stats && (
        <>
          <PerformanceOverviewCards stats={stats} />
          <EquityCurveChart userId={user.id} />
          <RecentTradesTable userId={user.id} />
        </>
      )}

      {/* Empty state si pas de connexion */}
      {connections.length === 0 && (
        <EmptyStateConnectExchange />
      )}
    </div>
  )
}
```

#### Section 1: Exchange Connections

```tsx
'use client'

export function ExchangeConnectionsCard({ connections }: Props) {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Exchanges</CardTitle>
            <CardDescription>
              Sync your trading activity from Binance and Bybit
            </CardDescription>
          </div>
          <ConnectExchangeDialog>
            <Button>
              <PlusCircle className="mr-2 size-4" />
              Connect Exchange
            </Button>
          </ConnectExchangeDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connections.map(conn => (
          <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              {/* Exchange icon */}
              <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                {conn.exchange === 'BINANCE' ? (
                  <BinanceIcon className="size-6" />
                ) : (
                  <BybitIcon className="size-6" />
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{conn.label || conn.exchange}</p>
                  {conn.isActive && (
                    <Badge variant="outline" className="bg-green-50">
                      <CheckCircle className="mr-1 size-3" />
                      Active
                    </Badge>
                  )}
                  {conn.lastSyncError && (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 size-3" />
                      Error
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">
                  {conn.lastSyncAt ? (
                    <>Last sync: {formatDistanceToNow(conn.lastSyncAt, { addSuffix: true })}</>
                  ) : (
                    <>Never synced</>
                  )}
                </p>

                {conn.lastSyncError && (
                  <p className="text-destructive text-xs mt-1">
                    {conn.lastSyncError}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <SyncNowButton connectionId={conn.id} />
              <Button variant="ghost" size="sm" onClick={() => setSelectedConnection(conn.id)}>
                <Settings className="size-4" />
              </Button>
              <DeleteConnectionButton connectionId={conn.id} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

#### Dialog: Connect Exchange

```tsx
'use client'

export function ConnectExchangeDialog({ children }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select' | 'credentials' | 'verify'>('select')
  const [selectedExchange, setSelectedExchange] = useState<ExchangeType | null>(null)

  const form = useForm({
    defaultValues: {
      exchange: 'BINANCE',
      label: '',
      apiKey: '',
      apiSecret: ''
    }
  })

  const connectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const result = await connectExchangeAction(data)
      return unwrapServerActionResult(result)
    },
    onSuccess: () => {
      toast.success('Exchange connected successfully!')
      setOpen(false)
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Exchange Account</DialogTitle>
          <DialogDescription>
            Connect your Binance or Bybit account to sync your trades automatically
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="grid gap-4">
            <SelectExchangeCard
              exchange="BINANCE"
              selected={selectedExchange === 'BINANCE'}
              onSelect={() => {
                setSelectedExchange('BINANCE')
                setStep('credentials')
              }}
            />
            <SelectExchangeCard
              exchange="BYBIT"
              selected={selectedExchange === 'BYBIT'}
              onSelect={() => {
                setSelectedExchange('BYBIT')
                setStep('credentials')
              }}
            />
          </div>
        )}

        {step === 'credentials' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(connectMutation.mutate)} className="space-y-4">
              <FormField
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My main account" />
                    </FormControl>
                    <FormDescription>
                      Give this connection a memorable name
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your API key" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Your API secret" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Alert>
                <Shield className="size-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Your API keys are encrypted and stored securely. We only request READ permissions.
                  We will NEVER execute trades on your behalf.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep('select')}>
                  Back
                </Button>
                <Button type="submit" disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? 'Verifying...' : 'Connect'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

#### Section 2: Performance Overview

```tsx
export function PerformanceOverviewCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          <Activity className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTrades}</div>
          <p className="text-muted-foreground text-xs">
            {stats.winningTrades}W / {stats.losingTrades}L
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Win Rate
            <Badge variant="outline" className="ml-2">
              <CheckCircle className="mr-1 size-3" />
              Verified
            </Badge>
          </CardTitle>
          <TrendingUp className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.winRate.toFixed(1)}%
          </div>
          <p className="text-muted-foreground text-xs">
            {stats.totalTrades} verified trades
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          <DollarSign className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            stats.totalPnl > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(stats.totalPnl)}
          </div>
          <p className="text-muted-foreground text-xs">
            {stats.totalPnlPercent > 0 ? '+' : ''}{stats.totalPnlPercent.toFixed(2)}% return
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          <BarChart3 className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.profitFactor?.toFixed(2) ?? '-'}
          </div>
          <p className="text-muted-foreground text-xs">
            Sharpe: {stats.sharpeRatio?.toFixed(2) ?? '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Section 3: Equity Curve

```tsx
export function EquityCurveChart({ userId }: Props) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1M')

  // Fetch equity data (TODO: implement query)
  const { data: equityData } = useQuery({
    queryKey: ['equity-curve', userId, timeframe],
    queryFn: () => getEquityCurveData(userId, timeframe)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equity Curve</CardTitle>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList>
              <TabsTrigger value="1D">1D</TabsTrigger>
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="ALL">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={equityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'PPP')}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolioValue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Your Portfolio"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="btcValue"
              stroke="#f7931a"
              strokeWidth={1}
              strokeDasharray="5 5"
              name="BTC Benchmark"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

#### Section 4: Recent Trades Table

```tsx
export async function RecentTradesTable({ userId }: Props) {
  const trades = await prisma.exchangeTrade.findMany({
    where: {
      connection: { userId }
    },
    orderBy: { openedAt: 'desc' },
    take: 20,
    include: {
      connection: {
        select: { exchange: true }
      }
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <div className="flex gap-2">
          <TradeFilters /> {/* TODO: implement filters */}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exchange</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {trades.map(trade => (
              <TableRow key={trade.id}>
                <TableCell>
                  <Badge variant="outline">{trade.connection.exchange}</Badge>
                </TableCell>

                <TableCell className="font-medium">{trade.symbol}</TableCell>

                <TableCell>
                  <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                    {trade.positionSide || trade.side}
                    {trade.leverage && ` ${trade.leverage}x`}
                  </Badge>
                </TableCell>

                <TableCell>{formatPrice(trade.entryPrice)}</TableCell>

                <TableCell>
                  {trade.exitPrice ? formatPrice(trade.exitPrice) : (
                    <Badge variant="outline">OPEN</Badge>
                  )}
                </TableCell>

                <TableCell>{formatQuantity(trade.quantity)}</TableCell>

                <TableCell>
                  {trade.realizedPnl ? (
                    <span className={cn(
                      'font-medium',
                      trade.realizedPnl > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(trade.realizedPnl)}
                      {trade.realizedPnlPercent &&
                        ` (${trade.realizedPnlPercent > 0 ? '+' : ''}${trade.realizedPnlPercent.toFixed(2)}%)`
                      }
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span>{format(trade.openedAt, 'PPp')}</span>
                    {trade.closedAt && (
                      <span className="text-muted-foreground text-xs">
                        Closed: {format(trade.closedAt, 'PPp')}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Page Profil Trader Public - Onglet "Verified Stats"

Page: `app/orgs/[orgSlug]/(navigation)/(trading)/traders/[traderId]/page.tsx`

```tsx
export default async function TraderPublicProfilePage({ params }: Props) {
  const trader = await getTraderProfileById(params.traderId)
  if (!trader) notFound()

  const user = await getUser() // Current user (peut être null)
  const userPlan = user?.planName ?? 'free'

  // Fetch verified stats
  const stats = await prisma.traderPerformanceSnapshot.findFirst({
    where: {
      userId: trader.userId,
      period: 'ALL_TIME'
    },
    orderBy: { calculatedAt: 'desc' }
  })

  // Check if trader has exchange connected
  const hasExchangeConnected = await prisma.exchangeConnection.count({
    where: { userId: trader.userId, isActive: true }
  }) > 0

  return (
    <div className="container mx-auto py-8">
      {/* Header avec infos trader... */}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verified-stats">
            Verified Stats
            {hasExchangeConnected && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="mr-1 size-3" />
                Verified
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        {/* Onglet Verified Stats */}
        <TabsContent value="verified-stats">
          {!hasExchangeConnected ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  This trader hasn't connected any exchange account yet.
                </p>
              </CardContent>
            </Card>
          ) : !stats ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No trading data available yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Performance cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Verified Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.winRate.toFixed(1)}%
                    </div>
                    <p className="text-muted-foreground text-xs mt-2">
                      From {stats.totalTrades} verified trades
                    </p>
                    <Badge variant="outline" className="mt-2">
                      <CheckCircle className="mr-1 size-3" />
                      On-chain verified
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total P&L</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold",
                      stats.totalPnl > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(stats.totalPnl)}
                    </div>
                    <p className="text-muted-foreground text-xs mt-2">
                      {stats.totalPnlPercent > 0 ? '+' : ''}{stats.totalPnlPercent.toFixed(2)}% return
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Risk Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Profit Factor</span>
                        <span className="font-medium">{stats.profitFactor?.toFixed(2) ?? '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sharpe Ratio</span>
                        <span className="font-medium">{stats.sharpeRatio?.toFixed(2) ?? '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Max DD</span>
                        <span className="font-medium text-red-600">
                          {stats.maxDrawdownPercent?.toFixed(2) ?? '-'}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Equity curve (avec blur si Free) */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                </CardHeader>
                <CardContent>
                  {userPlan === 'free' ? (
                    <BlurredEquityCurveWithUpsell traderId={trader.id} />
                  ) : (
                    <EquityCurveChart userId={trader.userId} />
                  )}
                </CardContent>
              </Card>

              {/* Trades table (avec blur si Free) */}
              {userPlan === 'free' ? (
                <BlurredTradesTableWithUpsell />
              ) : (
                <RecentTradesTable userId={trader.userId} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### Component: Blurred Upsell

```tsx
export function BlurredEquityCurveWithUpsell({ traderId }: Props) {
  return (
    <div className="relative">
      {/* Chart blurred */}
      <div className="blur-md pointer-events-none">
        <EquityCurveChart userId={traderId} />
      </div>

      {/* Overlay upsell */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Unlock Verified Stats</CardTitle>
            <CardDescription>
              Upgrade to Pro to see full trading history and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600 size-4" />
                  <span className="text-sm">Full equity curve history</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600 size-4" />
                  <span className="text-sm">All verified trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600 size-4" />
                  <span className="text-sm">Advanced risk metrics</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/pricing">Upgrade to Pro - $49/mo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 💰 Monétisation

### Gating Features par Plan

**Plan FREE**:
```
❌ Pas de connexion exchange
✅ Voir stats publiques blurred des traders vérifiés
✅ Voir nombre total trades + winrate uniquement
```

**Plan PRO** ($49/mois):
```
✅ 1 connexion exchange (Binance OU Bybit)
✅ Sync toutes les 5 minutes
✅ 90 jours d'historique
✅ Stats complètes visibles (winrate, P&L, profit factor)
✅ Equity curve chart
✅ Recent trades table (20 derniers)
✅ Export CSV basic
```

**Plan ULTRA** ($99/mois):
```
✅ 3 connexions exchanges (multi-exchange)
✅ Sync temps réel (1 minute)
✅ Historique illimité (toutes données disponibles)
✅ Analytics avancées (Sharpe, Sortino, Calmar, MDD)
✅ Export tax reports (FIFO/LIFO/HIFO)
✅ Trading hours heatmap
✅ Symbol performance breakdown
✅ API access pour scripts custom (optionnel)
```

### Matrice Features

| Feature | FREE | PRO | ULTRA |
|---------|------|-----|-------|
| **Connexions exchange** | ❌ | 1 | 3 |
| **Sync interval** | - | 5 min | 1 min |
| **Historique trades** | - | 90 jours | Illimité |
| **Voir stats publiques** | Blurred | ✅ Full | ✅ Full |
| **Equity curve** | ❌ | ✅ | ✅ |
| **Trades table** | ❌ | 20 derniers | Illimité |
| **Basic stats** | ❌ | ✅ | ✅ |
| **Advanced metrics** | ❌ | ❌ | ✅ |
| **Export CSV** | ❌ | ✅ Basic | ✅ Advanced |
| **Tax reports** | ❌ | ❌ | ✅ |
| **API access** | ❌ | ❌ | ✅ |

### Projections Revenus

**Hypothèses conservatrices:**

```
État actuel (sans portfolio tracking):
- 1,000 users actifs
- 100 users Pro (10% conversion)
- 25 users Ultra (2.5% conversion)
- Revenue: (100 × 49$) + (25 × 99$) = 7,375$/mois

Avec portfolio tracking (estimations):
- 1,000 users actifs
- 30% sont traders potentiels = 300 traders
- 40% traders upgrade Pro pour portfolio = 120 nouveaux Pro
- 10% traders upgrade Ultra pour multi-exchange = 30 nouveaux Ultra
- Users existants: +20% upgrade pour voir stats vérifiées = 20 nouveaux Pro

Revenue additionnel:
- Nouveaux Pro traders: 120 × 49$ = 5,880$
- Nouveaux Ultra traders: 30 × 99$ = 2,970$
- Nouveaux Pro users: 20 × 49$ = 980$
TOTAL additionnel: +9,830$/mois

Revenue total projeté: 17,205$/mois (+133% vs sans feature!)
```

**Scénario optimiste (6-12 mois post-launch):**
```
- 2,000 users actifs
- 50% upgrade rate traders Pro = 300 Pro
- 15% upgrade rate traders Ultra = 90 Ultra
- 25% upgrade rate users = 100 Pro

Revenue: (400 × 49$) + (90 × 99$) = 28,510$/mois 🚀
```

### Upsell Strategies

**1. Badge "Verified Trader"**

Critères d'obtention:
- ✅ Au moins 1 exchange connecté
- ✅ Minimum 20 trades dans les 30 derniers jours
- ✅ Sync actif (dernière sync < 1h)

Bénéfices:
- ✅ Badge ✓ sur profil
- ✅ Boost ranking marketplace (+20% visibilité)
- ✅ Mention "Verified Stats" partout

**2. Tax Reports Premium (Ultra only)**

Features:
- Export CSV avec calculs FIFO/LIFO/HIFO
- Format compatible TurboTax, CoinTracker
- Yearly summary PDF
- Capital gains/losses breakdown

Prix standalone (si pas Ultra): 29$/année

**3. API Access (Ultra only)**

Use cases:
- Custom analytics scripts
- Webhooks pour alertes
- Integration avec outils externes (TradingView, etc.)

Features:
- Personal API token
- Rate limits généreux (1000 req/min)
- Documentation complète
- Code examples (Python, Node.js)

**4. Multi-Exchange Dashboard (Ultra only)**

Features:
- Vue agrégée Binance + Bybit
- Compare performance cross-exchange
- Identify best exchange par symbole
- Unified P&L tracking

---

## 📊 Analytics Uniques

### Métriques Exclusives MyCryptoPilot

Ces analytics sont uniques car elles combinent données exchange + signaux publiés.

#### 1. Signal Accuracy Score

**Concept**: Mesure la corrélation entre signaux publiés et trades réels.

**Calcul**:
```typescript
// Pour chaque signal publié
const signal = getSignal(signalId)
const tradesInWindow = getTrades({
  symbol: signal.asset,
  timeWindow: [signal.publishedAt, signal.expiresAt]
})

// Check si trader a pris position dans direction du signal
const matchingTrades = tradesInWindow.filter(trade =>
  (signal.payload.bias === 'LONG' && trade.positionSide === 'LONG') ||
  (signal.payload.bias === 'SHORT' && trade.positionSide === 'SHORT')
)

const signalFollowed = matchingTrades.length > 0
const signalAccuracy = (followedCount / totalSignals) * 100
```

**Affichage**:
```
📊 Signal Accuracy: 87%
This trader follows their own signals 87% of the time
```

**Insights**:
- Score élevé (>80%) = trader congruent, trustworthy
- Score faible (<50%) = signaux pas alignés avec trades, red flag

#### 2. Signal vs Performance Correlation

**Concept**: Compare winrate signaux vs winrate trades réels.

**Calcul**:
```typescript
// Winrate signaux (basé sur Signal.status)
const signalWinRate = calculateSignalWinRate(traderId)

// Winrate trades réels (basé sur ExchangeTrade.realizedPnl)
const tradeWinRate = stats.winRate

// Correlation
const correlation = Math.abs(signalWinRate - tradeWinRate)
```

**Affichage**:
```
Chart overlay:
- Line 1: Signal winrate over time
- Line 2: Actual trades winrate over time

Metric: Correlation score: 0.92 (high = good)
```

**Insights**:
- Correlation élevée = signaux reflètent vraie performance
- Divergence = possible cherry-picking signals

#### 3. Risk Consistency Score

**Concept**: Mesure la discipline du trader (position sizing constant).

**Calcul**:
```typescript
// Standard deviation position sizes (en % of account)
const positionSizes = trades.map(t =>
  (t.quoteQuantity / accountSize) * 100
)

const stdDev = standardDeviation(positionSizes)
const mean = average(positionSizes)
const coefficientOfVariation = (stdDev / mean) * 100

// Score inversé (low CV = high score)
const riskConsistencyScore = Math.max(0, 100 - coefficientOfVariation)
```

**Affichage**:
```
🎯 Risk Consistency: 95/100
This trader maintains very consistent position sizing
95% of trades within 1-3% risk tolerance
```

**Insights**:
- Score élevé (>90) = trader discipliné, pro
- Score bas (<70) = trader YOLO, high variance

#### 4. Best Trading Hours Heatmap

**Concept**: Identifier quand trader est le plus profitable.

**Calcul**:
```typescript
// Group trades by hour of day (UTC)
const tradesByHour = groupBy(trades, t =>
  new Date(t.openedAt).getUTCHours()
)

// Calculate winrate per hour
const hourlyStats = Object.entries(tradesByHour).map(([hour, trades]) => ({
  hour: parseInt(hour),
  winRate: calculateWinRate(trades),
  totalTrades: trades.length,
  avgPnl: average(trades.map(t => t.realizedPnl))
}))
```

**Affichage**:
```
Heatmap 24x7:
- X-axis: Hours (0-23 UTC)
- Y-axis: Days (Mon-Sun)
- Color intensity: Winrate (green = high, red = low)

Insight: "Most profitable: 14:00-18:00 UTC (78% WR)"
```

**Use case**:
- Users savent quand copier ce trader
- Educational: Comprendre market hours impact

#### 5. Symbol Specialization Matrix

**Concept**: Performance breakdown par crypto symbole.

**Calcul**:
```typescript
const symbolStats = groupBy(trades, 'symbol')

const matrix = Object.entries(symbolStats).map(([symbol, trades]) => ({
  symbol,
  totalTrades: trades.length,
  winRate: calculateWinRate(trades),
  avgPnl: average(trades.map(t => t.realizedPnl)),
  profitFactor: calculateProfitFactor(trades),
  label: classifyExpertise(winRate, totalTrades)
}))

function classifyExpertise(winRate, totalTrades) {
  if (totalTrades > 50 && winRate > 70) return 'Expert'
  if (totalTrades > 20 && winRate > 60) return 'Good'
  if (totalTrades > 10) return 'Average'
  return 'Beginner'
}
```

**Affichage**:
```
Table:
| Symbol   | Trades | WR    | Avg P&L | Expertise |
|----------|--------|-------|---------|-----------|
| BTCUSDT  | 127    | 78%   | +$124   | 🏆 Expert  |
| ETHUSDT  | 89     | 72%   | +$87    | 🏆 Expert  |
| SOLUSDT  | 34     | 52%   | +$12    | ⚠️ Average |
| DOGEUSDT | 12     | 38%   | -$23    | ❌ Avoid   |

Insight: "This trader excels at BTC/ETH but struggles with altcoins"
```

**Use case**:
- Users follow traders pour symboles spécifiques
- Traders identifient leurs forces/faiblesses

---

## 🗓️ Roadmap Implémentation

### Estimation Totale: 10 semaines (2.5 mois)

### Phase 1: MVP Core Infrastructure (3 semaines)

**Semaine 1: Database & Security**
- [ ] Créer migrations Prisma (3 tables)
- [ ] Implémenter EncryptionService (AES-256-GCM)
- [ ] Tests unitaires encryption (100% coverage)
- [ ] Setup env vars (ENCRYPTION_MASTER_KEY)
- [ ] Documentation security best practices

**Deliverable**: DB ready + Encryption service tested

**Semaine 2: Exchange Services**
- [ ] Interface IExchangeService
- [ ] BinanceService implementation (Spot + Futures)
- [ ] API clients setup (binance SDK)
- [ ] Tests unitaires (mocks)
- [ ] Error handling & rate limiting

**Deliverable**: Binance API integration functional

**Semaine 3: Sync Engine**
- [ ] TradeSyncService implementation
- [ ] Stats calculation helpers
- [ ] Cron job setup (5min intervals)
- [ ] Logging & monitoring
- [ ] Tests E2E sync flow

**Deliverable**: Automatic sync working

### Phase 2: Analytics & Calculations (2 semaines)

**Semaine 4: Advanced Metrics**
- [ ] Performance calculator (Sharpe, Sortino, Calmar)
- [ ] Drawdown calculator
- [ ] RR ratio calculator
- [ ] Performance snapshots caching
- [ ] Benchmark vs BTC helper

**Deliverable**: Pro-grade analytics ready

**Semaine 5: Charts & Visualization**
- [ ] Equity curve data generation
- [ ] P&L timeline data generation
- [ ] Heatmap data generation (trading hours)
- [ ] Symbol breakdown data
- [ ] Win/Loss distribution data

**Deliverable**: All chart data endpoints ready

### Phase 3: Public Verified Stats (1 semaine)

**Semaine 6: User-Facing Public Stats**
- [ ] Trader public profile "Verified Stats" tab
- [ ] Stats cards (winrate, P&L, PF)
- [ ] Blur logic pour Free users
- [ ] Badge "Verified Trader" component
- [ ] Upsell modals Pro/Ultra

**Deliverable**: Public stats with paywall

### Phase 4: Bybit Support (1 semaine)

**Semaine 7: Multi-Exchange**
- [ ] BybitService implementation
- [ ] Multi-exchange UI selector
- [ ] Exchange-specific icons/branding
- [ ] Tests cross-exchange
- [ ] Documentation Bybit setup

**Deliverable**: Binance + Bybit supported

### Phase 5: Premium Features Ultra (2 semaines)

**Semaine 8: Ultra-Only Features**
- [ ] Real-time WebSocket sync (Binance user data stream)
- [ ] Unlimited history (remove 90d limit)
- [ ] Advanced analytics charts
- [ ] Trading hours heatmap component
- [ ] Symbol specialization matrix

**Deliverable**: Ultra plan features complete

**Semaine 9: Export & API**
- [ ] CSV export (trades, P&L)
- [ ] Tax reports generator (FIFO/LIFO)
- [ ] API token generation system
- [ ] API rate limiting
- [ ] Webhooks (optional)

**Deliverable**: Export & API functional

### Phase 6: Polish & Launch (1 semaine)

**Semaine 10: Production Ready**
- [ ] Security audit (external consultant)
- [ ] Performance optimization (DB indexes, caching)
- [ ] Error monitoring (Sentry integration)
- [ ] User documentation (help center)
- [ ] Marketing materials (blog post, landing page)
- [ ] Beta testing avec 10 traders
- [ ] Bug fixes from beta
- [ ] Launch! 🚀

**Deliverable**: Production launch

---

## ⚠️ Risques & Mitigation

### Risques Sécurité (CRITIQUE)

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **API keys leak** | 🔴 Catastrophique | Faible | - AES-256-GCM encryption<br>- Env vars jamais commit<br>- Never log keys<br>- Rotation régulière (user can change)<br>- Security audit externe |
| **MITM attacks** | 🔴 Critique | Très faible | - HTTPS only<br>- Certificate pinning<br>- No HTTP fallback |
| **XSS injection** | 🟡 Moyen | Faible | - CSP headers strict<br>- Sanitize all user inputs<br>- React auto-escaping |
| **SQL injection** | 🟡 Moyen | Très faible | - Prisma ORM (parameterized queries)<br>- No raw SQL |
| **Rate limiting bypass** | 🟡 Moyen | Moyenne | - Server-side rate limiting<br>- Respect exchange limits<br>- Backoff exponential |

**Action requise**: Security audit externe avant production (budget 1.5-2k€)

### Risques Techniques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Exchange API changes** | 🟡 Moyen | Moyenne | - Version pinning SDKs<br>- Monitoring changelog<br>- Fallback graceful degradation<br>- Alert system |
| **Sync failures** | 🟡 Moyen | Moyenne | - Retry logic (3 attempts)<br>- Error notifications trader<br>- Manual sync button<br>- Logs détaillés |
| **DB performance** | 🟡 Moyen | Faible | - Proper indexes<br>- Stats caching (snapshots)<br>- Pagination everywhere<br>- Query optimization |
| **Cron job latence** | 🟢 Faible | Faible | - Job queue (BullMQ)<br>- Parallel processing (max 10)<br>- Monitoring execution time |
| **WebSocket disconnects** | 🟢 Faible | Moyenne | - Auto-reconnect logic<br>- Heartbeat monitoring<br>- Fallback to REST API |

### Risques Business

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Low adoption traders** | 🟡 Moyen | Moyenne | - Strong onboarding UX<br>- Clear value proposition<br>- Video tutorials<br>- Early access beta (top 10 traders) |
| **Fake traders** | 🟡 Moyen | Faible | - Only verified exchanges<br>- Manual review high-volume<br>- Community reporting<br>- Algorithm detection anomalies |
| **User privacy concerns** | 🟡 Moyen | Faible | - Opt-in by default<br>- Granular permissions<br>- Clear privacy policy<br>- RGPD compliance |
| **High churn rate** | 🟡 Moyen | Moyenne | - Focus qualité traders<br>- Excellent support<br>- Educational content<br>- Feedback loops |
| **Competition** | 🟢 Faible | Élevée | - Differentiation UX<br>- Social proof focus<br>- Premium analytics<br>- Fast iteration |

### Risques Légaux

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **RGPD non-compliance** | 🟡 Moyen | Faible | - Consent explicite<br>- Data encryption<br>- Right to deletion<br>- DPO designation |
| **KYC/AML** | 🟡 Moyen | Faible | - User identity verification (already in place)<br>- Transaction monitoring<br>- Suspicious activity reporting |
| **Terms of Service exchanges** | 🟢 Faible | Faible | - Read-only permissions only<br>- Respect rate limits<br>- No automated trading<br>- Legal disclaimer |

---

## 🎯 Recommandations

### ✅ POURQUOI C'EST UNE EXCELLENTE FEATURE

**1. Légalement Clean** ✅
- Zero zone grise (pure data analytics)
- Pas de conseil en investissement
- Pas d'exécution trades
- Read-only strict

**2. Crédibilité Massive** 🚀
- Stats vérifiées on-chain (impossible à falsifier)
- Transparence totale pour followers
- Trust factor x10 vs self-reported

**3. Moat Defensible** 🏰
- Intégration multi-exchange = barrière technique
- Data accumulation over time = compounding value
- Network effects (plus de traders verified = plus d'attraction users)

**4. Upsell Naturel** 💰
- Feature killer pour upgrade Pro/Ultra
- ROI évident pour traders (time saved + credibility)
- Sticky (once connected, hard to leave)

**5. Données Précieuses** 📊
- Analytics uniques (signal correlation, etc.)
- Insights business (quels traders performent, quels symboles populaires)
- Product improvements data-driven

### 🚀 QUICK WINS (MVP Focus)

**Phase 1 - Minimum Viable:**
- Binance only (API la plus mature + market share #1)
- Read-only strict (zero risk)
- Basic stats (winrate, P&L, total trades)
- Trader dashboard seulement (pas encore public)
- Manual sync button (pas de cron d'abord)

**Timeline MVP**: 3 semaines hardcore dev

**Go-To-Market Strategy:**
1. **Beta privée** (Semaine 1-2):
   - Target: Top 10 traders actuels MyCryptoPilot
   - Offer: Free access Beta + Pro plan gratis 3 mois
   - Exchange: Feedback détaillé + testimonials

2. **Beta élargie** (Semaine 3-4):
   - Ouvrir à tous traders (invite-only)
   - Fix bugs remontés
   - Polish UX

3. **Public launch** (Semaine 5):
   - Marketing push (blog post, email, Discord)
   - Public stats enable
   - Paywall activate

### 💡 DIFFÉRENCIATION vs CONCURRENTS

**3Commas**: Focus automation/bots, UI complexe, pas social
**Wundertrading**: Copy trading mais opaque, stats douteuses
**TradingView**: Charts only, pas de sync exchange

**MyCryptoPilot UNIQUE:**
1. **Social Trading Context**: Stats pour prouver crédibilité, pas juste self-tracking
2. **Signal Correlation**: Compare signaux vs trades (personne fait ça!)
3. **Verified Trader Program**: Badge automatique basé données réelles
4. **Educational Focus**: Learn from verified winners

### 🎯 SUCCESS METRICS

**KPIs à tracker:**
```
- Conversion rate Free → Pro (target: +40% vs baseline)
- Trader adoption (% traders with exchange connected)
- User engagement (time spent on verified stats)
- Upgrade rate Pro → Ultra (target: 10%)
- Churn rate (should decrease avec sticky feature)
- NPS score traders (satisfaction)
```

**Success criteria (3 mois post-launch):**
- ✅ 50+ traders with active exchange connection
- ✅ 20+ traders avec badge "Verified"
- ✅ +60% revenue mensuel vs pre-launch
- ✅ <5% bug rate (stability)
- ✅ NPS > 50 (trader satisfaction)

---

## 📚 Documentation Complémentaire

### Fichiers à Créer

**Backend:**
- `src/lib/exchange/README.md` - Guide exchange services
- `src/lib/crypto/ENCRYPTION.md` - Security guidelines
- `docs/API_KEYS_SETUP.md` - User guide Binance/Bybit API setup

**Frontend:**
- `docs/UI_COMPONENTS.md` - Portfolio tracking components
- `docs/CHARTS.md` - Charts data formats

**DevOps:**
- `docs/DEPLOYMENT.md` - Cron jobs setup
- `docs/MONITORING.md` - Alerting & logging

### Resources Externes

**Binance API:**
- [Spot API Docs](https://binance-docs.github.io/apidocs/spot/en/)
- [Futures API Docs](https://binance-docs.github.io/apidocs/futures/en/)
- [SDK Node.js](https://www.npmjs.com/package/@binance/connector)

**Bybit API:**
- [V5 API Docs](https://bybit-exchange.github.io/docs/v5/intro)
- [SDK Node.js](https://www.npmjs.com/package/bybit-api)

**Security:**
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Best Practices](https://nodejs.org/api/crypto.html)

---

## 🚀 Next Steps

### Immediate Actions (si GO)

**1. Architecture Review** (1-2h)
- [ ] Review DB models ensemble
- [ ] Validate encryption approach
- [ ] Confirm exchange APIs choice

**2. POC Technique** (1-2 jours)
- [ ] Spike Binance API integration
- [ ] Test encryption/decryption
- [ ] Validate stats calculations accuracy

**3. Design Mocks** (2-3 jours)
- [ ] Figma mocks Dashboard Trader
- [ ] Figma mocks Public Profile tabs
- [ ] User flow connect exchange

**4. Sprint Planning** (1 jour)
- [ ] Break down tasks (tickets GitHub)
- [ ] Assign story points
- [ ] Setup sprint (3 semaines Phase 1)

**5. Development Kickoff** (Semaine 1)
- [ ] DB migrations
- [ ] Encryption service
- [ ] Binance service skeleton

---

**Prêt à commencer ?** 🚀

Cette feature va transformer MyCryptoPilot en référence de transparence et crédibilité dans l'espace crypto trading social. Let's build it! 💪
