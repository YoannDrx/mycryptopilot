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
          <Suspense fallback={<TreasuryCardSkeleton />}>
            <TreasuryCard />
          </Suspense>

          {/* Futures KPI cards à ajouter ici */}
        </div>
      </LayoutContent>
    </Layout>
  );
}

function TreasuryCardSkeleton() {
  return <Skeleton className="h-[320px] w-full" />;
}
