import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTraderProfileById } from "@/features/trader/trader-queries";
import { displayName } from "@/lib/format/display-name";
import { CheckCircle2, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowButton } from "./follow-button";

type TraderProfilePageProps = {
  params: Promise<{ traderId: string }>;
};

export async function generateMetadata({
  params,
}: TraderProfilePageProps): Promise<Metadata> {
  const { traderId } = await params;
  const trader = await getTraderProfileById(traderId);

  if (!trader) {
    return {
      title: "Trader not found",
    };
  }

  return {
    title: `${trader.displayName} - Trader Profile`,
    description: trader.bio ?? "Professional crypto trader on MyCryptoPilot",
  };
}

export default async function TraderProfilePage({
  params,
}: TraderProfilePageProps) {
  const { traderId } = await params;
  const trader = await getTraderProfileById(traderId);

  if (!trader) {
    notFound();
  }

  // Parse stats from JSON
  const stats = trader.statsJson as {
    winrate?: number;
    payoff?: number;
    maxDD?: number;
    nTrades?: number;
    expectancy?: number;
  } | null;

  const userName = displayName({
    email: trader.user.email,
    name: trader.user.name,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Avatar className="size-24 md:size-32">
                <AvatarImage src={trader.user.image ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {trader.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-3xl">
                      {trader.displayName}
                    </CardTitle>
                    {trader.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="size-3" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-base">
                    {userName}
                  </CardDescription>
                </div>

                {trader.bio && (
                  <p className="text-muted-foreground">{trader.bio}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  <FollowButton traderId={trader.id} />
                  {trader.priceMonthlyUSD > 0 && (
                    <Badge variant="outline" className="text-base">
                      ${trader.priceMonthlyUSD}/mois
                    </Badge>
                  )}
                  {trader.priceMonthlyUSD === 0 && (
                    <Badge variant="outline" className="text-base">
                      Gratuit
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.winrate ? `${stats.winrate}%` : "N/A"}
              </div>
              <p className="text-muted-foreground text-xs">
                Taux de réussite
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profit Factor
              </CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.payoff ? stats.payoff.toFixed(2) : "N/A"}
              </div>
              <p className="text-muted-foreground text-xs">
                Ratio gain/perte
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max DD</CardTitle>
              <TrendingDown className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.maxDD ? `${stats.maxDD}%` : "N/A"}
              </div>
              <p className="text-muted-foreground text-xs">
                Drawdown maximum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trades</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.nTrades ?? 0}
              </div>
              <p className="text-muted-foreground text-xs">
                Signaux publiés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Signaux récents</CardTitle>
            <CardDescription>
              Les derniers signaux de trading publiés par {trader.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Aucun signal publié pour le moment
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Historique des performances de trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Graphique de performance à venir
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
