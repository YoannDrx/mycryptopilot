import { EmailFormSection } from "@/features/email/email-form-section";
import { BentoGridSection } from "@/features/landing/bento-section";
import { ComparisonTable } from "@/features/landing/comparison-table";
import { CTASectionCard } from "@/features/landing/cta/cta-card-section";
import { CTAImageSection } from "@/features/landing/cta/cta-image-section";
import { CtaSection } from "@/features/landing/cta/cta-section";
import { EcosystemCycleSection } from "@/features/landing/ecosystem-cycle-section";
import { FAQSection } from "@/features/landing/faq-section";
import { FAQRiskSection } from "@/features/landing/faq-risk-section";
import { FeaturesSection } from "@/features/landing/feature-section";
import { Hero } from "@/features/landing/hero";
import { LandingHeader } from "@/features/landing/landing-header";
import { PainSection } from "@/features/landing/pain";
import { ReviewGrid } from "@/features/landing/review/review-grid";
import { ReviewSingle } from "@/features/landing/review/review-single";
import { ReviewTriple } from "@/features/landing/review/review-triple";
import { RiskConsoleDemo } from "@/features/landing/risk-console-demo";
import { SectionDivider } from "@/features/landing/section-divider";
import { StatsSection } from "@/features/landing/stats-section";
import { Footer } from "@/features/layout/footer";
import { Pricing } from "@/features/plans/pricing-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <div
      className="bg-background text-foreground relative flex h-fit flex-col"
      suppressHydrationWarning
    >
      {/* Spacer for fixed header */}
      <div className="h-16" aria-hidden="true" />

      <LandingHeader />

      <Hero />

      <RiskConsoleDemo />

      <StatsSection />

      <EcosystemCycleSection />

      <BentoGridSection />

      <PainSection />

      <ComparisonTable />

      <SectionDivider />

      <ReviewTriple
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=a1",
            name: "Thomas D.",
            review: `As a beginner, **structured signals saved me from major losses**. Detailed rationales teach me to understand the market rather than blindly copying. My win rate went from 35% to 52% in 4 months.`,
            role: "Beginner Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=a2",
            name: "Marie L.",
            review: `I finally stopped overtrading thanks to the risk console. **Automatically calculating my position sizing protected my capital** during volatile phases. I trade less but better.`,
            role: "Intermediate Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=a3",
            name: "Kevin R.",
            review: `After 2 years of solo losses, **following verified traders with transparent stats changed everything**. The trading journal made me realize my recurring mistakes. Finally profitable for 6 months.`,
            role: "Ex-Solo Trader",
          },
        ]}
      />

      <SectionDivider />

      <ReviewSingle
        image="https://i.pravatar.cc/300?u=5"
        name="Antoine B."
        review={`I've been trading crypto solo since 2021 with average results. **MyCryptoPilot opened my eyes to the importance of stats**: win rate isn't enough, it's the payoff ratio that matters. Signals are solid and rationales helped me improve. **Best ROI since following 2-3 verified traders.**`}
        role="Experienced Trader"
        compagnyImage="https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
        key={1}
      />

      <FeaturesSection
        features={[
          {
            badge: "📊 Signals",
            title: "Receive structured signals",
            description:
              "Each signal contains entry, TP, SL, rationales and risk level. Understand WHY to take a trade, not just WHAT to trade.",
            component: (
              <Image
                src="/images/trading-dashboard.png"
                alt="Trading Dashboard"
                width={800}
                height={600}
                className="h-auto w-full rounded-lg object-cover"
              />
            ),
          },
          {
            badge: "🛡️ Console",
            title: "Protect your capital",
            description:
              "Risk console automatically calculates ideal position size based on your capital, risk tolerance and signal's R:R ratio.",
            component: (
              <Image
                src="/images/plateform-analytics.png"
                alt="Platform Analytics"
                width={800}
                height={600}
                className="h-auto w-full rounded-lg object-cover"
              />
            ),
          },
          {
            badge: "📖 Journal",
            title: "Track your performance",
            description:
              "Record every trade, analyze recurring mistakes and identify what works. Continuous improvement starts with measurement.",
            component: (
              <Image
                src="/images/plateform-overview.png"
                alt="Platform Overview"
                width={800}
                height={600}
                className="h-auto w-full rounded-lg object-cover"
              />
            ),
          },
          {
            badge: "📈 Stats",
            title: "Choose your traders",
            description:
              "View real win rate, payoff ratio and max drawdown of each verified trader. Transparent stats, no fake promises.",
            component: (
              <Image
                src="/images/pricing.png"
                alt="Pricing Plans"
                width={800}
                height={600}
                className="h-auto w-full rounded-lg object-cover"
              />
            ),
          },
        ]}
      />

      <CTAImageSection />

      <CTASectionCard />

      <CtaSection />

      <Pricing />

      <FAQRiskSection />

      <FAQSection
        faq={[
          {
            question: "What is MyCryptoPilot?",
            answer:
              "MyCryptoPilot is a crypto trading signals platform with a risk-first approach. We connect retail traders with verified professional traders who share their structured signals in real-time.",
          },
          {
            question: "How do trading signals work?",
            answer:
              "Each signal contains: entry price, take-profit(s), stop-loss, risk level (1-5), confidence (%), detailed rationales and market context. You get all the info to understand WHY to take the trade, not just WHAT to trade.",
          },
          {
            question: "What is a 'risk-first' approach?",
            answer:
              "Risk-first means capital protection comes before profit seeking. We provide a risk console to calculate your position sizing, display traders' max drawdowns, and educate on risk/reward ratio.",
          },
          {
            question: "How to choose a trader to follow?",
            answer:
              "Check transparent stats of each trader: win rate, payoff ratio, max drawdown, number of signals sent. Choose according to your risk profile and strategy (SPOT vs PERP, timeframe, etc.).",
          },
          {
            question: "How many signals can I receive?",
            answer:
              "Free Plan: 5 signals/day (1 trader). Pro Plan: 50 signals/day (5 traders). Ultra Plan: unlimited signals (unlimited traders). Premium signals are blurred for Free users.",
          },
          {
            question: "Can I try it for free?",
            answer:
              "Yes! The Free plan allows you to receive 5 signals per day and follow 1 verified trader. You have access to complete rationales and basic risk console. No credit card required.",
          },
          {
            question: "How does position sizing calculation work?",
            answer:
              "The risk console takes into account your total capital, the % risk you accept (e.g. 2%), the signal's R:R ratio and automatically calculates the optimal position size to protect your capital.",
          },
          {
            question: "Are traders verified?",
            answer:
              "Yes, all traders display transparent stats based on their real trades. We show win rate, payoff ratio and max drawdown. No fake promises or stat manipulation.",
          },
          {
            question: "Can I become a trader on the platform?",
            answer:
              "Yes! If you have a consistent track record (min. 6 months, 50+ trades), you can request verification. Traders earn revenue when users follow them via paid plans.",
          },
          {
            question: "Which cryptos and exchanges are supported?",
            answer:
              "We support all major exchanges (Binance, Bybit, OKX, etc.) and cover BTC, ETH and main altcoins. Signals always specify the exact pair and type (SPOT or PERPETUAL).",
          },
        ]}
      />

      <SectionDivider />

      <ReviewGrid
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=b1",
            name: "Lea M.",
            review:
              "Crypto beginner, I lost 40% of my capital in 2 months solo. Since following 2 verified traders on MyCryptoPilot, I trade with discipline and my losses are limited. The Free plan let me test risk-free.",
            role: "Beginner Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b2",
            name: "Julian P.",
            review:
              "The risk console is a game-changer. Before, I traded with positions too large. Now I systematically calculate my sizing and sleep better. My max drawdown went from -35% to -8%.",
            role: "Intermediate Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b3",
            name: "Sarah K.",
            review:
              "After 18 months of solo losses (-$4k), I finally found a method that works thanks to structured signals. Rationales taught me to read the market. First profitable month in 3 years of trading.",
            role: "Ex-Losing Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b4",
            name: "Max B.",
            review:
              "What differentiates MCP from other platforms is the rationales. I don't blindly copy, I understand WHY the trader takes this setup. I progressed more in 3 months than in 2 years of YouTube.",
            role: "Self-Taught Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b5",
            name: "Emma R.",
            review:
              "I follow 3 traders with different styles: scalp, swing, SPOT only. This diversification protects me from one trader's bad streaks. The Pro plan at $49/month is well worth it.",
            role: "Multi-Strategy Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b6",
            name: "Nick T.",
            review:
              "The integrated trading journal made me aware of my recurring mistakes: I took profits too early and let losses run. Now I respect my TP/SL.",
            role: "Improving Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b7",
            name: "Clara D.",
            review:
              "I tested 4 signal platforms before MCP. This is the only one where stats are transparent and verifiable. No fake screenshots or 1000%/month promises. Serious at last.",
            role: "Skeptical Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b8",
            name: "Alex G.",
            review:
              "I traded solo since 2020 with average winrate (48%). Following pros opened my eyes to my psychological biases. I trade less but with more conviction. WR at 61% now.",
            role: "Former Solo Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b9",
            name: "Camille V.",
            review:
              "As a verified trader on the platform, I earn passive income by sharing my setups. Onboarding was rigorous but it filters out cowboys. Quality community.",
            role: "MCP Verified Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b10",
            name: "Lucas F.",
            review:
              "Ultra plan is expensive ($99) but if you trade seriously with 5k+ capital, it's nothing. Unlimited access + real-time screener + custom alerts. Made $2.8k profit first month.",
            role: "Serious Trader",
          },
        ]}
      />

      <EmailFormSection />

      <SectionDivider />

      <Footer />
    </div>
  );
}
