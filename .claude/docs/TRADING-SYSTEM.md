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

| Modèle | Rôle | Champs notables |
|--------|------|-----------------|
| `TraderProfile` | Profil public | `statsJson`, `verified`, relation 1–1 avec `User`. |
| `Signal` | Signal publié | `payloadJson`, `ttlSec`, `hash`, `linkedTradeId` (vers `TraderTrade`). |
| `Follow` | Relation follower/trader | `status`, `source`, `invitationId`. |
| `TraderTrade` | Position agrégée | Quantités d’entrée/sortie, `source` (`BINANCE`, `BYBIT`, `MANUAL`), `signals[]`. |
| `ExchangeTrade` | Fill brut exchange | Utilisé pour compléter `TraderTrade`. |
| `TraderPerformanceSnapshot` | KPI traders | `period`, `winrate`, `profitFactor`, `maxDrawdown`… |
| `UserExchangeConnection` | Connexion API utilisateur | `mode` (`MANUAL`/`AUTO`), `encrypted*` clés, `isActive`. |
| `CopyTrade` | Position copiée | `status` (inclut `CLOSED`), `fills`, `pnl`. |
| `TraderInvitation` & co | Referral traders | Voir `.claude/docs/future-features/REFERRAL-SYSTEM.md`. |

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

### 5. Copy-trading utilisateur (WIP)

- Connexion API utilisateur (`UserExchangeConnection`), configuration `mode`.
- `CopyTradeService` crée des `CopyTrade` lors de la réception de nouveaux signaux/trades agrégés.
- TODO: queue d’exécution pour pousser les ordres vers l’exchange utilisateur (`src/lib/trading/copy-trade.service.ts:191`).

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

