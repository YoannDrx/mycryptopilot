import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  q: string;
  page: number;
};

export async function SignalsTable({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const pageSize = 20;
  const page = searchParams.page || 1;

  // Build where clause
  const whereClause = searchParams.q
    ? {
        OR: [
          {
            symbol: { contains: searchParams.q, mode: "insensitive" as const },
          },
          {
            trader: {
              traderProfile: {
                displayName: {
                  contains: searchParams.q,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      }
    : {};

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            email: true,
            traderProfile: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.signal.count({
      where: whereClause,
    }),
  ]);

  if (signals.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border">
        <div className="text-muted-foreground text-center">
          <p className="mb-2 text-lg font-medium">No signals found</p>
          <p className="text-sm">
            {searchParams.q
              ? "Try adjusting your search"
              : "No signals have been published yet"}
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => {
              const isExpired = new Date(signal.expiresAt) < now;
              return (
                <TableRow key={signal.id}>
                  <TableCell>
                    <div className="font-medium">{signal.symbol}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {signal.trader.traderProfile?.displayName ??
                          signal.trader.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {signal.trader.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(signal.createdAt), "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(signal.createdAt), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(signal.expiresAt), "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(signal.expiresAt), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="secondary">Expired</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/signals/${signal.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground text-center text-sm">
        Showing {signals.length} of {total} signals
      </div>
    </div>
  );
}
