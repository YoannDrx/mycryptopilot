import { EmailFormSection } from "@/features/email/email-form-section";
import { BentoGridSection } from "@/features/landing/bento-section";
import { CTASectionCard } from "@/features/landing/cta/cta-card-section";
import { CTAImageSection } from "@/features/landing/cta/cta-image-section";
import { CtaSection } from "@/features/landing/cta/cta-section";
import { FAQSection } from "@/features/landing/faq-section";
import { FeaturesSection } from "@/features/landing/feature-section";
import { Hero } from "@/features/landing/hero";
import { LandingHeader } from "@/features/landing/landing-header";
import { PainSection } from "@/features/landing/pain";
import { ReviewGrid } from "@/features/landing/review/review-grid";
import { ReviewSingle } from "@/features/landing/review/review-single";
import { ReviewTriple } from "@/features/landing/review/review-triple";
import { SectionDivider } from "@/features/landing/section-divider";
import { StatsSection } from "@/features/landing/stats-section";
import { Footer } from "@/features/layout/footer";
import { Pricing } from "@/features/plans/pricing-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative flex h-fit flex-col">
      <div className="mt-16"></div>

      <LandingHeader />

      <Hero />

      <StatsSection />

      <BentoGridSection />

      <PainSection />

      <SectionDivider />

      <ReviewTriple
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=a1",
            name: "Mark",
            review: `MyCryptoPilot **has completely transformed my crypto trading approach**. The risk-first signals and real-time analysis helped me increase my profits by 40% in 3 months.`,
            role: "Crypto Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=a2",
            name: "Leah",
            review: `MyCryptoPilot's automated trading is incredible. **I can sleep peacefully** knowing the bot manages my positions according to my strategies with stop-loss and take-profit.`,
            role: "Investor",
          },
          {
            image: "https://i.pravatar.cc/300?u=a3",
            name: "Thomas",
            review: `The multi-exchange connection is amazing. **I can trade on Binance and Bybit simultaneously** from a single interface. The Discord bot keeps me informed in real-time.`,
            role: "Day Trader",
          },
        ]}
      />

      <SectionDivider />

      <ReviewSingle
        image="https://i.pravatar.cc/300?u=5"
        name="Sophie"
        review={`MyCryptoPilot **has revolutionized my crypto trading approach**. The technical analysis and automated signals **have multiplied my returns by 3 in 6 months.**`}
        role="Professional Trader"
        compagnyImage="https://1000logos.net/wp-content/uploads/2021/05/JP-Morgan-Chase-logo.png"
        key={1}
      />

      <FeaturesSection
        features={[
          {
            badge: "📊 Real-time Analysis",
            title: "Real-time Market Analysis",
            description:
              "Continuous monitoring of prices, volumes and technical indicators across all major exchanges.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "🚦 Risk-First Signals",
            title: "Intelligent Trading Signals",
            description:
              "Signal generation based on risk analysis and market opportunities assessment.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
              />
            ),
          },
          {
            badge: "🤖 Automated Trading",
            title: "Automated Strategies",
            description:
              "Automatic execution of your trading strategies with advanced risk management.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "💎 Multi-Exchange",
            title: "Multi-Exchange Support",
            description:
              "Connect Binance, Bybit, OKX and Bitget to trade across all platforms.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt=""
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
        ]}
      />

      <CTAImageSection />

      <CTASectionCard />

      <CtaSection />

      <Pricing />

      <FAQSection
        faq={[
          {
            question: "What is MyCryptoPilot?",
            answer:
              "MyCryptoPilot is an intelligent crypto trading copilot that provides real-time market analysis, risk-based trading signals and automated strategies to optimize your trading performance.",
          },
          {
            question: "How do trading signals work?",
            answer:
              "Our trading signals use advanced market analysis, technical indicators and a 'risk-first' approach to identify the best investment opportunities with optimal risk management.",
          },
          {
            question: "Which exchanges are supported?",
            answer:
              "MyCryptoPilot supports major crypto exchanges: Binance, Bybit, OKX and Bitget. You can connect multiple accounts and trade simultaneously across multiple platforms.",
          },
          {
            question: "Can I automate my trading strategies?",
            answer:
              "Yes, our platform allows you to create and automatically execute trading strategies with custom conditions, stop-loss and take-profit for complete trade management.",
          },
          {
            question: "Which crypto networks are supported?",
            answer:
              "We support major blockchain networks: Base, Tron, Polygon and Ethereum. You can trade assets on these networks with optimized transaction fees.",
          },
          {
            question: "Is automated trading safe?",
            answer:
              "Security is our priority. All exchange connections are secured with API keys, and we use advanced protection mechanisms with loss limits and security checks.",
          },
          {
            question: "What are the benefits of the Discord bot?",
            answer:
              "Our Discord bot provides you with real-time alerts, trading signals directly on your server, and allows you to manage some operations from Discord for a simplified trading experience.",
          },
        ]}
      />

      <SectionDivider />

      <ReviewGrid
        reviews={[
          {
            image: "https://i.pravatar.cc/300?u=b1",
            name: "Anthony",
            review:
              "Since I started using MyCryptoPilot, my trading performance has skyrocketed. The risk-first signals have saved me from several major losses. Recommended for any serious trader.",
            role: "Crypto Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b2",
            name: "Camille",
            review:
              "MyCryptoPilot's dashboard is exceptional. I can monitor all my trades in real-time on Binance and Bybit. An essential tool for day trading.",
            role: "Day Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b3",
            name: "Julian",
            review:
              "The technical analysis provided by MyCryptoPilot is invaluable. It allowed me to double my success rate in just a few months.",
            role: "Technical Analyst",
          },
          {
            image: "https://i.pravatar.cc/300?u=b4",
            name: "Emily",
            review:
              "I was skeptical about automated trading, but MyCryptoPilot changed my mind. The bot executes my strategies perfectly with impeccable risk management.",
            role: "Investor",
          },
          {
            image: "https://i.pravatar.cc/300?u=b5",
            name: "Nicholas",
            review:
              "MyCryptoPilot's interface is incredibly intuitive. I was able to onboard my entire team in record time, and our trading performance has significantly improved.",
            role: "Trading Team Lead",
          },
          {
            image: "https://i.pravatar.cc/300?u=b6",
            name: "Marie",
            review:
              "The Discord bot is a feature I didn't know about. It's great for receiving real-time alerts and managing some operations directly from Discord.",
            role: "Freelance Trader",
          },
          {
            image: "https://i.pravatar.cc/300?u=b7",
            name: "David",
            review:
              "Joining the MyCryptoPilot community opened up networking opportunities with other traders. It's more than a tool, it's a growth ecosystem.",
            role: "Crypto Influencer",
          },
          {
            image: "https://i.pravatar.cc/300?u=b8",
            name: "Laura",
            review:
              "The multi-exchange view in MyCryptoPilot helps me visualize my entire portfolio. It's been a game-changer for my investment strategy.",
            role: "Crypto Strategist",
          },
          {
            image: "https://i.pravatar.cc/300?u=b9",
            name: "Peter",
            review:
              "I appreciate the flexibility of MyCryptoPilot's pricing plans. It's accessible for traders at all levels, from beginners to professional traders.",
            role: "Crypto Entrepreneur",
          },
          {
            image: "https://i.pravatar.cc/300?u=b10",
            name: "Chloe",
            review:
              "MyCryptoPilot's support team is fantastic. They were quick to respond and helpful with all my questions. Exceptional customer service.",
            role: "Premium Customer",
          },
        ]}
      />

      <EmailFormSection />

      <SectionDivider />

      <Footer />
    </div>
  );
}
