# 📜 MyCryptoPilot Scripts Index

**Dernière mise à jour**: 2 novembre 2025
**Total scripts**: 23 fichiers organisés

---

## 📂 Structure

```
scripts/
├── README.md                    # Ce fichier
├── dev-tools/                   # Scripts de test et développement (9)
├── archive/                     # Scripts obsolètes (0)
│
├── 🔐 Crypto & Payments (4)
├── 🧪 Testing & Setup (2)
├── 👥 User Management (3)
├── 🗄️ Database (1)
├── 📧 Email (1)
├── 🤖 Discord (2)
└── 🚀 Deployment (1)
```

---

## 🔐 Crypto & Payments

### `generate-mainnet-xpubs.ts` (13K) ✅ PRODUCTION
**Description**: Génère les Extended Public Keys (XPUB) pour mainnet
**Usage**:
```bash
npx tsx scripts/generate-mainnet-xpubs.ts
```
**Output**: XPUB Base + Tron pour production
**Variables requises**: `CRYPTO_MNEMONIC_BASE`, `CRYPTO_MNEMONIC_TRON`

---

### `generate-testnet-xpubs.ts` (4.1K) ✅ DEV
**Description**: Génère les Extended Public Keys (XPUB) pour testnet
**Usage**:
```bash
npx tsx scripts/generate-testnet-xpubs.ts
```
**Output**: XPUB testnet pour développement
**Variables requises**: `CRYPTO_MNEMONIC_TESTNET_BASE`, `CRYPTO_MNEMONIC_TESTNET_TRON`

---

### `sweep-to-binance.ts` (23K) ✅ OPÉRATIONNEL
**Description**: Regroupe les soldes des adresses de paiement (Base/Tron) et envoie les fonds vers les wallets Binance.
**Usage**:
```bash
# Dry-run (aucune transaction, mode par défaut)
npx tsx scripts/sweep-to-binance.ts

# Sweep réel (demande de saisir CONFIRM)
DRY_RUN=false npx tsx scripts/sweep-to-binance.ts
```
**Documentation**: `README-SWEEP.md`, `SWEEP_SETUP.md`
**Variables requises**: `.env.sweep` (DRY_RUN, SWEEP_MIN_THRESHOLD_USD, seed Base/Tron) + `BINANCE_MASTER_WALLET_BASE`, `BINANCE_MASTER_WALLET_TRON`
**Notes**: Met à jour `CryptoAddress.sweptAt/sweptTxHash` et journalise les liens BaseScan/TronScan.

---

### `verify-encryption.ts` (6.3K) ✅ MAINTENANCE
**Description**: Diagnostic des exchange connections encryptées
**Usage**:
```bash
npx tsx scripts/verify-encryption.ts
```
**Output**: Vérifie encryption/decryption des API keys Binance/Bybit
**Variables requises**: `ENCRYPTION_SECRET`

---

## 🧪 Testing & Setup

### `setup-test-db.sh` (1.7K) ✅ E2E TESTS
**Description**: Configure la base de données de test
**Usage**:
```bash
./scripts/setup-test-db.sh
```
**Actions**: Crée DB test, applique migrations, seed data
**Variables requises**: `DATABASE_URL_TEST`

---

### `run-e2e-tests.sh` (4.1K) ✅ E2E TESTS
**Description**: Exécute les tests Playwright E2E
**Usage**:
```bash
./scripts/run-e2e-tests.sh
```
**Actions**: Setup DB test → Run Playwright → Cleanup
**Variables requises**: `NODE_ENV=test`

---

## 👥 User Management

### `upgrade-to-pro.ts` (≈2K) ✅ ADMIN
**Description**: Upgrade manuel via `activateSubscription` (plan PRO).
**Usage**:
```bash
npx tsx scripts/upgrade-to-pro.ts <user-email> [daysGranted=30]
```
**Effets**: Applique le plan PRO, prolonge `daysGranted`, déclenche Discord + email + bonus referral.

---

### `upgrade-to-ultra.ts` (≈2K) ✅ ADMIN
**Description**: Upgrade manuel via `activateSubscription` (plan ULTRA).
**Usage**:
```bash
npx tsx scripts/upgrade-to-ultra.ts <user-email> [daysGranted=30]
```
**Effets**: Applique le plan ULTRA, prolonge `daysGranted`, déclenche Discord + email + bonus referral.

---

### `clean-resend-audience.ts` (3.8K) ✅ MAINTENANCE
**Description**: Nettoie l'audience Resend (supprime emails invalides/bounced)
**Usage**:
```bash
npx tsx scripts/clean-resend-audience.ts
```
**Variables requises**: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`

---

## 🗄️ Database

### `backfill-trader-trade-quantities.ts` (4K) ✅ MIGRATION
**Description**: Fix données `totalQuantity` après Phase 7 (Portfolio Tracking)
**Usage**:
```bash
npx tsx scripts/backfill-trader-trade-quantities.ts
```
**Actions**: Recalcule `totalQuantity` pour trades CLOSED avec nouvelle formule
**Migration**: Peut être archivé si migration complète

---

## 🤖 Discord

### `start-discord-bot.ts` (≈2K) ✅ LOCAL
**Description**: Démarre le bot Discord en local (utilise `.env.local` / `.env`).
**Usage**:
```bash
npx tsx scripts/start-discord-bot.ts
```
**Notes**: Charge automatiquement `.env.local` (fallback `.env.development`/`.env`). Nécessite `DISCORD_BOT_ENABLED=true`.

---

### `deploy-railway.sh` (4K) ✅ DEPLOYMENT
**Description**: Déploie le bot Discord sur Railway (login CLI + `railway up`).
**Usage**:
```bash
./scripts/deploy-railway.sh
```
**Notes**: Vérifie la présence de Railway CLI, invite au login si besoin, rappelle les variables à configurer (`DISCORD_BOT_*`, `DATABASE_URL`, etc.).

---

## 🚀 Deployment

### `conductor-setup-script.sh` (3.2K) ❓ CONDUCTOR
**Description**: Setup Conductor workspace
**Status**: À vérifier - Conductor encore utilisé?

---

### `conductor-archive-script.sh` (3.1K) ❓ CONDUCTOR
**Description**: Archive Conductor workspace
**Status**: À vérifier - Conductor encore utilisé?

---

## 🛠️ Dev Tools (9 scripts)

Dossier: `scripts/dev-tools/`

Scripts de test et debug manuel (non utilisés en production):

1. **`test-checkout.ts`** (9.2K) - Test complet checkout crypto
2. **`test-checkout-simple.ts`** (2.6K) - Test checkout simplifié
3. **`test-address-generation.ts`** (5.6K) - Test génération adresses
4. **`test-rpc-urls.ts`** (5.5K) - Test connectivity RPC nodes
5. **`test-crypto-addresses.ts`** (3.7K) - Test addresses DB
6. **`test-db.ts`** (2K) - Test connection DB
7. **`test-crypto.sh`** (936B) - Quick crypto test
8. **`test-cleanup.ts`** (2.9K) - Cleanup test data
9. **`check-test-env.sh`** (3.7K) - Vérifie env vars test

**Usage**: Ces scripts sont conservés pour debug manuel si nécessaire.

---

## 📖 Documentation Scripts

- **`README-SWEEP.md`** - Guide d'utilisation sweep script
- **`SWEEP_SETUP.md`** - Configuration détaillée sweep

---

## 🚨 Points de vigilance

### ⚠️ À clarifier
- [ ] `conductor-setup-script.sh` / `conductor-archive-script.sh` — Conductor toujours utilisé ? Archiver si workflow abandonné.
- [ ] `backfill-trader-trade-quantities.ts` — Script one-shot. Archiver une fois la backfill exécutée partout.

### ✅ Aligné (nov 2025)
- [x] `sweep-to-binance.ts` — Transferts réels implémentés (dry-run par défaut).
- [x] `start-discord-bot.ts` — Charge `.env.local` (fallback `.env`), utile pour debug local.

---

## 💡 Guidelines d'Utilisation

### Scripts Production
✅ Toujours tester en dry-run/preview avant exécution réelle
✅ Vérifier variables d'environnement requises
✅ Backup DB avant scripts de migration
✅ Logger toutes les exécutions (stdout + fichier)

### Scripts Dev Tools
🛠️ Utiliser uniquement en local development
🛠️ Ne jamais exécuter en production
🛠️ Cleanup data après tests

### Variables d'Environnement
Voir: `.claude/docs/ENV-VARIABLES-MAPPING.md` pour la liste complète

---

## 📚 Références

- **Crypto Payments**: `.claude/docs/CRYPTO-PAYMENTS.md`
- **Portfolio Tracking**: `.claude/docs/PORTFOLIO-TRACKING.md`
- **Environment Vars**: `.claude/docs/ENV-VARIABLES-MAPPING.md`
- **Discord Setup**: `.claude/docs/DISCORD-SETUP.md`

---

**Maintenu par**: MyCryptoPilot Team
**Créé le**: 2 novembre 2025
