# MyCryptoPilot

Plateforme de trading crypto « risk-first » permettant aux utilisateurs de suivre des traders vérifiés, de recevoir leurs signaux en temps réel et de consulter des performances vérifiées (Binance + Bybit).

---

## ✨ Points forts

- **Trading social complet** : profils traders, publication de signaux (TradingCard JSON), feed avec filtres, marketplace et dashboards.
- **Paiements crypto natifs** : génération d’adresses HD (Base/Tron), watcher on-chain, activation d’abonnement automatique, script de sweep vers Binance.
- **Portfolio tracking vérifié** : intégration API read-only Binance & Bybit, calcul de KPI (winrate, profit factor, drawdown) et snapshots par période.
- **Automations Discord** : bot 24/7 (Fly worker), slash commands (user + admin), rôles dynamiques, notifications de signaux et DM plan.
- **Tooling dev** : scripts `scripts/` + `scripts/dev-tools/`, workflows GitHub Actions (lint/tests), commandes `.claude/commands/*.md` pour audit, env sync, TDD.

---

## 🛠️ Stack technique

- **Front** : Next.js 15 (App Router), React 19, Tailwind CSS v4 + Shadcn UI.
- **Langage** : TypeScript strict.
- **Backend** : Prisma (PostgreSQL), Better Auth, Resend (emails), Discord.js, ccxt.
- **Crypto** : Ethers.js, TronWeb, @scure/bip32/39, sweep script TS.
- **Tests** : Vitest (21 suites), Playwright (26 scénarios).
- **Gestion de packages** : pnpm 10.

---

## 🚀 Démarrage rapide

```bash
# Cloner le repo
git clone git@github.com:YoannDrx/mycryptopilot.git
cd mycryptopilot

# Installer les dépendances
pnpm install

# Initialiser les variables d'environnement
cp .env.example .env.local
# (Optionnel) Copier .env.sweep si vous utilisez le script de sweep
# cp .env.sweep.example .env.sweep

# Générer le client Prisma
pnpm prisma generate

# Appliquer les migrations (PostgreSQL local ou Neon branch)
pnpm prisma migrate dev

# Lancer l'app
pnpm dev
```

🔎 Pour la liste complète des variables (prod, preview, tests, sweep) consultez `.claude/docs/ENV-VARIABLES-MAPPING.md`.

---

## 🧪 Tests & QA

| Commande                                | Description                                                |
| --------------------------------------- | ---------------------------------------------------------- |
| `pnpm test`                             | Tests Vitest (unitaires/intégration).                      |
| `pnpm test:ci`                          | Vitest en mode CI (utilisé dans GitHub Actions).           |
| `pnpm test:e2e`                         | Playwright en local (requires `scripts/setup-test-db.sh`). |
| `pnpm test:e2e:ci`                      | Pipeline complet (reset DB + Playwright headless). `--reuse-db`/`--reuse-server` pour accélérer. |
| `./scripts/dev-tools/check-test-env.sh` | Diagnostic (Postgres, Prisma, Playwright, pnpm).           |
| `./scripts/dev-tools/test-*.ts`         | Scripts ciblés (checkout, RPC, crypto addresses, etc.).    |

Plus de détails dans `.claude/docs/TESTING.md`.

---

## 📚 Documentation interne

| Sujet                             | Emplacement                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| Guide contributeurs & conventions | `.claude/CLAUDE.md`                                                                      |
| État du projet & roadmap          | `.claude/docs/DEVELOPMENT.md`                                                            |
| Base de données & migrations      | `.claude/docs/DATABASE.md`                                                               |
| Trading system                    | `.claude/docs/TRADING-SYSTEM.md`                                                         |
| Portfolio tracking                | `.claude/docs/PORTFOLIO-TRACKING.md`                                                     |
| Paiements crypto & sweep          | `.claude/docs/CRYPTO-PAYMENTS.md` + `scripts/README-SWEEP.md` + `scripts/SWEEP_SETUP.md` |
| Abonnements & rôles Discord       | `.claude/docs/SUBSCRIPTIONS.md`                                                          |
| Variables d’environnement         | `.claude/docs/ENV-VARIABLES-MAPPING.md`                                                  |
| Audit doc/scripts (2 nov 2025)    | `.claude/docs/AUDIT-2025-11-02.md`                                                       |
| Scripts CLI                       | `scripts/README.md`                                                                      |

---

## 🧰 Scripts utiles

| Script                                                            | Usage                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `scripts/sweep-to-binance.ts`                                     | Sweep fonds Base/Tron vers Binance (dry-run par défaut, utilise `.env.sweep`). |
| `scripts/generate-mainnet-xpubs.ts` / `generate-testnet-xpubs.ts` | Génère les XPUB HD wallet.                                                     |
| `scripts/upgrade-to-pro.ts <email> [days]`                        | Upgrade manuel utilisateur (plan PRO).                                         |
| `scripts/upgrade-to-ultra.ts <email> [days]`                      | Upgrade manuel utilisateur (plan ULTRA).                                       |
| `scripts/start-fly-worker.ts`                                     | Entrypoint du worker Fly (cron + payment watcher + bot Discord).               |
| `scripts/run-e2e-tests.sh`                                        | Reset DB + Playwright pour CI.                                                 |
| `scripts/setup-test-db.sh`                                        | Prépare la base de tests locale.                                               |

Le dossier `scripts/dev-tools/` contient les scripts de debug ciblés (checkout, RPC, tests environnement). Voir `scripts/README.md` pour l’index complet.

---

## 🚀 Déploiement

### Web app (Vercel)

1. `pnpm add -g vercel` puis `vercel login`.
2. Configurer les variables via le dashboard Vercel (prod & preview). Référence : `.claude/docs/ENV-VARIABLES-MAPPING.md`.
3. `vercel --prod` (Vercel exécute `prisma generate`, `prisma migrate deploy`, `pnpm build`).

### Worker Fly.io (Cron + Discord bot)

1. Installer Fly CLI : `brew install flyctl` puis `fly auth login`.
2. Déployer via `fly deploy --config fly.worker.toml --ha=false` (pense à charger les secrets avant).
3. Surveiller avec `fly logs -a mycryptopilot-worker --no-tail`.

Tous les détails (secrets requis, commandes, monitoring) sont décrits dans `.claude/docs/FLY-WORKER.md` et la section Discord de `.claude/docs/DISCORD-SETUP.md`.

---

## 🧭 Roadmap rapide

Les priorités courantes (2 nov 2025) sont listées dans `.claude/CLAUDE.md` et `.claude/docs/DEVELOPMENT.md` : validation API réelle pour les connexions utilisateurs, queue copy-trading, notifications tier-check/email hebdo, observabilité sweep.

---

## 🤝 Contribuer

1. Créer une branche via les scripts worktree (`pnpm worktree:setup <issue-url>`). Documentation : `README-WORKTREES.md`.
2. Suivre les conventions `.claude/CLAUDE.md`.
3. Mettre à jour la documentation si le comportement change (audit régulier).
4. Lancer lint + tests avant PR (`pnpm lint && pnpm ts && pnpm test`).

---

## 📝 Licence

MIT — voir [LICENSE](LICENSE).
