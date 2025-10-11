import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowButton } from "@/components/nowts/follow-button";
import { isFollowingTrader } from "@/features/follow/follow-queries";
import { countTotalSignalsByTrader } from "@/features/signal/signal-queries";
import { getTraderById } from "@/features/trader/trader-queries";
import { getUser } from "@/lib/auth/auth-user";
import { CheckCircle2, Signal, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type FollowTraderPageProps = {
  params: Promise<{
    traderId: string;
  }>;
};

export async function generateMetadata(
  props: FollowTraderPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const trader = await getTraderById(params.traderId);

  if (!trader?.traderProfile) {
    return {
      title: "Trader Not Found - MyCryptoPilot",
    };
  }

  return {
    title: `Follow ${trader.traderProfile.displayName} - MyCryptoPilot`,
    description: `Follow ${trader.traderProfile.displayName} to receive professional trading signals in real-time.`,
  };
}

export default async function FollowTraderPage(props: FollowTraderPageProps) {
  const params = await props.params;
  const user = await getUser();

  // Récupérer le trader
  const trader = await getTraderById(params.traderId);

  if (!trader?.traderProfile) {
    notFound();
  }

  const traderProfile = trader.traderProfile;

  // Si pas connecté, rediriger vers signin avec callback
  if (!user) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/follow/${params.traderId}`)}`,
    );
  }

  // Vérifier si on suit déjà ce trader
  const isFollowing = await isFollowingTrader(user.id, params.traderId);

  // Si on suit déjà, rediriger vers le profil trader
  if (isFollowing) {
    redirect(`/traders/${params.traderId}`);
  }

  // Compter les signaux du trader
  const signalsCount = await countTotalSignalsByTrader(params.traderId);

  // Stats du trader
  const stats =
    (traderProfile.statsJson as Record<string, number | string | boolean> | null) ??
    {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header avec avatar et info */}
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
                  {trader.name}
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

            {/* CTA Follow */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Signal className="text-primary mt-0.5 size-5" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      Suivez {traderProfile.displayName} pour recevoir ses signaux
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Recevez des notifications Discord en temps réel pour chaque
                      nouveau signal publié. Accédez au journal de trading et aux
                      statistiques détaillées.
                    </p>
                  </div>
                </div>
              </div>

              <FollowButton
                traderId={params.traderId}
                traderName={traderProfile.displayName}
                isFollowing={isFollowing}
                variant="default"
                size="lg"
              />
            </div>

            {/* Liens additionnels */}
            <div className="flex flex-col gap-2 border-t pt-4">
              <Button variant="outline" asChild>
                <Link href={`/traders/${params.traderId}`}>
                  <TrendingUp className="mr-2 size-4" />
                  Voir le profil complet
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/traders">Voir tous les traders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info supplémentaire */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-muted-foreground space-y-2 text-center text-sm">
              <p>
                ✅ Suivez des traders vérifiés avec un track record transparent
              </p>
              <p>🔔 Recevez des notifications instantanées sur Discord</p>
              <p>📊 Accédez aux outils de gestion du risque</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
