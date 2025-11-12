# 🧹 Guide de configuration : Sweep vers Binance

Ce guide explique comment configurer et exploiter `scripts/sweep-to-binance.ts`, le script qui regroupe les fonds reçus sur les adresses de paiement Base/Tron et les transfère vers tes wallets Binance.

---

## ⚙️ Pré-requis

- **Ne partage jamais `.env.sweep`**. Stocker les seed phrases dans un gestionnaire chiffré (1Password, Bitwarden).
- Dispose d’un minimum de gas :
  - Base : ~0.001 ETH par adresse à balayer.
  - Tron : ~5 TRX par adresse.
- Vérifie que les adresses de destination sont bien des adresses de dépôt Binance sur les bons réseaux (Base / TRC20).

---

## 1. Configurer les adresses Binance

### Base (USDC)

1. Binance → Wallet → **Fiat and Spot**.
2. Bouton **Deposit** → Token **USDC** → Réseau **Base**.
3. Copier l’adresse `0x...`.

### Tron (USDT)

1. Même parcours.
2. Token **USDT** → Réseau **TRC20**.
3. Copier l’adresse `T...`.

Ajouter les valeurs dans `.env.local` (ou `.env` pour la prod) :

```bash
BINANCE_MASTER_WALLET_BASE="0x..."
BINANCE_MASTER_WALLET_TRON="T..."
```

> ℹ️ Le script peut aussi lire ces valeurs depuis `.env.sweep` si tu veux isoler la configuration sweep.

---

## 2. Créer `.env.sweep`

```bash
cp .env.sweep.example .env.sweep
```

Compléter avec :

```bash
# Seeds HD wallet (DOIT correspondre aux XPUB utilisés côté checkout)
SWEEP_MNEMONIC_BASE="mots ..."
SWEEP_MNEMONIC_TRON="mots ..."

# Paramètres supplémentaires
DRY_RUN="true"                # true par défaut pour prévenir les accidents
SWEEP_MIN_THRESHOLD_USD="10"  # Minimum à balayer (USD)
```

> Laisser `DRY_RUN` à `true` tant que tu n’as pas validé le flux en testnet.

---

## 3. Vérifier la configuration

```bash
npx tsx scripts/sweep-to-binance.ts
```

Sortie attendue (mode dry-run) :

```
🧹 Starting sweep of all crypto addresses to Binance...
Mode: 🔍 DRY RUN (preview only)
...
🔍 [DRY RUN] Would sweep 49.50 USDC to 0x742d...
```

Le script affiche également les adresses ignorées (seuil, absence de gas) et fournit un récapitulatif final.

---

## 4. Envoyer un sweep réel

```bash
DRY_RUN=false npx tsx scripts/sweep-to-binance.ts
```

1. Le script rappelle la configuration et demande de taper `CONFIRM`.
2. Pour chaque adresse éligible :
   - Dérive la clé privée HD.
   - Signe la transaction (ethers.js pour Base, TronWeb pour Tron).
   - Envoie la transaction vers l’adresse Binance correspondante.
   - Met à jour `CryptoAddress.sweptAt` + `sweptTxHash` dans la base.
3. Affiche le hash et le lien explorer (BaseScan / TronScan).

> ⚠️ En mode réel, **aucun rollback** : ne lance la commande que si la configuration a été testée et sauvegardée.

---

## 5. Monitoring & journalisation

- **Base de données** : `CryptoAddress` → champs `sweptAt`, `sweptTxHash`.
- **Explorers** : `https://basescan.org/tx/<hash>` ou `https://tronscan.org/#/transaction/<hash>`.
- **Logs** : le script loggue les confirmations de bloc, les erreurs RPC et les balances post-sweep.

Pour un suivi régulier, envisager d’ajouter un dashboard (ex : Notion / Google Sheet) alimenté par une requête Prisma.

---

## 6. Bonnes pratiques sécurité

- Limiter l’accès à `.env.sweep` et à la machine exécutant le script.
- Utiliser des seed phrases dédiées à MyCryptoPilot (pas de wallet perso).
- Stocker les seed phrases dans un coffre chiffré et supprimer toute copie locale après usage.
- Tenir un registre des sweeps (date, montant, hash) pour réconciliation comptable.

---

## 7. Mode testnet

Pour valider end-to-end sans risque :

1. Paramétrer `.env.local` avec les XPUB/addresses testnet (`CRYPTO_NETWORK="testnet"`).
2. Alimenter les adresses en USDC Base Sepolia / USDT Tron Shasta.
3. Lancer le sweep (dry-run puis réel) pour vérifier que les transactions sont signées correctement.

---

## 8. Déploiement automatisé (optionnel)

Si tu souhaites exécuter le sweep sur un serveur ou via cron :

- Stocker `.env.sweep` dans un coffre (ex : secrets manager) et l’injecter au runtime.
- Forcer `DRY_RUN=false` via la variable d’environnement du job.
- Logger les sorties dans un canal privé (Slack/Discord) ou un fichier auditable.
- Ajouter une alerte en cas d’échec (ex : cron + `||` webhook).

---

## 9. Resources associées

- `.claude/docs/CRYPTO-PAYMENTS.md`
- `.claude/docs/ENV-VARIABLES-MAPPING.md`
- `scripts/README-SWEEP.md`
- `scripts/sweep-to-binance.ts`
