# 🏗️ [Epic] Unified Trading System: Connecting Exchange Portfolio, Manual Trading & Copy Trading

## 📋 Executive Summary

Unifier le système de trading de MyCryptoPilot en connectant trois composants actuellement isolés:
1. **Portfolio Tracking** (Binance/Bybit sync) - Actuellement opérationnel mais isolé
2. **Trading Signals** (création manuelle) - Actuellement opérationnel mais déconnecté du portfolio
3. **Copy Trading** (nouveau) - Permettre aux utilisateurs de copier les trades (manuel et automatique)

### Vision Finale
- **Traders**: Connectent Binance/Bybit pour monitorer leur activité Spot/Futures, peuvent partager leurs trades réels comme signaux
- **Utilisateurs**: Peuvent suivre et copier les trades des traders (mode manuel ou automatique via API)
- **Cohérence**: Un seul système unifié où les trades réels, signaux manuels et copies sont interconnectés

## 🎯 Objectifs

### Pour les Traders
- ✅ Visualiser leur portfolio complet (trades Binance/Bybit synchronisés)
- ✅ Créer des trades manuels (pour stratégies hors exchange)
- ✅ Partager n'importe quel trade (réel ou manuel) comme signal
- ✅ Voir les statistiques unifiées (portfolio réel + trades manuels)

### Pour les Utilisateurs
- ✅ Copier les trades en mode **MANUAL** (journal de trading personnel)
- ✅ Copier les trades en mode **AUTO** (exécution via leur API Binance/Bybit)
- ✅ Recevoir les mises à jour de SL/TP des traders
- ✅ Voir leur performance de copy-trading

## 🏛️ Architecture Technique

### Modèles de Données

```prisma
// 1. NOUVEAU: Position agrégée du trader (Spot ou Futures)
model TraderTrade {
  id                String              @id @default(cuid())
  traderProfileId   String
  trader            TraderProfile       @relation(...)

  // Source & Type
  source           TradeSource         // BINANCE, BYBIT, MANUAL
  instrumentType   InstrumentType      // SPOT, FUTURES
  symbol           String              // e.g., "BTC/USDT"

  // Position Data
  status           TradeStatus         // OPEN, CLOSED, PARTIAL
  side             TradeSide           // BUY, SELL (LONG, SHORT for Futures)

  // Quantités & Prix
  totalQuantity    Decimal             // Quantité totale de la position
  averageEntry     Decimal             // Prix d'entrée moyen
  averageExit      Decimal?            // Prix de sortie moyen (si fermé)

  // Risk Management
  stopLoss         Decimal?            // NULL pour trades Binance (Phase 1)
  takeProfit       Json?               // Array de TPs, NULL pour Binance

  // Performance
  realizedPnl      Decimal?            // PnL réalisé (si fermé)
  unrealizedPnl    Decimal?            // PnL non-réalisé (si ouvert) - CALCULÉ
  fees             Decimal             // Total des frais

  // Timestamps
  openedAt         DateTime            // Première entrée
  closedAt         DateTime?           // Dernière sortie (si fermé)
  lastActivityAt   DateTime            // Dernière modification

  // Relations
  fills            ExchangeTrade[]     // Raw fills from exchange (si source != MANUAL)
  signals          Signal[]            // Signaux créés depuis ce trade
  copies           CopyTrade[]         // Copies par les utilisateurs

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([traderProfileId, status])
  @@index([symbol])
  @@index([openedAt])
}

// 2. Signal modifié (peut lier à un trade)
model Signal {
  // ... existing fields ...
  linkedTradeId    String?             // NOUVEAU: Lien vers TraderTrade
  linkedTrade      TraderTrade?        // NOUVEAU: Relation
  // ... rest unchanged ...
}

// 3. NOUVEAU: Connection Exchange pour utilisateurs (copy-trading)
model UserExchangeConnection {
  id               String              @id @default(cuid())
  userId           String
  user             User                @relation(...)
  exchange         Exchange            // BINANCE, BYBIT

  // Encrypted API credentials
  encryptedApiKey     String @db.Text
  encryptedSecretKey  String @db.Text
  keyIv               String
  keyTag              String

  // Configuration
  mode             CopyMode            // MANUAL, AUTO
  isActive         Boolean @default(true)

  // Metadata
  lastSyncedAt     DateTime?
  lastError        String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, exchange]) // 1 connection par exchange pour users
}

// 4. NOUVEAU: Journal de Copy Trading
model CopyTrade {
  id               String              @id @default(cuid())
  userId           String
  user             User                @relation(...)

  // Source
  originalTradeId  String              // TraderTrade.id
  originalTrade    TraderTrade         @relation(...)

  // Copy Configuration
  mode             CopyMode            // MANUAL, AUTO
  status           CopyStatus          // PENDING, EXECUTED, FAILED, CANCELLED

  // Execution (si AUTO)
  exchangeOrderId  String?             // ID de l'ordre sur Binance/Bybit
  executedPrice    Decimal?            // Prix réel d'exécution
  executedQuantity Decimal?            // Quantité réelle exécutée
  slippage         Decimal?            // Différence avec le trade original

  // Manual tracking (si MANUAL)
  manualEntry      Decimal?            // Prix d'entrée manuel
  manualExit       Decimal?            // Prix de sortie manuel
  manualPnl        Decimal?            // PnL calculé manuellement
  notes            String?             // Notes personnelles

  // Risk Management
  stopLoss         Decimal?            // SL personnalisé
  takeProfit       Json?               // TPs personnalisés

  // Timestamps
  copiedAt         DateTime @default(now())
  executedAt       DateTime?           // Si AUTO et exécuté
  closedAt         DateTime?           // Quand fermé

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId, status])
  @@index([originalTradeId])
}

// 5. Enums
enum TradeSource {
  BINANCE
  BYBIT
  MANUAL
}

enum InstrumentType {
  SPOT
  FUTURES
}

enum TradeStatus {
  OPEN
  CLOSED
  PARTIAL    // Partiellement fermé
}

enum CopyMode {
  MANUAL     // Journal personnel, pas d'exécution
  AUTO       // Exécution automatique via API
}

enum CopyStatus {
  PENDING    // En attente d'exécution
  EXECUTED   // Exécuté avec succès
  FAILED     // Échec de l'exécution
  CANCELLED  // Annulé par l'utilisateur
}
```

## 📐 Algorithme de Détection de Sessions

### Concept: Session Trading
Une "session" représente un cycle complet d'entrée/sortie sur un instrument. L'algorithme détecte automatiquement les sessions indépendantes depuis les fills bruts.

### Règles de Découpage de Session

```typescript
interface SessionDetectionRules {
  // Règle 1: Gap temporel
  maxGapHours: 24,          // Nouveau trade si >24h depuis dernière activité

  // Règle 2: Position nette nulle
  checkNetZero: true,       // Nouveau trade si quantity nette = 0

  // Règle 3: Changement d'instrument
  checkInstrument: true,    // Nouveau trade si changement de type (SPOT↔FUTURES)

  // Règle 4: Inversion de direction (Futures uniquement)
  checkDirectionFlip: true  // Nouveau trade si LONG→SHORT ou SHORT→LONG
}

// Algorithme
function detectTradingSessions(fills: ExchangeTrade[]): TraderTrade[] {
  const sessions: TraderTrade[] = [];
  let currentSession: TraderTrade | null = null;

  for (const fill of fills.sort(f => f.executedAt)) {
    // Déterminer si ce fill démarre une nouvelle session
    const startsNewSession =
      !currentSession ||
      // Règle 1: Gap > 24h
      (fill.executedAt - currentSession.lastActivityAt > 24*3600*1000) ||
      // Règle 2: Position fermée (net = 0) et nouveau trade
      (currentSession.netQuantity === 0) ||
      // Règle 3: Changement d'instrument
      (detectInstrumentType(fill) !== currentSession.instrumentType) ||
      // Règle 4: Inversion Futures (LONG→SHORT)
      (currentSession.instrumentType === 'FUTURES' &&
       detectDirection(fill) !== currentSession.side);

    if (startsNewSession) {
      // Finaliser la session précédente
      if (currentSession) {
        currentSession.status = currentSession.netQuantity === 0 ? 'CLOSED' : 'PARTIAL';
        sessions.push(currentSession);
      }
      // Démarrer nouvelle session
      currentSession = createNewSession(fill);
    } else {
      // Ajouter le fill à la session courante
      aggregateFillIntoSession(currentSession, fill);
    }
  }

  // Finaliser dernière session
  if (currentSession) {
    currentSession.status = currentSession.netQuantity === 0 ? 'CLOSED' : 'OPEN';
    sessions.push(currentSession);
  }

  return sessions;
}
```

### Cas de Test à Couvrir

```typescript
describe('Session Detection Algorithm', () => {
  it('should handle partial close (50% exit)', () => {
    // BUY 1 BTC, then SELL 0.5 BTC → Session reste OPEN avec 0.5 BTC
  });

  it('should handle DCA (Dollar Cost Averaging)', () => {
    // BUY 0.5, BUY 0.3, BUY 0.2 → Une seule session avec averageEntry pondéré
  });

  it('should detect new session after 24h gap', () => {
    // BUY 1 BTC, wait 25h, BUY 1 BTC → 2 sessions distinctes
  });

  it('should detect new session on full close + reopen', () => {
    // BUY 1, SELL 1 (net=0), BUY 1 → 2 sessions (CLOSED + OPEN)
  });

  it('should handle Futures direction flip', () => {
    // LONG 1 BTC, then SHORT 1 BTC → 2 sessions distinctes
  });

  it('should aggregate complex multi-fill patterns', () => {
    // BUY 0.3, BUY 0.2, SELL 0.1, BUY 0.4, SELL 0.8 → 1 session CLOSED
  });
});
```

## 💰 Calcul du PnL

### Spot Trading (FIFO - First In First Out)

```typescript
function calculateSpotPnL(fills: ExchangeTrade[]): number {
  const buyQueue: {quantity: number, price: number}[] = [];
  let realizedPnL = 0;

  for (const fill of fills.sort(f => f.executedAt)) {
    if (fill.side === 'BUY') {
      buyQueue.push({quantity: fill.quantity, price: fill.price});
    } else { // SELL
      let remainingToSell = fill.quantity;

      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0];
        const soldQuantity = Math.min(remainingToSell, oldestBuy.quantity);

        // PnL = (sellPrice - buyPrice) * quantity - fees
        realizedPnL += (fill.price - oldestBuy.price) * soldQuantity;

        remainingToSell -= soldQuantity;
        oldestBuy.quantity -= soldQuantity;

        if (oldestBuy.quantity === 0) {
          buyQueue.shift();
        }
      }
    }

    // Soustraire les frais
    realizedPnL -= fill.fee * getUSDValue(fill.feeAsset);
  }

  return realizedPnL;
}
```

### Futures Trading

```typescript
function calculateFuturesPnL(fills: ExchangeTrade[]): number {
  // Pour Futures, utiliser directement realizedPnl de l'exchange
  return fills.reduce((sum, fill) => sum + (fill.realizedPnl || 0), 0);
}
```

### UnrealizedPnL (Calculé, pas stocké)

```typescript
// Calculé à la volée avec cache 5min
async function getUnrealizedPnL(trade: TraderTrade): Promise<number> {
  if (trade.status === 'CLOSED') return 0;

  const cacheKey = `upnl:${trade.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return parseFloat(cached);

  const currentPrice = await getMarketPrice(trade.symbol);
  const netQuantity = trade.totalQuantity; // Ajusté par fills

  let unrealizedPnL: number;
  if (trade.instrumentType === 'SPOT') {
    // Spot: (currentPrice - averageEntry) * quantity
    unrealizedPnL = (currentPrice - trade.averageEntry) * netQuantity;
  } else {
    // Futures: Tenir compte de la direction
    const priceMove = trade.side === 'LONG'
      ? (currentPrice - trade.averageEntry)
      : (trade.averageEntry - currentPrice);
    unrealizedPnL = priceMove * netQuantity * getContractMultiplier(trade.symbol);
  }

  await redis.setex(cacheKey, 300, unrealizedPnL.toString()); // Cache 5min
  return unrealizedPnL;
}
```

## 🚦 Stratégie "Genesis Trade"

### Gestion des Portfolios Existants

Pour les traders ayant déjà des trades dans la DB lors du déploiement:

```typescript
enum GenesisStrategy {
  EMPTY_PORTFOLIO = 'empty',     // Défaut: Supposer portfolio vide au T0
  SNAPSHOT_IMPORT = 'snapshot',  // Import manuel du portfolio initial
  FIRST_TRADE_BASELINE = 'first' // Premier trade = baseline
}

// Stratégie par défaut: EMPTY_PORTFOLIO
async function handleGenesisForExistingData(connection: ExchangeConnection) {
  const strategy = process.env.GENESIS_STRATEGY || 'empty';

  switch(strategy) {
    case 'empty':
      // Défaut: Traiter tous les trades comme partant de 0
      // Les premiers trades peuvent montrer des positions "négatives" temporairement
      // mais se corrigeront avec le temps
      await aggregateAllTradesFromZero(connection);
      break;

    case 'snapshot':
      // Option manuelle: Trader fournit son portfolio actuel
      // On crée un "Genesis Trade" synthétique représentant l'état initial
      const snapshot = await promptTraderForPortfolioSnapshot();
      await createGenesisTrade(connection, snapshot);
      await aggregateTradesFromGenesis(connection);
      break;

    case 'first':
      // Le premier trade historique devient la baseline
      // Utile si le trader a commencé avec un portfolio vide
      const firstTrade = await getFirstTrade(connection);
      await aggregateTradesFromDate(connection, firstTrade.executedAt);
      break;
  }
}

// Log pour transparence
async function createGenesisTrade(connection: ExchangeConnection, snapshot: PortfolioSnapshot) {
  await prisma.traderTrade.create({
    data: {
      traderProfileId: connection.traderProfileId,
      source: 'MANUAL',
      symbol: 'GENESIS',
      instrumentType: 'SPOT',
      status: 'CLOSED',
      side: 'BUY',
      totalQuantity: 0,
      averageEntry: 0,
      realizedPnl: snapshot.totalValue, // Valeur initiale du portfolio
      notes: `Genesis Trade: Portfolio initial de ${snapshot.totalValue} USD`,
      openedAt: snapshot.date,
      closedAt: snapshot.date,
    }
  });
}
```

**Décision pour MVP**: Utiliser `EMPTY_PORTFOLIO` (défaut) - Simple et sans intervention manuelle.

## ⚠️ Limitations Phase 1

### Stop Loss & Take Profit

**IMPORTANT**: Les API `fetchMyTrades()` de Binance/Bybit ne retournent QUE les trades exécutés, pas les ordres ouverts.

```typescript
// Ce qu'on peut récupérer en Phase 1
interface ExchangeTradeData {
  orderId: string;      // ✅ ID de l'ordre
  symbol: string;       // ✅ Symbole
  side: 'buy' | 'sell'; // ✅ Direction
  price: number;        // ✅ Prix d'exécution
  quantity: number;     // ✅ Quantité
  fee: number;          // ✅ Frais

  stopLoss?: number;    // ❌ NON DISPONIBLE via fetchMyTrades
  takeProfit?: number;  // ❌ NON DISPONIBLE via fetchMyTrades
}

// Phase 1: SL/TP = NULL pour trades Binance/Bybit
const traderTrade = {
  // ... autres champs ...
  stopLoss: null,        // Toujours NULL en Phase 1
  takeProfit: null,      // Toujours NULL en Phase 1
  // Note UI: "SL/TP automatique disponible dans une future mise à jour"
};

// Phase 6 (Future): Utiliser fetchOpenOrders() + fetchPositions()
async function syncStopLossTakeProfit(exchange: ccxt.Exchange) {
  // FUTUR: Récupérer les ordres conditionnels
  const openOrders = await exchange.fetchOpenOrders();
  const stopOrders = openOrders.filter(o => o.type === 'stop_loss_limit');
  const takeProfitOrders = openOrders.filter(o => o.type === 'take_profit_limit');

  // FUTUR: Matcher avec les positions ouvertes
  const positions = await exchange.fetchPositions(); // Futures seulement
  // ... logique de matching ...
}
```

### UI Implications

```tsx
// Composant TraderTradeCard
function TraderTradeCard({ trade }: { trade: TraderTrade }) {
  return (
    <Card>
      {/* ... autres infos ... */}

      {/* SL/TP pour trades manuels */}
      {trade.source === 'MANUAL' && (
        <>
          <div>SL: {trade.stopLoss || 'Non défini'}</div>
          <div>TP: {trade.takeProfit?.join(', ') || 'Non défini'}</div>
        </>
      )}

      {/* SL/TP pour trades Binance/Bybit */}
      {trade.source !== 'MANUAL' && (
        <div className="text-muted-foreground">
          <InfoIcon className="inline w-4 h-4" />
          <span>SL/TP: Synchronisation automatique à venir</span>
          <Tooltip>
            Les stops et take profits placés sur {trade.source} ne sont pas
            encore synchronisés. Cette fonctionnalité arrivera dans une
            prochaine mise à jour.
          </Tooltip>
        </div>
      )}
    </Card>
  );
}
```

## 🎚️ Circuit Breakers (Copy Trading Beta)

### Mesures de Sécurité

```typescript
// 1. Feature Flags
const COPY_TRADING_FLAGS = {
  ENABLED: process.env.COPY_TRADING_ENABLED === 'true',
  AUTO_MODE_ENABLED: process.env.COPY_AUTO_ENABLED === 'true',
  MAX_USERS_BETA: parseInt(process.env.COPY_BETA_LIMIT || '100'),
  MAX_COPY_VALUE_USD: parseFloat(process.env.MAX_COPY_VALUE || '1000'),
  MAX_DAILY_COPIES: parseInt(process.env.MAX_DAILY_COPIES || '10'),
};

// 2. Circuit Breakers
interface CircuitBreaker {
  maxLossPercent: number;      // Stop si perte > X%
  maxDailyTrades: number;       // Max trades par jour
  maxPositionSize: number;      // Max taille position USD
  cooldownMinutes: number;      // Délai entre trades
  requireConfirmation: boolean; // Confirmation manuelle requise
}

// 3. Beta User Limits
async function canUserJoinCopyBeta(userId: string): Promise<boolean> {
  const betaUsers = await prisma.copyTrade.findMany({
    where: { mode: 'AUTO' },
    distinct: ['userId'],
  });

  return betaUsers.length < COPY_TRADING_FLAGS.MAX_USERS_BETA;
}

// 4. Risk Monitoring
async function monitorCopyTradeRisk(copyTrade: CopyTrade) {
  const user = await prisma.user.findUnique({ where: { id: copyTrade.userId }});
  const recentLosses = await calculateRecentLosses(user.id, '24h');

  if (recentLosses > user.maxDailyLoss) {
    await disableAutoCopy(user.id);
    await sendRiskAlert(user.email, 'Daily loss limit reached');
  }
}

// 5. Gradual Rollout
const ROLLOUT_PHASES = {
  PHASE_1: { users: 10, maxValue: 100, mode: 'MANUAL' },   // Manual seulement
  PHASE_2: { users: 50, maxValue: 500, mode: 'BOTH' },     // Manual + Auto limité
  PHASE_3: { users: 200, maxValue: 1000, mode: 'BOTH' },   // Expansion
  PHASE_4: { users: null, maxValue: null, mode: 'BOTH' },  // GA
};
```

## 🚀 Plan d'Implémentation

### Phase 1: Core Models & Aggregation (5-6 jours)
- [ ] Créer migration TraderTrade, UserExchangeConnection, CopyTrade
- [ ] Implémenter SessionDetectionService
- [ ] Créer FillAggregationService
- [ ] Ajouter linkedTradeId à Signal
- [ ] Tests unitaires algorithme de session

### Phase 2: Sync & Performance (3-4 jours)
- [ ] Modifier ExchangeSyncService pour appeler aggregation
- [ ] Implémenter PnL calculators (Spot FIFO, Futures)
- [ ] Ajouter cache Redis pour UnrealizedPnL
- [ ] Créer ManualTradeService pour trades manuels
- [ ] Optimisation: Incremental aggregation

### Phase 3: Signal Integration (2-3 jours)
- [ ] UI: "Partager comme signal" sur TraderTrade
- [ ] Modifier create-signal-form pour lier à TraderTrade
- [ ] Update signal-card pour afficher trade source
- [ ] Webhook Discord avec infos du trade lié

### Phase 4: Copy Trading Manual (3-4 jours)
- [ ] UI: User exchange connections page
- [ ] CopyTrade journal UI (liste des copies)
- [ ] Manual copy form (entry, exit, PnL)
- [ ] Performance dashboard copies

### Phase 5: Copy Trading Auto Beta (4-5 jours)
- [ ] WebSocket service pour real-time sync
- [ ] Order execution service (Binance/Bybit)
- [ ] Circuit breakers implementation
- [ ] Beta user enrollment UI
- [ ] Monitoring & alerting

### Phase 6: Future - SL/TP Sync (différé)
- [ ] Implémenter fetchOpenOrders polling
- [ ] Matcher ordres conditionnels avec positions
- [ ] UI pour afficher SL/TP réels
- [ ] Propagation modifications aux copy-traders

## 📊 Métriques de Succès

### Phase 1-3 (2 semaines)
- ✅ 100% des trades agrégés en positions
- ✅ PnL calculé correctement (tests vs exchange)
- ✅ Signaux liés aux trades réels
- ✅ Performance < 500ms pour aggregation

### Phase 4-5 (1 semaine)
- ✅ 50+ beta users en copy manual
- ✅ 10 beta users en copy auto
- ✅ 0 incidents de sécurité
- ✅ Latence copy < 2 secondes

### Long terme
- 📈 30% des utilisateurs utilisent copy-trading
- 📈 50% des signaux proviennent de trades réels
- 📈 NPS > 50 pour copy-traders

## 🔄 Migration & Rétrocompatibilité

### Données Existantes
```sql
-- Les ExchangeTrade existants restent intacts
-- On crée les TraderTrade par aggregation
INSERT INTO TraderTrade
SELECT aggregate_fills(*) FROM ExchangeTrade
GROUP BY session_rules;

-- Les Signals existants restent compatibles
-- linkedTradeId = NULL pour anciens signaux manuels
UPDATE Signal SET linkedTradeId = NULL WHERE createdAt < deployment_date;
```

### Rollback Plan
```typescript
// Feature flags permettent rollback instant
if (!COPY_TRADING_FLAGS.ENABLED) {
  // Masquer UI copy-trading
  // Continuer avec système actuel
}

// Les nouvelles tables n'impactent pas l'existant
// Peut être désactivé sans perte de données
```

## 🎯 Definition of Done

### Must Have (MVP)
- [ ] TraderTrade agrège correctement les fills
- [ ] Algorithme de session avec tests exhaustifs
- [ ] PnL calculé = PnL exchange (±0.1% tolérance)
- [ ] Signaux liables aux trades
- [ ] Copy manual fonctionnel (journal)
- [ ] Documentation API complète

### Nice to Have (Post-MVP)
- [ ] Copy auto beta (10 users)
- [ ] WebSocket real-time
- [ ] SL/TP sync (Phase 6)
- [ ] Mobile app support

## 📝 Notes Techniques

### Décisions Architecturales
1. **TraderTrade central**: Évite la pollution d'ExchangeTrade avec données métier
2. **Signal → Trade (pas l'inverse)**: Permet multiples signaux par trade
3. **UserExchangeConnection séparé**: Préserve les multiples connexions Ultra
4. **UnrealizedPnL calculé**: Évite les mises à jour DB fréquentes
5. **Session detection**: Algorithme déterministe avec règles claires

### Risques Identifiés
1. **Performance aggregation**: Mitigé par incremental processing
2. **Slippage copy-trading**: Mitigé par circuit breakers
3. **API rate limits**: Mitigé par WebSocket + cache
4. **Complexité UI**: Mitigé par rollout progressif

### Dépendances
- Redis (cache UnrealizedPnL)
- WebSocket server (copy auto)
- Monitoring (Sentry, Datadog)

## 🔗 Références

- [Binance Spot API](https://binance-docs.github.io/apidocs/spot/en/)
- [Binance Futures API](https://binance-docs.github.io/apidocs/futures/en/)
- [Bybit API V5](https://bybit-exchange.github.io/docs/v5/intro)
- [CCXT Documentation](https://docs.ccxt.com/)

---

**Estimation Totale**: 17-22 jours (3-4 semaines)
**Priorité**: P0 - Critique pour différenciation produit
**Impact**: Unifie l'expérience trading et débloque le copy-trading

*Cette issue épique sera décomposée en sous-issues par phase pour un suivi granulaire.*