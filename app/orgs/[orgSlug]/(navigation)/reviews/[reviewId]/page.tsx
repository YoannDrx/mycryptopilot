import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { type PageParams } from "@/types/next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReviewActions } from "./_components/review-actions";
import { ReviewContentForm } from "./_components/review-content-form";
import { UserInfoForm } from "./_components/user-info-form";

async function ReviewFormWrapper({ reviewId }: { reviewId: string }) {
  const { org } = await getRequiredCurrentOrgCache();

  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
      organizationId: org.id,
    },
    select: {
      id: true,
      authorName: true,
      authorRole: true,
      text: true,
      status: true,
      videoUrl: true,
    },
  });

  if (!review) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <UserInfoForm review={review} />
      <ReviewContentForm review={review} />
    </div>
  );
}

export default async function ReviewPage(
  props: PageParams<{ reviewId: string }>,
) {
  const params = await props.params;

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Review Details</LayoutTitle>
        <LayoutDescription>View and edit review information</LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <ReviewActions reviewId={params.reviewId} />
      </LayoutActions>
      <LayoutContent>
        <Suspense fallback={<div>Loading review...</div>}>
          <ReviewFormWrapper reviewId={params.reviewId} />
        </Suspense>
      </LayoutContent>
    </Layout>
  );
}
