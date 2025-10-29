import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Suspense } from "react";
import { TreasuryCard } from "./_components/treasury-card";
import { PaymentsCard } from "./_components/payments-card";
import { SubscriptionsCard } from "./_components/subscriptions-card";
import { UsersCard } from "./_components/users-card";
import { TradersCard } from "./_components/traders-card";
import { SignalsCard } from "./_components/signals-card";
import { FollowsCard } from "./_components/follows-card";
import { ReferralsCard } from "./_components/referrals-card";
import { ExchangesCard } from "./_components/exchanges-card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AdminPage() {
  await getRequiredAdmin();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Admin Dashboard</LayoutTitle>
        <LayoutDescription>
          Vue d'ensemble MyCryptoPilot - Trésorerie et métriques clés
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<CardSkeleton />}>
            <TreasuryCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <PaymentsCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <SubscriptionsCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <UsersCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <TradersCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <SignalsCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <FollowsCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <ReferralsCard />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <ExchangesCard />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

function CardSkeleton() {
  return <Skeleton className="h-[320px] w-full" />;
}
