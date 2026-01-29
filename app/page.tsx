import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  Hero,
  FeaturesBento,
  PricingSection,
  MobileAppCta,
  FaqSection,
  Navbar,
  Footer,
} from "@/features/landing-new";

// Force dynamic rendering to avoid Prisma calls during build
export const dynamic = "force-dynamic";

export const metadata = {
  title: "MyCryptoPilot - Ne Tradez Pas Sans Radar",
  description:
    "Suivez des traders vérifiés. Recevez leurs signaux en temps réel. Gérez votre risque comme un pro.",
};

export default async function HomePage() {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="relative min-h-screen bg-[var(--bg-obsidian)]">
        <Navbar />
        <main>
          <Hero />
          <FeaturesBento />
          <PricingSection />
          <MobileAppCta />
          <FaqSection />
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
