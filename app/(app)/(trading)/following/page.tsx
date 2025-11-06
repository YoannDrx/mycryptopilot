import { getRequiredUser } from "@/lib/auth/auth-user";
import { getFollowedTraders } from "@/features/follow/follow-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Following Page
 *
 * Big Bang (Issue #77 Phase 11) - Created for multi-sidebar architecture
 *
 * Display list of traders the user is following
 */
export default async function FollowingPage() {
  const user = await getRequiredUser();
  const followedTraders = await getFollowedTraders(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Users className="size-8" />
        <div>
          <Typography variant="h1">Following</Typography>
          <Typography variant="muted">
            Traders you are currently following
          </Typography>
        </div>
      </div>

      {followedTraders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No traders followed yet</CardTitle>
            <CardDescription>
              Start following traders to see their signals and updates here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/traders"
              className="text-primary font-medium hover:underline"
            >
              Browse traders marketplace →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followedTraders.map((follow) => (
            <Card key={follow.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={follow.trader.image ?? undefined} />
                    <AvatarFallback>
                      {follow.trader.name[0] || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {follow.trader.traderProfile?.displayName ??
                        follow.trader.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      @{follow.trader.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Typography variant="muted" className="mb-3 text-sm">
                  {follow.trader.traderProfile?.bio ?? "No bio available"}
                </Typography>
                <Link
                  href={`/traders/${follow.trader.id}`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  View profile →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
