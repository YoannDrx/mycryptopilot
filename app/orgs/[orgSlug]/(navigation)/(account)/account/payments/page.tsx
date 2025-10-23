import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteConfig } from "@/site-config";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

export const generateMetadata = combineWithParentMetadata({
  title: "Payment History",
  description: "View your crypto payment history.",
});

export default async function PaymentHistoryPage() {
  const user = await getRequiredUser();

  // Get all crypto payments for this user
  const payments = await prisma.cryptoPayment.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground mt-2">
          View all your crypto payments and their status
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              No payments yet. Your payment history will appear here.
            </p>
            <Button asChild>
              <a href={`/orgs/${user.id}/pricing`}>View Plans</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const networkConfig =
              payment.network === "BASE"
                ? SiteConfig.crypto.networks.base
                : SiteConfig.crypto.networks.tron;

            const explorerUrl =
              payment.network === "BASE"
                ? `${networkConfig.explorerUrl}/tx/${payment.txHash}`
                : `${networkConfig.explorerUrl}/#/transaction/${payment.txHash}`;

            const statusVariant =
              payment.status === "CONFIRMED"
                ? "default"
                : payment.status === "PENDING"
                  ? "secondary"
                  : "destructive";

            return (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="capitalize">{payment.plan}</span>
                        {payment.plan === "test" && (
                          <Badge variant="outline">Test Payment</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {format(payment.createdAt, "PPP 'at' p")}
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant}>{payment.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">
                        ${payment.amountUSD.toString()} USD (
                        {payment.amountToken.toString()} {payment.currency})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-medium">
                        {networkConfig.name} ({networkConfig.currency})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Confirmations:
                      </span>
                      <span className="font-medium">
                        {payment.confirmations}
                      </span>
                    </div>
                    {payment.daysGranted > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Days Granted:
                        </span>
                        <span className="font-medium">
                          {payment.daysGranted} days
                        </span>
                      </div>
                    )}
                    {payment.confirmedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Confirmed At:
                        </span>
                        <span className="font-medium">
                          {format(payment.confirmedAt, "PPP 'at' p")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-muted-foreground mb-2 text-xs">
                      Transaction Hash:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted flex-1 rounded-md border px-2 py-1 text-xs break-all">
                        {payment.txHash}
                      </code>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {payment.plan === "test" &&
                    payment.status === "CONFIRMED" && (
                      <div className="bg-muted/30 rounded-lg border-2 border-dashed p-4">
                        <p className="text-center text-sm">
                          ✅ Test payment confirmed! You can now{" "}
                          <a
                            href={`/orgs/${user.id}/pricing`}
                            className="text-primary font-semibold underline"
                          >
                            subscribe to a full plan
                          </a>
                          .
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
