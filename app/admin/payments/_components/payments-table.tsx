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
import type { Prisma } from "@/generated/prisma";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  network: string;
  status: string;
  page: number;
};

export async function PaymentsTable({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const pageSize = 20;
  const page = searchParams.page || 1;

  // Build where clause
  const whereClause: Prisma.CryptoPaymentWhereInput = {};

  if (searchParams.network !== "all") {
    whereClause.network = searchParams.network as "BASE" | "TRON";
  }

  if (searchParams.status !== "all") {
    whereClause.status = searchParams.status as
      | "PENDING"
      | "CONFIRMED"
      | "FAILED";
  }

  const [payments, total] = await Promise.all([
    prisma.cryptoPayment.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.cryptoPayment.count({
      where: whereClause,
    }),
  ]);

  if (payments.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border">
        <div className="text-muted-foreground text-center">
          <p className="mb-2 text-lg font-medium">No payments found</p>
          <p className="text-sm">No crypto payments have been received yet</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getNetworkBadgeVariant = (network: string) => {
    switch (network) {
      case "BASE":
        return "default";
      case "TRON":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    if (network === "BASE") {
      return `https://basescan.org/tx/${txHash}`;
    }
    if (network === "TRON") {
      return `https://tronscan.org/#/transaction/${txHash}`;
    }
    return null;
  };

  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.amountUSD.toString());
  }, 0);

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Payments</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Page Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Showing</p>
          <p className="text-2xl font-bold">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const explorerUrl = getExplorerUrl(
                payment.network,
                payment.txHash,
              );
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {payment.user.name || "Unknown"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {payment.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(payment.createdAt), "HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getNetworkBadgeVariant(payment.network)}>
                      {payment.network}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {parseFloat(payment.amountToken.toString()).toFixed(2)}{" "}
                      {payment.currency}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      ${parseFloat(payment.amountUSD.toString()).toFixed(2)} USD
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {payment.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.daysGranted}d</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {explorerUrl ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <span className="max-w-[100px] truncate font-mono text-xs">
                            {payment.txHash}
                          </span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <Link
                        href={`/admin/users/${payment.userId}`}
                        className="text-muted-foreground font-mono text-xs hover:underline"
                      >
                        {payment.txHash.slice(0, 8)}...
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground text-center text-sm">
        Showing {payments.length} of {total} payments
      </div>
    </div>
  );
}
