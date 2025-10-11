import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInvitationByToken } from "@/features/invitation/invitation-queries";
import { countTotalSignalsByTrader } from "@/features/signal/signal-queries";
import { getUser } from "@/lib/auth/auth-user";
import { CheckCircle2, Signal } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcceptInvitationButton } from "./_components/accept-invitation-button";

type AcceptInvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const metadata: Metadata = {
  title: "Accept Invitation - MyCryptoPilot",
  description: "Accept trader invitation to follow them and receive signals",
};

export default async function AcceptInvitationPage(
  props: AcceptInvitationPageProps,
) {
  const params = await props.params;
  const user = await getUser();

  // Get invitation
  const invitation = await getInvitationByToken(params.token);

  // If invitation not found or expired
  if (!invitation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Not Found</CardTitle>
              <CardDescription>
                This invitation is invalid, expired, or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                If you believe this is an error, please contact the trader who
                invited you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to signin with callback
  if (!user) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/invite/accept/${params.token}`)}`,
    );
  }

  // Get trader details
  const trader = invitation.trader;
  const traderProfile = trader.traderProfile;

  if (!traderProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Trader Not Found</CardTitle>
              <CardDescription>
                This trader profile is no longer available.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Count trader's signals
  const signalsCount = await countTotalSignalsByTrader(trader.id);

  // Stats
  const stats =
    (traderProfile.statsJson as Record<
      string,
      number | string | boolean
    > | null) ?? {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="size-24">
                <AvatarImage src={trader.image ?? undefined} alt={trader.name} />
                <AvatarFallback>
                  {traderProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-2xl">
                    {traderProfile.displayName}
                  </CardTitle>
                  {traderProfile.verified && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-base">
                  invited you to follow them
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bio */}
            {traderProfile.bio && (
              <div className="text-muted-foreground text-center">
                <p>{traderProfile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-xs">Win Rate</p>
                <p className="text-2xl font-bold">
                  {typeof stats.winrate === "number"
                    ? `${stats.winrate.toFixed(1)}%`
                    : "--%"}
                </p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-xs">Payoff</p>
                <p className="text-2xl font-bold">
                  {typeof stats.payoff === "number"
                    ? stats.payoff.toFixed(1)
                    : "--"}
                </p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-muted-foreground text-xs">Signals</p>
                <p className="text-2xl font-bold">{signalsCount}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Signal className="text-primary mt-0.5 size-5" />
                  <div className="space-y-1">
                    <p className="font-medium">Accept Invitation</p>
                    <p className="text-muted-foreground text-sm">
                      Follow {traderProfile.displayName} to receive real-time
                      trading signals via Discord. Access their track record and
                      detailed statistics.
                    </p>
                  </div>
                </div>
              </div>

              <AcceptInvitationButton
                token={params.token}
                traderId={trader.id}
                traderName={traderProfile.displayName}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-muted-foreground space-y-2 text-center text-sm">
              <p>✅ Follow verified traders with transparent track records</p>
              <p>🔔 Get instant notifications on Discord</p>
              <p>📊 Access risk management tools</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
