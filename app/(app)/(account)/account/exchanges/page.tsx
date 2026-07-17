import { getRequiredUser } from "@/lib/auth/auth-user";
import { getOrCreateReadOnlyPortfolioProfile } from "@/features/trader/trader-queries";
import { getTraderExchangeConnections } from "@/features/exchange/exchange-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { ConnectExchangeForm } from "./_components/connect-exchange-form";
import { ExchangeConnectionsList } from "./_components/exchange-connections-list";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { getExchangeConnectionLimit } from "@/features/exchange/exchange-plan-limits";

export const metadata: Metadata = {
  title: "Exchange Connections - MyCryptoPilot",
  description: "Connect one exchange using strictly read-only API credentials",
};

export default async function ExchangeConnectionsPage() {
  const session = await getRequiredUser();

  // Fetch full user from DB to get planName
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      id: true,
      planName: true,
    },
  });

  // ExchangeConnection still points to TraderProfile in the historical
  // schema. Create an internal private owner without exposing a trader profile
  // or changing the user's role.
  const traderProfile = await getOrCreateReadOnlyPortfolioProfile({
    id: user.id,
    name: session.name,
  });

  // Fetch existing connections
  const connectionsRaw = await getTraderExchangeConnections(traderProfile.id);

  // Convert to serializable format for client component
  const connections = connectionsRaw.map((conn) => ({
    id: conn.id,
    exchange: conn.exchange,
    isActive: conn.isActive,
    lastSyncedAt: conn.lastSyncedAt?.toISOString() ?? null,
    nextSyncAt: conn.nextSyncAt?.toISOString() ?? null,
    lastSyncError: conn.lastSyncError,
    createdAt: conn.createdAt.toISOString(),
  }));

  // Check plan limits
  const planName = user.planName?.toLowerCase() ?? "free";
  const connectionLimit = getExchangeConnectionLimit(planName);

  const canAddConnection = connections.length < connectionLimit;

  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <LinkIcon className="size-5" />
        </div>
        <div>
          <LayoutTitle>Exchange Connections</LayoutTitle>
          <LayoutDescription>
            Import balances and history with a read-only key. Order creation and
            cancellation are disabled at the adapter boundary.
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent className="space-y-8">
        {/* Product safety boundary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Read-only connection
              <Badge variant="secondary">
                {connections.length} / {connectionLimit} connections
              </Badge>
            </CardTitle>
            <CardDescription>
              Demo / Testnet policy · one Binance or Bybit connection per
              account · no paid tier and no execution permission.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Existing Connections */}
        {connections.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Your Connections</h2>
              <p className="text-muted-foreground text-sm">
                Manage your connected exchanges
              </p>
            </div>
            <ExchangeConnectionsList
              connections={connections}
              traderProfileId={traderProfile.id}
            />
          </div>
        )}

        {/* Add New Connection */}
        {canAddConnection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="size-5" />
                Connect New Exchange
              </CardTitle>
              <CardDescription>
                Credentials are accepted only after their read-only scope is
                verified by the exchange.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectExchangeForm />
            </CardContent>
          </Card>
        )}

        {/* Connection Limit Reached */}
        {!canAddConnection && (
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertDescription>
              <strong>Connection limit reached.</strong>
              <br />
              Disconnect the current exchange before connecting another one.
            </AlertDescription>
          </Alert>
        )}

        {/* Help Section */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>How it works:</strong> Connect your exchange with
              read-only API keys. We automatically sync your trades every 5
              minutes in the demonstrator.
            </p>
            <p>
              <strong>Security:</strong> Your API keys are encrypted with
              AES-256-GCM. We only request read-only permissions - no trading
              access.
            </p>
            <p>
              <strong>Privacy:</strong> Your trade history is used to calculate
              sourced performance summaries. Values remain labelled with their
              exchange source and last synchronization time.
            </p>
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
