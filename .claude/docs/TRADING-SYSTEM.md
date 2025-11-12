# Trading System - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025.

Ce document synthétise le fonctionnement du trading social, depuis la création du profil trader jusqu’à la diffusion des signaux et aux mécanismes de copy-trading/portfolio.

---

## 🧱 Architecture globale

1. **Profils traders** — Créés via `src/features/trader/trader.action.ts`, stockés dans `TraderProfile` (bio, stats agrégées, vérification). Un utilisateur peut basculer `userRole` (`USER`, `TRADER`, `BOTH`).
2. **Signaux** — `Signal` relie un trader (`User`) à un payload TradingCard JSON. Publication côté UI (`app/orgs/[orgSlug]/trader-dashboard`) et diffusion via Discord/webhooks.
3. **Relations followers** — `Follow` conserve l’association follower ↔ trader avec limites par plan (`src/features/follow`).
4. **Trading unifié** — `TraderTrade`, `TraderPerformanceSnapshot`, `ExchangeTrade` et la couche copy-trade orchestrent l’alignement entre signaux manuels et remplissages Binance/Bybit.
5. **Copy-trading utilisateur** — `UserExchangeConnection` + `CopyTrade` pour répliquer les positions (TODO : queue d’exécution auto).
6. **Notifications** — Email (`src/lib/mail`) + Discord (`src/lib/discord`) alimentent followers et administrateurs.

---

## 🌐 Entités clés (prisma/schema.prisma)

| Modèle                      | Rôle                      | Champs notables                                                                  |
| --------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `TraderProfile`             | Profil public             | `statsJson`, `verified`, relation 1–1 avec `User`.                               |
| `Signal`                    | Signal publié             | `payloadJson`, `ttlSec`, `hash`, `linkedTradeId` (vers `TraderTrade`).           |
| `Follow`                    | Relation follower/trader  | `status`, `source`, `invitationId`.                                              |
| `TraderTrade`               | Position agrégée          | Quantités d’entrée/sortie, `source` (`BINANCE`, `BYBIT`, `MANUAL`), `signals[]`. |
| `ExchangeTrade`             | Fill brut exchange        | Utilisé pour compléter `TraderTrade`.                                            |
| `TraderPerformanceSnapshot` | KPI traders               | `period`, `winrate`, `profitFactor`, `maxDrawdown`…                              |
| `UserExchangeConnection`    | Connexion API utilisateur | `mode` (`MANUAL`/`AUTO`), `encrypted*` clés, `isActive`.                         |
| `CopyTrade`                 | Position copiée           | `status` (inclut `CLOSED`), `fills`, `pnl`.                                      |
| `TraderInvitation` & co     | Referral traders          | Voir `.claude/docs/future-features/REFERRAL-SYSTEM.md`.                          |

---

## 🔄 Flots principaux

### 1. Création / gestion du profil trader

- **Actions**: `createTraderProfileAction`, `updateTraderProfileAction`, `toggleTraderRoleAction`.
- **Validation**: Zod schemas dans `src/features/trader/trader.schema.ts`.
- **Stats**: `statsJson` mis à jour via services d’agrégation (portfolio sync + manual trade service).

### 2. Publication d’un signal

1. Formulaire React (`src/features/signals/create-signal-form.tsx`) → server action `createSignalAction`.
2. Payload TradingCard (JSON) enregistré dans `Signal.payloadJson` + TTL par `ttlSec`/`expiresAt`.
3. Optionnel: `linkedTradeId` si un trade agrégé existe (unified trading system).
4. Notifications: `src/lib/mail/send-signal-notification.ts` + Discord webhook via `src/lib/discord/commands`/`signals.ts`.

### 3. Suivre / ne plus suivre

- Actions `followTraderAction` / `unfollowTraderAction` (`src/features/follow/follow.action.ts`).
- Vérifications plan (Free/Pro/Ultra) basées sur `ctx.user.planName` et limites dans `src/lib/crypto/mycryptopilot-plans.ts`.
- Effets secondaires: rôle Discord (free/pro/ultra) appliqué via `assignRoleToUser` lors des upgrades (`src/lib/subscription/subscription-manager.ts`).

### 4. Portfolio tracking & stats vérifiées

- Traders connectent leurs API via `ExchangeConnection` (`src/lib/exchange/binance-service.ts`, `bybit-service.ts`).
- Cron `sync-service.ts` importe les fills, agrège dans `TraderTrade`, calcule les snapshots (`src/lib/trading/portfolio-analytics.service.ts`).
- Admin & traders consultent `app/orgs/[orgSlug]/(trading)/portfolio` + dashboard admin.

### 5. Copy-trading utilisateur

Le système de Copy Trading permet aux utilisateurs de répliquer les trades de traders qu'ils suivent, avec deux modes distincts: **MANUAL** et **AUTO**.

#### 🔄 Modes de Copy Trading

**MANUAL Mode (Journal Personnel)**:

- User copie le signal dans son journal de trading personnel
- Aucune exécution automatique
- Position tracking manuel via `CopyTrade` avec `status: PENDING`
- Idéal pour users qui veulent analyser avant d'exécuter
- **Setup requis**: Aucun - juste un compte MyCryptoPilot

**AUTO Mode (Exécution Automatique)**:

- Exécution automatique via API Binance/Bybit de l'utilisateur
- Réplication en temps réel des positions du trader
- Position sizing ajustée au capital utilisateur
- Circuit breakers intégrés (max position size, daily limits)
- **Setup requis**: `UserExchangeConnection` avec API keys encrypted

#### 🎯 SPOT vs FUTURES Copy Trading

**SPOT Trading**:

```typescript
// Position sizing simple
const spotQuantity = userCapital / entryPrice;
// Exemple: $1000 / $50000 = 0.02 BTC
```

**FUTURES Trading**:

```typescript
// Position sizing avec leverage
const futuresQuantity = (userCapital * leverage) / entryPrice;
// Exemple: ($1000 × 10x) / $50000 = 0.2 BTC
```

**Différences clés**:

- **SPOT**: Pas de liquidation, ownership direct, pas de leverage
- **FUTURES**: Liquidation price tracking, margin requirements, leverage 1-125x
- **Risk**: FUTURES = higher risk/reward, SPOT = lower risk

#### 🔐 Sécurité & Circuit Breakers

**1. Max Position Size**: Limite par copy (ex: $1000)

```typescript
if (copyValue > maxPositionSize) {
  throw new Error("Position size exceeds limit");
}
```

**2. Daily Trade Limit**: Max 10 copies/jour par utilisateur

```typescript
const dailyCopies = await getCopyTradesCountToday(userId);
if (dailyCopies >= 10) {
  throw new Error("Daily copy limit reached");
}
```

**3. Stop Loss Auto**: Désactivation automatique si pertes excessives

```typescript
const dailyPnl = await calculateDailyPnL(userId);
if (dailyPnl < -maxDailyLoss) {
  await disableCopyTrading(userId);
}
```

#### 🔧 Implémentation Technique

**Connexion Exchange**:

- `UserExchangeConnection` stocke API keys encrypted (AES-256-GCM)
- Service: `src/lib/trading/user-exchange-connection.service.ts`
- Validation API avant activation (TODO: validation réelle)

**Copy Execution**:

- Service: `src/lib/trading/copy-trade.service.ts`
- Create `CopyTrade` lors réception signal/trade
- Queue d'exécution pour AUTO mode (TODO: line 191)

**UI Components**:

- `src/components/copy-trading/copy-trade-button.tsx` - Bouton copy avec dialog
- `src/components/copy-trading/copy-trade-dialog.tsx` - Configuration MANUAL/AUTO

#### 📚 Tests & Documentation

**Guide de test complet**: `.claude/docs/UNIFIED-TRADING-SYSTEM-TESTING.md`

**4 Scénarios couverts**:

1. **Copy MANUAL SPOT** - Journal personnel
2. **Copy AUTO SPOT** - Exécution automatique Binance
3. **Copy FUTURES** - Leverage + liquidation tracking
4. **Circuit Breakers** - Tests limites sécurité

**Setup Binance Testnet**: Guide inclus avec génération API keys, env vars, seed DB

**Note**: Pour tester AUTO mode, nécessite compte Binance Testnet + `ENCRYPTION_SECRET` configuré.

### 6. Intégration Discord

- Bot gère `/follow`, `/upgrade`, `/admin-*` via `src/lib/discord/commands`.
- Notifications signaux: `src/lib/discord/webhook.ts` + `send-signal-notification.ts`.
- Canal privé par trader encore à implémenter (`src/lib/discord/user-management.ts:60`).

---

## 📌 Points d’attention

- Vérifier `TODO` listés dans `.claude/CLAUDE.md` (tier-check job, validation API, etc.).
- Les préférences de notifications email ne sont pas encore branchées (futur champ DB requis).
- Les limites de plan sont codées en dur; prévoir une centralisation si nouveaux plans.
- Les scripts `scripts/dev-tools/test-*` permettent de valider la génération d’adresses, le checkout et l’intégration crypto.

---

## 🔗 Documentation associée

- `.claude/docs/DEVELOPMENT.md` — contexte global & roadmap.
- `.claude/docs/PORTFOLIO-TRACKING.md` — détails Bybit/Binance + métriques.
- `.claude/docs/CRYPTO-PAYMENTS.md` — HD wallet, watcher, checkout.
- `.claude/docs/TESTING.md` — scénarios manuels + automatisation.
- `.claude/docs/DISCORD-SETUP.md` — configuration complète du bot.
