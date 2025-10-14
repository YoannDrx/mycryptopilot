"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard, DollarSign, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

type CryptoPayment = {
  id: string;
  network: string;
  txHash: string;
  amountToken: string;
  amountUSD: string;
  currency: string;
  status: string;
  confirmations: number;
  plan: string;
  daysGranted: number;
  createdAt: string;
  confirmedAt: string | null;
};

type CryptoPaymentsResponse = {
  payments: CryptoPayment[];
  total: number;
  totalAmountUSD: number;
};

export function OrganizationCryptoPayments({
  organizationId,
}: {
  organizationId: string;
}) {
  const [data, setData] = useState<CryptoPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/admin/organizations/${organizationId}/crypto-payments`,
        );
        if (response.ok) {
          const result = (await response.json()) as CryptoPaymentsResponse;
          setData(result);
        }
      } catch {
        // Silent fail - payments are not critical for the admin view
      } finally {
        setLoading(false);
      }
    };

    void fetchPayments();
  }, [organizationId]);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Crypto Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading payments...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const payments = data?.payments ?? [];
  const totalAmountUSD = data?.totalAmountUSD ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Crypto Payment History ({payments.length})
          </div>
          {totalAmountUSD > 0 && (
            <div className="flex items-center gap-2 text-base font-normal">
              <DollarSign className="h-4 w-4" />
              <span>Total: ${totalAmountUSD.toFixed(2)}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              No crypto payments found for this organization.
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
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(payment.createdAt), "HH:mm:ss")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getNetworkBadgeVariant(payment.network)}>
                        {payment.network}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {parseFloat(payment.amountToken).toFixed(2)}{" "}
                          {payment.currency}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          ${parseFloat(payment.amountUSD).toFixed(2)} USD
                        </div>
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
                      <div className="space-y-1">
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                        {payment.status === "PENDING" && (
                          <div className="text-muted-foreground text-xs">
                            {payment.confirmations}/12 confirmations
                          </div>
                        )}
                      </div>
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
                        <span className="text-muted-foreground font-mono text-xs">
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
