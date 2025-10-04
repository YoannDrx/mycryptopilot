import GridBackground from "@/components/nowts/grid-background";
import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About ${SiteConfig.title}`,
  description:
    "Two friends, one vision: democratize access to professional crypto trading signals. Meet the team behind MyCryptoPilot.",
  keywords: ["about", "crypto trading", "trading signals", "founders", "team"],
  openGraph: {
    title: `About ${SiteConfig.title}`,
    description:
      "Two friends, one vision: democratize access to professional crypto trading signals. Meet the team behind MyCryptoPilot.",
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
            Democratizing access to professional crypto trading signals. Making
            trading accessible, transparent, and driven by risk management.
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
              How it all started
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-6 text-base/7"
            >
              Late 2023, over coffee, we were sharing our frustrations. Me, a
              developer passionate about tech and crypto, struggling to trade
              consistently. My friend, a professional trader for 5 years, had
              solid expertise but lacked tools to share it effectively with
              those who needed it most.
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-8 text-base/7"
            >
              That's when the idea of{" "}
              <span className="text-primary font-semibold">MyCryptoPilot</span>{" "}
              was born. Why couldn't professional traders monetize their
              expertise transparently? Why should beginner traders pay $2000 for
              courses with no guarantee? We needed something simple,
              transparent, based on actual performance.
            </Typography>
            <Typography
              variant="p"
              className="text-muted-foreground mt-8 text-base/7"
            >
              We wanted to build a platform where{" "}
              <span className="text-primary font-semibold">
                risk management
              </span>{" "}
              is king, where stats are verifiable, and where everyone pays for
              what they actually use. No subscription traps, no unrealistic
              promises. Just serious trading, accessible to everyone.
            </Typography>
          </div>
          <div className="pt-16 lg:row-span-2 lg:-mr-16 xl:mr-auto">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt="Crypto trading charts and analysis"
                  src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt="Bitcoin and cryptocurrency technology"
                  src="https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1">
                <img
                  alt="Crypto trading workspace"
                  src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
              <div className="outline-border -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 lg:-mt-40">
                <img
                  alt="Digital cryptocurrency network"
                  src="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop"
                  className="block size-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <Typography
              variant="p"
              className="text-muted-foreground text-base/7 font-semibold"
            >
              Our core principles
            </Typography>
            <hr className="border-border mt-6 border-t" />
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="border-border flex flex-col gap-y-2 border-b border-dotted pb-4">
                <dt className="text-muted-foreground text-sm/6">Crypto Only</dt>
                <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                  <span>100</span>%
                </dd>
              </div>
              <div className="border-border flex flex-col gap-y-2 border-b border-dotted pb-4">
                <dt className="text-muted-foreground text-sm/6">
                  Risk-First Trading
                </dt>
                <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                  <span>Always</span>
                </dd>
              </div>
              <div className="max-sm:border-border flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:pb-4">
                <dt className="text-muted-foreground text-sm/6">
                  Transparent Stats
                </dt>
                <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                  <span>Real</span>
                </dd>
              </div>
              <div className="flex flex-col gap-y-2">
                <dt className="text-muted-foreground text-sm/6">
                  No BS Promises
                </dt>
                <dd className="text-foreground order-first text-6xl font-semibold tracking-tight">
                  <span>Ever</span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </SectionLayout>
    </div>
  );
}
