# Database Architecture - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025.

MyCryptoPilot s’appuie sur PostgreSQL (Neon en prod, Postgres.app ou Docker en local) et Prisma. Deux schémas sont générés :

- `prisma/schema.prisma` — modèles métier MyCryptoPilot.
- `prisma/better-auth.prisma` — schéma géré par Better Auth (users, sessions, organizations).

Le client Prisma compilé réside dans `src/generated/prisma/` (généré via `pnpm prisma generate`).

---

## 📦 Migrations

- 23 migrations appliquées au 2 nov 2025 (`ls prisma/migrations`).
- Les dernières migrations couvrent l’unified trading system, l’ajout de champs de sweep, les métriques portfolio et le status `CLOSED` pour le copy-trading.
- Vérification rapide :

```bash
pnpm prisma migrate status
# Database schema is up to date! ✅
```

- Les scripts `scripts/setup-test-db.sh` et `scripts/run-e2e-tests.sh` appliquent automatiquement les migrations dans les environnements de test.

---

## 🧩 Groupes de modèles principaux

| Groupe               | Modèles clés                                                                                                   | Description                                                                                                                                                                                                                        | Références code                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Auth & Organisations | `User`, `Organization`, `Member`, `Session`, `Account`                                                         | Fourni par Better Auth. Pattern 1 user = 1 organization (voir `src/lib/auth.ts`).                                                                                                                                                  | `prisma/better-auth.prisma`, `src/lib/auth/*`            |
| Trading Social       | `TraderProfile`, `Signal`, `Follow`, `CopyTrade`, `CopyTradeFill?`, `TraderTrade`, `TraderPerformanceSnapshot` | Profils traders, signaux JSON, relations follower↔trader, historique de trades et calculs de performance. `TraderTrade` stocke les positions agrégées, `TraderPerformanceSnapshot` met en cache les KPI (winrate, max drawdown…). | `src/lib/trading/*`, `app/orgs/[orgSlug]/(trading)`      |
| Portfolio Tracking   | `ExchangeConnection`, `ExchangeTrade`, `UserExchangeConnection`                                                | Connexions Binance/Bybit pour traders et utilisateurs, stockage des fills, suivi de synchronisation (`lastSyncedAt`, `lastEmailSentAt`).                                                                                           | `src/lib/exchange/*`                                     |
| Paiements Crypto     | `CryptoAddress`, `CryptoPayment`                                                                               | Addresses HD dérivées (Base/Tron) et paiements détectés par `payment-watcher`. Champs `sweptAt` et `sweptTxHash` alimentés par `scripts/sweep-to-binance.ts`.                                                                      | `src/lib/crypto/*`, `app/orgs/.../checkout`              |
| Referral & Growth    | `TraderInvitation`, `ReferralCredit`, `ReferralReward`, `ReferralTier`, `FraudLog`                             | Système d’invitations, crédits, paliers et journal de fraude. Certaines features sont planifiées (`.claude/docs/future-features/REFERRAL-SYSTEM.md`).                                                                              | `src/lib/referral/*`, `src/lib/discord/commands/invite*` |
| Feedback & Support   | `Feedback`                                                                                                     | Collecte des retours utilisateurs.                                                                                                                                                                                                 | `src/query/feedback/*`                                   |

> ℹ️ Le type `CopyTrade` inclut un status `CLOSED` ajouté par la migration `20251101092918_add_closed_to_copy_status`.

---

## 🔗 Relations importantes

- `User` ↔ `TraderProfile` (1–1) — champ `userRole` (`USER`, `TRADER`, `BOTH`) dans `User`.
- `TraderProfile` ↔ `ExchangeConnection` (1–n) — une connexion par exchange (`@@unique([traderProfileId, exchange])`).
- `Signal` ↔ `TraderTrade` (optionnel) via `linkedTradeId` pour l’unified trading system.
- `CryptoAddress` ↔ `CryptoPayment` (1–n) — les paiements peuvent être liés à une adresse (champ `addressId` nullable pour compatibilité historique).
- `User` ↔ `UserExchangeConnection` — connexions API users (copy-trading) avec statut `mode` (`MANUAL`/`AUTO`).

---

## 🛠 Commandes utiles

```bash
# Générer le client Prisma
pnpm prisma generate

# Appliquer les migrations en local
pnpm prisma migrate dev

# Inspecter la base (nécessite Prisma CLI)
pnpm prisma studio

# Reset complet (attention: destructive)
pnpm prisma migrate reset
```

Pour les tests automatiques :

```bash
# Préparer la DB de test (postgres local ou Docker)
./scripts/setup-test-db.sh

# Lancer les tests E2E (Playwright)
./scripts/run-e2e-tests.sh
```

---

## 📝 Notes supplémentaires

- Les valeurs par défaut sensibles (ex : champs JSON, décimales) sont gérées via `@prisma/client/runtime`. Penser à utiliser `new Decimal(...)` lors des mises à jour (`scripts/backfill-trader-trade-quantities.ts`).
- `prisma.config.ts` pointe le générateur client vers `src/generated/prisma` pour coller aux imports Next.js edge.
- Les enum Prisma sont consommés via `@/generated/prisma` (ex : `Exchange`, `TradeSide`, `CopyMode`).
- Lors de refactoring destructifs, préférer la commande personnalisée `.claude/commands/migration-rename.md` afin d’éviter les pertes de données.
