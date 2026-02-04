import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Shield, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HERO_STATS = [
  { icon: Shield, label: "100% On-Chain", description: "Paiements crypto" },
  { icon: TrendingUp, label: "2% Rule", description: "Risk Management" },
  { icon: Zap, label: "Base L2", description: "Frais minimaux" },
] as const;

export const Hero = () => {
  return (
    <div className="relative isolate flex flex-col" id="hero">
      <GridBackground />
      <GradientBackground />
      <main className="relative py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Two Column Layout */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Animated Badge */}
              <Badge
                variant="emerald"
                className="badge-pulse mb-6 gap-2 px-4 py-1.5 text-sm font-medium"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00ffaa] opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#00ffaa]" />
                </span>
                V1.0 Live • Base & Tron
              </Badge>

              {/* Main Title */}
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">NE TRADEZ PAS</span>
                <span className="mt-2 block bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] bg-clip-text text-transparent">
                  SANS RADAR
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Console de risque automatisée (règle des 2%), traders vérifiés
                Binance/Bybit, analytics temps réel—votre écosystème risk-first
                360° pour trader avec confiance.
              </p>

              {/* Stats Row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                      <stat.icon className="size-5 text-[#00ffaa]" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {stat.label}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {stat.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#marketplace"
                  className={buttonVariants({
                    size: "lg",
                    variant: "emerald",
                    className: "min-w-[180px] tracking-wider uppercase",
                  })}
                >
                  Explorer Marketplace
                </Link>
                <Link
                  href="/docs"
                  className={buttonVariants({
                    size: "lg",
                    variant: "glass",
                    className: "min-w-[180px] tracking-wider uppercase",
                  })}
                >
                  Documentation
                </Link>
              </div>

              {/* Trust Note */}
              <p className="mt-6 text-xs tracking-wide text-[var(--text-muted)]">
                Pas de carte bancaire. Paiement en USDC (Base) ou USDT (Tron).
              </p>
            </div>

            {/* Right Column - Risk Console Preview */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-[#00ffaa]/20 to-[#00d4ff]/10 opacity-50 blur-3xl" />

              {/* Preview Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[#00ffaa]/30 bg-[var(--bg-onyx)] p-1 shadow-2xl shadow-[#00ffaa]/10">
                <div className="scanline rounded-xl bg-[var(--bg-graphite)] p-6">
                  {/* Terminal Header */}
                  <div className="mb-4 flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#ff3366]" />
                    <div className="size-3 rounded-full bg-[#f59e0b]" />
                    <div className="size-3 rounded-full bg-[#00ffaa]" />
                    <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
                      risk_console.exe
                    </span>
                  </div>

                  {/* Console Content */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                      <span className="terminal-text text-xs">Capital</span>
                      <span className="font-mono text-lg font-bold text-white">
                        $10,000
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                      <span className="terminal-text text-xs">Risque Max</span>
                      <span className="font-mono text-lg font-bold text-[#00ffaa]">
                        2.0%
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                      <span className="terminal-text text-xs">
                        Position Size
                      </span>
                      <span className="font-mono text-lg font-bold text-white">
                        $200
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="terminal-text text-xs">R:R Ratio</span>
                      <span className="font-mono text-lg font-bold text-[#00d4ff]">
                        1:3
                      </span>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-6 flex items-center justify-between rounded-lg border border-[#00ffaa]/20 bg-[#00ffaa]/5 px-4 py-2">
                    <span className="text-xs font-medium text-[#00ffaa]">
                      RISK PROTOCOL ACTIVE
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00ffaa] opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-[#00ffaa]" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mt-20 sm:mt-28">
            <Image
              alt="Preview of MyCryptoPilot trader marketplace with verified stats"
              src="/images/trader-marketplace.png"
              width={1280}
              height={720}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl shadow-[#00ffaa]/5"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const GridBackground = () => {
  return (
    <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(180deg,transparent,var(--foreground),transparent)]"></div>
  );
};

const GradientBackground = () => {
  return (
    <>
      {/* Mesh gradient overlay */}
      <div className="mesh-gradient pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#00ffaa] to-[#00d4ff] opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff3366] to-[#a855f7] opacity-15 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>
    </>
  );
};
