# 🧹 Guide de Configuration : Sweep vers Binance

Ce guide explique comment configurer le script de **sweep automatique** des fonds crypto vers ton wallet Binance.

---

## 📋 Qu'est-ce que le Sweep ?

**Sweep** = Récupérer automatiquement les fonds des adresses de paiement générées et les transférer vers ton wallet Binance principal.

### Pourquoi sweep vers Binance ?

✅ **Sécurité** : Fonds centralisés sur une plateforme sécurisée avec assurance
✅ **Facilité** : Conversion USDC/USDT → EUR en 1 clic
✅ **Retrait** : Virement bancaire direct depuis Binance
✅ **Comptabilité** : Toutes les transactions visibles dans Binance

### Flow complet

```
User paie 49 USDC
  → Adresse unique générée (0x123...)
  → USDC reçu sur 0x123...
  → Script sweep détecte balance > 10 USDC
  → Transfert automatique vers ton wallet Binance
  → Tu convertis en EUR et retires
```

---

## 🔧 Configuration

### Étape 1 : Obtenir tes adresses de dépôt Binance

#### Pour Base (USDC)

1. **Connecte-toi à Binance** : [binance.com](https://www.binance.com)
2. **Va dans Wallet** → **Fiat and Spot**
3. **Clique sur "Deposit"** (Dépôt)
4. **Sélectionne "USDC"**
5. **Sélectionne le réseau "Base"** (très important !)
6. **Copie l'adresse** de dépôt (format `0x...`)

**Exemple** : `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1`

⚠️ **ATTENTION** : Vérifie que tu es bien sur le réseau **Base**, pas Ethereum ou autre !

#### Pour Tron (USDT)

1. **Même processus que ci-dessus**
2. **Sélectionne "USDT"**
3. **Sélectionne le réseau "TRC20" (Tron)**
4. **Copie l'adresse** de dépôt (format `T...`)

**Exemple** : `TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe`

---

### Étape 2 : Ajouter les adresses dans .env.local

Ouvre `.env.local` et ajoute ces 2 lignes à la fin :

```bash
# 🏦 BINANCE MASTER WALLETS (for sweep)
BINANCE_MASTER_WALLET_BASE="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"  # Ton adresse Binance Base
BINANCE_MASTER_WALLET_TRON="TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe"  # Ton adresse Binance Tron
```

**Remplace par tes vraies adresses Binance !**

---

### Étape 3 : Ajouter dans Vercel Production (optionnel)

Si tu veux automatiser le sweep en production avec un cron job :

```bash
vercel env add BINANCE_MASTER_WALLET_BASE production
# Colle ton adresse Binance Base

vercel env add BINANCE_MASTER_WALLET_TRON production
# Colle ton adresse Binance Tron
```

---

## 🚀 Utilisation

### Tester le script localement

```bash
npx tsx scripts/sweep-to-binance.ts
```

**Sortie attendue** :

```
🧹 Starting sweep of all crypto addresses to Binance...

📊 Found 5 active addresses to check

🟦 Checking 3 Base addresses...

  0xA69D04D4935eE5F44AF64E5628805A5Ed3b03267: 45.50 USDC
    ⚠️  Would sweep 45.50 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
    ⚠️  Transfer not implemented yet (requires private key access)

  0xB123...: 3.20 USDC (skipped, below threshold)

🟣 Checking 2 Tron addresses...

  TABC123...: 99.00 USDT
    ⚠️  Would sweep 99.00 USDT to TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe
    ⚠️  Transfer not implemented yet (requires private key access)

═══════════════════════════════════════════════════════════
✅ Sweep completed!
📦 Addresses checked: 5
💰 Funds swept: 0 addresses (transfer not implemented)
💵 Total amount: ~0.00 USD
═══════════════════════════════════════════════════════════
```

---

## ⚠️ Limitation Actuelle

**Le script est actuellement en READ-ONLY** (lecture seule). Il peut :

✅ Détecter les balances sur les adresses
✅ Identifier quelles adresses ont besoin d'un sweep
✅ Calculer le total à transférer

❌ Mais il **NE PEUT PAS ENCORE** effectuer les transferts réels

### Pourquoi ?

Pour transférer des fonds, le script a besoin d'accéder aux **clés privées** dérivées du mnemonic. Actuellement, on utilise seulement les **xpub** (clés publiques) pour générer les adresses.

---

## 🔐 Prochaine Étape : Implémenter les Transferts

### Option A : Script Manuel avec Mnemonic (Simple)

**Durée** : 2-3h

1. **Créer script sécurisé** `scripts/sweep-with-keys.ts`
2. **Utiliser le mnemonic** pour dériver les clés privées
3. **Signer les transactions** avec ethers.js (Base) et TronWeb (Tron)
4. **Exécuter manuellement** quand tu veux récupérer les fonds

**Sécurité** : 🟡 Moyenne (mnemonic stocké chiffré)

---

### Option B : Service Externe (Fireblocks, Coinbase Commerce)

**Durée** : 1-2 jours d'intégration

Utilise un service tiers qui gère les clés privées de manière sécurisée :

- [Fireblocks](https://www.fireblocks.com/) (entreprise)
- [Coinbase Commerce](https://commerce.coinbase.com/) (simple)
- [BitGo](https://www.bitgo.com/) (sécurité maximale)

**Sécurité** : ✅ Excellente (HSM, multi-sig)

---

### Option C : Hardware Wallet + Script (Production)

**Durée** : 4-5h

1. **Connecter Ledger** via USB
2. **Script demande signature** au Ledger pour chaque transfert
3. **Tu approuves manuellement** sur le Ledger

**Sécurité** : ✅ Excellente (clés jamais exposées)

---

## 📊 Configuration Recommandée

### Pour Développement/Test

✅ **Option A : Script Manuel avec Mnemonic**

- Rapide à implémenter
- Suffisant pour volumes faibles
- Exécution manuelle (pas de risque d'automatisation)

---

### Pour Production (> 10k$/mois)

✅ **Option C : Hardware Wallet**

- Sécurité maximale
- Contrôle total
- Pas de dépendance tiers

---

## 🤖 Automatisation (Optionnel)

### Via Vercel Cron Job

Ajoute dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/sweep",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Crée `app/api/cron/sweep/route.ts` :

```typescript
import { sweepAllAddresses } from '@/scripts/sweep-to-binance'

export async function GET(request: Request) {
  // Vérifier secret CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Exécuter sweep
  const results = await sweepAllAddresses()

  return Response.json({ success: true, results })
}
```

**Exécution** : Tous les jours à 2h du matin (UTC)

---

## 🆘 Troubleshooting

### Erreur : "BINANCE_MASTER_WALLET_BASE not configured"

→ Tu n'as pas ajouté ton adresse Binance dans `.env.local`

---

### Erreur : "Failed to connect to RPC"

→ Vérifie que `BASE_RPC_URL` et `TRON_RPC_URL` sont bien configurés

---

### Balance détectée = 0 alors que j'ai reçu des fonds

→ Vérifie le réseau (Base vs Ethereum, TRC20 vs ERC20)
→ Vérifie l'adresse sur [BaseScan](https://basescan.org) ou [TronScan](https://tronscan.org)

---

## 📞 Support

- Issues GitHub : [MyCryptoPilot Issues](https://github.com/YoannDrx/mycryptopilot/issues)
- Documentation Binance : [Deposit Guide](https://www.binance.com/en/support/faq/how-to-deposit-crypto-on-binance-115003698492)

---

**Créé le** : 11 octobre 2025
**Auteur** : MyCryptoPilot Team
