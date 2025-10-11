# Crypto Payment System - Address Generator

Ce module implémente la génération d'adresses crypto pour les paiements Base (USDC) et Tron (USDT) en utilisant la dérivation HD wallet (BIP44).

---

## ⚠️ IMPORTANT: ÉTAT ACTUEL DU SYSTÈME (10 octobre 2025)

**STATUT**: 🟡 **STRUCTURE CRÉÉE - IMPLÉMENTATION PLACEHOLDERS**

Ce système crypto est **structuré et documenté** mais contient des **placeholders** dans les parties critiques :

### 🔴 TODOs Critiques

**Issue #4 - Génération Adresses Crypto (2 TODOs)**:

- `src/lib/crypto/address-generator.ts:137` - `deriveAddressFromIndex()` - HD wallet derivation = placeholder
- `src/lib/crypto/address-generator.ts:184` - `generatePaymentAddress()` - Retourne des adresses placeholder

**Issue #5 - Watcher On-Chain (2 TODOs)**:

- `src/lib/crypto/payment-watcher.ts:81` - `watchPayment()` - RPC calls = placeholder
- `src/lib/crypto/payment-watcher.ts:120` - `watchPaymentWithTimeout()` - Polling réel = placeholder

### ✅ Ce Qui Fonctionne

- Plans configuration (`mycryptopilot-plans.ts`) ✅
- Structure de la base de données (CryptoAddress, CryptoPayment) ✅
- Documentation complète (ce fichier) ✅
- Tests de structure ✅

### ❌ Ce Qui Manque

- Vraie dérivation HD wallet (ethers v6 + tronweb)
- Appels RPC réels (Base/Tron networks)
- Détection on-chain des transferts USDC/USDT
- UI de paiement crypto (`/checkout/[plan]`)

**Effort restant**: ~4-5 jours de développement (Issue #4: 3j, Issue #5: 2j)

Pour implémenter le système complet, voir sections ci-dessous.

---

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
import { generateCryptoAddress } from "@/lib/crypto/address-generator";

// Générer une adresse Base (USDC)
const baseAddress = await generateCryptoAddress(userId, "BASE");
console.log(baseAddress.address); // 0x...

// Générer une adresse Tron (USDT)
const tronAddress = await generateCryptoAddress(userId, "TRON");
console.log(tronAddress.address); // T...
```

### Récupérer toutes les adresses d'un utilisateur

```typescript
import { getUserCryptoAddresses } from "@/lib/crypto/address-generator";

const addresses = await getUserCryptoAddresses(userId);
addresses.forEach((addr) => {
  console.log(`${addr.network}: ${addr.address}`);
});
```

### Générer adresses pour tous les réseaux supportés

```typescript
import { ensureUserCryptoAddresses } from "@/lib/crypto/address-generator";

const addresses = await ensureUserCryptoAddresses(userId);
// Génère automatiquement Base + Tron si elles n'existent pas
```

## 🛠️ Configuration

### Variables d'environnement requises

```bash
# Extended public keys (testnet ou mainnet)
CRYPTO_XPUB_BASE="xpub..." # Extended public key Base (Ethereum)
CRYPTO_XPUB_TRON="xpub..." # Extended public key Tron
```

---

## 🔐 Guide Complet: Générer les XPUB Keys

### 📋 Qu'est-ce qu'un XPUB ?

Un **Extended Public Key (xpub)** permet de générer une infinité d'adresses publiques **sans avoir accès aux clés privées**. C'est parfait pour un système de paiement watch-only.

**Avantages**:

- ✅ Aucune clé privée sur le serveur (sécurité maximale)
- ✅ Génération d'adresses illimitée
- ✅ Si le serveur est compromis, les fonds sont en sécurité

---

### 🎯 Option 1: Pour Développement Local / Testnet (RECOMMANDÉ pour démarrer)

**Durée**: 5 minutes

#### Étape 1: Générer les clés testnet

```bash
npx tsx scripts/generate-testnet-xpub.ts
```

#### Étape 2: Sauvegarder le mnemonic

Le script affiche un mnemonic de 12 mots. **SAUVEGARDEZ-LE** dans un endroit sûr (password manager, coffre-fort physique).

```
📝 Generated Mnemonic (SAVE THIS SECURELY):
   urban spin minimum bicycle jeans someone bid view finger canyon whale lion
```

⚠️ **IMPORTANT**: Sans ce mnemonic, vous ne pourrez pas accéder aux fonds envoyés aux adresses générées !

#### Étape 3: Copier les XPUB dans .env.local

Le script affiche les variables d'environnement :

```bash
CRYPTO_XPUB_BASE="xpub6N7sdi6Sg2je8tzPT82VEYoTSRfbwwX5ainzENHWkNPBgUJGn8qxntovmphr6qbH7ecEYsDjZuEyjkR6HKgkcBoZgGTYLfQ34A8uCsg7ccQ"
CRYPTO_XPUB_TRON="xpub6CcdKscfwZnhK13xafCaxNVRNAfArcLmA4QF8xieodw93dQoDSduCBo97uVzbauhFSYPWx5ihDZDAWyB2b6PEGRgJbDfiSQNjsSgz5MyEky"
```

Ajoutez-les dans votre `.env.local`.

#### Étape 4: Tester

```bash
./scripts/test-address-generation-wrapper.sh
```

✅ Si tous les tests passent, c'est bon !

**⚠️ Limitations**: Ces clés sont pour **DEV/TESTNET UNIQUEMENT**. Ne les utilisez JAMAIS en production.

---

### 🏭 Option 2: Pour Production avec Hardware Wallet (RECOMMANDÉ)

**Durée**: 30-45 minutes
**Matériel requis**: Ledger Nano S/X ou Trezor

#### 🔹 Avec Ledger Nano

**Étape 1: Installer Ledger Live**

1. Téléchargez [Ledger Live](https://www.ledger.com/ledger-live)
2. Connectez votre Ledger
3. Installez les apps **Ethereum** et **Tron** sur le Ledger

**Étape 2: Générer XPUB Base (Ethereum)**

1. Ouvrez Ledger Live
2. Allez dans **Accounts** → **Add account** → **Ethereum**
3. Le Ledger va dériver un compte à `m/44'/60'/0'/0`
4. Une fois le compte créé, allez dans **Account settings** → **Advanced**
5. Copiez l'**Extended Public Key (xpub)** affiché

**Alternative via Electrum (plus technique)**:

```bash
# 1. Installer Electrum
# Linux/Mac: https://electrum.org/#download
# Windows: Télécharger l'installateur

# 2. Connecter Ledger et ouvrir app Ethereum
# 3. Créer nouveau wallet "Standard wallet" → "Use a hardware device"
# 4. Dans Console (View → Show Console):
wallet.get_master_public_key()
# Copier le xpub
```

**Étape 3: Générer XPUB Tron**

Pour Tron, c'est plus complexe car Ledger Live ne montre pas directement l'xpub.

**Option A: Via TronLink Pro**

1. Téléchargez [TronLink Pro](https://www.tronlink.org/)
2. Connectez votre Ledger
3. Importez le compte Ledger
4. Utilisez les Developer Tools pour extraire l'xpub:
   ```javascript
   // Dans la console du navigateur (F12)
   tronWeb.defaultAddress.base58;
   // Note: Ceci donne l'adresse, pas l'xpub directement
   ```

**Option B: Via script Python avec tronpy** (plus technique)

```python
# Installation
pip install tronpy ledgerblue

# Script extract-tron-xpub.py
from ledgerblue.comm import getDongle
from tronpy import keys

# Connecter au Ledger
dongle = getDongle()

# Dériver le chemin m/44'/195'/0'
path = "44'/195'/0'"
# ... (code pour communiquer avec Ledger)

# Extraire xpub
# (Nécessite implémentation complète avec APDU commands)
```

**Option C: Utiliser un service tiers sécurisé** (plus simple)

Services comme **Fireblocks**, **Copper**, ou **Anchorage** offrent la gestion de clés avec extraction d'xpub.

**⚠️ IMPORTANT pour Tron**: Si trop complexe, une alternative est d'utiliser le même mnemonic que Base mais avec un chemin différent. Voir Option 3 ci-dessous.

#### Étape 4: Ajouter aux variables d'environnement

Ajoutez les xpub dans votre système de secrets :

**Vercel**:

```bash
vercel env add CRYPTO_XPUB_BASE
vercel env add CRYPTO_XPUB_TRON
```

**AWS Secrets Manager**:

```bash
aws secretsmanager create-secret \
  --name mycryptopilot/crypto/xpub-base \
  --secret-string "xpub..."
```

**GitHub Secrets** (pour CI uniquement):

```
Settings → Secrets and variables → Actions → New repository secret
```

---

### 🔧 Option 3: Mnemonic partagé Base + Tron (Compromis dev/production)

**Durée**: 15 minutes
**Sécurité**: Moyenne (mnemonic stocké, mais chiffré)

Si vous voulez éviter la complexité de Ledger pour Tron, vous pouvez utiliser un **mnemonic sécurisé partagé**.

#### Étape 1: Générer un mnemonic sécurisé

**Option A: Via hardware wallet**

1. Configurez un nouveau Ledger/Trezor
2. Notez le mnemonic de 24 mots généré

**Option B: Via Ian Coleman's BIP39 Tool (OFFLINE)**

1. Téléchargez [BIP39 Tool](https://github.com/iancoleman/bip39) en local
2. Déconnectez internet
3. Générez un mnemonic de 24 mots
4. Copiez-le dans un password manager (1Password, Bitwarden)

#### Étape 2: Dériver les XPUB avec notre script

Modifiez temporairement `scripts/generate-testnet-xpub.ts` :

```typescript
// Remplacez cette ligne:
const mnemonic = Wallet.createRandom().mnemonic;

// Par votre mnemonic sécurisé:
const mnemonic = {
  phrase: "votre mnemonic de 24 mots ici",
  // ... ethers va calculer le reste
};
```

Exécutez:

```bash
npx tsx scripts/generate-testnet-xpub.ts
```

**⚠️ SUPPRIMEZ le mnemonic du fichier après** !

#### Étape 3: Chiffrer et stocker le mnemonic

**Option A: Via Ansible Vault**

```bash
ansible-vault create secrets.yml
# Entrez le mnemonic
```

**Option B: Via GPG**

```bash
echo "votre mnemonic" | gpg --encrypt --armor > mnemonic.gpg
```

**Option C: Via Password Manager**

- 1Password, Bitwarden, LastPass (avec 2FA activé)

#### Étape 4: Configurer les XPUB en production

Même processus que l'Option 2, Étape 4.

---

### 📊 Comparaison des Options

| Critère              | Option 1 (Script)    | Option 2 (Ledger)  | Option 3 (Mnemonic) |
| -------------------- | -------------------- | ------------------ | ------------------- |
| **Sécurité**         | ⚠️ Faible (dev only) | ✅ Excellente      | 🟡 Moyenne          |
| **Durée setup**      | 5 min                | 45 min             | 15 min              |
| **Coût**             | Gratuit              | ~80€ (Ledger)      | Gratuit             |
| **Usage recommandé** | Dev/Testnet          | Production         | Staging/Pre-prod    |
| **Accès fonds**      | ⚠️ Mnemonic en clair | ✅ Hardware wallet | 🟡 Mnemonic chiffré |

---

### 🔒 Bonnes Pratiques de Sécurité

#### ✅ À FAIRE

1. **Utilisez un hardware wallet en production**
2. **Chiffrez tous les mnemonics** (ne les stockez JAMAIS en clair)
3. **Activez 2FA** sur tous les services (Vercel, GitHub, AWS)
4. **Limitez l'accès** aux secrets (principe du moindre privilège)
5. **Auditez régulièrement** qui a accès aux xpub
6. **Sauvegardez les mnemonics** dans plusieurs endroits sécurisés (coffre-fort, password manager)

#### ❌ À ÉVITER

1. ❌ **Ne committez JAMAIS** de mnemonic/xpub dans Git
2. ❌ **Ne partagez JAMAIS** les mnemonics par email/Slack
3. ❌ **N'utilisez JAMAIS** de clés de dev/testnet en production
4. ❌ **Ne stockez JAMAIS** de clés privées sur le serveur (xpub uniquement)
5. ❌ **Ne réutilisez JAMAIS** un mnemonic entre plusieurs projets

---

### 🆘 En Cas de Problème

#### Le script génère des erreurs

```bash
# Vérifiez que les dépendances sont installées
pnpm install

# Vérifiez Node.js version (>= 18)
node --version
```

#### Les XPUB ne fonctionnent pas

```bash
# Testez la génération d'adresses
npx tsx scripts/test-address-generation.ts

# Vérifiez le format (doit commencer par "xpub")
echo $CRYPTO_XPUB_BASE | grep "^xpub"
```

#### Besoin de régénérer les clés

⚠️ **ATTENTION**: Changer les xpub rendra les anciennes adresses inaccessibles !

1. Notez toutes les adresses déjà générées
2. Récupérez les fonds avant de changer
3. Générez de nouvelles xpub
4. Mettez à jour les variables d'environnement
5. Redéployez l'application

---

### 📞 Support

- Documentation Ledger: https://support.ledger.com/
- BIP44 Standard: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- Electrum Docs: https://electrum.readthedocs.io/
- Issues GitHub: https://github.com/YoannDrx/mycryptopilot/issues

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
