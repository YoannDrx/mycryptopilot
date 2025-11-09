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
import { FeedbackFilters } from "./_components/feedback-filters";
import { FeedbackTable } from "./_components/feedback-table";
import { MessageSquare } from "lucide-react";

const feedbackSearchParams = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
};

const searchParamsCache = createSearchParamsCache(feedbackSearchParams);

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  await getRequiredAdmin();

  const params = await searchParamsCache.parse(searchParams);

  return (
    <Layout size="lg">
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <MessageSquare className="size-5" />
        </div>
        <div>
          <LayoutTitle>Feedback Management</LayoutTitle>
          <LayoutDescription>
            View and manage all user feedback submissions
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <div className="space-y-4">
          <FeedbackFilters />

          <Suspense fallback={<FeedbackTableSkeleton />}>
            <FeedbackTable searchParams={params} />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

const FeedbackTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);
