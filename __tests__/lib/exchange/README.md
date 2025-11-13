# Exchange Native Services Tests

Tests unitaires complets pour les services Binance et Bybit utilisant les SDK natifs.

## 📊 Couverture

### BinanceNativeService (21 tests)
- ✅ `fetchConsolidatedBalance` - Spot + Futures combinés
- ✅ `fetchOpenPositions` - Positions futures avec filtrage
- ✅ `createOrder` - Spot limit + Futures market
- ✅ `cancelOrder` - Par orderId/clientOrderId
- ✅ `getOrderStatus` - Tous les statuts (NEW, FILLED, PARTIALLY_FILLED)
- ✅ `testConnection` - Validation API keys read-only
- ✅ `fetchRecentTrades` - Spot + Futures avec gestion erreurs
- ✅ `close` - Fermeture gracieuse

### BybitNativeService (20 tests)
- ✅ `fetchConsolidatedBalance` - Compte UNIFIED (Spot + Linear combinés)
- ✅ `fetchOpenPositions` - Positions linear avec filtrage
- ✅ `createOrder` - Spot limit + Linear market
- ✅ `cancelOrder` - Par orderId/orderLinkId
- ✅ `getOrderStatus` - Via `getActiveOrders`
- ✅ `testConnection` - Via `getQueryApiKey`
- ✅ `fetchRecentTrades` - Spot + Linear avec closedSize
- ✅ `close` - Fermeture gracieuse

## 🚀 Exécution

### Localement

```bash
# Tous les tests exchange (run once)
pnpm test:exchange

# Mode watch pour développement
pnpm test:exchange:watch

# Test spécifique
pnpm vitest binance-native-service.test.ts
pnpm vitest bybit-native-service.test.ts
```

### CI/CD

Les tests sont automatiquement exécutés dans GitHub Actions via un job dédié :

**Job:** `exchange-tests`
- **Trigger:** Sur chaque push/PR
- **Timeout:** 10 minutes
- **Dépendances:** `lint-and-typecheck`
- **Statut:** Bloquant (doit passer pour merge)

## 🏗️ Structure des Tests

### Pattern de Mocking

Les tests utilisent Vitest pour mocker les SDK natifs :

**Binance:**
```typescript
vi.mock("binance", () => ({
  MainClient: vi.fn(),    // Spot/Margin
  USDMClient: vi.fn(),    // USD-M Futures
}));
```

**Bybit:**
```typescript
vi.mock("bybit-api", () => ({
  RestClientV5: vi.fn(),  // API V5 unifiée
}));
```

### Organisation

Chaque suite de tests couvre :
1. **Setup** - Mock des clients SDK
2. **Tests positifs** - Comportements attendus
3. **Tests négatifs** - Gestion d'erreurs
4. **Tests edge cases** - Cas limites (empty data, etc.)

## 📝 Spécificités d'Implémentation

### Binance

- **Compte séparé:** Spot (MainClient) + Futures (USDMClient)
- **Balance:** 2 appels API distincts
- **Statuts:** Mapping `status` → `OrderStatus`
- **Trades:** `getAccountTradeList` (spot) + `getAccountTrades` (futures)

### Bybit

- **Compte UNIFIED:** 1 seul appel API pour tout
- **Balance:** `getWalletBalance({ accountType: "UNIFIED" })`
- **Statuts:** Mapping `orderStatus` → `OrderStatus`
- **Trades:** `getExecutionList` avec `category: "spot"` ou `"linear"`
- **Connection test:** Utilise `getQueryApiKey` pas `getWalletBalance`

## 🎯 Objectifs de Qualité

- ✅ **100% de couverture** des méthodes publiques
- ✅ **Tests isolés** via mocking complet des SDK
- ✅ **Pas d'appels API réels** en tests unitaires
- ✅ **Tests rapides** (~15ms par suite)
- ✅ **Indépendance** - Aucune dépendance entre tests

## 🐛 Troubleshooting

### Erreur "Mock not found"

Si vous voyez `TypeError: Cannot read properties of undefined`:
- Vérifiez que le mock est défini **avant** l'import du service
- Utilisez `vi.mock()` au top-level du fichier de test

### Tests qui passent localement mais échouent en CI

- Vérifiez les variables d'environnement
- Les tests exchange ne nécessitent **aucune** env var (mocks purs)

### Performance

Si les tests sont lents (>100ms par suite):
- Vérifiez qu'aucun appel API réel n'est fait
- Confirmez que tous les clients SDK sont bien mockés

## 📚 Ressources

- [Binance SDK Documentation](https://www.npmjs.com/package/binance)
- [Bybit SDK Documentation](https://www.npmjs.com/package/bybit-api)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

## 🔄 Maintenance

Pour ajouter de nouveaux tests :

1. Identifiez la méthode à tester
2. Ajoutez le mock approprié dans `beforeEach`
3. Créez les cas de test (succès + erreurs)
4. Vérifiez que le test passe : `pnpm test:exchange`
5. Committez et poussez (CI validera automatiquement)

---

**Dernière mise à jour:** Novembre 2025
**Auteur:** MyCryptoPilot Team
**Status:** ✅ Production Ready
