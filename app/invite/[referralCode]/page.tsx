import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInvitationByToken } from "@/features/invitation/invitation-queries";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { SiteConfig } from "@/site-config";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  Gift,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

type InviteLandingPageProps = {
  params: Promise<{ referralCode: string }>;
};

export async function generateMetadata({
  params,
}: InviteLandingPageProps): Promise<Metadata> {
  const { referralCode } = await params;
  const invitation = await getInvitationByToken(referralCode);

  if (!invitation?.trader.traderProfile) {
    return {
      title: "Invalid Invitation - MyCryptoPilot",
    };
  }

  const traderName = invitation.trader.traderProfile.displayName;

  return {
    title: `Join ${traderName}'s Trading Signals - MyCryptoPilot`,
    description: `Get access to ${traderName}'s professional crypto trading signals. Start your 14-day Pro trial for free!`,
  };
}

export default async function InviteLandingPage({
  params,
}: InviteLandingPageProps) {
  const { referralCode } = await params;
  const user = await getUser();

  // Get invitation and validate
  const invitation = await getInvitationByToken(referralCode);

  if (!invitation || !invitation.trader.traderProfile) {
    notFound();
  }

  // Increment landing views (only first time)
  if (invitation.landingViews === 0) {
    await prisma.traderInvitation.update({
      where: { id: invitation.id },
      data: {
        landingViews: { increment: 1 },
        clickedAt: new Date(),
      },
    });
  }

  const traderProfile = invitation.trader.traderProfile;
  const traderName = traderProfile.displayName;
  const stats = traderProfile.statsJson as {
    winrate?: number;
    payoff?: number;
    totalSignals?: number;
  } | null;

  // Get recent signals from this trader (last 3)
  const recentSignals = await prisma.signal.findMany({
    where: {
      traderId: invitation.traderId,
      expiresAt: { gt: new Date() }, // Only active signals
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      symbol: true,
      payloadJson: true,
      createdAt: true,
    },
  });

  // Already signed in and following this trader?
  const isAlreadyFollowing =
    user &&
    (await prisma.follow.findUnique({
      where: {
        userId_traderId: {
          userId: user.id,
          traderId: invitation.traderId,
        },
      },
    }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header - Trader Profile */}
        <div className="text-center">
          {invitation.trader.image && (
            <div className="mb-4 flex justify-center">
              <Image
                src={invitation.trader.image}
                alt={traderName}
                width={80}
                height={80}
                className="border-primary rounded-full border-4"
              />
            </div>
          )}
          <div className="mb-2 flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold">{traderName}</h1>
            {traderProfile.verified && (
              <CheckCircle2 className="size-6 text-blue-600" />
            )}
          </div>
          {traderProfile.bio && (
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              {traderProfile.bio}
            </p>
          )}
        </div>

        {/* Trial Banner */}
        <Card className="border-primary border-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <Gift className="text-primary size-12" />
              <div>
                <p className="text-xl font-bold">
                  🎉 14-Day Pro Trial Included!
                </p>
                <p className="text-muted-foreground">
                  Get full access to {traderName}'s signals for free
                </p>
              </div>
            </div>
            <Clock className="text-primary size-8" />
          </CardContent>
        </Card>

        {/* Personal Message */}
        {invitation.personalMessage && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-lg">
                📝 Personal Message from {traderName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap italic">
                "{invitation.personalMessage}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-muted-foreground size-4" />
                <span className="text-2xl font-bold">
                  {stats?.winrate
                    ? `${stats.winrate.toFixed(1)}%`
                    : "--%"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="text-muted-foreground size-4" />
                <span className="text-2xl font-bold">
                  {stats?.totalSignals ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground size-4" />
                <span className="text-2xl font-bold">
                  {await prisma.follow.count({
                    where: {
                      traderId: invitation.traderId,
                      status: "ACTIVE",
                    },
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signals Preview */}
        {recentSignals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
              <CardDescription>
                Preview of {traderName}'s latest trading signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSignals.map((signal) => {
                const payload = signal.payloadJson as {
                  type?: string;
                  entryPrice?: number;
                };
                return (
                  <div
                    key={signal.id}
                    className="bg-card flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          payload.type === "LONG" ? "default" : "destructive"
                        }
                      >
                        {payload.type}
                      </Badge>
                      <span className="font-mono font-semibold">
                        {signal.symbol}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        $
                        {payload.entryPrice
                          ? payload.entryPrice.toFixed(2)
                          : "N/A"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(signal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* What You Get */}
        <Card>
          <CardHeader>
            <CardTitle>What You'll Get</CardTitle>
            <CardDescription>
              Benefits of following {traderName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span>
                  Real-time trading signals with entry/exit prices and stop loss
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span>
                  14-day Pro trial - full access, no credit card required
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span>Discord notifications for instant signal updates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span>Trading journal to track your performance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span>
                  Risk management console with position sizing calculator
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-primary bg-primary/5 border-2">
          <CardContent className="p-8 text-center">
            {isAlreadyFollowing ? (
              <>
                <p className="mb-4 text-lg font-medium">
                  You're already following {traderName}!
                </p>
                <Button asChild size="lg">
                  <Link href={`${SiteConfig.appUrl}/dashboard`}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </>
            ) : user ? (
              <>
                <p className="mb-4 text-lg font-medium">
                  Ready to start following {traderName}?
                </p>
                <Button asChild size="lg">
                  <Link
                    href={`${SiteConfig.appUrl}/follow/${invitation.traderId}?ref=${referralCode}`}
                  >
                    Follow {traderName}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="mb-2 text-2xl font-bold">
                  Start Your 14-Day Pro Trial
                </p>
                <p className="text-muted-foreground mb-6">
                  Join {traderName} and get access to professional trading
                  signals
                </p>
                <Button asChild size="lg" className="text-lg">
                  <Link
                    href={`${SiteConfig.appUrl}/sign-up?ref=${referralCode}`}
                  >
                    Sign Up Free
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
                <p className="text-muted-foreground mt-4 text-sm">
                  No credit card required • Cancel anytime
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
