import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getTraderProfileByUserId } from "@/features/trader/trader-queries";
import { redirect } from "next/navigation";
import { ReferralLinkCard } from "@/components/nowts/referral-link-card";
import { InviteFollowerDialog } from "@/components/nowts/invite-follower-dialog";
import { EnhancedInvitationsTable } from "@/components/nowts/enhanced-invitations-table";
import { DetailedFunnelCard } from "@/components/nowts/detailed-funnel-card";
import { TopInviteesCard } from "@/components/nowts/top-invitees-card";
import { TierProgressCard } from "@/components/nowts/tier-progress-card";
import { ConversionStatsCard } from "@/components/nowts/conversion-stats-card";
import { ReferralEarningsSection } from "./_components/referral-earnings-section";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { Gift, TrendingUp, Users } from "lucide-react";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutActions,
  LayoutContent,
} from "@/features/page/layout";

export const metadata: Metadata = {
  title: "Referral Program - MyCryptoPilot",
  description: "Manage your referral program, invitations, and rewards",
};

/**
 * Referral Program Page
 *
 * Big Bang (Issue #77 Phase 11) - Adapted for user-centric architecture
 * - Removed getRequiredCurrentOrgCache()
 * - Direct URLs (no /orgs/${slug} prefix)
 */
export default async function ReferralProgramPage() {
  const user = await getRequiredUser();

  // Fetch trader profile
  const traderProfile = await getTraderProfileByUserId(user.id);

  if (!traderProfile) {
    // Redirect to become trader page if no profile
    redirect("/account/become-trader");
  }

  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Gift className="size-5" />
        </div>
        <div>
          <LayoutTitle>Referral Program</LayoutTitle>
          <LayoutDescription>
            Invite followers, earn rewards, and grow your audience
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutActions>
        <InviteFollowerDialog />
      </LayoutActions>

      <LayoutContent className="space-y-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ReferralLinkCard
            traderId={user.id}
            traderName={traderProfile.displayName}
          />
          <ReferralEarningsSection />
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <TierProgressCard traderId={user.id} />
          </Suspense>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <TrendingUp className="mr-2 size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Users className="mr-2 size-4" />
              Invitations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Conversion Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <ConversionStatsCard traderId={user.id} />
              </Suspense>
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>
                    Grow your audience and earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Share Your Link</h4>
                      <p className="text-muted-foreground text-sm">
                        Copy your unique referral link and share it with
                        potential followers
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">They Sign Up</h4>
                      <p className="text-muted-foreground text-sm">
                        When someone signs up through your link, earn 5 credits
                        instantly
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Earn More Rewards</h4>
                      <p className="text-muted-foreground text-sm">
                        Get bonus credits when they upgrade to Pro (50) or Ultra
                        (100) plans
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold">Unlock Tiers</h4>
                      <p className="text-muted-foreground text-sm">
                        More active invitees = higher tier = better rewards and
                        benefits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Funnel & Top Invitees */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Suspense
                fallback={<Skeleton className="h-96 w-full lg:col-span-2" />}
              >
                <div className="lg:col-span-2">
                  <DetailedFunnelCard traderId={user.id} />
                </div>
              </Suspense>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TopInviteesCard traderId={user.id} />
              </Suspense>
            </div>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Invitations</CardTitle>
                <CardDescription>
                  Detailed tracking of all your invitations and their
                  performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  }
                >
                  <EnhancedInvitationsTable traderId={user.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </LayoutContent>
    </>
  );
}
