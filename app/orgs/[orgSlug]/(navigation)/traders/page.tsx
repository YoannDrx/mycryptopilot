import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Search, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traders Marketplace - MyCryptoPilot",
  description:
    "Discover and follow verified crypto traders. Access professional trading signals.",
};

export default async function TradersMarketplacePage() {
  // TODO: Fetch traders from database
  // TODO: Implement search and filters
  // TODO: Add pagination

  // Placeholder data for UI
  const traders = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Traders Marketplace
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Discover professional crypto traders and follow their signals.
            Verified track records and transparent statistics.
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search traders by name..."
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Traders</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="top">Top Performers</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="winrate">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winrate">Win Rate</SelectItem>
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="profit">Profit Factor</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Traders
              </CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{traders.length}</div>
              <p className="text-muted-foreground text-xs">
                Publishing signals daily
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Traders
              </CardTitle>
              <CheckCircle2 className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-muted-foreground text-xs">
                With proven track record
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Win Rate
              </CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--%</div>
              <p className="text-muted-foreground text-xs">
                Across all traders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Traders List */}
        {traders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="text-muted-foreground mb-4 size-16 opacity-20" />
              <h3 className="mb-2 text-xl font-semibold">No traders yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Be the first trader to join MyCryptoPilot! Create your trader
                profile and start sharing your trading signals with the
                community.
              </p>
              <Button>Become a Trader</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder trader cards */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="size-16">
                      <AvatarImage src="" />
                      <AvatarFallback>TC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Trader Name {i}
                        </CardTitle>
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          Verified
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Crypto trader since 2021
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Specialized in BTC/ETH swing trading with focus on
                    risk-reward optimization.
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Win Rate</p>
                      <p className="text-xl font-bold">72%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Profit Factor
                      </p>
                      <p className="text-xl font-bold">2.4</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Followers</p>
                      <p className="text-xl font-bold">128</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Signals</p>
                      <p className="text-xl font-bold">156</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Badge variant="outline">BTC</Badge>
                    <Badge variant="outline">ETH</Badge>
                    <Badge variant="outline">Swing</Badge>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button className="flex-1" variant="default">
                    Follow
                  </Button>
                  <Button variant="outline">View Profile</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination would go here */}
        {traders.length > 0 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">Next</Button>
          </div>
        )}

        {/* CTA Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Want to become a trader?</CardTitle>
            <CardDescription className="text-base">
              Share your trading expertise and earn from your followers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="grid gap-4 text-center md:grid-cols-3">
              <div>
                <div className="mb-2 text-3xl font-bold">1</div>
                <p className="text-muted-foreground text-sm">
                  Create your trader profile
                </p>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold">2</div>
                <p className="text-muted-foreground text-sm">
                  Share quality trading signals
                </p>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold">3</div>
                <p className="text-muted-foreground text-sm">
                  Earn from your followers
                </p>
              </div>
            </div>
            <Button size="lg" className="mt-4">
              Start Trading Today
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
