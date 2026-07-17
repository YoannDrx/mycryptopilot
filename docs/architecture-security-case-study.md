# MyCryptoPilot — architecture & security case study

## Contexte et décision produit

Le prototype historique mélangeait signaux, abonnements crypto, copy-trading,
workers d'exécution, école et fiscalité. Ce périmètre rendait le produit peu
crédible et augmentait fortement le risque financier. La version retenue est un
démonstrateur **risk-first**, sans garde de fonds et sans exécution :

1. simuler une exposition dans la Risk Console ;
2. consulter des signaux datés et attribués ;
3. lire un portfolio provenant d'une connexion Binance ou Bybit read-only ;
4. inspecter des profils et leurs données sourcées ;
5. révoquer sa connexion et son compte.

Les modules historiques restent temporairement dans le dépôt pour faciliter la
revue d'architecture, mais sont absents de la navigation, des deep-links et du
runtime public.

## Modèle de menace

| Risque                                                | Impact                                       | Contrôle retenu                                                                                         |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Clé exchange avec droit de trading                    | Ordre financier non souhaité                 | Inspection des scopes en mode fail-closed ; connexion refusée au moindre scope d'ordre/position         |
| Réactivation accidentelle du copy-trading             | Exécution depuis un ancien worker            | Barrière permanente dans l'adaptateur, la queue et le démarrage du worker                               |
| Ancien client de paiement encore ouvert               | Génération d'adresse ou activation d'un plan | Endpoints tombstone HTTP `410`, watcher retiré du worker déployable                                     |
| Secret présent dans les logs                          | Compromission de compte                      | Aucun credential ou adresse sensible dans les logs applicatifs ; erreurs renvoyées sous forme générique |
| Statistique de démo prise pour une performance réelle | Décision financière trompeuse                | Badge Démo/Testnet, source et fraîcheur obligatoires, aucune promesse de rendement                      |
| Route cachée accessible directement                   | Surface non supportée exposée                | Manifeste serveur partagé par proxy, navigation et recherche globale                                    |

## Frontières techniques

```text
Navigateur
  ├─ Risk Console ───────────────► calcul + historique local au compte
  ├─ Signaux ────────────────────► données datées ─► simulation préremplie
  └─ Connexion exchange
       └─ API serveur
            ├─ validation Zod
            ├─ inspection read-only Binance/Bybit
            ├─ chiffrement AES-256-GCM (IV unique par valeur)
            └─ adaptateur read-only
                 ├─ soldes / positions / historique : autorisés
                 └─ createOrder / cancelOrder : erreur systématique
```

Le manifeste expose uniquement `Risk Console`, `Signaux`, `Portfolio
read-only`, `Traders` et `Compte`. Les routes Dashboard, School, Tax, Journal,
Pricing, Checkout et Paiements sont redirigées avant rendu. Les API de paiement
ne s'appuient pas sur ce seul masquage : elles ne contiennent plus de logique
métier et répondent `410 Gone`.

## Validation des permissions

- Binance est accepté uniquement lorsque les restrictions Spot/Margin et
  Futures indiquent toutes deux l'absence de trading.
- Bybit exige à la fois un indicateur read-only explicite et l'absence de scopes
  `SpotTrade`, `SpotConvert`, `Order` ou `Position`.
- Une réponse absente, contradictoire ou une erreur réseau échoue fermée.
- Bitget reste lisible pour les enregistrements historiques, mais n'est pas
  proposé aux nouvelles connexions tant que l'inspection de scopes n'est pas
  suffisamment fiable.

Même après validation, le service retourné par la factory est encapsulé dans un
proxy qui refuse `createOrder` et `cancelOrder`. Les queues et workers historiques
refusent aussi de démarrer indépendamment du statut d'un feature flag.

## Données et confidentialité

Les clés sont chiffrées côté serveur avec AES-256-GCM. Clé API, secret et
passphrase utilisent des IV et tags propres ; les valeurs en clair ne sont ni
retournées au client ni journalisées. Le produit ne collecte aucun dépôt,
mnemonic ou clé privée. Une déconnexion supprime les credentials persistés.

Les métriques distinguent solde, PnL réalisé et PnL non réalisé. Toute donnée
issue d'un exchange doit afficher sa source et sa dernière synchronisation. Le
dataset de démonstration est déterministe et explicitement étiqueté.

## Preuves automatisées

La suite vérifie notamment :

- refus d'une mutation au niveau de l'adaptateur ;
- refus d'une réponse Bybit contradictoire ;
- liste d'exchanges publics limitée à Binance et Bybit ;
- deep-links historiques bloqués ;
- anciennes API crypto en `410` ;
- calculs de risque et métriques de portfolio ;
- chiffrement, intégrité GCM et payloads historiques.

Les commandes de sortie sont `pnpm ts`, `pnpm lint:ci`, `pnpm test:ci` et
`pnpm build`.

## Limites assumées

MyCryptoPilot n'est ni un conseiller financier, ni un exchange, ni un service
de copy-trading. Il ne garantit pas l'exactitude temps réel d'une source tierce
et ne déduit aucune causalité d'une performance historique. La prochaine étape
utile n'est pas d'ajouter des modules : c'est de durcir l'E2E testnet de
connexion, synchronisation, simulation et révocation.
