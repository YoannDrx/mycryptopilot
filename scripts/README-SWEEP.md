# 🧹 Sweep Script - Guide d'Utilisation

Script automatisé pour transférer les fonds crypto reçus vers tes wallets Binance.

---

## 🚀 Quick Start

### 1. Configuration (Une seule fois)

```bash
# Copier le template de configuration
cp .env.sweep.example .env.sweep

# Éditer .env.sweep avec tes seed phrases et adresses Binance
nano .env.sweep
```

**Variables requises**:
- `SWEEP_MNEMONIC_BASE` - Ta seed phrase Base (24 mots)
- `SWEEP_MNEMONIC_TRON` - Ta seed phrase Tron (24 mots)
- `BINANCE_MASTER_WALLET_BASE` - Ton adresse Binance Base (0x...)
- `BINANCE_MASTER_WALLET_TRON` - Ton adresse Binance Tron (T...)

### 2. Test en Dry-Run (Preview)

```bash
# Voir ce qui serait swept sans exécuter
npx tsx scripts/sweep-to-binance.ts
```

Output attendu:
```
🧹 Starting sweep of all crypto addresses to Binance...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  SWEEP CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode:               🔍 DRY RUN (preview only)
Network:            🚀 Mainnet
Min threshold:      $10 USD
Base wallet:        ✅ Configured
Tron wallet:        ✅ Configured
Base mnemonic:      ✅ Configured
Tron mnemonic:      ✅ Configured
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Dry-run mode enabled: No real transactions will be sent.

📊 Found 3 active addresses to check

🟦 Checking 2 Base addresses...

  0xA69D04D4935eE5F44AF64E5628805A5Ed3b03267: 49.50 USDC
    🔍 [DRY RUN] Would sweep 49.50 USDC to 0x742d35Cc...

  0xB123...: 3.20 USDC (skipped, below threshold)

🟣 Checking 1 Tron addresses...

  TABC123...: 99.00 USDT
    🔍 [DRY RUN] Would sweep 99.00 USDT to TJDENsfB...

═══════════════════════════════════════════════════════════
✅ Sweep completed!
📦 Addresses checked: 3
💰 Funds swept: 0 addresses (dry-run mode)
💵 Total amount: ~148.50 USD
═══════════════════════════════════════════════════════════
```

### 3. Exécution Réelle

```bash
# ATTENTION: Transfère RÉELLEMENT les fonds!
DRY_RUN=false npx tsx scripts/sweep-to-binance.ts
```

Le script demandera une confirmation:
```
⚠️  WARNING: You are about to execute REAL sweep transactions!
⚠️  Funds will be transferred to your Binance wallets immediately.

🔐 Type "CONFIRM" to proceed with sweep (or anything else to cancel):
```

Tape `CONFIRM` pour lancer le sweep.

---

## ⚙️ Configuration Avancée

### Variables Optionnelles (.env.sweep)

```bash
# Seuil minimum pour sweep (défaut: 10 USD)
SWEEP_MIN_THRESHOLD_USD="50"

# Mode dry-run par défaut (défaut: true)
DRY_RUN="true"

# Notifications email (défaut: false)
SWEEP_EMAIL_NOTIFICATION="true"
SWEEP_NOTIFICATION_EMAIL="ton-email@example.com"
```

---

## 🔐 Sécurité

### Checklist avant le Premier Sweep

- [ ] Seed phrases sauvegardées dans 1Password/Bitwarden
- [ ] `.env.sweep` dans `.gitignore` (vérifié)
- [ ] Adresses Binance vérifiées (0x... pour Base, T... pour Tron)
- [ ] Test en dry-run passé avec succès
- [ ] Réseau correct (testnet ou mainnet)

### Gas Fees

**Base Network (ETH)**:
- Besoin de ~0.001 ETH par adresse pour payer les gas fees
- Coût estimé: ~$3-5 par sweep (selon gas price)
- Si pas assez d'ETH: le sweep skip automatiquement l'adresse

**Tron Network (TRX)**:
- Besoin de ~5 TRX par adresse
- Coût estimé: ~$0.50 par sweep
- Si pas assez de TRX: le sweep skip automatiquement l'adresse

**Solution**: Envoyer un peu de ETH/TRX aux adresses de paiement avant de sweeper, OU implémenter un "gas station wallet" qui alimente automatiquement.

---

## 📊 Monitoring

### Vérifier les Sweeps Passés

```bash
# Via Prisma Studio
npx prisma studio

# Table: CryptoAddress
# Colonnes: sweptAt, sweptTxHash
```

### Explorer Transactions

**Base (mainnet)**:
- Explorer: https://basescan.org/tx/[TX_HASH]

**Tron (mainnet)**:
- Explorer: https://tronscan.org/#/transaction/[TX_HASH]

### Logs

Le script affiche:
- ✅ Confirmations (block numbers)
- 💾 Mises à jour database
- 🔗 Liens explorateurs

---

## 🐛 Troubleshooting

### Erreur: "SWEEP_MNEMONIC_BASE not configured"

**Solution**: Vérifie que `.env.sweep` existe et contient tes seed phrases.

```bash
# Vérifier le fichier
cat .env.sweep | grep SWEEP_MNEMONIC
```

### Erreur: "Insufficient ETH for gas fees"

**Solution**: Envoie ~0.001 ETH à l'adresse de paiement avant de sweeper.

```bash
# Vérifier balance ETH
cast balance 0xYourAddress --rpc-url https://mainnet.base.org
```

### Erreur: "Derived address mismatch"

**Solution**: Le mnemonic ne correspond pas aux XPUBs utilisés. Vérifie:

1. Tu utilises les **MÊMES seed phrases** que celles qui ont généré les XPUBs
2. Le réseau est correct (testnet vs mainnet)
3. Les seed phrases sont complètes (24 mots avec espaces)

### Balance = 0 alors que j'ai reçu des fonds

**Solution**: Vérifie le réseau (Base vs Ethereum, TRC20 vs ERC20)

```bash
# Vérifier sur l'explorer
# Base: https://basescan.org/address/[ADDRESS]
# Tron: https://tronscan.org/#/address/[ADDRESS]
```

---

## 🔄 Automatisation (Optionnel)

### Cron Job Vercel

**Non recommandé** pour le sweep car nécessite les seed phrases. Mieux vaut exécuter manuellement.

### Script Hebdomadaire Local

Ajoute à ton crontab:

```bash
# Tous les lundis à 9h
0 9 * * 1 cd /path/to/mycryptopilot && DRY_RUN=false npx tsx scripts/sweep-to-binance.ts
```

**Note**: Nécessite que ta machine soit allumée.

---

## 📧 Notifications Email

Configurer dans `.env.sweep`:

```bash
SWEEP_EMAIL_NOTIFICATION="true"
SWEEP_NOTIFICATION_EMAIL="ton-email@example.com"
```

Email envoyé après chaque sweep réussi avec:
- Résumé (total swept)
- Détails par transaction (Base + Tron)
- Liens explorateurs
- Prochaines étapes (conversion EUR, retrait)

---

## 📚 Références

- [Setup Guide](./SWEEP_SETUP.md) - Configuration détaillée
- [Crypto Payments Doc](../.claude/docs/CRYPTO-PAYMENTS.md) - Architecture HD wallet
- [Database Schema](../prisma/schema.prisma) - Modèle CryptoAddress

---

**Créé le**: 24 octobre 2025
**Dernière mise à jour**: 24 octobre 2025
