import { buttonVariants } from "@/components/ui/button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { combineWithParentMetadata } from "@/lib/metadata";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { TradersStatsCard } from "./traders-stats-card";
import { SignalsByAssetChart } from "./signals-by-asset-chart";
import { TradersPerformanceChart } from "./traders-performance-chart";

export const generateMetadata = combineWithParentMetadata({
  title: "Analytics",
  description: "Trading analytics and platform statistics",
});

export default async function RoutePage(
  props: PageProps<"/orgs/[orgSlug]/users">,
) {
  const params = await props.params;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Platform Analytics</LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="flex gap-2">
        <Link
          href={`/orgs/${params.orgSlug}/dashboard`}
          className={buttonVariants({ variant: "outline" })}
        >
          <BarChart3 className="mr-2 size-4" />
          Back to Dashboard
        </Link>
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4 lg:gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TradersPerformanceChart />
          <TradersStatsCard />
        </div>
        <SignalsByAssetChart />
      </LayoutContent>
    </Layout>
  );
}
