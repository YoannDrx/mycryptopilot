import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Tax Reports - Tax & Declaration",
  description: "Generate tax reports and export your crypto trading data for tax filing.",
};

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            Tax Reports
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate comprehensive tax reports for your crypto trading activity
          </p>
        </div>

        {/* Tax Year Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Tax Year</CardTitle>
            <CardDescription>
              Choose the fiscal year for your tax report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" disabled className="w-32">
                <Calendar className="mr-2 size-4" />
                2024
              </Button>
              <Button variant="outline" disabled className="w-32">
                2023
              </Button>
              <Button variant="outline" disabled className="w-32">
                2022
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Trades</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">No transactions imported</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Realized Gains</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <TrendingUp className="text-green-500 size-6" />
                $0.00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">0% of portfolio</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Realized Losses</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <TrendingDown className="text-red-500 size-6" />
                $0.00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">0% of portfolio</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-semibold">Available Reports</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tax Summary Report</CardTitle>
                <CardDescription>
                  Complete overview of your crypto tax obligations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Total capital gains/losses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Short-term vs long-term gains
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Income from staking/rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Transaction summaries
                  </li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <Download className="mr-2 size-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Detailed list of all your crypto transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    All trades with timestamps
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Cost basis calculations (FIFO)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Exchange and wallet transfers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Fees and commissions
                  </li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <Download className="mr-2 size-4" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Report</CardTitle>
                <CardDescription>
                  Track all crypto income sources for tax filing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Staking rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Mining income
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Airdrops and forks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Interest and lending
                  </li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <Download className="mr-2 size-4" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form 8949 (US)</CardTitle>
                <CardDescription>
                  IRS form for capital gains and losses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Pre-filled IRS Form 8949
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Schedule D summary
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    Supporting documentation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-primary/20 size-1.5 rounded-full" />
                    TurboTax compatible
                  </li>
                </ul>
                <Button disabled className="w-full" variant="outline">
                  <Download className="mr-2 size-4" />
                  Generate Form
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tax Calculation Method */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Calculation Settings</CardTitle>
            <CardDescription>
              Configure how your capital gains are calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Cost Basis Method</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="mt-0.5">
                    <div className="bg-primary size-2 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium">FIFO (First In, First Out)</p>
                    <p className="text-muted-foreground text-sm">
                      The first assets you bought are the first ones sold. Most common method accepted by tax authorities.
                    </p>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-start gap-3 rounded-lg border border-dashed p-4">
                  <div className="mt-0.5">
                    <div className="bg-muted size-2 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium">LIFO (Last In, First Out)</p>
                    <p className="text-sm">
                      Coming soon - The last assets you bought are the first ones sold.
                    </p>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-start gap-3 rounded-lg border border-dashed p-4">
                  <div className="mt-0.5">
                    <div className="bg-muted size-2 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium">Specific Identification</p>
                    <p className="text-sm">
                      Coming soon - Manually choose which specific assets to sell for optimization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
