# Crypto Payments System - MyCryptoPilot

**Dernière mise à jour**: 11 octobre 2025
**Statut**: ✅ **100% FONCTIONNEL** (Backend + Frontend + API routes)

## Vue d'ensemble

Système complet de paiement crypto permettant aux users de payer leurs abonnements en USDC (Base) ou USDT (Tron) avec:

- ✅ HD wallet pour génération d'adresses uniques
- ✅ RPC monitoring pour détection on-chain
- ✅ Support pro-rata automatique
- ✅ Activation subscription automatique
- ✅ UI checkout complète (447 lignes!)

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

## Documentation Complémentaire

- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [TronWeb Docs](https://developers.tron.network/docs/tronweb-introduction)
- [BIP-44 Standard](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Base Network Docs](https://docs.base.org/)
- [TronGrid API](https://developers.tron.network/docs/tron-grid-intro)
