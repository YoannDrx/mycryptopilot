# Subscription Management - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025.

Le module d’abonnement orchestre l’activation automatique suite aux paiements crypto, la mise à jour des plans Better Auth, la synchronisation Discord et les bonus referral.

---

## 🧬 Vue d’ensemble

| Composant                              | Rôle                                                                                                           | Référence                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Hook Better Auth (`user.create.after`) | Initialise tout nouvel utilisateur sur le plan FREE.                                                           | `src/lib/auth.ts`                                                 |
| `activateSubscription`                 | Point d’entrée unique pour upgrades (crypto, admin, referral).                                                 | `src/lib/subscription/subscription-manager.ts`                    |
| Payment watcher                        | Déclenche l’activation après confirmation on-chain.                                                            | `src/lib/crypto/payment-watcher.ts`                               |
| Discord roles                          | Ajuste les rôles (Free/Pro/Ultra) & DM de confirmation.                                                        | `src/lib/discord/roles.ts`, `src/lib/discord/dm-notifications.ts` |
| Referral bonus                         | Attribue crédits & suivi invitation lors des upgrades. Voir `.claude/docs/future-features/REFERRAL-SYSTEM.md`. | `src/lib/referral/invitation-tracking-service.ts`                 |
| Scripts admin                          | Upgrade manuel pour support et tests.                                                                          | `scripts/upgrade-to-pro.ts`, `scripts/upgrade-to-ultra.ts`        |

---

## ⚙️ Activation détaillée (`activateSubscription`)

1. **Lookup organisation et user**
   - Pattern 1 user ↔ 1 organization (`Member` avec role `owner`).
   - Si aucune organisation → erreur explicite et log.

2. **Calcul période**
   - Prolonge si un abonnement est encore actif (`planExpiresAt > now`).
   - Sinon démarre à `Date.now()` pour `daysGranted` jours.
   - Les plans sont décrits dans `src/lib/crypto/mycryptopilot-plans.ts`.

3. **Mise à jour atomique**
   - `User.planName` & `planExpiresAt` sont mis à jour.
   - `Subscription` (Better Auth) upsertée via `referenceId = org.id`.

4. **Effets secondaires**
   - Attribution rôle Discord (`assignRoleToUser`).
   - Notification DM (`notifyPlanUpdated`).
   - Email Markdown envoyé via `sendEmail` + template `@email/markdown.email`.
   - Attribution de crédits referral (`awardUpgradeBonus`) si l'utilisateur vient d'une invitation ou d'une campagne.
     - 📚 **Documentation complète**: `.claude/docs/future-features/REFERRAL-SYSTEM.md` pour les règles de calcul, tiers et déblocages.

5. **Logging & retour**
   - Logs détaillés avec `userId`, `plan`, `source` (`crypto_payment`, `admin`, `stripe_legacy`).
   - Retourne `success`, `organizationId`, `periodEnd`.

---

## 🔁 Flux courants

### Paiement crypto (flux normal)

1. Checkout génère une adresse HD (`generate-address.action`).
2. Watcher (`payment-watcher.ts`) détecte le paiement, calcule USD & jours.
3. Appelle `activateSubscription({ source: "crypto_payment" })`.
4. Écrit un `CryptoPayment` + e-mail & Discord.

### Upgrade manuel (support)

- Utiliser les scripts `scripts/upgrade-to-pro.ts` ou `scripts/upgrade-to-ultra.ts` (acceptent désormais un email et une durée personnalisée, voir README des scripts).
- Source définie sur `admin` pour différencier dans les analytics.

### Downgrade / expiration

- Cron nocturne (Better Auth) réinitialise `planName` → `free` lorsque `planExpiresAt < now`.
- Les rôles Discord sont synchronisés via `/admin-sync-roles` ou le cron de sync.

---

## 📬 Notifications

| Canal        | Comportement                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| Email        | `sendEmail` via Resend, template Markdown. TODO: préférences utilisateur globales. |
| Discord DM   | `notifyPlanUpdated` si `discordId` enregistré.                                     |
| Discord rôle | `assignRoleToUser` applique Free/Pro/Ultra.                                        |

Si aucune `discordId`, la portion Discord est ignorée sans échec.

---

## 🧾 Plans & limites

| Plan  | Limites                        | Commentaires                            |
| ----- | ------------------------------ | --------------------------------------- |
| Free  | 1 trader suivi, 5 signaux/jour | Plan par défaut à la création.          |
| Pro   | 5 traders, 50 signaux/jour     | Concerne la majorité des upgrades.      |
| Ultra | Illimité                       | Destiné aux power users & institutions. |

Les limites sont centralisées dans `src/lib/crypto/mycryptopilot-plans.ts`. Les checks sont réutilisés côté UI (pricing), server actions (follow) et script Discord.

---

## 🧰 Scripts & debugging

- `scripts/upgrade-to-pro.ts <email> [days]`
- `scripts/upgrade-to-ultra.ts <email> [days]`
- `scripts/dev-tools/test-checkout.ts` / `test-checkout-simple.ts` (dry-run checkout crypto).
- `scripts/dev-tools/test-crypto-addresses.ts` (vérifie correspondances DB ↔ HD wallet).

Logs Prisma/Plan sont visibles via `pnpm prisma studio` (`User`, `Subscription`, `CryptoPayment`).

---

## 🔮 TODO / améliorations

- Brancher préférences notifications email (TODO dans `send-signal-notification.ts`).
- Ajouter un flux de downgrade manuel (actuellement faire via DB + rôle Discord).
- Publier un rapport plan actif dans l’admin (les données sont disponibles via `get-subscriptions-metrics`).
