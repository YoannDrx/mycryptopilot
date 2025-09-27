# MyCryptoPilot - Template User Stories

## Table des Matières

1. [Templates & Définitions Globales](#templates--définitions-globales)
2. [NFR & SLO Globaux](#nfr--slo-globaux)
3. [Template US Complet](#template-us-complet)
4. [Matrices de Tests Transverses](#matrices-de-tests-transverses)
5. [Pipeline QA/CI](#pipeline-qaci)
6. [Exemple US Remplie](#exemple-us-remplie)

---

## Templates & Définitions Globales

### ✅ Definition of Ready (DoR) — Global

Une user story est prête pour le développement quand :

- **Problème clair** : Valeur utilisateur explicite en 1 phrase
- **Portée définie** : In scope/Out scope explicite et dépendances identifiées
- **Dépendances** : APIs, clés, rôles, schémas identifiés et accessibles
- **Métriques** : Logs et métriques à exposer définis
- **Acceptation** : Critères BDD listés et testables
- **Mocks** : Fixtures prévues si besoin (Discord sandbox, RPC testnet)
- **Estimation** : ≤ 3-5 jours homme (sinon découper)

### ✅ Definition of Done (DoD) — Global

Une user story est terminée quand :

- **Code** : Code, tests unitaires (≥80% couverture), tests d'intégration verts
- **Qualité** : Logs structurés + métriques Prometheus exposées
- **Monitoring** : Alertes créées dans Grafana/Alertmanager si applicable
- **Documentation** : README du module + runbook court (ops) + notes de sécurité
- **Demo** : Steps reproductibles (5 étapes max)
- **Déploiement** : Feature flag/rollout si risque prod
- **Sécurité** : Pas de P0/P1 lints, pas de secrets en clair, SAST vert

---

## NFR & SLO Globaux

### Performance
- **Latence pipeline**: P95 tick→signal < 100ms, P95 signal→Discord < 200ms
- **Fraîcheur**: ≥ 85% des cartes envoyées avant 30% de TTL écoulé
- **Fiabilité watchers**: 0 "paiement-missed" en testnet; en prod miss rate < 0.05%
- **Disponibilité**: 99.5% bot & API
- **Traçabilité**: 100% des cartes hashées + livraisons journalisées

### Sécurité
- **Clés**: 0 secret en clair, clés RPC en vault, no private keys côté app (HD xpub only)
- **Validation**: Toutes les transactions on-chain validées
- **Rate limiting**: Protection contre le spam et les abus
- **Audit trail**: Traçabilité complète de toutes les actions

### Qualité
- **Tests**: Couverture ≥ 80% pour les modules critiques
- **Linting**: 0 warning de type P0/P1
- **Documentation**: Tous les modules ont README et runbook
- **Monitoring**: Toutes les métriques critiques sont exposées

---

## Template US Complet

```markdown
## US-XX — [Titre clair et concis]

**En tant que** [rôle]
**Je veux** [capacité]
**Afin de** [valeur]

### Portée
**In scope** :
-

**Out of scope** :
-

### Dépendances
- **APIs** :
- **Rôles** :
- **Schémas** :
- **Flags** :

### Design Notes
**Schémas** :
**DTOs** :
**Permission model** :

### Telemetry
**Logs clés** :
**Métriques Prometheus** :

### Sécurité
**ACL** :
**Rate-limit** :
**Idempotence** :

### Critères d'Acceptation (BDD)

**Scenario 1: [Nom du scénario]**
Given [contexte initial]
When [action]
Then [résultat attendu]

**Scenario 2: [Nom du scénario]**
Given [contexte initial]
When [action]
Then [résultat attendu]

### Tests

#### Tests Unitaires
- [ ]

#### Tests d'Intégration
- [ ]

#### Tests E2E
- [ ]

### Données de Test
**Adresses** :
**Montants** :
**IDs** :
**Canaux Discord** :

### DoD Spécifique à cette US
- [ ]
- [ ]
- [ ]
- [ ]

### Estimation
**Complexité** : [Simple/Moyenne/Complexe]
**Charge** : [X jours/homme]
**Risques** :
```

---

## Matrices de Tests Transverses

### Permissions Discord
| Rôle | Teaser | #signals-pro | "Create Invite" | Publier signaux |
|------|--------|--------------|------------------|-----------------|
| Free | ✅     | ❌           | ❌               | ❌              |
| Pro  | ✅     | ✅           | ❌               | ❌              |
| Trader | ✅   | ✅           | ❌               | ✅ (via bot)    |
| Admin | ✅     | ✅           | ✅               | ✅              |

### Réseaux Paiement
| Réseau | Token | Confirmations | Prorata | Gestion erreurs |
|--------|-------|---------------|---------|-----------------|
| Base | USDC | 1 | ✅ | ✅ |
| TRON | USDT | 2 | ✅ | ✅ |
| Polygon | USDC | 1 | ✅ | ✅ |
| Ethereum | USDC/USDT | 2 | ✅ | ✅ |

### Détecteurs (Qualité)
| Détecteur | Spread min | Liquidité req | Concordance | TTL max |
|-----------|------------|---------------|--------------|---------|
| Funding flip | 0.1% | Tier A | 2+ signaux | 10min |
| OI spike | 0.2% | Tier B | 1+ signal | 5min |
| Sweep HTF | 0.05% | Tier A | Structure OK | 15min |
| Cassure | 0.1% | Tier B | Volume OK | 8min |

---

## Pipeline QA/CI

### Pre-commit
- [ ] Linters (ESLint, Prettier)
- [ ] Type-check (TypeScript strict)
- [ ] Secrets scan
- [ ] Unit tests rapides

### Tests Unitaires
```bash
pnpm test:ci
```
- Couverture ≥ 80% pour modules critiques
- Mocks avec vitest-mock-extended
- Tests parallélisés

### Tests d'Intégration
```bash
pnpm test:integration
```
- Docker-compose (DB, anvil EVM, mock TRON, Discord sandbox)
- Suites par module
- Fixtures réutilisables

### Tests E2E
```bash
pnpm test:e2e:ci
```
- Scénarios utilisateur complets
- Tests sur environnement staging
- Captures d'écran en cas d'échec

### Load Tests (nightly)
```bash
pnpm test:load
```
- Simulateur WS (pertes/ordre faux)
- Watchers: 100 tx/10min
- Mesure P95 latence

### Security
- [ ] SAST scan (CodeQL, SonarQube)
- [ ] Dependencies audit (npm audit)
- [ ] Secrets detection (git-secrets)
- [ ] Container security (Trivy)

### Canary
- Feature flags par détecteur
- Déploiement progressif (5% → 50% → 100%)
- Monitoring en temps réel

---

## Exemple US Remplie

## US-11 — Diffusion sur Discord (teaser+complet)

**En tant que** système de distribution
**Je veux** publier teasers floutés en public et cartes complètes aux Pro
**Afin de** livrer vite sans fuite

### Portée
**In scope** :
- #signals-teaser, #signals-pro, DM, boutons, watermark, TTL
- Système anti-leak avec watermarking

**Out of scope** :
- Analytics avancées (v2)
- Personnalisation avancée des teasers

### Dépendances
- **APIs** : Discord Bot API
- **Rôles** : Free, Pro, Trader, Admin
- **Schémas** : deliveries table, signal schema
- **Flags** : feature_discord_telemetry

### Design Notes
**Schémas** :
```typescript
interface Delivery {
  id: string;
  signalId: string;
  userId: string;
  channel: 'public' | 'dm';
  status: 'sent' | 'failed' | 'pending';
  latencyMs: number;
}
```

**DTOs** : DiscordEmbed, ButtonComponent
**Permission model** : Role-based access control

### Telemetry
**Logs clés** :
- signal_delivery_attempted
- signal_delivery_success
- signal_delivery_failed
- button_click_analytics

**Métriques Prometheus** :
- deliveries_latency_ms{channel}
- dm_success_total
- watermark_mismatch_total
- button_click_rate

### Sécurité
**ACL** : Vérification des rôles avant toute action
**Rate-limit** : 5 interactions/10s par utilisateur
**Idempotence** : ID unique pour chaque delivery

### Critères d'Acceptation (BDD)

**Scenario 1: Utilisateur Free clique sur teaser**
Given un utilisateur avec rôle Free
When il clique sur le bouton "Voir"
Then il reçoit une réponse éphémère avec message d'upgrade
And une adresse crypto pour paiement

**Scenario 2: Utilisateur Pro clique sur teaser**
Given un utilisateur avec rôle Pro
When il clique sur le bouton "Voir"
Then il reçoit l'embed complet en réponse éphémère
And il reçoit la carte complète en DM avec watermark

**Scenario 3: Signal expiré**
Given un signal avec TTL expiré
When tentative de publication
Then le message est marqué comme "Observation only"
And aucun bouton d'action n'est affiché

### Tests

#### Tests Unitaires
- [ ] Générateur d'embed Discord
- [ ] Système de floutage d'images
- [ ] Générateur de watermarks
- [ ] Calcul TTL et expiration

#### Tests d'Intégration
- [ ] Flux complet teaser → clic → livraison
- [ ] Sandbox Guild → interactions Free vs Pro
- [ ] Gestion des erreurs de livraison

#### Tests E2E
- [ ] Mesurer latence post (P95 < 200ms)
- [ ] Test watermark sur différents formats
- [ ] Test rate limiting

### Données de Test
**Adresses** : 0x123... (Base), TR7NH... (TRON)
**Montants** : 39, 59, 99, 149 USDC/USDT
**IDs** : signal_test_001, user_test_001
**Canaux Discord** : #signals-teaser, #signals-pro

### DoD Spécifique à cette US
- [ ] Teaser image avec floutage fonctionnel
- [ ] Boutons interactifs opérationnels
- [ ] Réponses éphémères et DM fonctionnelles
- [ ] Watermark avec user#discriminator + UUID
- [ ] Logs et métriques exposés dans Grafana
- [ ] Demo script validé avec 2 comptes test

### Estimation
**Complexité** : Moyenne
**Charge** : 4 jours/homme
**Risques** : Gestion des fichiers images, performance sous charge

---

## Notes d'Implémentation

### Priorités
1. **DoR strict** : Ne jamais commencer de développement sans DoR validé
2. **DoD complet** : Ne jamais considérer une US comme terminée sans DoD validé
3. **Tests d'abord** : Écrire les tests avant le code (TDD)
4. **Documentation** : Documenter pendant le développement, pas après

### Workflow
1. **Création** : Remplir le template US complet
2. **Review** : Validation DoR par le PO/tech lead
3. **Développement** : TDD avec DoD comme checklist
4. **QA** : Validation DoD + tests transverses
5. **Merge** : DoD 100% validé

### Qualité
- **Zero bug policy** : Les bugs en production sont prioritaires
- **Technical debt** : Documentée et planifiée
- **Refactoring** : Continu et justifié

*Ce template est évolutif et sera enrichi avec le retour d'expérience du projet.*