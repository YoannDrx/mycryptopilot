"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Lock,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { SectionLayout } from "./section-layout";

type TraderPreviewData = {
  name: string;
  avatar: string;
  specialty: string;
  winRate: number;
  payoffRatio: number;
  followers: number;
  verified: boolean;
  locked?: boolean;
};

const PREVIEW_TRADERS: TraderPreviewData[] = [
  {
    name: "CryptoMaster_BTC",
    avatar: "CM",
    specialty: "BTC Futures",
    winRate: 62,
    payoffRatio: 2.4,
    followers: 847,
    verified: true,
  },
  {
    name: "AltcoinPro",
    avatar: "AP",
    specialty: "Altcoins Spot",
    winRate: 58,
    payoffRatio: 3.1,
    followers: 623,
    verified: true,
  },
  {
    name: "SwingTrader_ETH",
    avatar: "ST",
    specialty: "ETH Swing",
    winRate: 65,
    payoffRatio: 2.8,
    followers: 1205,
    verified: true,
    locked: true,
  },
];

export function TradersPreviewSection() {
  return (
    <SectionLayout size="lg" id="marketplace">
      <div className="text-center">
        {/* Section Header */}
        <Badge variant="emerald" className="mb-4">
          <Users className="mr-1 size-3" />
          Marketplace
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Traders Vérifiés <span className="text-[#00ffaa]">On-Chain</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          Suivez des traders professionnels avec des statistiques transparentes
          et vérifiables. Binance et Bybit connectés en lecture seule.
        </p>
      </div>

      {/* Traders Grid */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PREVIEW_TRADERS.map((trader, index) => (
          <TraderPreviewCard key={trader.name} trader={trader} index={index} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Button asChild variant="emerald" size="lg">
          <Link href="/auth/signup">
            Explorer le Marketplace
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          +15 traders vérifiés • Statistiques mises à jour quotidiennement
        </p>
      </div>
    </SectionLayout>
  );
}

function TraderPreviewCard({
  trader,
  index,
}: {
  trader: TraderPreviewData;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--bg-onyx)] p-6 transition-all duration-300",
        trader.locked
          ? "hover:border-[#ff3366]/30"
          : "hover:border-[#00ffaa]/30 hover:shadow-[0_0_30px_rgba(0,255,170,0.1)]",
      )}
    >
      {/* Locked Overlay */}
      {trader.locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-obsidian)]/80 backdrop-blur-sm">
          <div className="flex size-12 items-center justify-center rounded-full border border-[#ff3366]/30 bg-[#ff3366]/10">
            <Lock className="size-5 text-[#ff3366]" />
          </div>
          <p className="mt-3 text-sm font-medium text-white">Trader Premium</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Upgrade pour débloquer
          </p>
          <Button variant="crimson" size="sm" className="mt-4" asChild>
            <Link href="/pricing">Voir les plans</Link>
          </Button>
        </div>
      )}

      {/* Card Content */}
      <div className={cn(trader.locked && "locked-blur")}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full border border-[#00ffaa]/30 bg-[#00ffaa]/10 text-lg font-bold text-[#00ffaa]">
            {trader.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{trader.name}</h3>
              {trader.verified && (
                <CheckCircle className="size-4 text-[#00ffaa]" />
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {trader.specialty}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="size-4 text-[#00ffaa]" />
              <span className="text-lg font-bold text-white">
                {trader.winRate}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Win Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <BarChart3 className="size-4 text-[#00d4ff]" />
              <span className="text-lg font-bold text-white">
                {trader.payoffRatio}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Payoff</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="size-4 text-[var(--text-muted)]" />
              <span className="text-lg font-bold text-white">
                {trader.followers}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Followers</p>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Performance 30j</span>
            <span className="font-medium text-[#00ffaa]">+12.4%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-slate)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00ffaa] to-[#00d4ff]"
              style={{ width: `${Math.min(trader.winRate + 20, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
