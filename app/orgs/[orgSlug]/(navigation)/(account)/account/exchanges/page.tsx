import { getRequiredUser } from "@/lib/auth/auth-user";
import { getTraderProfileByUserId } from "@/features/trader/trader-queries";
import { getTraderExchangeConnections } from "@/features/exchange/exchange-queries";
import { redirect } from "next/navigation";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, TrendingUp } from "lucide-react";
import { ConnectExchangeForm } from "./_components/connect-exchange-form";
import { ExchangeConnectionsList } from "./_components/exchange-connections-list";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Exchange Connections - MyCryptoPilot",
  description:
    "Connect your exchanges to sync trades and display verified stats",
};

export default async function ExchangeConnectionsPage() {
  const session = await getRequiredUser();
  const org = await getRequiredCurrentOrgCache();

  // Fetch full user from DB to get planName
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      planName: true,
    },
  });

  if (!user) {
    redirect(`/orgs/${org.slug}`);
  }

  // Check if user is a trader
  const traderProfile = await getTraderProfileByUserId(user.id);

  if (!traderProfile) {
    // Redirect non-traders to become-trader page
    redirect(`/orgs/${org.slug}/account/become-trader`);
  }

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
  const connectionLimit = planName === "ultra" ? 3 : planName === "pro" ? 1 : 0;

  const canAddConnection = connections.length < connectionLimit;
  const isFreePlan = planName === "free";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Exchange Connections
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your exchange accounts to automatically sync trades and
            display verified performance stats
          </p>
        </div>

        {/* Plan Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Your Plan: {user.planName ?? "Free"}
              <Badge variant={isFreePlan ? "secondary" : "default"}>
                {connections.length} / {connectionLimit} connections
              </Badge>
            </CardTitle>
            <CardDescription>
              {isFreePlan
                ? "Upgrade to Pro to connect exchanges and display verified stats"
                : `You can connect up to ${connectionLimit} exchange${connectionLimit > 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Free Plan Blocker */}
        {isFreePlan && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Exchange connections require a Pro or Ultra plan.</strong>
              <br />
              Upgrade to sync your trades automatically and display verified
              stats on your profile.
            </AlertDescription>
          </Alert>
        )}

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
        {!isFreePlan && canAddConnection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="size-5" />
                Connect New Exchange
              </CardTitle>
              <CardDescription>
                Add a new exchange connection to sync trades automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectExchangeForm />
            </CardContent>
          </Card>
        )}

        {/* Connection Limit Reached */}
        {!isFreePlan && !canAddConnection && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Connection limit reached.</strong>
              <br />
              {planName === "pro"
                ? "Upgrade to Ultra to connect up to 3 exchanges."
                : "You have reached the maximum number of connections for your plan."}
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
              minutes (Pro) or 1 minute (Ultra).
            </p>
            <p>
              <strong>Security:</strong> Your API keys are encrypted with
              AES-256-GCM. We only request read-only permissions - no trading
              access.
            </p>
            <p>
              <strong>Privacy:</strong> Your trade history is used to calculate
              verified performance stats displayed on your public profile.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
