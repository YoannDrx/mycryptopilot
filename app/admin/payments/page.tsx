import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { Suspense } from "react";
import { PaymentsTable } from "./_components/payments-table";
import { DollarSign } from "lucide-react";

const searchParamsCache = createSearchParamsCache({
  network: parseAsString.withDefault("all"),
  status: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(1),
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  await getRequiredAdmin();

  const params = await searchParamsCache.parse(searchParams);

  return (
    <Layout size="lg">
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <DollarSign className="size-5" />
        </div>
        <div>
          <LayoutTitle>Crypto Payments</LayoutTitle>
          <LayoutDescription>
            Monitor all crypto payments and subscription activations
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <div className="space-y-4">
          <Suspense fallback={<PaymentTableSkeleton />}>
            <PaymentsTable searchParams={params} />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

const PaymentTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);
