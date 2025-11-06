import { TradingCard } from "@/components/nowts/trading-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SignalDetailPage(props: {
  params: Promise<{ signalId: string }>;
}) {
  const params = await props.params;
  await getRequiredAdmin();

  const signal = await prisma.signal.findUnique({
    where: { id: params.signalId },
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
              verified: true,
            },
          },
        },
      },
    },
  });

  if (!signal) {
    notFound();
  }

  const isExpired = new Date(signal.expiresAt) < new Date();
  const traderName =
    signal.trader.traderProfile?.displayName ?? signal.trader.name;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/signals">
              <ArrowLeft className="mr-2 size-4" />
              Back to Signals
            </Link>
          </Button>
        </div>
        <LayoutTitle>Signal Details</LayoutTitle>
        <LayoutDescription>
          View complete signal information and metadata
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent className="flex flex-col gap-4">
        {/* Signal Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Signal Preview</CardTitle>
            <CardDescription>
              How this signal appears to users in the feed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-md">
              <TradingCard
                symbol={signal.symbol}
                payload={signal.payloadJson as TradingCardPayloadType}
                traderName={traderName}
                expiresAt={signal.expiresAt}
                compact={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signal Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Signal Metadata</CardTitle>
            <CardDescription>
              Internal signal information for debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Status</span>
              {isExpired ? (
                <Badge variant="secondary">Expired</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>

            {/* ID */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Signal ID</span>
              <code className="text-muted-foreground text-xs">{signal.id}</code>
            </div>

            {/* Hash */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Hash</span>
              <code className="text-muted-foreground text-xs">
                {signal.hash.slice(0, 16)}...
              </code>
            </div>

            {/* Symbol */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Symbol</span>
              <span className="font-mono text-sm">{signal.symbol}</span>
            </div>

            {/* TTL */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">TTL</span>
              <span className="text-sm">{signal.ttlSec} seconds</span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Created At</span>
              <div className="text-right text-sm">
                <div>{format(new Date(signal.createdAt), "MMM dd, yyyy")}</div>
                <div className="text-muted-foreground text-xs">
                  {format(new Date(signal.createdAt), "HH:mm:ss")}
                </div>
              </div>
            </div>

            {/* Expires */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expires At</span>
              <div className="text-right text-sm">
                <div>{format(new Date(signal.expiresAt), "MMM dd, yyyy")}</div>
                <div className="text-muted-foreground text-xs">
                  {format(new Date(signal.expiresAt), "HH:mm:ss")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trader Information */}
        <Card>
          <CardHeader>
            <CardTitle>Trader Information</CardTitle>
            <CardDescription>
              Information about the trader who published this signal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trader Name */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Display Name</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{traderName}</span>
                {signal.trader.traderProfile?.verified && (
                  <Badge variant="default" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Email</span>
              <span className="text-muted-foreground text-sm">
                {signal.trader.email}
              </span>
            </div>

            {/* Trader ID */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-medium">Trader ID</span>
              <code className="text-muted-foreground text-xs">
                {signal.trader.id}
              </code>
            </div>

            {/* View Trader Profile */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users/${signal.trader.id}`}>
                  <ExternalLink className="mr-2 size-4" />
                  View Trader Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
