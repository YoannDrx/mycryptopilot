# Crypto Payment System - Address Generator

Ce module implémente la génération d'adresses crypto pour les paiements Base (USDC) et Tron (USDT) en utilisant la dérivation HD wallet (BIP44).

## 🎯 Fonctionnalités

✅ **Génération d'adresses Base** (Ethereum-compatible, pour USDC)
✅ **Génération d'adresses Tron** (pour USDT TRC-20)
✅ **Dérivation HD wallet** depuis extended public keys (xpub)
✅ **Watch-only** - Aucune clé privée stockée ou accessible
✅ **Réutilisation d'adresses** - Même adresse pour le même utilisateur + réseau
✅ **Adresses uniques** - Chaque utilisateur reçoit des adresses différentes

## 📂 Fichiers

- `address-generator.ts` - Module principal de génération d'adresses
- `mycryptopilot-plans.ts` - Configuration des plans tarifaires
- `payment-watcher.ts` - Surveillance des paiements on-chain (TODO)
- `README.md` - Cette documentation

## 🔐 Sécurité

**IMPORTANT**: Ce système utilise des **extended public keys (xpub)** uniquement. Les clés privées ne sont JAMAIS stockées ou accessibles depuis l'application.

### Dérivation HD Wallet (BIP44)

**Base (Ethereum)**: `m/44'/60'/0'/0/{index}`
- 44' = BIP44 standard
- 60' = Ethereum coin type
- 0'/0 = Account 0, External chain
- {index} = Index séquentiel par utilisateur

**Tron**: `m/44'/195'/0'/0/{index}`
- 44' = BIP44 standard
- 195' = Tron coin type
- 0'/0 = Account 0, External chain
- {index} = Index séquentiel par utilisateur

## 🚀 Utilisation

### Générer une adresse pour un utilisateur

```typescript
import { generateCryptoAddress } from '@/lib/crypto/address-generator'

// Générer une adresse Base (USDC)
const baseAddress = await generateCryptoAddress(userId, 'BASE')
console.log(baseAddress.address) // 0x...

// Générer une adresse Tron (USDT)
const tronAddress = await generateCryptoAddress(userId, 'TRON')
console.log(tronAddress.address) // T...
```

### Récupérer toutes les adresses d'un utilisateur

```typescript
import { getUserCryptoAddresses } from '@/lib/crypto/address-generator'

const addresses = await getUserCryptoAddresses(userId)
addresses.forEach(addr => {
  console.log(`${addr.network}: ${addr.address}`)
})
```

### Générer adresses pour tous les réseaux supportés

```typescript
import { ensureUserCryptoAddresses } from '@/lib/crypto/address-generator'

const addresses = await ensureUserCryptoAddresses(userId)
// Génère automatiquement Base + Tron si elles n'existent pas
```

## 🛠️ Configuration

### Variables d'environnement requises

```bash
# Extended public keys (testnet ou mainnet)
CRYPTO_XPUB_BASE="xpub..." # Extended public key Base (Ethereum)
CRYPTO_XPUB_TRON="xpub..." # Extended public key Tron
```

### Générer des XPUB keys pour testnet

```bash
npx tsx scripts/generate-testnet-xpub.ts
```

Ce script va:
1. Générer un nouveau mnemonic de test (BIP39)
2. Dériver les extended public keys (xpub) pour Base et Tron
3. Afficher les variables d'environnement à ajouter dans `.env.local`

⚠️ **ATTENTION**: Ces clés sont pour TEST uniquement. En production, utilisez un hardware wallet (Ledger/Trezor).

## ✅ Tests

### Exécuter les tests

```bash
./scripts/test-address-generation-wrapper.sh
```

Les tests vérifient:
- ✅ Génération d'adresses Base valides (format `0x...`)
- ✅ Génération d'adresses Tron valides (format `T...`)
- ✅ Réutilisation des adresses pour le même utilisateur
- ✅ Unicité des adresses entre utilisateurs
- ✅ Stockage correct en base de données

### Résultats attendus

```
✅ All tests passed!
✅ Base (Ethereum) addresses are valid
✅ Tron addresses are valid
✅ Address reuse is working
✅ Unique addresses per user
```

## 📊 Base de données

### Table `crypto_address`

```prisma
model CryptoAddress {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  network         CryptoNetwork // BASE, TRON
  address         String        @unique
  derivationPath  String?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())

  @@unique([userId, network])
  @@index([userId])
}
```

## 🔗 Dépendances

- `ethers@^6` - Dérivation HD wallet Base (Ethereum)
- `@scure/bip32` - Dérivation BIP32 pour Tron
- `@scure/bip39` - Génération mnemonic (scripts uniquement)
- `@noble/hashes` - Hash keccak256 pour adresses Tron
- `bs58check` - Encodage base58check pour adresses Tron

## 📝 Notes pour production

### Avant de passer en production

1. **Générer des XPUB depuis hardware wallet**:
   - Utilisez Ledger ou Trezor
   - Dérivez les chemins `m/44'/60'/0'` (Base) et `m/44'/195'/0'` (Tron)
   - Exportez les extended public keys uniquement

2. **Sécuriser les variables d'environnement**:
   - Utilisez un secret manager (AWS Secrets Manager, Vault, etc.)
   - Ne committez JAMAIS les clés dans le code

3. **Monitorer les adresses générées**:
   - Vérifiez régulièrement la dérivation
   - Alertez sur les index trop élevés (> 10000)

4. **Backup des xpub keys**:
   - Gardez une copie sécurisée des xpub
   - Documentez le chemin de dérivation utilisé

## 🐛 Debugging

### Activer les logs

Les logs sont automatiques via le logger. Vérifiez:
- `Derived Base address from HD wallet` - Succès dérivation Base
- `Derived Tron address from HD wallet` - Succès dérivation Tron
- `Returning existing crypto address` - Réutilisation d'adresse

### Problèmes communs

**Erreur: `CRYPTO_XPUB_BASE is not configured`**
→ Vérifiez que `.env.local` contient les XPUB keys

**Erreur: `Foreign key constraint violated`**
→ L'utilisateur n'existe pas en DB. Créez-le d'abord.

**Adresse Tron invalide (ne commence pas par T)**
→ Vérifiez que l'encodage base58check est correct

## 📚 Références

- [BIP44 - Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [BIP32 - Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [Ethereum HD Wallets](https://ethereum.org/en/developers/docs/accounts/#hd-wallets)
- [Tron Address Format](https://developers.tron.network/docs/account)

---

**Auteur**: MyCryptoPilot Team
**Dernière mise à jour**: 9 octobre 2025
