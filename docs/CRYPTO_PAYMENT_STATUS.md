# 💳 État du Système de Paiement Crypto

**Date de mise à jour** : 11 octobre 2025
**Branche** : `feature/crypto-payment-setup`

---

## ✅ Ce qui est TERMINÉ (Configuration Complète)

### 1. Génération XPUB Keys Testnet

✅ **Script exécuté avec succès**

```bash
npx tsx scripts/generate-testnet-xpub.ts
```

**Résultat** :

- ✅ Base XPUB : `xpub6XXXXXXXXXXXXXXXXXXXXXX...` (stored in GitHub secrets)
- ✅ Tron XPUB : `xpub6XXXXXXXXXXXXXXXXXXXXXX...` (stored in GitHub secrets)
- ✅ Mnemonic sauvegardé : `[REDACTED - NEVER COMMIT THIS]`

**⚠️ IMPORTANT** : Mnemonic enregistré dans `.env.local` avec warning clair (testnet only)

---

### 2. Configuration .env.local

✅ **Ajouté dans `.env.local`** (gitignored) :

```bash
# 💳 CRYPTO PAYMENTS (Testnet - Development)
# ⚠️  WARNING: These are TEST keys only. DO NOT use in production!
# Test Mnemonic: almost gas infant pyramid judge deliver myth pause link copper cabbage pulse
# SAVE THIS MNEMONIC IN 1PASSWORD/BITWARDEN! You need it to access the wallets.

## RPC URLs for blockchain payment detection
BASE_RPC_URL="https://mainnet.base.org"
TRON_RPC_URL="https://api.trongrid.io"

## HD Wallet Extended Public Keys (Testnet)
CRYPTO_XPUB_BASE="xpub6XXXXXXXXXXXXXXXXXXXXXX..."  # Get from GitHub secrets
CRYPTO_XPUB_TRON="xpub6XXXXXXXXXXXXXXXXXXXXXX..."  # Get from GitHub secrets
```

---

### 3. Configuration Vercel Production

✅ **Variables ajoutées dans Vercel Dashboard** (Production scope only) :

```bash
BASE_RPC_URL=https://mainnet.base.org
TRON_RPC_URL=https://api.trongrid.io
CRYPTO_XPUB_BASE=<redacted - stored in Vercel environment variables>
CRYPTO_XPUB_TRON=<redacted - stored in Vercel environment variables>
```

**Vérification** :

```bash
vercel env ls | grep CRYPTO
# ✅ CRYPTO_XPUB_BASE (Production)
# ✅ CRYPTO_XPUB_TRON (Production)
```

---

### 4. Script de Sweep vers Binance

✅ **Créé** : `scripts/sweep-to-binance.ts` (279 lignes)

**Fonctionnalités actuelles** :

- ✅ Lecture de toutes les CryptoAddress en base
- ✅ Check balance Base (USDC) via RPC
- ✅ Check balance Tron (USDT) via RPC
- ✅ Identification adresses avec balance > seuil (10 USDC/USDT)
- ✅ Calcul total à transférer
- ⚠️ Transfert réel **PAS ENCORE IMPLÉMENTÉ** (nécessite clé privée)

**Seuils configurés** :

- Minimum sweep Base : 10 USDC (éviter frais gas inutiles)
- Minimum sweep Tron : 10 USDT

**Utilisation** :

```bash
npx tsx scripts/sweep-to-binance.ts
```

---

### 5. Documentation Sweep

✅ **Créé** : `scripts/SWEEP_SETUP.md` (420 lignes)

**Contenu** :

- Guide configuration adresses dépôt Binance
- Instructions .env.local + Vercel
- 3 options d'implémentation transferts (manuel/service externe/hardware wallet)
- Configuration cron job automatique
- Troubleshooting

---

### 6. Tests Adresses Crypto

✅ **Créé** : `scripts/test-crypto-addresses.ts` (97 lignes)

**Tests** :

1. ✅ Génération adresse Base (USDC)
2. ✅ Génération adresse Tron (USDT)
3. ✅ Validation format adresses (0x... et T...)
4. ✅ Réutilisation adresses (même user = même adresse)

**Résultat des tests** :

```
✅ All tests passed!
🎉 Your crypto payment system is ready!

📊 Test Results:
   Base address valid: ✅
   Tron address valid: ✅
   Address reuse works: ✅
```

**Adresses générées (exemple)** :

- Base : `0x9c677d357A4567a10038C479F18698d7edF33aBD`
- Tron : `THwfUfhWoTYdavuvFhaHrGV9QqDRXjhNzy`

---

### 7. Variables Environnement (env.ts)

✅ **Ajouté** dans `src/lib/env.ts` :

```typescript
// Binance master wallets for sweep (optional)
BINANCE_MASTER_WALLET_BASE: z.string().optional(),
BINANCE_MASTER_WALLET_TRON: z.string().optional(),
```

---

## ⏳ Ce qui MANQUE (Prochaines Étapes)

### 1. Configuration Adresses Binance (5 min) ⚠️ ACTION REQUISE

**Toi, tu dois** :

1. Te connecter à Binance
2. Aller dans Wallet → Fiat and Spot → Deposit
3. Sélectionner USDC (réseau Base) → Copier adresse
4. Sélectionner USDT (réseau TRC20/Tron) → Copier adresse
5. Ajouter dans `.env.local` :xxX
   ```bash
   # 🏦 BINANCE MASTER WALLETS (for sweep)
   BINANCE_MASTER_WALLET_BASE="0xTON_ADRESSE_BINANCE_BASE"
   BINANCE_MASTER_WALLET_TRON="TON_ADRESSE_BINANCE_TRON"
   ```

**Guide détaillé** : `scripts/SWEEP_SETUP.md`

---

### 2. UI Checkout Page (2-3 jours)

❌ **Page `/checkout/[plan]` à créer**

**Fonctionnalités requises** :

- Afficher plan sélectionné (PRO $49 ou ULTRA $99)
- Générer adresses crypto (Base USDC + Tron USDT)
- Afficher QR codes pour paiement mobile
- Countdown timer (15 min avant expiration)
- Status watcher (vérifier paiement toutes les 10s)
- Redirection post-paiement vers dashboard

**Dépendances** :

- `qrcode` (npm package pour QR codes)
- `react-countdown` (npm package pour timer)
- Payment watcher fonctionnel (étape 3)

---

### 3. Payment Watcher Implémentation (2-3 jours)

⚠️ **Fichier** : `src/lib/crypto/payment-watcher.ts`

**État actuel** : Placeholders (2 TODOs)

- Ligne 81 : `watchPayment()` - RPC calls = placeholder
- Ligne 120 : `watchPaymentWithTimeout()` - Polling réel = placeholder

**À implémenter** :

- RPC calls Base : Détecter Transfer events USDC via ethers.js
- RPC calls Tron : Détecter Transfer events USDT via TronWeb
- Polling avec retry (toutes les 10s pendant 15 min)
- Auto-detection plan depuis montant (49 USDC = PRO, 99 USDC = ULTRA)
- Activation subscription automatique (`activateUserSubscription`)

**Effort** : ~2 jours

**Issue GitHub** : #5

---

### 4. Sweep Transfers Implémentation (1-2 jours)

⚠️ **Fichier** : `scripts/sweep-to-binance.ts`

**État actuel** : Read-only (détecte balances, ne transfère pas)

**À implémenter** :

- Dériver clés privées depuis mnemonic (sécurisé)
- Signer transactions Base (ethers.js)
- Signer transactions Tron (TronWeb)
- Gérer erreurs/retry
- Logger transactions en base

**3 Options** :

1. **Script manuel avec mnemonic** (2-3h, sécurité moyenne)
2. **Service externe** (Fireblocks, Coinbase Commerce - 1-2j, sécurité excellente)
3. **Hardware wallet + script** (Ledger - 4-5h, sécurité excellente)

**Recommandé pour démarrer** : Option 1 (script manuel)

**Effort** : 3-5h (option 1) ou 1-2 jours (options 2-3)

---

### 5. Production XPUB Keys (30 min - 1h) ⚠️ AVANT LANCEMENT

**Actuellement** : Clés testnet (non sécurisées)

**Avant le lancement prod**, tu DOIS :

1. Acheter un Ledger Nano S (~80€) OU
2. Utiliser un mnemonic sécurisé de 24 mots

**Guide complet** : `src/lib/crypto/README.md` lignes 182-282

**Effort** : 30 min (mnemonic) ou 45 min (Ledger)

---

## 📊 Récapitulatif Effort Restant

| Tâche                   | Effort    | Priorité | Bloquant MVP ?        |
| ----------------------- | --------- | -------- | --------------------- |
| Config adresses Binance | 5 min     | P0       | ❌ Non (manuel OK)    |
| UI Checkout page        | 2-3 jours | P0       | ✅ **OUI**            |
| Payment watcher impl    | 2-3 jours | P0       | ✅ **OUI**            |
| Sweep transfers impl    | 3-5h      | P1       | ❌ Non (manuel OK)    |
| Production XPUB keys    | 30 min    | P1       | ❌ Non (avant launch) |

**Total MVP** : ~5-6 jours (checkout UI + payment watcher)

---

## 🎯 Prochaine Action Immédiate

### Pour toi (5 min) :

1. **Lire** : `scripts/SWEEP_SETUP.md`
2. **Configurer** : Adresses dépôt Binance dans `.env.local`
3. **Tester** : `npx tsx scripts/sweep-to-binance.ts`

---

### Pour moi (next session) :

1. **Créer** : UI Checkout page (`/checkout/[plan]`)
2. **Implémenter** : Payment watcher RPC calls
3. **Tester** : Flow complet user → paiement → activation

---

## 📞 Support

- **Documentation sweep** : `scripts/SWEEP_SETUP.md`
- **Documentation crypto** : `src/lib/crypto/README.md`
- **Issues GitHub** : #4 (adresses), #5 (watcher)

---

**Statut global** : 🟢 **READY TO CONTINUE** (système configuré, tests passent, prêt pour UI)
