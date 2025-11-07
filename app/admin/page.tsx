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
import { Home } from "lucide-react";

export default async function AdminPage() {
  await getRequiredAdmin();

  return (
    <Layout size="lg">
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Home className="size-5" />
        </div>
        <div>
          <LayoutTitle>Admin Dashboard</LayoutTitle>
          <LayoutDescription>
            MyCryptoPilot Overview - Treasury and Key Metrics
          </LayoutDescription>
        </div>
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
