"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type Review, type ReviewStatus } from "@prisma/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { EmptyReviews } from "./empty-reviews";

type Props = {
  reviews: Pick<
    Review,
    | "id"
    | "text"
    | "videoUrl"
    | "authorName"
    | "authorRole"
    | "status"
    | "createdAt"
  >[];
  totalReviews: number;
  currentPage: number;
};

const statusOptions: { value: ReviewStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function AutomaticPagination({
  totalItems,
  currentPage,
  itemsPerPage,
  getPageUrl,
  className,
}: {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  getPageUrl: (page: number) => string;
  className?: string;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const generatePaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink href={getPageUrl(1)}>1</PaginationLink>
        </PaginationItem>,
      );
      if (start > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href={getPageUrl(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink href={getPageUrl(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={getPageUrl(currentPage - 1)}
            aria-disabled={currentPage === 1}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
        {generatePaginationItems()}
        <PaginationItem>
          <PaginationNext
            href={getPageUrl(currentPage + 1)}
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function ReviewsTable({ reviews, totalReviews, currentPage }: Props) {
  const params = useParams();
  const [status, setStatus] = useQueryState("status", {
    shallow: false,
    throttleMs: 1000,
  });

  const getPageUrl = (page: number) => {
    return `/orgs/${params.orgSlug}/reviews?page=${page}${
      status ? `&status=${status}` : ""
    }`;
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Reviews ({totalReviews})</CardTitle>
        <Select
          value={status ?? ""}
          onValueChange={async (value) => setStatus(value || "ALL")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <EmptyReviews />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.authorName}</div>
                      {review.authorRole && (
                        <div className="text-sm text-muted-foreground">
                          {review.authorRole}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.text ? (
                      <div className="max-w-[300px] truncate">
                        {review.text}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Video Review
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        {
                          "bg-yellow-100 text-yellow-800":
                            review.status === "PENDING",
                          "bg-green-100 text-green-800":
                            review.status === "APPROVED",
                          "bg-red-100 text-red-800":
                            review.status === "REJECTED",
                        },
                      )}
                    >
                      {review.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/orgs/${params.orgSlug}/reviews/${review.id}`}
                      >
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <AutomaticPagination
          totalItems={totalReviews}
          currentPage={currentPage}
          itemsPerPage={10}
          getPageUrl={getPageUrl}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}
