import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CheckCircle,
  Users,
  Signal as SignalIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { TraderActions } from "./_components/trader-actions";

type PageProps = {
  params: Promise<{ traderId: string }>;
};

export default async function TraderDetailPage(props: PageProps) {
  await getRequiredAdmin();
  const params = await props.params;

  const trader = await prisma.traderProfile.findUnique({
    where: {
      id: params.traderId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!trader) {
    notFound();
  }

  // Get stats
  const [followersCount, signalsCount, recentSignals] = await Promise.all([
    prisma.follow.count({
      where: {
        traderId: trader.userId,
        status: "ACTIVE",
      },
    }),
    prisma.signal.count({
      where: {
        traderId: trader.userId,
      },
    }),
    prisma.signal.findMany({
      where: {
        traderId: trader.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  return (
    <Layout size="lg">
      <LayoutHeader>
        <div className="flex items-center gap-2">
          <Link href="/admin/traders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Traders
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={trader.user.image ?? undefined}
              alt={trader.displayName}
            />
            <AvatarFallback>
              {trader.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <LayoutTitle>{trader.displayName}</LayoutTitle>
            <LayoutDescription>{trader.user.email}</LayoutDescription>
          </div>
        </div>
      </LayoutHeader>
      <LayoutActions>
        <TraderActions trader={trader} />
      </LayoutActions>

      <LayoutContent>
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Trader Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Verification Status
                </span>
                {trader.verified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending Verification</Badge>
                )}
              </div>
              {trader.verifiedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified On</span>
                  <span className="font-medium">
                    {format(new Date(trader.verifiedAt), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">
                  {format(new Date(trader.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Price</span>
                <span className="font-medium">${trader.priceMonthlyUSD}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Users className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{followersCount}</p>
                    <p className="text-muted-foreground text-sm">Followers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <SignalIcon className="text-muted-foreground h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">{signalsCount}</p>
                    <p className="text-muted-foreground text-sm">
                      Signals Published
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Card */}
          {trader.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{trader.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Signals Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals ({recentSignals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSignals.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No signals published yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSignals.map((signal) => (
                    <div
                      key={signal.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{signal.symbol}</p>
                        <p className="text-muted-foreground text-sm">
                          {format(
                            new Date(signal.createdAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/signals/${signal.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </LayoutContent>
    </Layout>
  );
}
