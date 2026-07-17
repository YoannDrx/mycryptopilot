import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  Hero,
  FeaturesBento,
  FaqSection,
  Navbar,
  Footer,
} from "@/features/landing-new";

// Force dynamic rendering to avoid Prisma calls during build
export const dynamic = "force-dynamic";

export const metadata = {
  title: "MyCryptoPilot - Console de risque crypto en lecture seule",
  description:
    "Simulez une exposition, inspectez des signaux et connectez Binance ou Bybit en lecture seule. Aucun ordre, paiement ou dépôt.",
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
          <FaqSection />
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
