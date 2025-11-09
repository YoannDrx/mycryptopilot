import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CreditCard, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

type UserCryptoPaymentsProps = {
  userId: string;
};

export async function UserCryptoPayments({ userId }: UserCryptoPaymentsProps) {
  const payments = await prisma.cryptoPayment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalAmountUSD = payments.reduce(
    (sum, payment) => sum + Number(payment.amountUSD),
    0,
  );

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
      case "POLYGON":
        return "secondary";
      case "ETHEREUM":
        return "outline";
      default:
        return "outline";
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    switch (network) {
      case "BASE":
        return `https://basescan.org/tx/${txHash}`;
      case "TRON":
        return `https://tronscan.org/#/transaction/${txHash}`;
      case "POLYGON":
        return `https://polygonscan.com/tx/${txHash}`;
      case "ETHEREUM":
        return `https://etherscan.io/tx/${txHash}`;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Crypto Payment History ({payments.length})
          </div>
          {totalAmountUSD > 0 && (
            <div className="flex items-center gap-2 text-base font-normal">
              <DollarSign className="size-4" />
              <span>Total: ${totalAmountUSD.toFixed(2)}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              No crypto payments found for this user.
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                      <br />
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(payment.createdAt), "HH:mm:ss")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getNetworkBadgeVariant(payment.network)}>
                        {payment.network}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {Number(payment.amountToken).toFixed(2)}{" "}
                        {payment.currency}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        ${Number(payment.amountUSD).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.plan === "ultra"
                            ? "default"
                            : payment.plan === "pro"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {payment.plan.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.daysGranted}d</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                        {payment.status === "PENDING" && (
                          <span className="text-muted-foreground text-xs">
                            {payment.confirmations}/12 confirmations
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {explorerUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 size-4" />
                            View
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {payment.txHash.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
