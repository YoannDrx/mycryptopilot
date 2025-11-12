# 📊 Rapport E2E — Stabilisation MyCryptoPilot

**Date** : 12 novembre 2025  
**Branch observée** : `feature/trading-sidebar-reorganization`  
**Auteur** : Equipe QA (assistée par Codex)

---

## 1. Résultats actuels

| Métrique | Valeur |
| --- | --- |
| Tests Playwright | **84/84 passés** |
| Durée moyenne | 7m45s (3 workers Chromium) |
| Retrys | 0 (suite complète verte) |
| Tests ignorés | 0 (toutes les suites actives) |

Tous les scénarios listés dans `e2e/` couvrent désormais les flux suivants :

- Authentification, dashboard user/trader, navigation globale.
- Marketplace, follow/unfollow, limites Free/Pro/Ultra.
- Crypto checkout + subscriptions (activation, pro-rata, Discord role).
- Portfolio page & tracking (affichage, gating Free/Pro).
- Settings, password reset, signup, invitations/referrals.
- Signals : création, expiration, filtres, notifications email.

---

## 2. Lacunes identifiées (E2E & unitaires)

| Domaine | Couverture actuelle | Manques / idées de tests |
| --- | --- | --- |
| **Exchange connectors** (`src/lib/exchange`, API routes `/api/performance/*`) | Couverture E2E limitée aux scénarios d’affichage; aucun test d’erreur API | • Tests e2e simulant une sync échouée (401/422) pour vérifier les toasts et le retry. <br>• Tests unitaires sur `exchange-sync.service.ts` pour valider le mapping Bybit/Binance (fixtures JSON). |
| **Copy-trading & signaux live** (`src/lib/trading/copy-trade.service.ts`) | Aucun test (unitaires ou e2e) sur l’envoi effectif | • Tests unitaires avec Vitest sur la queue (validation du payload, calcul du sizing). <br>• E2E headless déclenchant `copyTrade` via une action manuelle (mock d’exchange). |
| **Discord automations** (`src/lib/discord/*`) | Couverture manuelle → pas de tests | • Ajouter des tests unitaires qui mockent `discord.js` pour `roles.ts`, `dm-notifications.ts`. <br>• Vérifier les cas d’erreur (bot non initialisé). |
| **Crypto payments — watcher & sweep** (`src/lib/crypto/*`, `scripts/sweep-*`) | E2E couvrent checkout/activation mais pas le watcher ni les scripts CLI | • Tests unitaires sur `payment-watcher.ts` avec fake RPC pour simuler confirmations. <br>• Tests d’intégration (Vitest) pour `address-generator` (Base/Tron). |
| **Better Auth policies** (`src/lib/auth/better-auth-*`) | Quelques tests unitaires (`__tests__/auth-permissions`) mais pas de cas limites | • Ajouter des tests sur les combinaisons rôle/plan (bannis, expired plan). |
| **API routes custom** (`app/api/*`) | Couvertes indirectement via E2E | • Ajouter des tests `@/lib/zod-route` qui valident les schémas (ex : `/api/traders/search`, `/api/follow/is-following`). |

---

## 3. Risques & TODO prioritaires

1. **Nettoyage base de test** : `scripts/run-e2e-tests.sh` reset la DB pour chaque spec ciblée (même en local). Pour accélérer les runs ciblés, prévoir un mode `--reuse-db`.
2. **Prisma disconnects** : les helpers E2E n’appellent plus `$disconnect` (fix appliqué), mais la suite dépend encore d’une seule connexion. Prévoir un wrapper partagé dans `e2e/utils/prisma-test-client.ts` si on ajoute des workers supplémentaires.
3. **Couverture mobile/tablette** : aucune suite Playwright mobile. Ajouter un projet iPhone 14 pour les pages marketing/checkout.

---

## 4. Pistes d’amélioration performance

1. **Réutilisation du serveur Next**  
   - Configurer `PLAYWRIGHT_TEST_BASE_URL` dans `scripts/run-e2e-tests.sh` quand on lance depuis `pnpm dev`. Cela évite le boot Next pour chaque run ciblé.
2. **DB fixtures par lot**  
   - Les helpers créent massivement des données via Prisma. Implémenter des seeds transactionnels (ex : `createSignalsBatch(traderId, count)`) réduit le temps passé à faire 10 insertions séquentielles.
3. **Filtrage des suites CI**  
   - Utiliser `npx playwright test --shard=${{ matrix.shard }}/${{ matrix.total }}` sur GitHub Actions pour paralléliser (2 shards → ~4m).  
   - En local, exposer `pnpm test:e2e:focused path/to/spec.ts` (wrapper autour du runner actuel) pour éviter l’étape « setup-db » quand on reste sur la même spec.
4. **Snapshots partagés**  
   - Les tests `follow-unfollow` et `plan-limits` créent systématiquement 10 signaux. On pourrait créer un utilitaire `ensureTraderWithSignals(cacheKey, count)` pour réutiliser le même trader au sein d’une même spec (mock seeds).

---

## 5. Historique synthétique

| Date | % succès | Points notables |
| --- | --- | --- |
| 8 nov 2025 | 62% (52/84) | Dépoussiérage B2C, suppression des anciens tests « organization ». |
| 11 nov 2025 | 92% (77/84) | Stabilisation follow/unfollow, plan limits, dashboard. |
| 12 nov 2025 | **100% (84/84)** | Suppression des derniers timeouts (`dashboard.spec.ts`, `follow-unfollow.spec.ts`), logs silencieux, DB helpers consolidés. |

---

### Annexes

- Runner : `scripts/run-e2e-tests.sh`
- Résultats bruts : `test-results.log` (dernier run vert)
- Commande de référence : `pnpm test:e2e:ci` (Chromium, 3 workers)

> Ce rapport remplace l’ancienne version (8 nov 2025) qui couvrait la migration B2B/B2C. Toute évolution future doit mettre à jour les tableaux ci-dessus plutôt que de créer un nouveau fichier.***
