import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About ${SiteConfig.title}`,
  description:
    "Discover the story of MyCryptoPilot, founded by two friends - Yoann the developer and Antho the pro trader - on a mission to democratize intelligent crypto trading.",
  keywords: [
    "about",
    "crypto trading",
    "founding story",
    "team",
    "mission",
    "automation",
  ],
  openGraph: {
    title: `About ${SiteConfig.title}`,
    description:
      "Discover the story of MyCryptoPilot, founded by two friends - Yoann the developer and Antho the pro trader - on a mission to democratize intelligent crypto trading.",
    url: `${SiteConfig.prodUrl}/about`,
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="relative">
      <GridBackground
        color="color-mix(in srgb, var(--muted) 50%, transparent)"
        size={20}
      />
      {/* Hero Section */}
      <SectionLayout variant="transparent">
        <div className="mx-auto max-w-2xl text-center">
          <Typography
            variant="p"
            className="text-primary text-base/7 font-semibold"
          >
            Our story
          </Typography>
          <Typography
            variant="h1"
            className="text-foreground mt-2 text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            Two friends, one mission
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-8 text-lg font-medium text-pretty sm:text-xl/8"
          >
            Born from late-night coding sessions and market analysis,
            MyCryptoPilot is the brainchild of Yoann, the tech wizard, and
            Antho, the trading prodigy, united by a passion to democratize
            intelligent crypto trading.
          </Typography>
        </div>
      </SectionLayout>

      {/* Main Content */}
      <SectionLayout size="lg" variant="transparent">
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
          <div className="lg:pr-8">
            <Typography
              variant="h2"
              className="text-foreground text-2xl font-semibold tracking-tight text-pretty"
            >
              The Genesis
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-6 text-base/7"
            >
              It all started in 2023 during one of those legendary crypto market
              rallies. Yoann, a seasoned full-stack developer with a passion for
              automation, was growing frustrated watching his friend Antho - a
              professional trader with 7+ years of experience - manually execute
              trades 24/7, missing opportunities while sleeping.
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-8 text-base/7"
            >
              "Dude, why are you still doing this manually?" Yoann asked during
              one of their late-night Discord calls. "I could build you a bot
              that does this while we sleep!"
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-6 text-base/7"
            >
              Antho laughed: "Bro, if only it were that simple. I need real-time
              analysis, risk management, multi-exchange support, and something
              that doesn't blow up my account when the market dumps!"
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-6 text-base/7"
            >
              That conversation sparked something. What if they could build the
              ultimate crypto trading assistant? One that combined Antho's
              trading expertise with Yoann's technical prowess?
            </Typography>
          </div>
          <div className="pt-16 lg:row-span-2 lg:-mr-16 xl:mr-auto">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt="Yoann coding late at night"
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=800&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt="Antho analyzing crypto charts"
                  src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=800&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt="Crypto trading dashboard"
                  src="https://images.unsplash.com/photo-1639762512840-4e7e0280d9fc?w=800&h=800&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt="Team celebrating success"
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <Typography
              variant="h2"
              className="text-foreground text-2xl font-semibold tracking-tight text-pretty"
            >
              Meet the Founders
            </Typography>
            <div className="mt-8 space-y-8">
              <div>
                <Typography
                  variant="h3"
                  className="text-primary text-lg font-semibold"
                >
                  Yoann - The Tech Architect
                </Typography>
                <Typography
                  variant="p"
                  className="text-muted-foreground mt-2 text-sm/6"
                >
                  Full-stack developer with 10+ years of experience building
                  scalable systems. Passionate about automation, AI, and
                  creating tools that solve real problems. When he's not coding,
                  you'll find him researching the latest in DeFi and blockchain
                  technology.
                </Typography>
              </div>
              <div>
                <Typography
                  variant="h3"
                  className="text-primary text-lg font-semibold"
                >
                  Antho - The Trading Strategist
                </Typography>
                <Typography
                  variant="p"
                  className="text-muted-foreground mt-2 text-sm/6"
                >
                  Professional trader with 7+ years navigating crypto markets.
                  Specialized in technical analysis, risk management, and
                  algorithmic trading strategies. Survived multiple bear and
                  bull markets, developing a keen sense for market
                  opportunities.
                </Typography>
              </div>
            </div>
            <div className="mt-12">
              <Typography
                variant="h3"
                className="text-muted-foreground text-base/7 font-semibold"
              >
                Our platform stats
              </Typography>
              <hr className="border-border mt-6 border-t" />
              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="border-border flex flex-col gap-y-2 border-b border-dotted pb-4">
                  <dt className="text-muted-foreground text-sm/6">
                    Trading Volume Processed
                  </dt>
                  <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                    <span>$50</span>M+
                  </dd>
                </div>
                <div className="border-border flex flex-col gap-y-2 border-b border-dotted pb-4">
                  <dt className="text-muted-foreground text-sm/6">
                    Active Traders
                  </dt>
                  <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                    <span>10</span>K+
                  </dd>
                </div>
                <div className="max-sm:border-border flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:pb-4">
                  <dt className="text-muted-foreground text-sm/6">
                    Supported Exchanges
                  </dt>
                  <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                    <span>4</span>+
                  </dd>
                </div>
                <div className="flex flex-col gap-y-2">
                  <dt className="text-muted-foreground text-sm/6">
                    Lines of Code
                  </dt>
                  <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                    <span>100</span>K+
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </SectionLayout>
    </div>
  );
}
