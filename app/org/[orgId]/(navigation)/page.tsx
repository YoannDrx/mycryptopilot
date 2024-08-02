import { buttonVariants } from "@/components/ui/button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import type { PageParams } from "@/types/next";
import Link from "next/link";
import InformationCards from "./InformationCards";
import { SubscribersChart } from "./SubscribersChart";

export default async function RoutePage(
  props: PageParams<{
    orgId: string;
  }>,
) {
  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Dashboard</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <Link
          href={`/org/${props.params.orgId}/settings/members`}
          className={buttonVariants({ variant: "outline" })}
        >
          Invite member
        </Link>
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4 lg:gap-8">
        <InformationCards />
        <SubscribersChart />
      </LayoutContent>
    </Layout>
  );
}
