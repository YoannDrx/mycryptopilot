import { buttonVariants } from "@/components/ui/button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import InformationCards from "./information-cards";
import { SubscribersChart } from "./subscribers-charts";

export default async function RoutePage(props: PageProps<"/orgs/[orgSlug]">) {
  const params = await props.params;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Platform Overview</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <Link
          href={`/orgs/${params.orgSlug}/traders`}
          className={buttonVariants({ variant: "outline" })}
        >
          <TrendingUp className="mr-2 size-4" />
          Browse Traders
        </Link>
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4 lg:gap-8">
        <InformationCards />
        <SubscribersChart />
      </LayoutContent>
    </Layout>
  );
}
