🎯 Plan d'implémentation MyCryptoPilot - Adaptation de la boilerplate now.ts │ │
│ │ │ │
│ │ Vue d'ensemble de l'approche │ │
│ │ │ │
│ │ Stratégie choisie : Option 2 modifiée - Garder le système d'organisations mais l'adapter comme "compte utilisateur" │ │
│ │ │ │
│ │ Principes clés : │ │
│ │ │ │
│ │ - ✅ Un user = une org (compte personnel) │ │
│ │ - ✅ Pas d'invitations/collaboration │ │
│ │ - ✅ Ajout de rôles USER/TRADER sur le modèle User │ │
│ │ - ✅ Nouveaux modèles : TraderProfile, CryptoAddress, Follow, Signal │ │
│ │ - ✅ Paiement crypto (USDC/USDT) au lieu de Stripe │ │
│ │ - ✅ UI simplifiée : masquer sélecteur d'org, désactiver invitations │ │
│ │ │ │
│ │ --- │ │
│ │ 📅 Phase 1 : Adaptation DB & Auth (Semaine 1) │ │
│ │ │ │
│ │ 1.1 Mise à jour du schéma Prisma │ │
│ │ │ │
│ │ Fichier : prisma/schema/mycryptopilot.prisma (nouveau) │ │
│ │ │ │
│ │ // Enums │ │
│ │ enum UserRole { │ │
│ │ USER │ │
│ │ TRADER │ │
│ │ BOTH │ │
│ │ } │ │
│ │ │ │
│ │ enum FollowStatus { │ │
│ │ ACTIVE │ │
│ │ EXPIRED │ │
│ │ CANCELLED │ │
│ │ } │ │
│ │ │ │
│ │ enum CryptoNetwork { │ │
│ │ BASE │ │
│ │ TRON │ │
│ │ POLYGON │ │
│ │ ETHEREUM │ │
│ │ } │ │
│ │ │ │
│ │ enum InvoiceStatus { │ │
│ │ OPEN │ │
│ │ PAID │ │
│ │ EXPIRED │ │
│ │ } │ │
│ │ │ │
│ │ enum PaymentStatus { │ │
│ │ PENDING │ │
│ │ CONFIRMED │ │
│ │ FAILED │ │
│ │ } │ │
│ │ │ │
│ │ // Extensions du modèle User existant │ │
│ │ model User { │ │
│ │ // ... champs existants de better-auth │ │
│ │ │ │
│ │ // Nouveaux champs MyCryptoPilot │ │
│ │ role UserRole @default(USER) │ │
│ │ traderProfile TraderProfile? │ │
│ │ cryptoAddresses CryptoAddress[] │ │
│ │ follows Follow[] @relation("UserFollows") │ │
│ │ followers Follow[] @relation("TraderFollowers") │ │
│ │ signals Signal[] │ │
│ │ cryptoPayments CryptoPayment[] │ │
│ │ } │ │
│ │ │ │
│ │ // Profil trader │ │
│ │ model TraderProfile { │ │
│ │ id String @id @default(cuid()) │ │
│ │ userId String @unique │ │
│ │ user User @relation(fields: [userId], references: [id], onDelete: Cascade) │ │
│ │ │ │
│ │ displayName String │ │
│ │ bio String? │ │
│ │ priceMonthlyUSD Int @default(0) │ │
│ │ │ │
│ │ // Stats (calculées périodiquement) │ │
│ │ statsJson Json? // { winrate, payoff, maxDD, nTrades, expectancy } │ │
│ │ │ │
│ │ // Certification │ │
│ │ verified Boolean @default(false) │ │
│ │ verifiedAt DateTime? │ │
│ │ │ │
│ │ createdAt DateTime @default(now()) │ │
│ │ updatedAt DateTime @updatedAt │ │
│ │ } │ │
│ │ │ │
│ │ // Adresses crypto pour paiements │ │
│ │ model CryptoAddress { │ │
│ │ id String @id @default(cuid()) │ │
│ │ userId String │ │
│ │ user User @relation(fields: [userId], references: [id], onDelete: Cascade) │ │
│ │ │ │
│ │ network CryptoNetwork │ │
│ │ address String @unique │ │
│ │ derivationPath String? │ │
│ │ isActive Boolean @default(true) │ │
│ │ │ │
│ │ payments CryptoPayment[] │ │
│ │ │ │
│ │ createdAt DateTime @default(now()) │ │
│ │ │ │
│ │ @@index([userId]) │ │
│ │ } │ │
│ │ │ │
│ │ // Relations de suivi trader │ │
│ │ model Follow { │ │
│ │ id String @id @default(cuid()) │ │
│ │ userId String │ │
│ │ user User @relation("UserFollows", fields: [userId], references: [id], onDelete: Cascade) │ │
│ │ traderId String │ │
│ │ trader User @relation("TraderFollowers", fields: [traderId], references: [id], onDelete: Cascade) │ │
│ │ │ │
│ │ status FollowStatus @default(ACTIVE) │ │
│ │ startedAt DateTime @default(now()) │ │
│ │ expiresAt DateTime? │ │
│ │ │ │
│ │ createdAt DateTime @default(now()) │ │
│ │ updatedAt DateTime @updatedAt │ │
│ │ │ │
│ │ @@unique([userId, traderId]) │ │
│ │ @@index([traderId]) │ │
│ │ } │ │
│ │ │ │
│ │ // Paiements crypto │ │
│ │ model CryptoPayment { │ │
│ │ id String @id @default(cuid()) │ │
│ │ userId String │ │
│ │ user User @relation(fields: [userId], references: [id], onDelete: Cascade) │ │
│ │ │ │
│ │ addressId String? │ │
│ │ address CryptoAddress? @relation(fields: [addressId], references: [id]) │ │
│ │ │ │
│ │ network CryptoNetwork │ │
│ │ txHash String @unique │ │
│ │ amountToken Decimal @db.Decimal(38, 18) │ │
│ │ amountUSD Decimal @db.Decimal(18, 2) │ │
│ │ currency String // USDC, USDT │ │
│ │ │ │
│ │ confirmations Int @default(0) │ │
│ │ status PaymentStatus @default(PENDING) │ │
│ │ confirmedAt DateTime? │ │
│ │ │ │
│ │ // Plan acheté │ │
│ │ plan String // free, pro, ultra │ │
│ │ daysGranted Int @default(30) │ │
│ │ │ │
│ │ createdAt DateTime @default(now()) │ │
│ │ updatedAt DateTime @updatedAt │ │
│ │ │ │
│ │ @@index([userId]) │ │
│ │ @@index([txHash]) │ │
│ │ } │ │
│ │ │ │
│ │ // Signaux de trading │ │
│ │ model Signal { │ │
│ │ id String @id @default(cuid()) │ │
│ │ traderId String │ │
│ │ trader User @relation(fields: [traderId], references: [id], onDelete: Cascade) │ │
│ │ │ │
│ │ symbol String │ │
│ │ payloadJson Json // Trading card complète │ │
│ │ ttlSec Int │ │
│ │ hash String @unique │ │
│ │ │ │
│ │ createdAt DateTime @default(now()) │ │
│ │ expiresAt DateTime │ │
│ │ │ │
│ │ @@index([traderId]) │ │
│ │ @@index([createdAt]) │ │
│ │ } │ │
│ │ │ │
│ │ Migration Prisma : │ │
│ │ # Créer le fichier de migration │ │
│ │ npx prisma migrate dev --name add*mycryptopilot_models │ │
│ │ │ │
│ │ # Générer le client Prisma │ │
│ │ npx prisma generate │ │
│ │ │ │
│ │ 1.2 Mise à jour de la config auth │ │
│ │ │ │
│ │ Fichier : src/lib/auth.ts │ │
│ │ │ │
│ │ Modifications à apporter : │ │
│ │ │ │
│ │ // Ligne 59 - Simplifier le nom de l'org créée automatiquement │ │
│ │ await auth.api.createOrganization({ │ │
│ │ body: { │ │
│ │ name: `Account`, // ← Changé de "${emailName}'s org" à "Account"                                                               │ │
│ │     slug: generateSlug(user.id), // ← Utiliser l'ID user pour un slug unique                                                       │ │
│ │     logo: `${getServerUrl()}/images/account-logo.png`,                                                                             │ │
│ │     userId: user.id,                                                                                                               │ │
│ │     keepCurrentActiveOrganization: false,                                                                                          │ │
│ │   },                                                                                                                               │ │
│ │ });                                                                                                                                │ │
│ │                                                                                                                                    │ │
│ │ 1.3 Mise à jour site-config.ts                                                                                                     │ │
│ │                                                                                                                                    │ │
│ │ Fichier : src/site-config.ts                                                                                                       │ │
│ │                                                                                                                                    │ │
│ │ export const SiteConfig = {                                                                                                        │ │
│ │   title: "MyCryptoPilot",                                                                                                          │ │
│ │   description: "Signaux de trading crypto risk-first. Analyse temps réel, plans explicables, console de risque.",                  │ │
│ │   prodUrl: "https://mycryptopilot.app",                                                                                            │ │
│ │   appId: "mycryptopilot",                                                                                                          │ │
│ │   domain: "mycryptopilot.app",                                                                                                     │ │
│ │   appIcon: "/images/icon.png",                                                                                                     │ │
│ │   company: {                                                                                                                       │ │
│ │     name: "MyCryptoPilot",                                                                                                         │ │
│ │     address: "", // À remplir selon juridiction                                                                                    │ │
│ │   },                                                                                                                               │ │
│ │   brand: {                                                                                                                         │ │
│ │     primary: "#F59E0B", // Amber pour crypto                                                                                       │ │
│ │   },                                                                                                                               │ │
│ │   team: {                                                                                                                          │ │
│ │     image: "/images/team.jpg",                                                                                                     │ │
│ │     website: "https://mycryptopilot.app",                                                                                          │ │
│ │     twitter: "https://twitter.com/mycryptopilot",                                                                                  │ │
│ │     name: "MyCryptoPilot Team",                                                                                                    │ │
│ │   },                                                                                                                               │ │
│ │   features: {                                                                                                                      │ │
│ │     enableImageUpload: true, // Pour logos traders                                                                                 │ │
│ │     enableLandingRedirection: false, // Garder la landing visible                                                                  │ │
│ │   },                                                                                                                               │ │
│ │   crypto: {                                                                                                                        │ │
│ │     networks: {                                                                                                                    │ │
│ │       base: {                                                                                                                      │ │
│ │         name: "Base",                                                                                                              │ │
│ │         currency: "USDC",                                                                                                          │ │
│ │         confirmations: 1,                                                                                                          │ │
│ │         rpcUrl: process.env.BASE_RPC_URL,                                                                                          │ │
│ │       },                                                                                                                           │ │
│ │       tron: {                                                                                                                      │ │
│ │         name: "Tron",                                                                                                              │ │
│ │         currency: "USDT",                                                                                                          │ │
│ │         confirmations: 2,                                                                                                          │ │
│ │         rpcUrl: process.env.TRON_RPC_URL,                                                                                          │ │
│ │       },                                                                                                                           │ │
│ │     },                                                                                                                             │ │
│ │   },                                                                                                                               │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ 1.4 Nouveaux types TypeScript                                                                                                      │ │
│ │                                                                                                                                    │ │
│ │ Fichier : src/types/mycryptopilot.ts (nouveau)                                                                                     │ │
│ │                                                                                                                                    │ │
│ │ import type { CryptoNetwork, FollowStatus, UserRole } from "@/generated/prisma";                                                   │ │
│ │                                                                                                                                    │ │
│ │ export type TradingCardPayload = {                                                                                                 │ │
│ │   symbol: string;                                                                                                                  │ │
│ │   instrumentType: "spot" | "perp";                                                                                                 │ │
│ │   bias: "bull" | "bear" | "neutral";                                                                                               │ │
│ │   entry: {                                                                                                                         │ │
│ │     zone: [number, number];                                                                                                        │ │
│ │     type: "limit" | "market";                                                                                                      │ │
│ │   };                                                                                                                               │ │
│ │   invalidation: number;                                                                                                            │ │
│ │   tps: number[];                                                                                                                   │ │
│ │   leverageBand?: [number, number];                                                                                                 │ │
│ │   risk: {                                                                                                                          │ │
│ │     Rpct: number;                                                                                                                  │ │
│ │     maxPortfolioExpPct: number;                                                                                                    │ │
│ │   };                                                                                                                               │ │
│ │   confidence: number;                                                                                                              │ │
│ │   rationales: string[];                                                                                                            │ │
│ │   regime: string;                                                                                                                  │ │
│ │   managedBy: "system" | `trader:${string}`;                                                                                        │ │
│ │   ttlSec: number;                                                                                                                  │ │
│ │   createdAt: string;                                                                                                               │ │
│ │   version: string;                                                                                                                 │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ export type TraderStats = {                                                                                                        │ │
│ │   winrate: number;                                                                                                                 │ │
│ │   payoff: number;                                                                                                                  │ │
│ │   maxDD: number;                                                                                                                   │ │
│ │   nTrades: number;                                                                                                                 │ │
│ │   expectancy: number;                                                                                                              │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ export type CryptoNetworkConfig = {                                                                                                │ │
│ │   name: string;                                                                                                                    │ │
│ │   currency: string;                                                                                                                │ │
│ │   confirmations: number;                                                                                                           │ │
│ │   rpcUrl: string;                                                                                                                  │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ ---                                                                                                                                │ │
│ │ 📅 Phase 2 : Système de paiement crypto (Semaine 2)                                                                                │ │
│ │                                                                                                                                    │ │
│ │ 2.1 Configuration des plans MyCryptoPilot                                                                                          │ │
│ │                                                                                                                                    │ │
│ │ Fichier : src/lib/crypto/mycryptopilot-plans.ts (nouveau)                                                                          │ │
│ │                                                                                                                                    │ │
│ │ import { Signal, TrendingUp, Zap } from "lucide-react";                                                                            │ │
│ │                                                                                                                                    │ │
│ │ export type MyCryptoPilotPlan = {                                                                                                  │ │
│ │   name: "free" | "pro" | "ultra";                                                                                                  │ │
│ │   description: string;                                                                                                             │ │
│ │   priceUSD: number;                                                                                                                │ │
│ │   priceCrypto: {                                                                                                                   │ │
│ │     usdc: number;                                                                                                                  │ │
│ │     usdt: number;                                                                                                                  │ │
│ │   };                                                                                                                               │ │
│ │   limits: {                                                                                                                        │ │
│ │     signalsPerDay: number;                                                                                                         │ │
│ │     tradersFollow: number;                                                                                                         │ │
│ │     screenerRefreshSec: number;                                                                                                    │ │
│ │     customAlerts: boolean;                                                                                                         │ │
│ │     riskConsole: boolean;                                                                                                          │ │
│ │     journaling: boolean;                                                                                                           │ │
│ │   };                                                                                                                               │ │
│ │   features: string[];                                                                                                              │ │
│ │   isPopular?: boolean;                                                                                                             │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ export const MYCRYPTOPILOT_PLANS: MyCryptoPilotPlan[] = [                                                                          │ │
│ │   {                                                                                                                                │ │
│ │     name: "free",                                                                                                                  │ │
│ │     description: "Découvrez les signaux de trading avec accès limité",                                                             │ │
│ │     priceUSD: 0,                                                                                                                   │ │
│ │     priceCrypto: { usdc: 0, usdt: 0 },                                                                                             │ │
│ │     limits: {                                                                                                                      │ │
│ │       signalsPerDay: 5,                                                                                                            │ │
│ │       tradersFollow: 1,                                                                                                            │ │
│ │       screenerRefreshSec: 300, // 5min                                                                                             │ │
│ │       customAlerts: false,                                                                                                         │ │
│ │       riskConsole: false,                                                                                                          │ │
│ │       journaling: false,                                                                                                           │ │
│ │     },                                                                                                                             │ │
│ │     features: [                                                                                                                    │ │
│ │       "Teasers de signaux floutés",                                                                                                │ │
│ │       "1 trader à suivre",                                                                                                         │ │
│ │       "Screeners refresh 5min",                                                                                                    │ │
│ │     ],                                                                                                                             │ │
│ │   },                                                                                                                               │ │
│ │   {                                                                                                                                │ │
│ │     name: "pro",                                                                                                                   │ │
│ │     description: "Signaux temps réel pour traders actifs",                                                                         │ │
│ │     priceUSD: 49,                                                                                                                  │ │
│ │     priceCrypto: { usdc: 49, usdt: 49 },                                                                                           │ │
│ │     limits: {                                                                                                                      │ │
│ │       signalsPerDay: 50,                                                                                                           │ │
│ │       tradersFollow: 5,                                                                                                            │ │
│ │       screenerRefreshSec: 60, // 1min                                                                                              │ │
│ │       customAlerts: false,                                                                                                         │ │
│ │       riskConsole: true,                                                                                                           │ │
│ │       journaling: true,                                                                                                            │ │
│ │     },                                                                                                                             │ │
│ │     features: [                                                                                                                    │ │
│ │       "Signaux complets en temps réel",                                                                                            │ │
│ │       "Jusqu'à 5 traders",                                                                                                         │ │
│ │       "Console de risque",                                                                                                         │ │
│ │       "Journal de trading",                                                                                                        │ │
│ │       "Screeners refresh 1min",                                                                                                    │ │
│ │     ],                                                                                                                             │ │
│ │     isPopular: true,                                                                                                               │ │
│ │   },                                                                                                                               │ │
│ │   {                                                                                                                                │ │
│ │     name: "ultra",                                                                                                                 │ │
│ │     description: "Outils pro pour traders exigeants",                                                                              │ │
│ │     priceUSD: 99,                                                                                                                  │ │
│ │     priceCrypto: { usdc: 99, usdt: 99 },                                                                                           │ │
│ │     limits: {                                                                                                                      │ │
│ │       signalsPerDay: 999,                                                                                                          │ │
│ │       tradersFollow: 999,                                                                                                          │ │
│ │       screenerRefreshSec: 5, // 5sec                                                                                               │ │
│ │       customAlerts: true,                                                                                                          │ │
│ │       riskConsole: true,                                                                                                           │ │
│ │       journaling: true,                                                                                                            │ │
│ │     },                                                                                                                             │ │
│ │     features: [                                                                                                                    │ │
│ │       "Signaux illimités",                                                                                                         │ │
│ │       "Traders illimités",                                                                                                         │ │
│ │       "Alertes personnalisées",                                                                                                    │ │
│ │       "Filtres avancés (funding, OI, corrélations)",                                                                               │ │
│ │       "Screeners refresh 5sec",                                                                                                    │ │
│ │       "Support prioritaire",                                                                                                       │ │
│ │     ],                                                                                                                             │ │
│ │   },                                                                                                                               │ │
│ │ ];                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ export const getPlanByName = (name: string) => {                                                                                   │ │
│ │   return MYCRYPTOPILOT_PLANS.find((p) => p.name === name) ?? MYCRYPTOPILOT_PLANS[0];                                               │ │
│ │ };                                                                                                                                 │ │
│ │                                                                                                                                    │ │
│ │ 2.2 Service de génération d'adresses crypto                                                                                        │ │
│ │                                                                                                                                    │ │
│ │ Fichier : src/lib/crypto/address-generator.ts (nouveau)                                                                            │ │
│ │                                                                                                                                    │ │
│ │ import { CryptoNetwork } from "@/generated/prisma";                                                                                │ │
│ │ import { prisma } from "@/lib/prisma";                                                                                             │ │
│ │ import { HDKey } from "@scure/bip32";                                                                                              │ │
│ │ import { mnemonicToSeed } from "@scure/bip39";                                                                                     │ │
│ │                                                                                                                                    │ │
│ │ const XPUB_BASE = process.env.CRYPTO_XPUB_BASE!;                                                                                   │ │
│ │ const XPUB_TRON = process.env.CRYPTO_XPUB_TRON!;                                                                                   │ │
│ │                                                                                                                                    │ │
│ │ export async function generateCryptoAddress(                                                                                       │ │
│ │   userId: string,                                                                                                                  │ │
│ │   network: CryptoNetwork                                                                                                           │ │
│ │ ): Promise<string> {                                                                                                               │ │
│ │   // Vérifier si une adresse existe déjà                                                                                           │ │
│ │   const existing = await prisma.cryptoAddress.findFirst({                                                                          │ │
│ │     where: { userId, network, isActive: true },                                                                                    │ │
│ │   });                                                                                                                              │ │
│ │                                                                                                                                    │ │
│ │   if (existing) {                                                                                                                  │ │
│ │     return existing.address;                                                                                                       │ │
│ │   }                                                                                                                                │ │
│ │                                                                                                                                    │ │
│ │   // Générer une nouvelle adresse via HD wallet                                                                                    │ │
│ │   const xpub = network === "BASE" || network === "ETHEREUM" ? XPUB_BASE : XPUB_TRON;                                               │ │
│ │   const derivationPath = `m/44'/60'/0'/0/${userId.slice(0, 8)}`; // Simplification │ │
│ │ │ │
│ │ const hdKey = HDKey.fromExtendedKey(xpub); │ │
│ │ const derived = hdKey.derive(derivationPath); │ │
│ │ const address = derived.address!; │ │
│ │ │ │
│ │ // Sauvegarder en DB │ │
│ │ await prisma.cryptoAddress.create({ │ │
│ │ data: { │ │
│ │ userId, │ │
│ │ network, │ │
│ │ address, │ │
│ │ derivationPath, │ │
│ │ isActive: true, │ │
│ │ }, │ │
│ │ }); │ │
│ │ │ │
│ │ return address; │ │
│ │ } │ │
│ │ │ │
│ │ 2.3 Watcher de paiements on-chain │ │
│ │ │ │
│ │ Fichier : src/lib/crypto/payment-watcher.ts (nouveau) │ │
│ │ │ │
│ │ import { CryptoNetwork, PaymentStatus } from "@/generated/prisma"; │ │
│ │ import { prisma } from "@/lib/prisma"; │ │
│ │ import { ethers } from "ethers"; │ │
│ │ │ │
│ │ export class CryptoPaymentWatcher { │ │
│ │ private providers: Map<CryptoNetwork, ethers.JsonRpcProvider>; │ │
│ │ │ │
│ │ constructor() { │ │
│ │ this.providers = new Map([ │ │
│ │ ["BASE", new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)], │ │
│ │ ["TRON", new ethers.JsonRpcProvider(process.env.TRON_RPC_URL)], │ │
│ │ ]); │ │
│ │ } │ │
│ │ │ │
│ │ async watchAddress(addressId: string) { │ │
│ │ const cryptoAddress = await prisma.cryptoAddress.findUnique({ │ │
│ │ where: { id: addressId }, │ │
│ │ include: { user: true }, │ │
│ │ }); │ │
│ │ │ │
│ │ if (!cryptoAddress) return; │ │
│ │ │ │
│ │ const provider = this.providers.get(cryptoAddress.network); │ │
│ │ if (!provider) return; │ │
│ │ │ │
│ │ // Écouter les transactions sur cette adresse │ │
│ │ provider.on(cryptoAddress.address, async (tx) => { │ │
│ │ await this.handleIncomingPayment(cryptoAddress.id, tx); │ │
│ │ }); │ │
│ │ } │ │
│ │ │ │
│ │ private async handleIncomingPayment(addressId: string, tx: any) { │ │
│ │ const cryptoAddress = await prisma.cryptoAddress.findUnique({ │ │
│ │ where: { id: addressId }, │ │
│ │ }); │ │
│ │ │ │
│ │ if (!cryptoAddress) return; │ │
│ │ │ │
│ │ // Vérifier si déjà traité │ │
│ │ const existing = await prisma.cryptoPayment.findUnique({ │ │
│ │ where: { txHash: tx.hash }, │ │
│ │ }); │ │
│ │ │ │
│ │ if (existing) return; │ │
│ │ │ │
│ │ // Créer le paiement │ │
│ │ const payment = await prisma.cryptoPayment.create({ │ │
│ │ data: { │ │
│ │ userId: cryptoAddress.userId, │ │
│ │ addressId: cryptoAddress.id, │ │
│ │ network: cryptoAddress.network, │ │
│ │ txHash: tx.hash, │ │
│ │ amountToken: tx.value.toString(), │ │
│ │ amountUSD: 0, // À calculer via oracle │ │
│ │ currency: cryptoAddress.network === "BASE" ? "USDC" : "USDT", │ │
│ │ confirmations: 0, │ │
│ │ status: "PENDING", │ │
│ │ plan: "pro", // À déterminer selon le montant │ │
│ │ daysGranted: 30, │ │
│ │ }, │ │
│ │ }); │ │
│ │ │ │
│ │ // Attendre les confirmations │ │
│ │ await this.waitForConfirmations(payment.id, tx.hash, cryptoAddress.network); │ │
│ │ } │ │
│ │ │ │
│ │ private async waitForConfirmations( │ │
│ │ paymentId: string, │ │
│ │ txHash: string, │ │
│ │ network: CryptoNetwork │ │
│ │ ) { │ │
│ │ const requiredConfs = network === "BASE" ? 1 : 2; │ │
│ │ const provider = this.providers.get(network)!; │ │
│ │ │ │
│ │ const receipt = await provider.waitForTransaction(txHash, requiredConfs); │ │
│ │ │ │
│ │ if (receipt?.status === 1) { │ │
│ │ // Transaction confirmée │ │
│ │ await prisma.cryptoPayment.update({ │ │
│ │ where: { id: paymentId }, │ │
│ │ data: { │ │
│ │ confirmations: requiredConfs, │ │
│ │ status: "CONFIRMED", │ │
│ │ confirmedAt: new Date(), │ │
│ │ }, │ │
│ │ }); │ │
│ │ │ │
│ │ // Activer l'abonnement │ │
│ │ const payment = await prisma.cryptoPayment.findUnique({ │ │
│ │ where: { id: paymentId }, │ │
│ │ }); │ │
│ │ │ │
│ │ if (payment) { │ │
│ │ await this.activateSubscription(payment.userId, payment.plan, payment.daysGranted); │ │
│ │ } │ │
│ │ } │ │
│ │ } │ │
│ │ │ │
│ │ private async activateSubscription(userId: string, plan: string, days: number) { │ │
│ │ // Trouver l'organisation de l'utilisateur │ │
│ │ const user = await prisma.user.findUnique({ │ │
│ │ where: { id: userId }, │ │
│ │ include: { members: { include: { organization: true } } }, │ │
│ │ }); │ │
│ │ │ │
│ │ const org = user?.members[0]?.organization; │ │
│ │ if (!org) return; │ │
│ │ │ │
│ │ // Mettre à jour la subscription de l'org │ │
│ │ await prisma.subscription.upsert({ │ │
│ │ where: { referenceId: org.id }, │ │
│ │ create: { │ │
│ │ referenceId: org.id, │ │
│ │ plan, │ │
│ │ status: "active", │ │
│ │ periodStart: new Date(), │ │
│ │ periodEnd: new Date(Date.now() + days * 24 _ 60 _ 60 _ 1000), │ │
│ │ }, │ │
│ │ update: { │ │
│ │ plan, │ │
│ │ status: "active", │ │
│ │ periodEnd: new Date(Date.now() + days _ 24 _ 60 _ 60 \_ 1000), │ │
│ │ }, │ │
│ │ }); │ │
│ │ } │ │
│ │ } │ │
│ │ │ │
│ │ --- │ │
│ │ 📅 Phase 3 : Adaptation de l'UI (Semaine 3) │ │
│ │ │ │
│ │ 3.1 Masquer/désactiver les fonctionnalités org inutiles │ │
│ │ │ │
│ │ Fichier : app/orgs/[orgSlug]/(navigation)/settings/members/page.tsx │ │
│ │ │ │
│ │ Remplacer par une redirection : │ │
│ │ │ │
│ │ import { redirect } from "next/navigation"; │ │
│ │ │ │
│ │ export default function MembersPage() { │ │
│ │ redirect("/dashboard/settings"); // Rediriger vers settings généraux │ │
│ │ } │ │
│ │ │ │
│ │ Fichier : app/orgs/[orgSlug]/(navigation)/\_navigation/orgs-select.tsx │ │
│ │ │ │
│ │ Masquer le sélecteur d'organisations (retourner null) : │ │
│ │ │ │
│ │ export function OrgsSelect() { │ │
│ │ return null; // Pas de sélecteur, une seule org │ │
│ │ } │ │
│ │ │ │
│ │ 3.2 Renommer "Organization" en "Account" dans l'UI │ │
│ │ │ │
│ │ Fichier : app/orgs/[orgSlug]/(navigation)/settings/(details)/page.tsx │ │
│ │ │ │
│ │ Changer les labels : │ │
│ │ │ │
│ │ <PageLayout │ │
│ │ title="Account Settings" // ← "Organization Settings" │ │
│ │ description="Manage your account preferences" │ │
│ │ > │ │
│ │ │ │
│ │ 3.3 Nouvelle page Pricing crypto │ │
│ │ │ │
│ │ Fichier : app/pricing/page.tsx │ │
│ │ │ │
│ │ import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans"; │ │
│ │ import { CryptoPricingCard } from "@/features/crypto/crypto-pricing-card"; │ │
│ │ │ │
│ │ export default function PricingPage() { │ │
│ │ return ( │ │
│ │ <div className="container py-12"> │ │
│ │ <h1 className="text-4xl font-bold text-center mb-12"> │ │
│ │ Choose Your Plan │ │
│ │ </h1> │ │
│ │ │ │
│ │ <div className="grid md:grid-cols-3 gap-8"> │ │
│ │ {MYCRYPTOPILOT_PLANS.map((plan) => ( │ │
│ │ <CryptoPricingCard key={plan.name} plan={plan} /> │ │
│ │ ))} │ │
│ │ </div> │ │
│ │ │ │
│ │ <p className="text-center mt-12 text-muted-foreground"> │ │
│ │ Paiement crypto uniquement (USDC, USDT). Pas de carte bancaire. │ │
│ │ </p> │ │
│ │ </div> │ │
│ │ ); │ │
│ │ } │ │
│ │ │ │
│ │ --- │ │
│ │ 📅 Phase 4 : Dashboards User/Trader (Semaine 4) │ │
│ │ │ │
│ │ 4.1 Dashboard User │ │
│ │ │ │
│ │ Fichier : app/dashboard/page.tsx (nouveau) │ │
│ │ │ │
│ │ Structure : │ │
│ │ - Vue des signaux (traders suivis) │ │
│ │ - Bouton "Suivre un trader" │ │
│ │ - Journal de trading │ │
│ │ - Stats personnelles │ │
│ │ │ │
│ │ 4.2 Dashboard Trader │ │
│ │ │ │
│ │ Fichier : app/dashboard/trader/page.tsx (nouveau) │ │
│ │ │ │
│ │ Structure : │ │
│ │ - Créer un nouveau signal │ │
│ │ - Signaux publiés (historique) │ │
│ │ - Statistiques (winrate, payoff, followers) │ │
│ │ - Revenue share │ │
│ │ │ │
│ │ 4.3 Marketplace de traders │ │
│ │ │ │
│ │ Fichier : app/traders/page.tsx (nouveau) │ │
│ │ │ │
│ │ Liste publique des traders avec : │ │
│ │ - Photo, nom, bio │ │
│ │ - Stats (winrate, payoff, nombre de signaux) │ │
│ │ - Bouton "Suivre" (selon le plan) │ │
│ │ │ │
│ │ --- │ │
│ │ 🧪 Tests & validation │ │
│ │ │ │
│ │ Tests à ajouter │ │
│ │ │ │
│ │ 1. Tests Prisma : vérifier que les nouveaux modèles fonctionnent │ │
│ │ 2. Tests crypto : génération d'adresses, watchers │ │
│ │ 3. Tests auth : vérifier que la création d'org fonctionne toujours │ │
│ │ 4. Tests e2e : parcours complet user → paiement → accès signaux │ │
│ │ │ │
│ │ --- │ │
│ │ 📋 Checklist de migration │ │
│ │ │ │
│ │ DB & Auth │ │
│ │ │ │
│ │ - Créer les nouveaux modèles Prisma │ │
│ │ - Migrer la DB (prisma migrate dev) │ │
│ │ - Adapter auth.ts pour simplifier le nom d'org │ │
│ │ - Tester la création de compte │ │
│ │ │ │
│ │ Crypto Billing │ │
│ │ │ │
│ │ - Créer service de génération d'adresses │ │
│ │ - Créer watcher de paiements │ │
│ │ - Tester en testnet (Base Sepolia, Tron Nile) │ │
│ │ - Configurer les variables d'env (RPC, XPUB) │ │
│ │ │ │
│ │ UI │ │
│ │ │ │
│ │ - Masquer sélecteur d'orgs │ │
│ │ - Désactiver page Members │ │
│ │ - Renommer "Organization" → "Account" │ │
│ │ - Créer page Pricing crypto │ │
│ │ - Dashboard User │ │
│ │ - Dashboard Trader │ │
│ │ - Marketplace traders │ │
│ │ │ │
│ │ Features métier │ │
│ │ │ │
│ │ - Modèle Signal + hash │ │
│ │ - Système de suivi (Follow) │ │
│ │ - Ingestion données marché (WebSocket) │ │
│ │ - Détection de signaux │ │
│ │ - Diffusion (Discord optionnel) │ │
│ │ │ │
│ │ --- │ │
│ │ 🚀 Ordre d'exécution recommandé │ │
│ │ │ │
│ │ 1. Jour 1-2 : DB (Prisma) + Auth │ │
│ │ 2. Jour 3-5 : Crypto billing (adresses + watcher) │ │
│ │ 3. Jour 6-8 : UI (masquer org, renommer, pricing) │ │
│ │ 4. Jour 9-12 : Dashboards (user, trader, marketplace) │ │
│ │ 5. Jour 13-15 : Tests + bugfixes │ │
│ │ 6. Jour 16-20 : Features métier (signaux, suivi, ingestion) │ │
│ │ │ │
│ │ --- │ │
│ │ 📦 Variables d'environnement à ajouter │ │
│ │ │ │
│ │ # Crypto │ │
│ │ BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_KEY │ │
│ │ TRON_RPC_URL=https://api.trongrid.io │ │
│ │ CRYPTO_XPUB_BASE=xpub... │ │
│ │ CRYPTO_XPUB_TRON=xpub... │ │
│ │ │ │
│ │ # Plans (optionnel si garde Stripe pour autre chose) │ │
│ │ STRIPE_PRO_PLAN_ID=price_xxx │ │
│ │ STRIPE_ULTRA_PLAN_ID=price_xxx │ │
│ │ │ │
│ │ --- │ │
│ │ ✅ Résultat final │ │
│ │ │ │
│ │ Ce qui reste de la boilerplate │ │
│ │ │ │
│ │ - ✅ Système d'auth (better-auth) │ │
│ │ - ✅ Modèle User │ │
│ │ - ✅ Organisation (renommée "Account") │ │
│ │ - ✅ Permissions & rôles (réutilisés) │ │
│ │ - ✅ UI de base (dashboard, settings) │ │
│ │ │ │
│ │ Ce qui est ajouté pour MyCryptoPilot │ │
│ │ │ │
│ │ - ✅ Rôles USER/TRADER │ │
│ │ - ✅ TraderProfile, Follow, Signal │ │
│ │ - ✅ Paiement crypto (USDC/USDT) │ │
│ │ - ✅ Dashboards trader/user │ │
│ │ - ✅ Marketplace traders │ │
│ │ - ✅ Système de signaux │ │
│ │ │ │
│ │ Ce qui est supprimé/masqué │ │
│ │ │ │
│ │ - ❌ Invitations │ │
│ │ - ❌ Sélecteur d'organisations │ │
│ │ - ❌ Gestion de membres │ │
│ │ - ❌ Stripe (remplacé par crypto) │ │
