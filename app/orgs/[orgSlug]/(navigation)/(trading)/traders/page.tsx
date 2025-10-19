import type { Metadata } from "next";
import { searchTraders } from "@/features/trader/trader-queries";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { TradersListClient } from "./_components/traders-list-client";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Traders Marketplace - MyCryptoPilot",
  description:
    "Discover and follow verified crypto traders. Access professional trading signals.",
};

export default async function TradersMarketplacePage() {
  const user = await getRequiredUser();

  // Initial SSR fetch (no filters, just default traders for SEO)
  const initialData = await searchTraders({
    limit: 12,
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TradersListClient initialData={initialData} userId={user.id} />
    </Suspense>
  );
}
