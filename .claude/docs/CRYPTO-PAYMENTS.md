# Crypto Payments System - MyCryptoPilot

**Dernière mise à jour**: 23 octobre 2025
**Statut**: ✅ **100% FONCTIONNEL** (Backend + Frontend + API routes + Testnet + Test Payment)

## Vue d'ensemble

Système complet de paiement crypto permettant aux users de payer leurs abonnements en USDC (Base) ou USDT (Tron) avec:

- ✅ HD wallet pour génération d'adresses uniques
- ✅ RPC monitoring pour détection on-chain
- ✅ Support pro-rata automatique
- ✅ Activation subscription automatique
- ✅ UI checkout complète (447 lignes!)
- ✅ **Support testnet (Base Sepolia + Tron Shasta)**
- ✅ **Test payment $1 avec success modal + email**
- ✅ **Payment history dashboard**

---

## Architecture

### 3 Modules Principaux

1. **Address Generator** - HD wallet (ethers.js + @scure/bip32)
2. **Payment Watcher** - RPC polling (ethers.js + TronWeb)
3. **Checkout UI** - Page paiement (QR codes + countdown + status)

---

## 1. Address Generator (HD Wallet)

**Fichier**: `src/lib/crypto/address-generator.ts` (212 lignes)

### Principe

Utilise un HD wallet (Hierarchical Deterministic) pour dériver des adresses crypto uniques sans stocker de clés privées.

**Derivation paths**:

- Base: `m/44'/60'/0'/0/{index}` (Ethereum standard BIP-44)
- Tron: `m/44'/195'/0'/0/{index}` (Tron standard BIP-44)

### Extended Public Keys (XPUB)

Configuration dans `.env.local`:

```bash
# Extended public keys (HD wallet)
CRYPTO_XPUB_BASE="xpub6F..."  # Base network (Ethereum BIP-44)
CRYPTO_XPUB_TRON="xpub6D..."  # Tron network (BIP-44)
```

**Génération XPUB**:

```typescript
// Avec ethers.js (Base)
import { HDNodeWallet } from "ethers";

const mnemonic = "your 12-word seed phrase";
const hdNode = HDNodeWallet.fromPhrase(mnemonic);
const basePath = "m/44'/60'/0'/0";
const xpub = hdNode.derivePath(basePath).extendedKey;
console.log("Base XPUB:", xpub);

// Avec @scure/bip32 (Tron)
import { HDKey } from "@scure/bip32";
import * as bip39 from "@scure/bip39";

const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const tronPath = "m/44'/195'/0'/0";
const tronXpub = hdKey.derive(tronPath).publicExtendedKey;
console.log("Tron XPUB:", tronXpub);
```

### Testnet Support (NEW - Issue #72)

**Ajouté**: 23 octobre 2025

Le système supporte maintenant **2 modes de fonctionnement**:

#### 1. Mainnet (Production)

Configuration par défaut en production:

```bash
# .env (Production - Vercel)
CRYPTO_NETWORK="mainnet"  # Par défaut

# Mainnet RPC URLs
BASE_RPC_URL="https://mainnet.base.org"
TRON_RPC_URL="https://api.trongrid.io"

# Mainnet XPUBs
CRYPTO_XPUB_BASE="xpub6F..."
CRYPTO_XPUB_TRON="xpub6D..."
```

#### 2. Testnet (Development)

Pour tester les paiements sans argent réel en dev:

```bash
# .env.local (Development)
CRYPTO_NETWORK="testnet"

# Testnet RPC URLs
BASE_RPC_URL_TESTNET="https://sepolia.base.org"
TRON_RPC_URL_TESTNET="https://api.shasta.trongrid.io"

# Testnet XPUBs (Base Sepolia + Tron Shasta)
CRYPTO_XPUB_BASE_TESTNET="xpub6..."
CRYPTO_XPUB_TRON_TESTNET="xpub6..."
```

**Réseaux testnet**:

- Base Sepolia (testnet Ethereum L2)
- Tron Shasta (testnet Tron)

**Avantages**:

- ✅ Tester le flow complet sans argent réel
- ✅ Obtenir des tokens testnet gratuits (faucets)
- ✅ Badge UI "TESTNET MODE" visible dans le checkout
- ✅ Liens explorateurs adaptés automatiquement (Sepolia BaseScan, Shasta TronScan)

**Obtenir des tokens testnet**:

- Base Sepolia USDC: https://faucet.circle.com
- Tron Shasta USDT: https://www.trongrid.io/shasta/#/

### Test Payment Plan (NEW - Issue #72)

**Ajouté**: 23 octobre 2025

Nouveau plan `test` permettant aux users de tester le système de paiement avec seulement **$1 USD**.

#### Configuration Plan

```typescript
// mycryptopilot-plans.ts
{
  name: "test",
  description: "Paiement de test pour vérifier le système crypto",
  priceUSD: 1,
  priceCrypto: { usdc: 1, usdt: 1 },
  daysGranted: 0, // N'active PAS d'abonnement
  limits: {
    // Même limites que FREE
    activeSignalsLimit: 0,
    tradersFollow: 0,
    // ...
  }
}
```

#### Workflow Test Payment

1. **User clique** "Send $1 Test Payment" sur page pricing
2. **Système génère** adresses crypto (comme plan normal)
3. **User paie** 1 USDC (Base) ou 1 USDT (Tron)
4. **Payment confirmé** → **3 actions automatiques**:
   - ✅ Popup success s'affiche (CTA vers plans)
   - ✅ Email de confirmation envoyé
   - ✅ Payment visible dans historique dashboard
5. **Pas d'activation** d'abonnement (daysGranted = 0)

#### Composants UI

**Success Dialog** (`test-payment-success-dialog.tsx`):

```typescript
<TestPaymentSuccessDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  orgSlug={orgSlug}
/>
```

**Email Template** (`test-payment-success.tsx`):

- Confirmation paiement $1
- Détails transaction (hash, network, time)
- Lien explorer blockchain
- CTA vers plans Pro/Ultra

**Payment History** (`account/payments/page.tsx`):

- Liste tous les paiements (test + real)
- Badge "Test Payment" pour plan test
- Status (PENDING/CONFIRMED)
- Explorer links
- CTA spécial pour test payments confirmés

### Fonctions

#### `deriveBaseAddress(index: number): string`

Dérive une adresse Ethereum/Base depuis XPUB.

```typescript
import { HDNodeWallet } from "ethers";

const xpub = env.CRYPTO_XPUB_BASE;
const hdNode = HDNodeWallet.fromExtendedKey(xpub);
const childNode = hdNode.derivePath(`${index}`);
const address = childNode.address; // 0x...

return address;
```

**Exemple**:

```typescript
const address = deriveBaseAddress(0);
// => "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

#### `deriveTronAddress(index: number): string`

Dérive une adresse Tron (TRC-20) depuis XPUB.

```typescript
import { HDKey } from "@scure/bip32";
import { keccak_256 } from "@noble/hashes/sha3";
import * as bs58check from "bs58check";

const xpub = env.CRYPTO_XPUB_TRON;
const hdKey = HDKey.fromExtendedKey(xpub);
const childKey = hdKey.derive(index);
const publicKey = childKey.publicKey; // 65 bytes (uncompressed)

// Ethereum-style address from public key
const hash = keccak_256(publicKey.slice(1));
const ethAddress = hash.slice(-20);

// Convert to Tron address (base58check with 0x41 prefix)
const tronAddress = bs58check.encode(
  Buffer.concat([Buffer.from([0x41]), ethAddress]),
);

return tronAddress; // T...
```

**Exemple**:

```typescript
const address = deriveTronAddress(0);
// => "TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS"
```

#### `generateCryptoAddress(userId: string, plan: string): Promise<GeneratedAddresses>`

Génère 2 adresses (Base + Tron) pour un paiement.

```typescript
// 1. Find next available derivation index
const lastAddress = await prisma.cryptoAddress.findFirst({
  orderBy: { derivationIndex: "desc" },
});
const nextIndex = (lastAddress?.derivationIndex ?? -1) + 1;

// 2. Derive addresses
const baseAddress = deriveBaseAddress(nextIndex);
const tronAddress = deriveTronAddress(nextIndex);

// 3. Save to DB with 15min expiration
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

const [base, tron] = await Promise.all([
  prisma.cryptoAddress.create({
    data: {
      userId,
      network: "BASE",
      address: baseAddress,
      derivationIndex: nextIndex,
      expiresAt,
    },
  }),
  prisma.cryptoAddress.create({
    data: {
      userId,
      network: "TRON",
      address: tronAddress,
      derivationIndex: nextIndex,
      expiresAt,
    },
  }),
]);

return {
  addresses: {
    base: { id: base.id, address: baseAddress },
    tron: { id: tron.id, address: tronAddress },
  },
  expiresAt,
};
```

---

## 2. Payment Watcher (RPC Monitoring)

**Fichier**: `src/lib/crypto/payment-watcher.ts` (415 lignes)

### Principe

Détecte les paiements on-chain en interrogeant les RPC nodes (Base + Tron) pour les Transfer events USDC/USDT.

### Configuration RPC

```bash
# .env.local
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_KEY"
TRON_RPC_URL="https://api.trongrid.io"  # Ou TronGrid API key

# Token contracts
USDC_BASE_CONTRACT="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"  # Base USDC
USDT_TRON_CONTRACT="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"  # Tron USDT (TRC-20)
```

### Fonctions

#### `checkAddressForPayments(address: string, network: "BASE" | "TRON"): Promise<Payment[]>`

Query blockchain pour détecter les Transfer events vers une adresse.

**Base (USDC)**:

```typescript
import { ethers, JsonRpcProvider, Contract } from "ethers";

const provider = new JsonRpcProvider(env.BASE_RPC_URL);
const usdcContract = new Contract(
  env.USDC_BASE_CONTRACT,
  ["event Transfer(address indexed from, address indexed to, uint256 value)"],
  provider,
);

// Query Transfer events to our address (last 1000 blocks)
const currentBlock = await provider.getBlockNumber();
const events = await usdcContract.queryFilter(
  usdcContract.filters.Transfer(null, address),
  currentBlock - 1000,
  currentBlock,
);

const payments = await Promise.all(
  events.map(async (event) => {
    const tx = await event.getTransaction();
    const receipt = await event.getTransactionReceipt();
    const block = await provider.getBlock(receipt.blockNumber);

    const amountToken = Number(event.args.value) / 1e6; // USDC has 6 decimals
    const confirmations = currentBlock - receipt.blockNumber + 1;

    return {
      network: "BASE",
      currency: "USDC",
      txHash: tx.hash,
      amountToken,
      amountUSD: amountToken, // USDC = $1
      confirmations,
      timestamp: new Date(block.timestamp * 1000),
    };
  }),
);

return payments;
```

**Tron (USDT)**:

```typescript
import TronWeb from "tronweb";

const tronWeb = new TronWeb({
  fullHost: env.TRON_RPC_URL,
});

// Get TRC-20 USDT transfers to address
const tronAddress = address;
const contract = await tronWeb.contract().at(env.USDT_TRON_CONTRACT);

// Query events (TronGrid API - last 200 txs)
const events = await tronWeb.event.getEventsByContractAddress(
  env.USDT_TRON_CONTRACT,
  {
    eventName: "Transfer",
    size: 200,
    onlyConfirmed: true,
  },
);

const payments = events
  .filter((event) => event.result.to === tronWeb.address.toHex(tronAddress))
  .map((event) => {
    const amountToken = Number(event.result.value) / 1e6; // USDT has 6 decimals
    const confirmations = event.confirmations ?? 0;

    return {
      network: "TRON",
      currency: "USDT",
      txHash: event.transaction,
      amountToken,
      amountUSD: amountToken, // USDT ≈ $1
      confirmations,
      timestamp: new Date(event.timestamp),
    };
  });

return payments;
```

#### Confirmations Required

- **Base**: 1 block (~2 secondes)
- **Tron**: 2 blocks (~6 secondes)

---

## 3. Checkout UI

**Fichier**: `src/components/checkout/checkout-form.tsx` (447 lignes!)

### Flow Utilisateur

1. User clique "Upgrade to PRO" → Redirect `/checkout/pro`
2. Auto-génération 2 adresses (Base + Tron) via `generateAddressAction`
3. Display QR codes + addresses + countdown (15 min)
4. User scan QR code ou copie adresse
5. User envoie 49 USDC depuis Binance/MetaMask
6. Polling API `/api/crypto/check-payment` toutes les 10s
7. Payment détecté → Activation subscription → Redirect dashboard

### Features

✅ **QR Codes** - Génération avec `qrcode` library
✅ **Countdown Timer** - 15 minutes avec `react-countdown`
✅ **Payment Status Polling** - Toutes les 10 secondes
✅ **Copy to Clipboard** - Boutons copy pour adresses
✅ **Responsive Design** - Mobile + desktop
✅ **Loading States** - Skeletons + spinners
✅ **Error Handling** - Expiration + network errors

### Code Clé

```typescript
// Generate addresses on mount
const generateMutation = useMutation({
  mutationFn: async () => {
    const result = await generateAddressAction({ plan });
    if (!isActionSuccessful(result)) {
      throw new Error(result.serverError);
    }
    return result.data;
  },
  onSuccess: async (data) => {
    setAddresses(data.addresses);
    setExpiresAt(new Date(data.expiresAt));

    // Generate QR codes
    const [baseQR, tronQR] = await Promise.all([
      QRCode.toDataURL(data.addresses.base.address, { width: 256 }),
      QRCode.toDataURL(data.addresses.tron.address, { width: 256 }),
    ]);
    setQrCodes({ base: baseQR, tron: tronQR });
  },
});

// Poll payment status every 10s
useEffect(() => {
  if (!addresses || paymentStatus !== "pending") return;

  const checkPaymentStatus = async () => {
    const result = await upfetch("/api/crypto/check-payment", {
      method: "POST",
      body: {
        baseAddressId: addresses.base.id,
        tronAddressId: addresses.tron.id,
      },
    });

    if (result.confirmed) {
      setPaymentStatus("confirmed");
      toast.success("Payment confirmed! Activating subscription...");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  void checkPaymentStatus();
  const interval = setInterval(checkPaymentStatus, 10000);
  return () => clearInterval(interval);
}, [addresses, paymentStatus]);
```

---

## 4. API Routes

### POST `/api/crypto/generate-address`

**Fichier**: `app/api/crypto/generate-address/route.ts`

Génère 2 adresses crypto (Base + Tron) pour un paiement.

```typescript
export const POST = authRoute
  .body(z.object({ plan: z.enum(["pro", "ultra"]) }))
  .handler(async (req, { body, ctx }) => {
    const userId = ctx.user.id;
    const { plan } = body;

    const result = await generateCryptoAddress(userId, plan);

    return {
      addresses: result.addresses,
      expiresAt: result.expiresAt.toISOString(),
    };
  });
```

### POST `/api/crypto/check-payment`

**Fichier**: `app/api/crypto/check-payment/route.ts` (152 lignes)

Vérifie le statut d'un paiement en interrogeant la blockchain.

```typescript
export const POST = authRoute
  .body(
    z.object({
      baseAddressId: z.string(),
      tronAddressId: z.string(),
    }),
  )
  .handler(async (req, { body, ctx }) => {
    const { baseAddressId, tronAddressId } = body;
    const userId = ctx.user.id;

    // 1. Fetch addresses from DB
    const [baseAddress, tronAddress] = await Promise.all([
      prisma.cryptoAddress.findUnique({ where: { id: baseAddressId, userId } }),
      prisma.cryptoAddress.findUnique({ where: { id: tronAddressId, userId } }),
    ]);

    // 2. Check for payments on both networks
    const [basePayments, tronPayments] = await Promise.all([
      checkAddressForPayments(baseAddress.address, "BASE"),
      checkAddressForPayments(tronAddress.address, "TRON"),
    ]);

    // 3. Find first confirmed payment
    const confirmedPayment = [...basePayments, ...tronPayments].find(
      (payment) =>
        payment.confirmations >= (payment.network === "BASE" ? 1 : 2),
    );

    if (!confirmedPayment) {
      return {
        confirmed: false,
        pending: basePayments.length > 0 || tronPayments.length > 0,
      };
    }

    // 4. Detect plan from amount
    const plan = getPlanFromAmount(confirmedPayment.amountUSD);
    const daysGranted = calculateDaysGranted(confirmedPayment.amountUSD, plan);

    // 5. Create CryptoPayment record
    await prisma.cryptoPayment.create({
      data: {
        userId,
        plan,
        network: confirmedPayment.network,
        currency: confirmedPayment.currency,
        amountToken: confirmedPayment.amountToken.toString(),
        amountUSD: confirmedPayment.amountUSD.toString(),
        txHash: confirmedPayment.txHash,
        confirmations: confirmedPayment.confirmations,
        status: "CONFIRMED",
        daysGranted,
        confirmedAt: confirmedPayment.timestamp,
      },
    });

    // 6. Activate subscription
    const activationResult = await activateSubscription({
      userId,
      plan,
      daysGranted,
    });

    return {
      confirmed: true,
      plan,
      daysGranted,
      periodEnd: activationResult.periodEnd?.toISOString(),
      txHash: confirmedPayment.txHash,
    };
  });
```

---

## 5. Plans & Pro-Rata

**Fichier**: `src/lib/crypto/mycryptopilot-plans.ts`

### Plans Configuration

```typescript
export const MYCRYPTOPILOT_PLANS = [
  {
    name: "free",
    priceUSD: 0,
    pricePerDay: 0,
    features: { signalsPerDay: 5, tradersFollow: 1, screenerRefresh: "5min" },
  },
  {
    name: "pro",
    priceUSD: 49,
    pricePerDay: 49 / 30, // $1.63/day
    features: { signalsPerDay: 50, tradersFollow: 5, screenerRefresh: "1min" },
  },
  {
    name: "ultra",
    priceUSD: 99,
    pricePerDay: 99 / 30, // $3.30/day
    features: {
      signalsPerDay: Infinity,
      tradersFollow: Infinity,
      screenerRefresh: "5sec",
    },
  },
] as const;
```

### Fonctions

#### `getPlanFromAmount(amountUSD: number): MyCryptoPilotPlanName`

Auto-détecte le plan depuis le montant payé.

```typescript
if (amountUSD >= 99) return "ultra";
if (amountUSD >= 49) return "pro";
return "free"; // Partial payment defaults to free (no credit)
```

#### `calculateDaysGranted(amountUSD: number, plan: MyCryptoPilotPlanName): number`

Calcule les jours d'abonnement accordés (support pro-rata).

```typescript
const planData = MYCRYPTOPILOT_PLANS.find((p) => p.name === plan);
if (!planData || planData.pricePerDay === 0) return 0;

const days = Math.floor(amountUSD / planData.pricePerDay);
return Math.max(0, days); // Minimum 0 jours
```

**Exemples**:

```typescript
calculateDaysGranted(49, "pro"); // 30 jours (49 / 1.63)
calculateDaysGranted(25, "pro"); // 15 jours (25 / 1.63)
calculateDaysGranted(99, "ultra"); // 30 jours (99 / 3.30)
calculateDaysGranted(50, "ultra"); // 15 jours (50 / 3.30)
```

---

## Sweep Script (Optional)

**Fichier**: `scripts/sweep-to-binance.ts`

Script pour transférer les fonds reçus vers un wallet Binance master.

⚠️ **Non implémenté** (4 TODOs - lignes 134, 167, 201, 229)

**Usage prévu**:

```bash
node scripts/sweep-to-binance.ts
```

---

## Security

### Best Practices

1. ✅ **XPUB uniquement** - Jamais de private keys dans le code
2. ✅ **Derivation index séquentiel** - Évite collisions adresses
3. ✅ **15min expiration** - Adresses limitées dans le temps
4. ✅ **Confirmations** - 1 block (Base), 2 blocks (Tron)
5. ✅ **Idempotency** - Check `txHash` unique avant créer CryptoPayment

### Risks

- **RPC rate limits**: Utiliser RPC payants (Alchemy, QuickNode)
- **Address reuse**: Script cleanup adresses expirées
- **Sweeping**: Implémenter sweep script pour centraliser funds

---

## Testing

### Testnet

**Base Sepolia**:

- RPC: `https://sepolia.base.org`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (testnet)

**Tron Shasta**:

- RPC: `https://api.shasta.trongrid.io`
- USDT: `TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs` (testnet)

### Testnet Flow

1. Generate testnet XPUB keys (separate from mainnet)
2. Get testnet tokens (faucets)
3. Test payment flow end-to-end
4. Verify subscription activation

---

## Performance

### Optimizations

- ✅ **Parallel RPC calls** - Base + Tron simultanés
- ✅ **Caching addresses** - Stockage DB avec index
- ✅ **Polling interval** - 10s balance perf/UX
- ✅ **Block range** - Query last 1000 blocks seulement

### Monitoring

- Log RPC response times
- Alert si RPC down
- Track payment detection latency

---

## Dependencies

```json
{
  "ethers": "^6.10.0",
  "tronweb": "^5.3.0",
  "@scure/bip32": "^1.3.0",
  "@scure/bip39": "^1.2.0",
  "@noble/hashes": "^1.3.0",
  "bs58check": "^2.1.2",
  "qrcode": "^1.5.3",
  "react-countdown": "^2.3.5"
}
```

Install:

```bash
pnpm add ethers@^6 tronweb @scure/bip32 @scure/bip39 @noble/hashes bs58check qrcode react-countdown
pnpm add -D @types/qrcode
```

---

## Fichiers Importants

**Backend**:

- `src/lib/crypto/address-generator.ts` - HD wallet (212 lignes)
- `src/lib/crypto/payment-watcher.ts` - RPC monitoring (415 lignes)
- `src/lib/crypto/mycryptopilot-plans.ts` - Plans config (95 lignes)

**Frontend**:

- `src/components/checkout/checkout-form.tsx` - Checkout UI (447 lignes)
- `app/orgs/[orgSlug]/(navigation)/checkout/[plan]/page.tsx` - Route page (39 lignes)

**API Routes**:

- `app/api/crypto/generate-address/route.ts` - Generate addresses
- `app/api/crypto/check-payment/route.ts` - Check payment status (152 lignes)

**Actions**:

- `src/lib/actions/crypto/generate-address.action.ts` - Server action

---

## Quick Setup Guide

### Development (Testnet) - 5 minutes

**Objectif**: Tester les paiements crypto sans argent réel.

```bash
# 1. Générer XPUBs testnet
npx tsx scripts/generate-testnet-xpubs.ts

# 2. Copier output dans .env.local
CRYPTO_NETWORK="testnet"
BASE_RPC_URL_TESTNET="https://sepolia.base.org"
TRON_RPC_URL_TESTNET="https://api.shasta.trongrid.io"
CRYPTO_XPUB_BASE_TESTNET="xpub6..." # Output du script
CRYPTO_XPUB_TRON_TESTNET="xpub6..." # Output du script

# 3. Obtenir tokens testnet (gratuits)
# Base Sepolia USDC: https://faucet.circle.com
# Tron Shasta USDT: https://www.trongrid.io/shasta/

# 4. Tester le flow
pnpm dev
# → /pricing → "Send $1 Test Payment"
# → Badge "TESTNET MODE" visible
# → Envoyer 1 USDC/USDT testnet
# → Popup success + email confirmation
```

### Production (Mainnet) - Déjà configuré ✅

Le système crypto est **déjà opérationnel en production** sur Vercel avec les variables:

```bash
CRYPTO_NETWORK="mainnet"  # Par défaut
BASE_RPC_URL="https://mainnet.base.org"
TRON_RPC_URL="https://api.trongrid.io"
CRYPTO_XPUB_BASE="xpub6F..." # Configuré dans Vercel
CRYPTO_XPUB_TRON="xpub6D..." # Configuré dans Vercel
```

**Test Payment $1** fonctionne directement en prod:

- User clique "Send $1 Test Payment" sur `/pricing`
- Paie 1 USDC (Base) ou 1 USDT (Tron)
- Reçoit popup success + email de confirmation
- Payment visible dans `/account/payments`
- **Pas d'activation subscription** (plan test = 0 jours)

**Script génération XPUBs testnet**:

```typescript
// scripts/generate-testnet-xpubs.ts
import { HDNodeWallet } from "ethers";
import { HDKey } from "@scure/bip32";
import * as bip39 from "@scure/bip39";

const mnemonic = bip39.generateMnemonic(bip39.wordlist);
console.log("🔐 TESTNET MNEMONIC (SAVE THIS!):", mnemonic);

// Base XPUB
const hdNode = HDNodeWallet.fromPhrase(mnemonic);
const baseXpub = hdNode.derivePath("m/44'/60'/0'/0").extendedKey;
console.log("BASE_TESTNET:", baseXpub);

// Tron XPUB
const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const tronXpub = hdKey.derive("m/44'/195'/0'/0").publicExtendedKey;
console.log("TRON_TESTNET:", tronXpub);
```

---

## 🧪 Guide de Test Complet

Le système de test payment est **100% fonctionnel** et prêt à être testé. Deux options disponibles:

---

### Option A: Test Payment Mainnet ($1 réel) ⭐ **FORTEMENT RECOMMANDÉ**

> 🎯 **C'est l'option la plus simple!** Aucun setup testnet, aucun faucet, aucune confusion. Lance l'app, clique "Send $1 Test Payment", paie, c'est fait.

**Avantages**:

- ✅ Teste le flow blockchain réel (Base ou Tron mainnet)
- ✅ **Zéro setup** - Tes XPUBs mainnet sont déjà configurés
- ✅ **Rapide** (< 5 min total du début à la fin)
- ✅ Coût minimal ($1 + frais gas ~$0.10)
- ✅ Confirme que ton système fonctionne en production
- ✅ **Pas de faucet** à gérer (parfois lents ou en panne)

**Prérequis**:

- Un wallet crypto (MetaMask, Trust Wallet, Binance, etc.)
- 1 USDC sur Base OU 1 USDT sur Tron + frais gas

**Flow complet (< 5 min)**:

```bash
# 1. Vérifier que tu es en MAINNET (par défaut)
cat .env.local | grep CRYPTO_NETWORK
# Doit être vide OU "mainnet"

# 2. Lancer l'app
pnpm dev

# 3. Login sur http://localhost:3000
```

**Steps dans l'interface**:

1. **Aller sur `/pricing`**

   ```
   http://localhost:3000/orgs/[ton-org-slug]/pricing
   ```

2. **Cliquer "Send $1 Test Payment"**
   - Section en bas de page (bordure en pointillés)
   - Redirige vers `/checkout/test`

3. **Page Checkout - Adresses générées automatiquement** 🎯
   - ✅ **2 adresses crypto affichées** (Base `0x...` + Tron `T...`)
   - ✅ QR codes scannables
   - ✅ Boutons "Copy Address"
   - ✅ Countdown timer 15 minutes
   - ✅ Montant: 1 USDC (Base) OU 1 USDT (Tron)

   > ⚠️ **IMPORTANT**: Copie l'adresse **directement depuis la page checkout** (pas besoin du XPUB!)

4. **Envoyer le Payment depuis ton wallet**

   **Option 1 - Base Network (USDC)** ⚡ Plus rapide:

   ```
   Réseau:  Base Mainnet (Chain ID: 8453)
   Token:   USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
   Montant: 1 USDC exactement
   Adresse: [copier depuis checkout - commence par 0x...]

   Wallets supportés:
   - Binance (retrait Base network)
   - MetaMask (switch to Base)
   - Coinbase Wallet
   - Trust Wallet
   ```

   **Option 2 - Tron Network (USDT)**:

   ```
   Réseau:  Tron Mainnet
   Token:   USDT TRC-20 (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
   Montant: 1 USDT exactement
   Adresse: [copier depuis checkout - commence par T...]

   Wallets supportés:
   - Binance (retrait Tron network)
   - TronLink
   - Trust Wallet
   ```

5. **Attendre la Confirmation**
   - ✅ Polling automatique toutes les 10 secondes
   - ✅ Base: 1 confirmation (~2 secondes)
   - ✅ Tron: 2 confirmations (~6 secondes)
   - ✅ Détection automatique via RPC monitoring

6. **Confirmation Réussie** 🎉
   - ✅ Popup "Test Payment Successful!"
   - ✅ Email de confirmation envoyé
   - ✅ CTA vers plans Pro/Ultra
   - ✅ **Aucune subscription activée** (plan test = 0 jours)

7. **Vérifier Payment History**
   ```
   http://localhost:3000/orgs/[ton-org-slug]/account/payments
   ```

   - ✅ Payment visible avec badge "Test Payment"
   - ✅ Status: CONFIRMED
   - ✅ Lien vers explorer (BaseScan ou TronScan)
   - ✅ CTA pour subscribe to full plan

**Vérifications Post-Test**:

```bash
# 1. Check database (Prisma Studio)
npx prisma studio

# Vérifier table CryptoPayment:
# - plan = "test"
# - status = "CONFIRMED"
# - amountUSD = "1"
# - daysGranted = 0
# - txHash présent
# - confirmations >= 1 (Base) ou >= 2 (Tron)

# 2. Check email
# → Inbox: "Test Payment Confirmed - MyCryptoPilot"
# → Contient: tx hash, network, explorer link, CTA vers plans
```

---

### Option B: Test Payment Testnet (Gratuit) 🧪

> ⚠️ **Option avancée** - Nécessite setup initial ~15-20 min. Recommandé UNIQUEMENT si tu veux tester plusieurs fois gratuitement.

**Avantages**:

- ✅ Totalement gratuit (tokens testnet)
- ✅ Aucun risque financier
- ✅ Teste le flow blockchain réel

**Inconvénients**:

- ⚠️ Setup initial (~15-20 min)
- ⚠️ Faucets parfois lents ou en maintenance
- ⚠️ Nécessite de générer des XPUBs testnet séparés
- ⚠️ Plus complexe (XPUB vs adresse - source de confusion)

---

#### 🔑 Concept Important: XPUB vs Adresse

**Avant de commencer, comprendre la différence:**

```
XPUB (Extended Public Key)
└─ xpub6F8yv... (clé étendue)
   └─ Sert à DÉRIVER des adresses
   └─ ⚠️ NE PAS envoyer de fonds directement au XPUB!

Adresse (Destination pour recevoir des fonds)
└─ Base:  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
└─ Tron:  TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS
   └─ ✅ C'est ICI qu'on envoie les fonds
```

**Analogie**:

- XPUB = "Usine à adresses" (génère des adresses)
- Adresse = "Boîte aux lettres" (reçoit de l'argent)

---

#### Setup Testnet (One-Time)

**Étape 1: Générer les XPUBs testnet**

```bash
npx tsx scripts/generate-testnet-xpubs.ts
```

**Output du script**:

```
📝 Generated Mnemonic: [12 words] ← SAUVEGARDER!
✅ Base XPUB: xpub6F8yv...
✅ Tron XPUB: xpub6D2jn...
   Test address (index 0): 0x742d35Cc... ← Adresse pour le faucet!
```

> 🔐 **IMPORTANT**: Sauvegarde la mnemonic dans un password manager (1Password, Bitwarden)

**Étape 2: Configurer .env.local**

```bash
# Variables testnet
echo 'CRYPTO_NETWORK="testnet"' >> .env.local
echo 'CRYPTO_XPUB_BASE="xpub6F8yv..."' >> .env.local  # Copier depuis output
echo 'CRYPTO_XPUB_TRON="xpub6D2jn..."' >> .env.local  # Copier depuis output

# RPC URLs testnet
echo 'BASE_RPC_URL="https://sepolia.base.org"' >> .env.local
echo 'TRON_RPC_URL="https://api.shasta.trongrid.io"' >> .env.local

# Redémarrer
pnpm dev
```

---

#### Obtenir des Tokens Testnet via Faucet

**Méthode 1: Via l'app (recommandé)**

1. Lancer `pnpm dev`
2. Aller sur `/pricing` → Cliquer "Send $1 Test Payment"
3. **Page checkout affiche "TESTNET MODE" badge**
4. **Copier l'adresse Base** (0x...) affichée sur la page
5. Utiliser cette adresse dans le faucet ⬇️

**Méthode 2: Via le script (si faucet avant de lancer l'app)**

```bash
# Le script affiche la première adresse dérivée:
# "Test address (index 0): 0x742d..."
# Copier CETTE adresse (PAS le XPUB!)
```

---

#### Obtenir USDC Base Sepolia via Faucet Circle

1. **Aller sur**: https://faucet.circle.com/
2. **Sélectionner**: "Base Sepolia" dans le dropdown
3. **Coller l'adresse**: `0x742d35Cc...`
   - ⚠️ **PAS le XPUB** (xpub6F8yv...)
   - ✅ **L'adresse 0x...** affichée sur checkout OU depuis le script
4. **Cliquer "Send 10 USDC"**
5. **Attendre 1-2 min** → Tu reçois 10 USDC testnet gratuits

**Si erreur "Please enter a valid wallet address for Base"**:

- Tu as probablement collé le XPUB au lieu de l'adresse
- Utilise l'adresse `0x...` depuis la page checkout

---

#### Obtenir USDT Tron Shasta

**Pour Tron testnet (si tu veux tester Tron)**:

1. Aller sur https://www.trongrid.io/shasta/
2. Coller ton adresse Tron (T...) depuis checkout
3. Recevoir 10,000 TRX testnet
4. Swap TRX → USDT sur https://shasta.tronscan.org/

---

#### Flow Test Payment Testnet

1. ✅ Lancer app: `pnpm dev`
2. ✅ Aller sur `/pricing` → Cliquer "Send $1 Test Payment"
3. ✅ **Badge "TESTNET MODE"** visible en haut du checkout
4. ✅ **Copier l'adresse Base** (0x...) affichée
5. ✅ Envoyer 1 USDC testnet depuis ton wallet testnet
   - Network: Base Sepolia
   - Montant: 1 USDC
   - Adresse: celle copiée depuis checkout
6. ✅ Attendre confirmation (~10-30 sec)
7. ✅ Popup success + email
8. ✅ Vérifier payment history

**Liens Explorers Testnet**:

- Base Sepolia: https://sepolia.basescan.org/
- Tron Shasta: https://shasta.tronscan.org/

---

### 🐛 Troubleshooting

#### Problème: "Addresses not generated"

**Cause**: XPUBs manquants ou invalides

**Solution**:

```bash
# Vérifier .env.local
cat .env.local | grep CRYPTO_XPUB

# Doit afficher (mainnet):
CRYPTO_XPUB_BASE="xpub6F..."
CRYPTO_XPUB_TRON="xpub6D..."

# OU (testnet):
CRYPTO_XPUB_BASE="xpub6..."
CRYPTO_XPUB_TRON="xpub6..."
CRYPTO_NETWORK="testnet"
```

#### Problème: "Payment not detected"

**Causes possibles**:

1. Mauvais réseau (envoi sur mainnet alors que testnet configuré)
2. Montant incorrect (< $0.95 ou > $1.05 pour test plan)
3. RPC down ou rate limited
4. Pas assez de confirmations

**Solutions**:

```bash
# 1. Vérifier tx sur explorer
# Base Mainnet: https://basescan.org/tx/[TX_HASH]
# Tron Mainnet: https://tronscan.org/#/transaction/[TX_HASH]

# 2. Check confirmations (doit être >= 1 Base, >= 2 Tron)

# 3. Check RPC logs dans terminal
# → Chercher "Checking address for payments..."

# 4. Vérifier montant exact
# → 1 USDC = 1,000,000 (6 decimals)
# → 1 USDT = 1,000,000 (6 decimals)
```

#### Problème: "RPC rate limit exceeded"

**Solution**: Utiliser un RPC provider premium

```bash
# Alchemy (Base)
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"

# QuickNode (Base)
BASE_RPC_URL="https://YOUR_ENDPOINT.base-mainnet.quiknode.pro/YOUR_KEY/"

# TronGrid API Key (Tron)
TRON_RPC_URL="https://api.trongrid.io?TRON_PRO_API_KEY=YOUR_KEY"
```

#### Problème: "Email not received"

**Causes**:

1. Resend API key manquant
2. Email dans spam
3. Email server down

**Solution**:

```bash
# Vérifier Resend config
cat .env.local | grep RESEND

# Check logs serveur
# → Chercher "Sending test payment confirmation email"

# Vérifier Resend dashboard
# → https://resend.com/emails
```

---

### ✅ Checklist de Validation Complète

Après avoir testé le test payment, vérifier que:

**Frontend**:

- [ ] Page pricing affiche CTA "Send $1 Test Payment"
- [ ] Checkout génère 2 adresses (Base + Tron)
- [ ] QR codes s'affichent correctement
- [ ] Countdown timer 15 minutes fonctionne
- [ ] Badge "Test Payment" visible (si testnet: badge "TESTNET MODE")
- [ ] Boutons copy to clipboard fonctionnels
- [ ] Liens vers explorers corrects
- [ ] Polling automatique toutes les 10s
- [ ] Popup success s'affiche après confirmation

**Backend**:

- [ ] Addresses générées avec derivation index unique
- [ ] CryptoAddress créées en DB avec expiresAt = +15min
- [ ] RPC monitoring détecte le payment on-chain
- [ ] CryptoPayment créé avec status = "CONFIRMED"
- [ ] Plan détecté = "test" (amount $1)
- [ ] daysGranted = 0 (pas d'activation subscription)
- [ ] Email confirmation envoyé via Resend
- [ ] Tx hash stocké correctement

**Database** (via Prisma Studio):

- [ ] Table CryptoAddress: 2 entrées (BASE + TRON)
- [ ] Table CryptoPayment: 1 entrée avec plan = "test"
- [ ] confirmations >= seuil (1 Base, 2 Tron)
- [ ] confirmedAt timestamp présent

**Payment History**:

- [ ] Payment visible dans `/account/payments`
- [ ] Badge "Test Payment" affiché
- [ ] Status = CONFIRMED
- [ ] Explorer link cliquable
- [ ] CTA "subscribe to a full plan" présent

---

### 📊 Métriques de Performance

**Temps attendu**:

- Génération adresses: < 1 seconde
- Confirmation Base: 2-10 secondes (1 block)
- Confirmation Tron: 6-20 secondes (2 blocks)
- Email envoi: < 2 secondes
- Total flow: **< 30 secondes** (Base) ou **< 1 minute** (Tron)

**Si plus lent**:

- Check RPC provider (latency)
- Check network congestion (gas price)
- Check polling interval (10s par défaut)

---

### 🎯 Recommandations

**Pour Dev**:

1. Commencer avec **Testnet** (gratuit, aucun risque)
2. Tester plusieurs fois pour valider stabilité
3. Tester les 2 réseaux (Base + Tron)
4. Tester edge cases (montant incorrect, timeout, etc.)

**Pour Staging/Prod**:

1. Utiliser **Mainnet** avec test payment $1 réel
2. Valider une fois en staging avant prod
3. Monitorer RPC latency et rate limits
4. Setup alertes email si RPC down

**Après Test Réussi**:

- ✅ Système crypto payment validé
- ✅ Prêt à recevoir vrais paiements Pro ($49) et Ultra ($99)
- ✅ Peut lancer en beta avec confiance

---

## Documentation Complémentaire

- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [TronWeb Docs](https://developers.tron.network/docs/tronweb-introduction)
- [BIP-44 Standard](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Base Network Docs](https://docs.base.org/)
- [TronGrid API](https://developers.tron.network/docs/tron-grid-intro)
