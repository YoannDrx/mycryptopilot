# Repository Guidelines
# Repository Guidelines

- `app/` handles App Router layouts, authenticated flows, and API routes under `app/api`; `src/` hosts shared UI, features, libs, and hooks.
- Tests live in `__tests__/`, `test/`, and `e2e/`, with automation scripts in `scripts/`.
- Data + assets: `prisma/`, `emails/`, `public/`, and `content/`.
- `.claude/` centralizes agent instructions—start with `CLAUDE.md`, then consult module docs as needed.

- `pnpm dev` runs the local app; `pnpm build && pnpm start` simulates production.
- `pnpm test` (optional `-- --watch`) and `pnpm test:ci` cover Vitest; `pnpm test:e2e` and `pnpm test:e2e:ci` exercise Playwright.
- `pnpm ts`, `pnpm lint`, and `pnpm clean` handle types, lint, and hygiene.
- Database workflow: `pnpm prisma:migrate`, `pnpm prisma:generate`, `pnpm prisma:seed`; supporting tools include `pnpm email`, `pnpm stripe-webhooks`, and `pnpm knip`.

## Coding Style & Naming Conventions
Stay in strict TypeScript, prefer server components, and add `"use client"` only when necessary. Keep Prettier defaults (2 spaces; plugin orders Tailwind) and resolve lint issues before pushing. API routes must wrap handlers with `@/lib/zod-route.ts`; outbound requests should use `@/lib/up-fetch.ts` instead of `fetch`. Name components in PascalCase, hooks in camelCase, and server actions with a `.action.ts` suffix while favoring named exports.

## Testing Guidelines
Mirror source paths, suffix Vitest files with `.test.ts`, and lean on Testing Library helpers for React coverage. Run `pnpm db:setup-test` before suites that require seeded data. Keep `pnpm test` and `pnpm test:e2e` green prior to review and note flakes in the PR.

## Commit & Pull Request Guidelines
Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) and keep subjects under 72 characters. Every PR should link its issue, summarize the change, list the commands executed (e.g. `pnpm test`, `pnpm lint`, `pnpm test:e2e`), and attach screenshots or terminal output when behaviour shifts. Request review from owners of the impacted area and wait for green CI before merging.

## Security & Configuration Tips
Store secrets in `.env` files that mirror the keys consumed in `prisma.config.ts` and deployment configs. Toggle testnet payments with `CRYPTO_NETWORK=testnet` and populate the XPUB and RPC values from `.claude/docs/CRYPTO-PAYMENTS.md`. Regenerate the Prisma client after schema edits (`pnpm prisma:generate`) and stage migrations before adjusting `railway.json` or `vercel.json`.

## Agent Workflow & References
Before editing, read at least three relevant files—`CLAUDE.md` lists the non-negotiable rules and links to modules such as `DATABASE.md` and `TRADING-SYSTEM.md`. Favor existing abstractions, record unavoidable deviations as TODOs, surface security-sensitive findings immediately, and update this guide when workflows change.
