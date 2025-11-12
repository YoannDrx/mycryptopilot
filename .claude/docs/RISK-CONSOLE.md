# Risk Console Documentation

**Date**: 4 novembre 2025
**Status**: Phase 1 (MVP) Complete ✅ | Phase 2 In Progress 🚧

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Phase 1 - MVP (Complete)](#phase-1---mvp-complete)
4. [Formules de Calcul](#formules-de-calcul)
5. [Phase 2 - Features Avancées](#phase-2---features-avancées)
6. [Intégration Système](#intégration-système)
7. [Testing Strategy](#testing-strategy)

---

## Vue d'ensemble

La **Risk Console** est l'outil central de gestion du risque de MyCryptoPilot. Elle permet aux traders de calculer automatiquement leur position size idéale en respectant la règle des 2% (ou tout autre pourcentage de risque défini).

### Concept "Risk-First"

**Principe**: Ne jamais risquer plus de 2% de son capital sur un seul trade.

**Pourquoi c'est critique**:

- Avec 2% de risque par trade, vous pouvez survivre à 50 pertes consécutives
- Avec 10% de risque par trade, vous explosez après 10 pertes
- Protection contre le "revenge trading" et l'over-leverage

### Disponibilité

| Plan  | Accès                                               |
| ----- | --------------------------------------------------- |
| FREE  | ❌ Démo sur landing page uniquement (pas de login)  |
| PRO   | ✅ Accès complet authentifié + historique + presets |
| ULTRA | ✅ Accès complet + capital live depuis exchanges    |

**Important**: Cette distinction est maintenant cohérente dans tout le codebase (FAQ, pricing, hero).

---

## Architecture

### Structure des Fichiers

```
app/orgs/[orgSlug]/(trading)/risk-console/
├── page.tsx                                    # Server component avec paywall check
├── _components/
│   ├── risk-console-page-content.tsx          # Client wrapper
│   └── risk-console-paywall.tsx               # Paywall FREE users

src/
├── components/nowts/
│   └── risk-console-calculator.tsx            # 🎯 Core component (761 lignes)
├── features/
│   ├── landing/
│   │   └── risk-console-demo.tsx              # Landing page demo (332 lignes)
│   └── risk-console/                          # 🚧 Phase 2 (à créer)
│       ├── risk-console.action.ts             # Server actions
│       └── risk-console-queries.ts            # Database queries
└── lib/crypto/
    └── mycryptopilot-plans.ts                 # Plan limits (riskConsole: boolean)
```

### Composant Principal

**`risk-console-calculator.tsx`** (761 lignes)

```typescript
type RiskConsoleCalculatorProps = {
  compact?: boolean; // Mode compact pour intégration
  showHistory?: boolean; // Afficher l'historique
  defaultCapital?: number; // Capital par défaut
  onResultChange?: (result: CalculationResult) => void; // Callback results
  className?: string; // Styling
  heading?: React.ReactNode; // Custom header
};

type CalculationResult = {
  capital: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  takeProfits: TakeProfitTarget[];

  // Outputs calculés
  riskAmount: number;
  positionSize: number;
  contracts: number;
  rrRatio: number;
  positionType: "LONG" | "SHORT";
  isValid: boolean;
};
```

**Features implémentées**:

- ✅ 2% rule position sizing
- ✅ Multiple Take Profit targets (jusqu'à 4)
- ✅ Allocation weighted des TPs (25%, 33%, 50%, 100%)
- ✅ Quick allocation presets
- ✅ LONG/SHORT detection automatique
- ✅ Risk/Reward ratio calculation
- ✅ Validation complète des configurations
- ✅ Responsive design (mobile-first)

---

## Phase 1 - MVP (Complete)

### ✅ Démo Landing Page

**Fichier**: `src/features/landing/risk-console-demo.tsx` (332 lignes)

**Features**:

- Accessible sans login (démo publique)
- Calcul position size en temps réel
- Risk/Reward ratio avec validation LONG/SHORT
- 1 Take Profit simple
- Explications intégrées

**Validation R/R Ratio**:

```typescript
// Détection position type
const isLongPosition = stopLossNum < entryPriceNum;
const isShortPosition = stopLossNum > entryPriceNum;

// Validation TP selon position type
if (isLongPosition) {
  isValidConfiguration = takeProfitNum > entryPriceNum; // TP au-dessus Entry
} else if (isShortPosition) {
  isValidConfiguration = takeProfitNum < entryPriceNum; // TP en-dessous Entry
}

// Badge selon R/R ratio
if (rrRatio >= 3) return "Excellent"; // Vert
if (rrRatio >= 2) return "Good"; // Jaune
if (rrRatio >= 1) return "Acceptable"; // Orange
return "Poor"; // Rouge
```

### ✅ Page Authentifiée

**Fichier**: `app/orgs/[orgSlug]/(trading)/risk-console/page.tsx`

**Flow**:

1. Server component récupère le plan de l'user
2. Check `planLimits.riskConsole`
3. Si `false` (FREE) → Affiche `<RiskConsolePaywall />`
4. Si `true` (PRO/ULTRA) → Affiche `<RiskConsolePageContent />`

**Paywall**:

```tsx
export function RiskConsolePaywall() {
  return (
    <Card>
      <CardHeader>
        <Lock className="text-muted-foreground size-12" />
        <CardTitle>Risk Console - Pro/Ultra Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Unlock unlimited access to the Risk Console with calculation history,
          custom presets, and live capital integration.
        </p>
        <Button asChild>
          <Link href="/pricing">Upgrade to Pro</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### ✅ Navigation Integration

**Fichiers modifiés**:

- `app/orgs/[orgSlug]/(trading)/_navigation/trading-links.ts`
- `app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.links.ts`

```typescript
{
  href: "/risk-console",
  label: "Risk Console",
  icon: Calculator,
}
```

---

## Formules de Calcul

### 1. Risk Amount (Montant à Risquer)

```typescript
riskAmount = capital × (riskPercent / 100)
```

**Exemple**:

- Capital: $10,000
- Risk: 2%
- **Risk Amount**: $10,000 × 0.02 = **$200**

### 2. Position Size (Taille de Position)

```typescript
stopLossDistance = |entryPrice - stopLoss|
positionSize = riskAmount / (stopLossDistance / entryPrice)
```

**Exemple LONG**:

- Entry: $42,000
- Stop Loss: $41,000
- Distance: $1,000 (2.38% de $42,000)
- Risk Amount: $200
- **Position Size**: $200 / 0.0238 = **$8,400**

**Exemple SHORT**:

- Entry: $42,000
- Stop Loss: $43,000
- Distance: $1,000 (2.38% de $42,000)
- Risk Amount: $200
- **Position Size**: $200 / 0.0238 = **$8,400**

### 3. Contracts (Quantité à Acheter)

```typescript
contracts = positionSize / entryPrice;
```

**Exemple**:

- Position Size: $8,400
- Entry: $42,000
- **Contracts**: $8,400 / $42,000 = **0.2 BTC**

### 4. Risk/Reward Ratio

```typescript
// LONG
potentialProfit = takeProfit - entryPrice;
potentialLoss = entryPrice - stopLoss;
rrRatio = potentialProfit / potentialLoss;

// SHORT
potentialProfit = entryPrice - takeProfit;
potentialLoss = stopLoss - entryPrice;
rrRatio = potentialProfit / potentialLoss;
```

**Exemple LONG**:

- Entry: $42,000
- TP: $45,000 → Profit: $3,000
- SL: $41,000 → Loss: $1,000
- **R/R Ratio**: 3,000 / 1,000 = **1:3.00** (Excellent ✅)

**Exemple SHORT**:

- Entry: $42,000
- TP: $39,000 → Profit: $3,000
- SL: $43,000 → Loss: $1,000
- **R/R Ratio**: 3,000 / 1,000 = **1:3.00** (Excellent ✅)

### 5. Multiple Take Profit Allocation

```typescript
// User définit allocation pour chaque TP
takeProfits = [
  { price: 44000, allocation: 25 },  // TP1: 25% de la position
  { price: 46000, allocation: 50 },  // TP2: 50% de la position
  { price: 48000, allocation: 25 },  // TP3: 25% de la position
];

// Total allocation doit être = 100%
totalAllocation = takeProfits.reduce((sum, tp) => sum + tp.allocation, 0);
isValid = totalAllocation === 100;

// Calcul weighted R/R ratio
weightedRR = 0;
for (const tp of takeProfits) {
  profit = tp.price - entryPrice;
  loss = entryPrice - stopLoss;
  rrForTP = profit / loss;
  weightedRR += rrForTP × (tp.allocation / 100);
}
```

**Exemple**:

- Entry: $42,000, SL: $41,000
- TP1 (25%): $44,000 → R/R = 2:1
- TP2 (50%): $46,000 → R/R = 4:1
- TP3 (25%): $48,000 → R/R = 6:1
- **Weighted R/R**: (2×0.25) + (4×0.50) + (6×0.25) = **4:1**

---

## Phase 2 - Features Avancées

### 🚧 Task 1: Capital Live depuis Exchanges

**Objectif**: Auto-remplir le capital depuis les exchanges connectés (Binance/Bybit)

**Implémentation**:

#### 1.1. Query getUserExchangeBalance

**Fichier**: `src/features/exchange/exchange-queries.ts` (nouveau)

```typescript
import { BinanceService } from "@/lib/exchange/binance-service";
import { BybitService } from "@/lib/exchange/bybit-service";
import { decryptApiKey } from "@/lib/crypto/encryption-service";
import { prisma } from "@/lib/prisma";

type ExchangeBalance = {
  exchange: "BINANCE" | "BYBIT";
  totalUSDT: number;
  available: number;
  locked: number;
  isActive: boolean;
  lastSync: Date | null;
};

export async function getUserExchangeBalances(
  userId: string,
): Promise<ExchangeBalance[]> {
  const connections = await prisma.userExchangeConnection.findMany({
    where: { userId, isActive: true },
    select: {
      exchange: true,
      encryptedApiKey: true,
      encryptedSecretKey: true,
      keyIv: true,
      keyTag: true,
      lastSyncedAt: true,
    },
  });

  const balances: ExchangeBalance[] = [];

  for (const conn of connections) {
    try {
      // Decrypt API keys
      const apiKey = decryptApiKey(
        conn.encryptedApiKey,
        conn.keyIv,
        conn.keyTag,
      );
      const secretKey = decryptApiKey(
        conn.encryptedSecretKey,
        conn.keyIv,
        conn.keyTag,
      );

      // Fetch balance from exchange
      let service;
      if (conn.exchange === "BINANCE") {
        service = new BinanceService(apiKey, secretKey);
      } else if (conn.exchange === "BYBIT") {
        service = new BybitService(apiKey, secretKey);
      } else {
        continue;
      }

      const balance = await service.exchange.fetchBalance();

      balances.push({
        exchange: conn.exchange,
        totalUSDT: balance.total.USDT ?? 0,
        available: balance.free.USDT ?? 0,
        locked: balance.used.USDT ?? 0,
        isActive: true,
        lastSync: conn.lastSyncedAt,
      });
    } catch (error) {
      console.error(`Failed to fetch balance for ${conn.exchange}:`, error);
      balances.push({
        exchange: conn.exchange,
        totalUSDT: 0,
        available: 0,
        locked: 0,
        isActive: false,
        lastSync: conn.lastSyncedAt,
      });
    }
  }

  return balances;
}
```

#### 1.2. UI Update - Dropdown Capital Source

**Fichier**: `src/components/nowts/risk-console-calculator.tsx`

Ajouter section "Capital Source" avant l'input:

```tsx
// State
const [capitalSource, setCapitalSource] = useState<"manual" | string>("manual");
const [exchangeBalances, setExchangeBalances] = useState<ExchangeBalance[]>([]);

// Fetch balances on mount
useEffect(() => {
  async function fetchBalances() {
    const balances = await fetch("/api/exchange/balances").then((r) =>
      r.json(),
    );
    setExchangeBalances(balances);
  }
  fetchBalances();
}, []);

// UI
<div className="space-y-2">
  <Label>Capital Source</Label>
  <Select
    value={capitalSource}
    onValueChange={(value) => {
      setCapitalSource(value);
      if (value !== "manual") {
        // Auto-fill from exchange
        const balance = exchangeBalances.find((b) => b.exchange === value);
        if (balance) {
          setCapital(balance.available.toString());
        }
      }
    }}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="manual">Manual Input</SelectItem>
      {exchangeBalances.map((balance) => (
        <SelectItem key={balance.exchange} value={balance.exchange}>
          {balance.exchange} - ${balance.available.toFixed(2)}
          {balance.isActive && <Badge className="ml-2">🟢 Live</Badge>}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>;
```

#### 1.3. API Route

**Fichier**: `app/api/exchange/balances/route.ts` (nouveau)

```typescript
import { getRequiredUser } from "@/lib/auth/get-required-user";
import { getUserExchangeBalances } from "@/features/exchange/exchange-queries";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getRequiredUser();
  const balances = await getUserExchangeBalances(user.id);
  return NextResponse.json(balances);
}
```

---

### 🚧 Task 2: Historique des Calculs

**Objectif**: Sauvegarder tous les calculs et permettre de les recharger

**Implémentation**:

#### 2.1. Modèle Prisma

**Fichier**: `prisma/schema/schema.prisma`

```prisma
model RiskCalculation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Inputs
  capital     Decimal  @db.Decimal(20, 2)
  riskPercent Decimal  @db.Decimal(5, 2)
  entryPrice  Decimal  @db.Decimal(20, 8)
  stopLoss    Decimal  @db.Decimal(20, 8)
  positionType String  // LONG, SHORT

  // Take Profit Targets (JSON array)
  takeProfits Json     // [{ price: number, allocation: number }]

  // Outputs (pre-calculated for performance)
  riskAmount       Decimal  @db.Decimal(20, 8)
  positionSize     Decimal  @db.Decimal(20, 8)
  contracts        Decimal  @db.Decimal(20, 8)
  rrRatio          Decimal  @db.Decimal(10, 4)

  // Metadata
  symbol      String?  // BTC-USDT, ETH-USDT (optional)
  notes       String?  @db.Text
  isPreset    Boolean  @default(false) // True si c'est un preset sauvegardé
  presetName  String?  // Nom du preset (ex: "BTC Conservative")

  createdAt   DateTime @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, isPreset])
}

// Extension du modèle User
model User {
  // ... existing fields
  riskCalculations RiskCalculation[]
}
```

**Migration**:

```bash
npx prisma migrate dev --name add-risk-calculation-history
npx prisma generate
```

#### 2.2. Server Action - Save Calculation

**Fichier**: `src/features/risk-console/risk-console.action.ts` (nouveau)

```typescript
"use server";

import { getRequiredUser } from "@/lib/auth/get-required-user";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SaveRiskCalculationSchema = z.object({
  capital: z.number().positive(),
  riskPercent: z.number().min(0.5).max(5),
  entryPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  positionType: z.enum(["LONG", "SHORT"]),
  takeProfits: z.array(
    z.object({
      price: z.number().positive(),
      allocation: z.number().min(0).max(100),
    }),
  ),
  riskAmount: z.number(),
  positionSize: z.number(),
  contracts: z.number(),
  rrRatio: z.number(),
  symbol: z.string().optional(),
  notes: z.string().optional(),
  isPreset: z.boolean().default(false),
  presetName: z.string().optional(),
});

type SaveRiskCalculationType = z.infer<typeof SaveRiskCalculationSchema>;

export async function saveRiskCalculationAction(
  input: SaveRiskCalculationType,
) {
  const user = await getRequiredUser();

  const calculation = await prisma.riskCalculation.create({
    data: {
      userId: user.id,
      capital: input.capital,
      riskPercent: input.riskPercent,
      entryPrice: input.entryPrice,
      stopLoss: input.stopLoss,
      positionType: input.positionType,
      takeProfits: input.takeProfits,
      riskAmount: input.riskAmount,
      positionSize: input.positionSize,
      contracts: input.contracts,
      rrRatio: input.rrRatio,
      symbol: input.symbol,
      notes: input.notes,
      isPreset: input.isPreset,
      presetName: input.presetName,
    },
  });

  return { success: true, calculation };
}
```

#### 2.3. Query - Get User Calculations

**Fichier**: `src/features/risk-console/risk-console-queries.ts` (nouveau)

```typescript
import { prisma } from "@/lib/prisma";
import type { RiskCalculation } from "@prisma/client";

export async function getUserRiskCalculations(
  userId: string,
  limit = 20,
): Promise<RiskCalculation[]> {
  return prisma.riskCalculation.findMany({
    where: { userId, isPreset: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserRiskPresets(
  userId: string,
): Promise<RiskCalculation[]> {
  return prisma.riskCalculation.findMany({
    where: { userId, isPreset: true },
    orderBy: { createdAt: "desc" },
  });
}
```

#### 2.4. Page History

**Fichier**: `app/orgs/[orgSlug]/(trading)/risk-console/history/page.tsx` (nouveau)

```tsx
import { getRequiredUser } from "@/lib/auth/get-required-user";
import { getUserRiskCalculations } from "@/features/risk-console/risk-console-queries";
import { RiskCalculationHistory } from "./_components/risk-calculation-history";

export default async function RiskConsoleHistoryPage() {
  const user = await getRequiredUser();
  const calculations = await getUserRiskCalculations(user.id, 50);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Risk Console History</h1>
      <RiskCalculationHistory calculations={calculations} />
    </div>
  );
}
```

#### 2.5. History Table Component

**Fichier**: `app/orgs/[orgSlug]/(trading)/risk-console/history/_components/risk-calculation-history.tsx` (nouveau)

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { RiskCalculation } from "@prisma/client";
import { format } from "date-fns";

type Props = {
  calculations: RiskCalculation[];
};

export function RiskCalculationHistory({ calculations }: Props) {
  const handleReload = (calc: RiskCalculation) => {
    // Navigate to main risk console with query params
    const params = new URLSearchParams({
      capital: calc.capital.toString(),
      riskPercent: calc.riskPercent.toString(),
      entryPrice: calc.entryPrice.toString(),
      stopLoss: calc.stopLoss.toString(),
      symbol: calc.symbol ?? "",
    });
    window.location.href = `/risk-console?${params.toString()}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Capital</TableHead>
          <TableHead>Position Size</TableHead>
          <TableHead>R/R Ratio</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calculations.map((calc) => (
          <TableRow key={calc.id}>
            <TableCell>{format(calc.createdAt, "MMM dd, HH:mm")}</TableCell>
            <TableCell>{calc.symbol ?? "—"}</TableCell>
            <TableCell>
              <Badge
                variant={
                  calc.positionType === "LONG" ? "default" : "destructive"
                }
              >
                {calc.positionType}
              </Badge>
            </TableCell>
            <TableCell>${calc.capital.toFixed(2)}</TableCell>
            <TableCell>${calc.positionSize.toFixed(2)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  Number(calc.rrRatio) >= 3
                    ? "success"
                    : Number(calc.rrRatio) >= 2
                      ? "warning"
                      : "default"
                }
              >
                1:{calc.rrRatio.toFixed(2)}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReload(calc)}
              >
                Reload
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### 2.6. Auto-save Integration

**Fichier**: `src/components/nowts/risk-console-calculator.tsx`

Ajouter bouton "Save Calculation" en bas de la console:

```tsx
const handleSave = async () => {
  if (!result.isValid) {
    toast.error("Cannot save invalid calculation");
    return;
  }

  const response = await saveRiskCalculationAction({
    capital: result.capital,
    riskPercent: result.riskPercent,
    entryPrice: result.entryPrice,
    stopLoss: result.stopLoss,
    positionType: result.positionType,
    takeProfits: result.takeProfits,
    riskAmount: result.riskAmount,
    positionSize: result.positionSize,
    contracts: result.contracts,
    rrRatio: result.rrRatio,
    symbol: result.symbol,
  });

  if (response.success) {
    toast.success("Calculation saved to history");
  }
};

// UI
<Button onClick={handleSave} variant="outline" className="w-full">
  💾 Save to History
</Button>;
```

---

### 🚧 Task 3: Presets/Templates

**Objectif**: Sauvegarder des configurations favorites pour quick load

**Implémentation**:

#### 3.1. Hardcoded Presets

```typescript
const GLOBAL_PRESETS = [
  {
    name: "Conservative (1%)",
    riskPercent: 1,
    description: "Low risk, high capital preservation",
  },
  {
    name: "Moderate (2%)",
    riskPercent: 2,
    description: "Balanced approach (recommended)",
  },
  {
    name: "Aggressive (3%)",
    riskPercent: 3,
    description: "Higher risk for experienced traders",
  },
];
```

#### 3.2. Save Custom Preset

Ajouter dans `risk-console.action.ts`:

```typescript
export async function saveCustomPresetAction(input: {
  presetName: string;
  capital: number;
  riskPercent: number;
  // ... autres fields
}) {
  const user = await getRequiredUser();

  const preset = await prisma.riskCalculation.create({
    data: {
      userId: user.id,
      isPreset: true,
      presetName: input.presetName,
      // ... rest of data
    },
  });

  return { success: true, preset };
}
```

#### 3.3. UI - Preset Selector

```tsx
<div className="space-y-2">
  <Label>Load Preset</Label>
  <Select onValueChange={handleLoadPreset}>
    <SelectTrigger>
      <SelectValue placeholder="Choose a preset..." />
    </SelectTrigger>
    <SelectContent>
      {/* Global presets */}
      <SelectGroup>
        <SelectLabel>Global Presets</SelectLabel>
        {GLOBAL_PRESETS.map((preset) => (
          <SelectItem key={preset.name} value={preset.name}>
            {preset.name}
          </SelectItem>
        ))}
      </SelectGroup>

      {/* User custom presets */}
      {userPresets.length > 0 && (
        <SelectGroup>
          <SelectLabel>My Presets</SelectLabel>
          {userPresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.presetName}
            </SelectItem>
          ))}
        </SelectGroup>
      )}
    </SelectContent>
  </Select>
</div>;

{
  /* Save Custom Preset Button */
}
<Button onClick={() => setShowSavePresetDialog(true)}>
  ⭐ Save as Custom Preset
</Button>;
```

---

### 🚧 Task 4: Mini-Console dans Create Signal (BONUS)

**Objectif**: Intégrer mini-console dans le formulaire de création de signal

**Implémentation**:

#### 4.1. Integration Point

**Fichier**: `app/orgs/[orgSlug]/(navigation)/dashboard/trader/signals/new/create-signal-form.tsx`

Ajouter section après les champs `entry`, `invalidation`, `takeProfits`:

```tsx
{
  /* Risk Analysis Section */
}
{
  form.watch("entry") && form.watch("invalidation") && (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Calculator className="size-5" />
        Risk Analysis Helper
      </h3>

      <RiskConsoleCalculator
        compact
        defaultCapital={10000}
        onResultChange={(result) => {
          // Auto-populate form with calculated values
          if (result.isValid) {
            form.setValue("positionSizeUSD", result.positionSize);
            form.setValue("rrRatio", result.rrRatio);
          }
        }}
        // Pre-fill with signal data
        entryPrice={form.watch("entry")}
        stopLoss={form.watch("invalidation")}
        takeProfits={form.watch("takeProfits")}
      />

      <p className="text-muted-foreground text-sm">
        This helper shows followers what position size they should use based on
        the 2% rule. It doesn't affect your signal creation.
      </p>
    </div>
  );
}
```

---

## Intégration Système

### Liens avec Autres Features

#### 1. Signals

- Mini-console dans create signal form aide traders à valider R/R ratio
- Afficher position size recommandée sur TradingCard display

#### 2. Copy Trading

- Utiliser risk console pour calculer position size auto sur copy trades
- Respecter max risk défini par user

#### 3. Portfolio Tracking

- Capital live fetch depuis UserExchangeConnection
- Binance/Bybit balance USDT pour auto-fill

#### 4. Discord Bot

- Commande `/risk` pour quick calculation via Discord
- Retourne position size en DM

#### 5. Subscriptions

- FREE: Démo landing only (pas de login)
- PRO: Full access + history + presets
- ULTRA: + Live capital from exchanges

---

## Testing Strategy

### Unit Tests (Vitest)

**Fichier**: `__tests__/risk-console/calculations.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  calculatePositionSize,
  calculateRRRatio,
} from "@/lib/risk-console/utils";

describe("Risk Console Calculations", () => {
  describe("Position Size - LONG", () => {
    it("should calculate correct position size", () => {
      const result = calculatePositionSize({
        capital: 10000,
        riskPercent: 2,
        entryPrice: 42000,
        stopLoss: 41000,
      });

      expect(result.riskAmount).toBe(200);
      expect(result.positionSize).toBeCloseTo(8400, 0);
      expect(result.contracts).toBeCloseTo(0.2, 2);
    });
  });

  describe("R/R Ratio", () => {
    it("should calculate correct ratio for LONG", () => {
      const ratio = calculateRRRatio({
        entryPrice: 42000,
        stopLoss: 41000,
        takeProfit: 45000,
        positionType: "LONG",
      });

      expect(ratio).toBe(3); // 1:3 ratio
    });

    it("should calculate correct ratio for SHORT", () => {
      const ratio = calculateRRRatio({
        entryPrice: 42000,
        stopLoss: 43000,
        takeProfit: 39000,
        positionType: "SHORT",
      });

      expect(ratio).toBe(3); // 1:3 ratio
    });
  });
});
```

### E2E Tests (Playwright)

**Fichier**: `e2e/risk-console.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Risk Console", () => {
  test("should show paywall for FREE users", async ({ page }) => {
    await page.goto("/auth/login");
    // Login as FREE user
    await page.fill("[name=email]", "free@test.com");
    await page.click("[type=submit]");

    await page.goto("/orgs/test-org/risk-console");
    await expect(page.getByText("Pro/Ultra Feature")).toBeVisible();
    await expect(page.getByText("Upgrade to Pro")).toBeVisible();
  });

  test("should allow PRO users to access", async ({ page }) => {
    // Login as PRO user
    await page.goto("/auth/login");
    await page.fill("[name=email]", "pro@test.com");
    await page.click("[type=submit]");

    await page.goto("/orgs/test-org/risk-console");
    await expect(page.getByText("Risk Console")).toBeVisible();
    await expect(page.getByLabel("Total Capital")).toBeVisible();
  });

  test("should calculate position size correctly", async ({ page }) => {
    // Login as PRO user
    await page.goto("/auth/login");
    await page.fill("[name=email]", "pro@test.com");
    await page.click("[type=submit]");

    await page.goto("/orgs/test-org/risk-console");

    // Fill inputs
    await page.fill("[name=capital]", "10000");
    await page.fill("[name=riskPercent]", "2");
    await page.fill("[name=entryPrice]", "42000");
    await page.fill("[name=stopLoss]", "41000");

    // Check outputs
    await expect(page.getByText("$200.00")).toBeVisible(); // Risk amount
    await expect(page.getByText("$8,400.00")).toBeVisible(); // Position size
    await expect(page.getByText("0.2000 BTC")).toBeVisible(); // Contracts
  });
});
```

---

## Performance Considerations

### Optimizations

1. **Pre-calculated Results**: Sauvegarder outputs dans DB pour éviter recalculs
2. **Debounced Inputs**: Calculer seulement après 300ms de pause typing
3. **Memoization**: Utiliser `useMemo` pour calculations complexes
4. **Lazy Loading**: Charger historique via pagination (limit 20)

### Caching

```typescript
// Cache exchange balances for 5 minutes
const BALANCE_CACHE_TTL = 5 * 60 * 1000;

const cachedBalances = new Map<
  string,
  {
    data: ExchangeBalance[];
    timestamp: number;
  }
>();

export async function getCachedExchangeBalances(userId: string) {
  const cached = cachedBalances.get(userId);
  if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL) {
    return cached.data;
  }

  const balances = await getUserExchangeBalances(userId);
  cachedBalances.set(userId, { data: balances, timestamp: Date.now() });
  return balances;
}
```

---

## Roadmap Future

### Phase 3 (Post-MVP)

- [ ] **Mobile App**: Version native iOS/Android
- [ ] **Advanced Analytics**: Track R/R ratio success rate over time
- [ ] **Risk Heatmap**: Visualiser exposition globale sur tous trades actifs
- [ ] **Portfolio Risk**: Calculer risque combiné multi-positions
- [ ] **Kelly Criterion**: Calculateur position size optimal selon winrate
- [ ] **Monte Carlo Simulation**: Simuler séries de trades avec R/R ratio donné
- [ ] **Export CSV**: Export history pour analyse externe
- [ ] **Integration TradingView**: Plugin pour calculer position size directement dans charts

---

**Dernière mise à jour**: 4 novembre 2025
**Maintainer**: Claude Code + User
**Status**: Phase 1 Complete ✅ | Phase 2 En cours 🚧
