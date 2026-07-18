import { Logo } from "@/components/brand";
import { GrainOverlay, MeshGradient } from "@/components/design-system";
import { Shield, TrendingUp, Zap, Lock } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";

const VALUE_PROPS = [
  {
    icon: Shield,
    title: "Risk-First",
    description: "Console de risque automatisée avec règle des 2%",
  },
  {
    icon: TrendingUp,
    title: "Traders Vérifiés",
    description: "Stats transparentes Binance/Bybit on-chain",
  },
  {
    icon: Zap,
    title: "Signaux Temps Réel",
    description: "Entry, TP, SL et rationales détaillés",
  },
  {
    icon: Lock,
    title: "Lecture Seule",
    description: "Aucun ordre, retrait ou fonds confié",
  },
] as const;

export default function RouteLayout(props: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen bg-[var(--bg-obsidian)]">
      {/* Mesh gradient background */}
      <MeshGradient variant="default" />

      {/* Grain overlay */}
      <GrainOverlay opacity={0.03} />

      {/* Grid overlay */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />

      {/* Two Column Layout */}
      <div className="relative z-10 flex w-full">
        {/* Left Column - Branding (hidden on mobile) */}
        <div className="hidden flex-col justify-between border-r border-[var(--glass-border)] bg-[var(--bg-onyx)]/50 p-8 lg:flex lg:w-1/2 lg:p-12">
          {/* Logo */}
          <Link href="/">
            <Logo variant="full" size="lg" />
          </Link>

          {/* Center Content - Radar Animation */}
          <div className="flex flex-1 flex-col items-center justify-center">
            {/* Radar Animation */}
            <div className="relative flex items-center justify-center">
              {/* Outer rings */}
              <div className="radar-pulse absolute size-64 rounded-full border border-[#00ffaa]/10" />
              <div className="radar-pulse absolute size-48 rounded-full border border-[#00ffaa]/20 [animation-delay:1s]" />
              <div className="radar-pulse absolute size-32 rounded-full border border-[#00ffaa]/30 [animation-delay:2s]" />

              {/* Sweep line */}
              <div className="absolute size-64">
                <div className="radar-sweep absolute inset-0 origin-center">
                  <div className="absolute top-0 left-1/2 h-1/2 w-[2px] origin-bottom bg-gradient-to-t from-[#00ffaa] to-transparent" />
                </div>
              </div>

              {/* Center dot */}
              <div className="relative z-10 flex size-16 items-center justify-center rounded-full border border-[#00ffaa]/50 bg-[#00ffaa]/10">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#00ffaa]/20">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00ffaa] opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-[#00ffaa]" />
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="text-white">Ne tradez pas</span>{" "}
                <span className="text-[#00ffaa]">sans radar</span>
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Simulez le risque sans exécuter d’ordre
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-4">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="flex items-start gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3"
              >
                <prop.icon className="size-5 shrink-0 text-[#00ffaa]" />
                <div>
                  <div className="text-sm font-semibold text-white">
                    {prop.title}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {prop.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 lg:w-1/2 lg:px-12">
          {/* Mobile Logo */}
          <Link href="/" className="mb-8 lg:hidden">
            <Logo variant="full" size="md" />
          </Link>

          {/* Form Container */}
          {props.children}
        </div>
      </div>
    </div>
  );
}
