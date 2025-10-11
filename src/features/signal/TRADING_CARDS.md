# Trading Cards - Format & Specifications

**Version**: 1.0
**Last Updated**: 9 octobre 2025

---

## Vue d'ensemble

Les **Trading Cards** sont le format structuré utilisé par MyCryptoPilot pour représenter les signaux de trading. Elles contiennent toutes les informations nécessaires pour qu'un utilisateur puisse reproduire un trade avec confiance et gestion du risque appropriée.

---

## Structure d'une Trading Card

### Schéma Complet

```typescript
{
  // Type d'instrument
  instrumentType: "SPOT" | "PERP",

  // Direction du trade
  bias: "LONG" | "SHORT",

  // Prix d'entrée
  entry: number,

  // Niveau d'invalidation (stop loss)
  invalidation: number,

  // Take profits (1 à 5 niveaux)
  tps: number[],

  // Bande de levier suggérée
  leverageBand: string,  // ex: "1-5x", "5-10x"

  // Niveau de risque (1-5)
  // 1 = Très faible risque
  // 5 = Risque extrême
  risk: 1 | 2 | 3 | 4 | 5,

  // Niveau de confiance (0-100%)
  confidence: number,

  // Rationales (justifications du signal)
  rationales: string[],  // 1 à 5 rationales

  // Régime de marché
  regime: string,  // "Bull", "Bear", "Ranging", "Volatile"

  // Généré par AI ou Humain
  managedBy: "AI" | "HUMAN",

  // Version du format
  version: "1.0"
}
```

---

## Exemples

### Exemple 1: Long BTC (Risk Level 2, PERP)

```json
{
  "instrumentType": "PERP",
  "bias": "LONG",
  "entry": 50000,
  "invalidation": 48000,
  "tps": [52000, 54000, 56000],
  "leverageBand": "1-5x",
  "risk": 2,
  "confidence": 75,
  "rationales": [
    "Strong support at 48k confirmed by volume profile",
    "Bullish divergence on 4H RSI",
    "Funding rate turning positive"
  ],
  "regime": "Bull",
  "managedBy": "HUMAN",
  "version": "1.0"
}
```

**Métriques**:

- Risk distance: 4% (2000/50000)
- Average reward: 8% (avg of TPs)
- Risk/Reward ratio: 2:1

**Optimal Position Size** (pour 10k USD account, 2% risk):

- Risk amount: 200 USD
- Position size: 5000 USD
- Position units: 0.1 BTC
- With 5x leverage: 1000 USD collateral

---

### Exemple 2: Short ETH (Risk Level 4, PERP)

```json
{
  "instrumentType": "PERP",
  "bias": "SHORT",
  "entry": 3000,
  "invalidation": 3150,
  "tps": [2850, 2700],
  "leverageBand": "1-3x",
  "risk": 4,
  "confidence": 60,
  "rationales": [
    "Resistance at 3150 held 3 times",
    "Bearish engulfing candle on daily",
    "High funding rate indicates overleveraged longs"
  ],
  "regime": "Bear",
  "managedBy": "AI",
  "version": "1.0"
}
```

**Métriques**:

- Risk distance: 5% (150/3000)
- Average reward: 8.3% (avg of TPs)
- Risk/Reward ratio: 1.66:1

---

### Exemple 3: Spot Buy SOL (Risk Level 1)

```json
{
  "instrumentType": "SPOT",
  "bias": "LONG",
  "entry": 150,
  "invalidation": 140,
  "tps": [165, 180, 200],
  "leverageBand": "1x",
  "risk": 1,
  "confidence": 85,
  "rationales": [
    "Accumulation zone confirmed",
    "Strong fundamentals (upcoming upgrade)",
    "Whale accumulation detected on-chain"
  ],
  "regime": "Ranging",
  "managedBy": "HUMAN",
  "version": "1.0"
}
```

**Métriques**:

- Risk distance: 6.67% (10/150)
- Average reward: 21.1% (avg of TPs)
- Risk/Reward ratio: 3.17:1

---

## Règles de Validation

### 1. Cohérence des Prix

**Pour LONG**:

- `invalidation < entry < tous les TPs`
- Stop loss en dessous de l'entrée
- Take profits au-dessus de l'entrée

**Pour SHORT**:

- `invalidation > entry > tous les TPs`
- Stop loss au-dessus de l'entrée
- Take profits en dessous de l'entrée

### 2. Risk Levels

| Level | Description | Use Case                                       |
| ----- | ----------- | ---------------------------------------------- |
| 1     | Très faible | Setup avec haute probabilité, stop large       |
| 2     | Faible      | Setup confirmé, bonne RR                       |
| 3     | Moyen       | Setup standard, conditions normales            |
| 4     | Élevé       | Setup spéculatif, conditions incertaines       |
| 5     | Extrême     | High risk/high reward, taille position réduite |

### 3. Limitations

- **Take Profits**: 1 à 5 niveaux maximum
- **Rationales**: 1 à 5 justifications maximum
- **Confidence**: 0-100%
- **Risk**: 1-5
- **Leverage band**: String format (ex: "1-5x", pas de validation stricte)

### 4. Warnings

Le système génère des warnings pour:

- **Low Risk/Reward** (< 1.5): Trade peu favorable
- **High Risk Distance** (> 10%): Stop très éloigné
- **Tight Stop** (< 1%): Risque de stop-out prématuré

---

## Calculs de Position Sizing

### Formule Générale

```typescript
Risk Amount = Account Size × (Risk % / 100)
Risk Distance % = abs(Entry - Invalidation) / Entry
Position Size = Risk Amount / (Risk Distance % / 100)
Position Units = Position Size / Entry Price
Collateral (with leverage) = Position Size / Leverage
```

### Exemple de Calcul

**Paramètres**:

- Account: 10,000 USD
- Risk: 2%
- Entry: 50,000
- Invalidation: 48,000

**Calcul**:

1. Risk Amount = 10,000 × 0.02 = **200 USD**
2. Risk Distance = (50,000 - 48,000) / 50,000 = **4%**
3. Position Size = 200 / 0.04 = **5,000 USD**
4. Position Units = 5,000 / 50,000 = **0.1 BTC**
5. Avec 5x leverage: 5,000 / 5 = **1,000 USD collateral**

---

## Suggestions de Levier

Le système suggère automatiquement un levier approprié selon:

### 1. Liquidité du Token

| Catégorie        | Tokens                                     | Max Leverage |
| ---------------- | ------------------------------------------ | ------------ |
| High Liquidity   | BTC, ETH                                   | 10-20x       |
| Medium Liquidity | SOL, BNB, XRP, ADA, AVAX, MATIC, DOT, LINK | 5-10x        |
| Low Liquidity    | Autres altcoins                            | 2-5x         |

### 2. Ajustements

**Risk Level**:

- Risk 1-2: Levier max conservé
- Risk 3: Réduction -15%
- Risk 4: Réduction -30%
- Risk 5: Réduction -45%

**Stop Distance**:

- < 2%: Réduction -50% (éviter liquidations)
- < 4%: Réduction -25%
- ≥ 4%: Aucune réduction

### 3. Levier Optimal

```typescript
Optimal Leverage = 50% du Max Leverage (conservateur)
```

---

## Utilisation du Code

### Import

```typescript
import {
  calculatePositionSize,
  suggestLeverage,
  validateTradingCard,
  type TradingCardPayloadType,
  type PositionSizeOptions,
  type LeverageSuggestion,
} from "@/features/signal/trading-card-utils";
```

### Calcul Position Size

```typescript
const positionResult = calculatePositionSize({
  accountSize: 10000,
  riskPercentage: 2,
  entryPrice: 50000,
  invalidationPrice: 48000,
  bias: "LONG",
  leverage: 5, // optional, default: 1
});

console.log(positionResult);
// {
//   riskAmount: 200,
//   riskPercentageDistance: 4,
//   positionSizeUSD: 5000,
//   positionSizeUnits: 0.1,
//   collateralRequired: 1000,
//   stopLossUSD: 200
// }
```

### Suggestion Levier

```typescript
const leverageSuggestion = suggestLeverage({
  symbol: "BTC-USDT",
  cardRiskLevel: 3,
  instrumentType: "PERP",
  riskDistancePercentage: 4,
});

console.log(leverageSuggestion);
// {
//   minLeverage: 1,
//   maxLeverage: 10,
//   optimalLeverage: 5,
//   reason: "medium risk BTC trade (high liquidity) with 4.0% stop distance",
//   riskLevel: "MEDIUM"
// }
```

### Validation Trading Card

```typescript
const payload: TradingCardPayloadType = {
  instrumentType: "PERP",
  bias: "LONG",
  entry: 50000,
  invalidation: 48000,
  tps: [52000, 54000, 56000],
  leverageBand: "1-5x",
  risk: 3,
  confidence: 75,
  rationales: ["Strong support", "Bullish divergence"],
  regime: "Bull",
  managedBy: "HUMAN",
  version: "1.0",
};

const validation = validateTradingCard(payload);

if (!validation.isValid) {
  console.error("Errors:", validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn("Warnings:", validation.warnings);
}

console.log("Metrics:", validation.metrics);
// {
//   riskRewardRatio: 2.0,
//   riskPercentage: 4.0,
//   averageTPPercentage: 8.0,
//   nearestTPPercentage: 4.0
// }
```

---

## Intégration avec Prisma

Les Trading Cards sont stockées dans le champ `payloadJson` du modèle `Signal`:

```prisma
model Signal {
  id          String   @id @default(cuid())
  traderId    String
  trader      User     @relation(...)

  symbol      String   // "BTC-USDT", "ETH-USDT"

  // Trading Card payload
  payloadJson Json     // TradingCardPayloadType

  ttlSec      Int      // Time-to-live in seconds
  hash        String   @unique // SHA256 hash

  createdAt   DateTime @default(now())
  expiresAt   DateTime // createdAt + ttlSec
}
```

### Création d'un Signal

```typescript
import { createSignalAction } from "@/features/signal/signal.action";

const result = await createSignalAction({
  symbol: "BTC-USDT",
  ttlSec: 86400, // 24 hours
  payload: {
    instrumentType: "PERP",
    bias: "LONG",
    entry: 50000,
    invalidation: 48000,
    tps: [52000, 54000],
    leverageBand: "1-5x",
    risk: 3,
    confidence: 75,
    rationales: ["Strong support"],
    regime: "Bull",
    managedBy: "HUMAN",
    version: "1.0",
  },
});
```

---

## TTL (Time-To-Live)

Chaque signal a une durée de vie limitée:

- **Minimum**: 1 heure (3600 secondes)
- **Maximum**: 7 jours (604800 secondes)
- **Défaut**: 24 heures (86400 secondes)

Le champ `expiresAt` est calculé automatiquement:

```typescript
expiresAt = createdAt + ttlSec;
```

Les signaux expirés peuvent être filtrés dans les queries:

```typescript
const activeSignals = await listSignals({
  includeExpired: false, // default
});
```

---

## Hash & Intégrité

Chaque signal possède un hash SHA256 pour garantir son intégrité:

```typescript
Hash = SHA256(traderId + symbol + JSON.stringify(payload) + createdAt);
```

Ce hash:

- Empêche les doublons
- Permet de vérifier que le signal n'a pas été modifié
- Peut être utilisé pour timestamping blockchain (feature future)

---

## Best Practices

### Pour les Traders

1. **Toujours fournir des rationales claires** (minimum 2-3)
2. **Utiliser un Risk/Reward >= 1.5** (idéalement 2:1 ou plus)
3. **Adapter le leverage au risk level**:
   - Risk 1-2: Levier normal
   - Risk 3: Levier modéré
   - Risk 4-5: Levier faible
4. **TTL réaliste**: Signals day trading = 6-12h, swing = 24-72h
5. **Multiple TPs**: Préférer 2-3 TPs pour scaling out

### Pour les Followers

1. **Calculer sa position size** avant d'enter
2. **Respecter le stop loss** (invalidation)
3. **Ne pas over-leverage**: Utiliser optimal leverage, pas max
4. **Gérer les TPs**: Scale out progressivement
5. **Vérifier le TTL**: Éviter les signaux proches de l'expiration

---

## Roadmap Features

### Phase 1 (MVP) ✅

- [x] Format structuré validé
- [x] Calculs position size
- [x] Suggestions leverage
- [x] Validation automatique
- [x] Hash & TTL

### Phase 2 (Q1 2026)

- [ ] Composant `TradingCard` React (affichage visuel)
- [ ] Calculateur interactif position size
- [ ] Historique performance par card
- [ ] Notes utilisateur sur signaux

### Phase 3 (Q2 2026)

- [ ] Trading cards personnalisées par follower
- [ ] Blockchain timestamping (immutabilité)
- [ ] Analyse technique automatique
- [ ] Suggestions AI pour améliorer cards

---

## Support & Questions

Pour toute question ou suggestion concernant le format Trading Cards:

- **Issue Tracker**: [GitHub Issues](https://github.com/mycryptopilot/mycryptopilot/issues)
- **Documentation**: `/src/features/signal/TRADING_CARDS.md`
- **Tests**: `/__tests__/trading-card-utils.test.ts`

---

_Document généré pour MyCryptoPilot - Issue #10_
