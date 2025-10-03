📊 Analyse du système actuel (boilerplate now.ts)

Architecture existante

1. Modèle de données :
   User
   ↓ (relation via Member)
   Organization (stripeCustomerId, subscription)
   ├─ Member[] (rôles: owner, admin, member)
   ├─ Invitation[]
   └─ Subscription (plan, status, périodes)

2. Flux actuel :

- À l'inscription → création automatique d'une org "{email}'s org" (auth.ts:61-69)
- Création automatique d'un customer Stripe lié à l'org (auth.ts:169-179)
- Subscription liée à Organization.id via referenceId (schema:126)
- Possibilité d'inviter des membres dans l'org
- Rôles au sein de l'org (owner/admin/member) avec permissions granulaires

3. Points clés du code actuel :

- getCurrentOrg() récupère l'org active depuis session.activeOrganizationId
- Permissions basées sur les rôles au sein de l'organisation
- Paiement Stripe au niveau organisation (pas user)
- UI complète de gestion d'org (membres, invitations, settings)

---

❌ Incompatibilités avec MyCryptoPilot

| Aspect             | Boilerplate actuelle             | Besoin MyCryptoPilot         | Problème                               |
| ------------------ | -------------------------------- | ---------------------------- | -------------------------------------- |
| Entité de paiement | Organisation                     | User individuel              | Subscription liée à l'org, pas au user |
| Collaboration      | Multi-membres par org            | Zéro collaboration           | Système Member/Invitation inutile      |
| Type de paiement   | Stripe (card)                    | Crypto on-chain              | Infrastructure de paiement à refaire   |
| Rôles              | owner/admin/member               | user/trader                  | Système de permissions inadapté        |
| Relations          | User ↔ Org ↔ Members           | User ↔ Traders (follow)     | Pas de modèle "follow"                 |
| Complexité UI      | Sélecteur d'org, gestion membres | Dashboard user/trader simple | UI trop lourde                         |

---

🔧 Options d'adaptation

Option 1 : 🗑️ Supprimer complètement le système d'org

Principe : Repartir sur une architecture user-centric simple.

model User {
id String @id
email String
role UserRole // USER | TRADER | BOTH
plan UserPlan // FREE | PRO | ULTRA

    traderProfile TraderProfile?
    subscriptions Subscription[]
    follows       Follow[]

}

model TraderProfile {
userId String @unique
bio String?
priceUSD Int
statsJson Json?
}

model Follow {
userId String
traderId String
status FollowStatus
expiresAt DateTime?
}

model Subscription {
userId String
plan UserPlan
cryptoAddress String
status Status
}

✅ Avantages :

- Architecture simple et claire
- Pas de confusion conceptuelle
- UI allégée (pas de sélecteur d'org)
- Adapté au modèle B2C

❌ Inconvénients :

- Refactoring massif (supprimer toute la logique org)
- Réécrire auth.ts (databaseHooks), get-org.ts, toutes les pages /orgs/...
- Perdre tout le code de gestion org/membres/invitations
- Migrations DB complexes si données existantes

Estimation : 2-3 semaines de refactoring complet

---

Option 2 : 🔄 Détourner "Organization" comme "compte utilisateur"

Principe : Réutiliser le système d'org mais en le renommant conceptuellement.

User
↓ (Member avec role=owner, toujours seul)
Organization → renommée "TradingAccount" dans l'UI
↓
Subscription (crypto au lieu de Stripe)

Implémentation :

1. Garder la création auto d'org à l'inscription
2. Désactiver les invitations (UI + permissions)
3. Remplacer Stripe par crypto billing
4. Ajouter un champ role sur User (USER/TRADER)
5. Ajouter un modèle TraderProfile lié à l'org (si trader)
6. Renommer "Organization" → "Account" dans toute l'UI

✅ Avantages :

- Refactoring minimal du code existant
- Réutilise toute l'infrastructure de subscription
- Migration DB simple (juste ajout de champs)
- Garde la logique de permissions

❌ Inconvénients :

- Conceptuellement étrange (org = compte perso)
- Complexité inutile sous le capot
- Tables Member/Invitation toujours là (inutilisées)
- Risque de confusion pour les devs futurs

Estimation : 1 semaine de refactoring léger

---

Option 3 : 🎭 Org uniquement pour les Traders

Principe : Système hybride où seuls les traders ont une "org" (leur business).

User (simple)
↓ Subscription directe

Trader → User avec Organization
↓
TraderOrganization (profil public, stats, signaux)

Implémentation :

1. User classique : pas d'org (désactiver création auto)
2. Devenir Trader → créer une org (= leur espace pro)
3. Subscription liée au User directement (nouveau modèle)
4. L'org du trader = sa "page trader" publique

✅ Avantages :

- Sémantiquement cohérent (org = business du trader)
- Évolutif (un trader peut inviter un co-trader plus tard)
- Garde le système org pour qui en a besoin

❌ Inconvénients :

- Deux systèmes différents (user vs trader)
- Complexité accrue de la codebase
- Subscription à refactorer pour supporter user direct
- Risque de bugs entre les deux modes

Estimation : 2 semaines de dev

---

Option 4 : ♻️ Réinterpréter "Organization" en "Trading Space"

Principe : Renommer et réutiliser le système pour gérer plusieurs "espaces de trading".

Organization → TradingSpace - Peut contenir plusieurs portefeuilles - Peut suivre des traders spécifiques - Subscription par espace

Member → Follow (relation user ↔ trader)

Implémentation :

1. Renommer Organization → TradingSpace (conceptuel + DB)
2. Member → Follow (qui suit quel trader)
3. Invitation → TraderInvite (invitation à un canal trader privé)
4. Garde la subscription liée à l'espace

✅ Avantages :

- Garde toute l'infrastructure
- Évolutif (multi-portefeuilles, équipes de trading)
- Sémantique claire si bien renommé

❌ Inconvénients :

- Over-engineering pour le MVP
- Risque de confusion
- Toujours besoin de désactiver invitations côté user
- Complexité inutile au début

Estimation : 1-2 semaines

---

✅ Ma recommandation : Option 2 modifiée (pragmatique)

Stratégie : "Keep it simple, adapt progressively"

Phase 1 : MVP (garder org, masquer la complexité)

1. Garder le système d'org tel quel :


    - Création automatique à l'inscription ✅
    - Un user = une org (toujours seul dedans)
    - Désactiver les invitations (masquer UI + bloquer permissions)

2. Ajouter les nouveaux modèles MyCryptoPilot :
   // Ajout au modèle User
   model User {
   // ... champs existants
   role UserRole @default(USER) // USER | TRADER | BOTH


    traderProfile TraderProfile?
    cryptoAddresses CryptoAddress[]

}

model TraderProfile {
id String @id
userId String @unique
user User @relation(...)
bio String?
displayName String
priceMonthlyUSD Int
statsJson Json?
}

model CryptoAddress {
id String @id
userId String
user User @relation(...)
network CryptoNetwork
address String @unique
derivationPath String?
isActive Boolean @default(true)
}

model Follow {
id String @id
userId String
traderId String
status FollowStatus
startedAt DateTime
expiresAt DateTime?
}

model Signal {
id String @id
traderId String
payloadJson Json
createdAt DateTime
expiresAt DateTime
}

3. Adapter le billing :


    - Garder Organization.stripeCustomerId (on ne l'utilise juste plus)
    - Ajouter CryptoAddress pour paiements crypto
    - Créer un nouveau système de CryptoSubscription (ou étendre Subscription)

4. UI simplifiée :


    - Masquer le sélecteur d'organisations (toujours une seule org)
    - Renommer "Organization Settings" → "Account Settings"
    - Supprimer la page "Members" et "Invitations"
    - Garder "Billing" mais remplacer Stripe par crypto

5. Permissions :


    - Garder le système de rôles org (owner/admin/member)
    - User est toujours "owner" de sa propre org
    - Ajouter de nouvelles permissions pour trader :

const statement = {
...defaultStatements,
signal: ["create", "update", "delete"],
trader: ["become", "manage"],
subscription: ["manage"],
}

Phase 2 : Nettoyage (après validation MVP)

Si le MVP fonctionne et que tu veux nettoyer :

1. Migrer progressivement vers Option 1 (supprimer org)
2. Ou garder tel quel si ça fonctionne bien

---

🎯 Plan d'implémentation (Option 2 modifiée)

Semaine 1 : Adaptation DB et Auth

Tâches :

1. ✅ Ajouter role sur User (migration Prisma)
2. ✅ Créer modèles TraderProfile, CryptoAddress, Follow, Signal
3. ✅ Modifier auth.ts pour ajouter le rôle USER par défaut
4. ✅ Garder la création auto d'org mais simplifier le nom

Fichiers à modifier :

- prisma/schema/schema.prisma : ajout des modèles
- src/lib/auth.ts : role par défaut
- Migrations DB

Semaine 2 : Billing Crypto

Tâches :

1. ✅ Créer service crypto-billing (génération adresses, watchers)
2. ✅ Adapter Subscription pour supporter crypto
3. ✅ Remplacer pages Stripe par pages crypto
4. ✅ Système de detection paiement on-chain

Fichiers à créer :

- src/lib/crypto-billing/ (nouveau)
- app/account/billing/crypto-payment.tsx

Semaine 3 : UI User/Trader

Tâches :

1. ✅ Dashboard User (voir signaux, suivre traders)
2. ✅ Dashboard Trader (créer signaux, voir stats)
3. ✅ Marketplace traders publique
4. ✅ Masquer/supprimer UI d'invitations

Fichiers à modifier :

- app/orgs/[orgSlug]/ → app/dashboard/
- Créer app/traders/marketplace.tsx
- Masquer app/orgs/[orgSlug]/settings/members/

Semaine 4 : Signaux & Diffusion

Tâches :

1. ✅ Système de création de signaux (traders)
2. ✅ Ingestion données marché (WebSocket)
3. ✅ Diffusion Discord (optionnel)
4. ✅ Console de risque

---

📝 Checklist de migration

À garder intact ✅

- Modèle User
- Modèle Organization (juste renommé conceptuellement)
- Modèle Member (user est toujours seul owner)
- Système de permissions (ac, roles)
- Auth (better-auth avec social providers)

À modifier 🔧

- Désactiver invitations (UI + logique)
- Masquer sélecteur d'organisations
- Renommer "Organization" → "Account" dans l'UI
- Remplacer Stripe par crypto billing
- Adapter getCurrentOrg() pour renvoyer "current account"

À ajouter ➕

- Modèles TraderProfile, CryptoAddress, Follow, Signal
- Service crypto-billing
- Dashboards User/Trader
- Marketplace traders
- Système de signaux

À supprimer 🗑️ (optionnel, Phase 2)

- UI d'invitations
- Logic d'invitations
- Pages Stripe
- Limites d'organisations (organizationLimit)

---

🎬 Conclusion

Pour MyCryptoPilot, je recommande l'Option 2 modifiée car :

1. ✅ Minimal refactoring : tu gardes 80% du code existant
2. ✅ Rapide à implémenter : 2-3 semaines vs 1-2 mois pour une réécriture
3. ✅ Réutilise l'infra : permissions, auth, UI de base
4. ✅ Évolutif : tu peux migrer vers Option 1 plus tard si besoin
5. ✅ Pragmatique : se concentrer sur les features métier (signaux, traders) plutôt que sur l'archi

Le système d'org devient simplement un "compte utilisateur" avec un rôle (USER/TRADER), et tu ajoutes les modèles spécifiques à
MyCryptoPilot par-dessus.
