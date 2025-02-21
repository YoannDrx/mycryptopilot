import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { type PageParams } from "@/types/next";
import { ReviewsTable } from "./_components/reviews-table";
import { searchParamsCache } from "./_lib/search-params";

export default async function ReviewsPage(props: PageParams) {
  const { org } = await getRequiredCurrentOrgCache();
  const { page, status } = await searchParamsCache.parse(props.searchParams);

  const where = {
    organizationId: org.id,
    ...(status !== "ALL" && { status }),
  };

  const [reviews, count] = await Promise.all([
    prisma.review.findMany({
      where,
      select: {
        id: true,
        text: true,
        videoUrl: true,
        authorName: true,
        authorRole: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      skip: (page - 1) * 10,
    }),
    prisma.review.count({
      where,
    }),
  ]);

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>All Reviews</LayoutTitle>
        <LayoutDescription>
          View and manage all reviews submitted through your review pages
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <ReviewsTable
          reviews={reviews}
          totalReviews={count}
          currentPage={page}
        />
      </LayoutContent>
    </Layout>
  );
}
