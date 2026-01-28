"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskConsoleCalculator } from "@/components/nowts/risk-console-calculator";
import {
  Calculator,
  Shield,
  Target,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { SectionLayout } from "./section-layout";

const FEATURES = [
  {
    icon: Zap,
    title: "Calcul Temps Réel",
    description:
      "Sizing de position instantané selon votre tolérance au risque",
    color: "#00ffaa",
  },
  {
    icon: Shield,
    title: "Règle des 2%",
    description: "Ne risquez jamais plus de 2% de votre capital par trade",
    color: "#00d4ff",
  },
  {
    icon: Target,
    title: "Validation R:R",
    description: "Détection automatique des setups invalides",
    color: "#00ffaa",
  },
  {
    icon: Lock,
    title: "Pro & Ultra",
    description: "Console complète avec presets et historique",
    color: "#ff3366",
  },
];

export function RiskConsoleDemo() {
  return (
    <SectionLayout size="lg" id="console">
      <div className="text-center">
        <Badge variant="emerald" className="mb-4">
          <Calculator className="mr-1 size-3" />
          Risk Console
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Calculez Votre <span className="text-[#00ffaa]">Position Size</span>{" "}
          en Secondes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          Notre console de risque calcule automatiquement la taille idéale de
          position, valide votre ratio R:R et vous protège avec la règle des 2%.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Features Grid */}
        <div className="flex flex-col justify-center gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl border border-[var(--glass-border)] bg-[var(--bg-onyx)] p-5 transition-all duration-300 hover:border-[#00ffaa]/30"
              >
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${feature.color}10`,
                    color: feature.color,
                  }}
                >
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-1 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#00ffaa]">2%</p>
              <p className="text-xs text-[var(--text-muted)]">Max Risk/Trade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#00d4ff]">1:3</p>
              <p className="text-xs text-[var(--text-muted)]">
                Min R:R Recommandé
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-[var(--text-muted)]">Calculs/Mois</p>
            </div>
          </div>

          <Button asChild variant="emerald" size="lg" className="w-fit">
            <Link href="/auth/signup">
              Protéger Mon Capital
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        {/* Right: Interactive Calculator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#00ffaa]/20 via-[#00d4ff]/20 to-[#00ffaa]/20 opacity-50 blur-xl" />

          {/* Calculator Card */}
          <div className="relative overflow-hidden rounded-xl border border-[#00ffaa]/20 bg-[var(--bg-onyx)] shadow-[0_0_30px_rgba(0,255,170,0.1)]">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 border-b border-[var(--glass-border)] bg-[var(--bg-graphite)] px-4 py-3">
              <div className="size-3 rounded-full bg-[#ff3366]" />
              <div className="size-3 rounded-full bg-[#f59e0b]" />
              <div className="size-3 rounded-full bg-[#00ffaa]" />
              <span className="terminal-text ml-2 text-xs">
                RISK_CONSOLE.EXE
              </span>
            </div>

            <RiskConsoleCalculator
              className="border-0 bg-transparent"
              heading={
                <span className="flex items-center gap-2">
                  <Calculator className="size-5 text-[#00ffaa]" />
                  <span className="terminal-text text-sm">
                    Position Calculator
                  </span>
                </span>
              }
            />
          </div>
        </motion.div>
      </div>
    </SectionLayout>
  );
}
