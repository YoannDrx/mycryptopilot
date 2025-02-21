"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileTextIcon, Share1Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useParams } from "next/navigation";

export function EmptyReviews() {
  const params = useParams();

  return (
    <Card className="flex flex-col items-center justify-center gap-8 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <FileTextIcon className="size-6 text-primary" />
          </div>
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Share1Icon className="size-6 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">No reviews yet</h3>
          <p className="text-sm text-muted-foreground">
            Create a review page and share it with your customers to start
            collecting reviews
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/orgs/${params.orgSlug}/pages`}>Create Review Page</Link>
        </Button>
      </div>
    </Card>
  );
}
