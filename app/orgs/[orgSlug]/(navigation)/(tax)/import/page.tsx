import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { FileUp, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Import Transactions - Tax & Declaration",
  description: "Import your crypto trading transactions from exchanges for tax reporting.",
};

export default function ImportPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            Import Transactions
          </h1>
          <p className="text-muted-foreground text-lg">
            Import your crypto trading history from exchanges and wallets for automated tax reporting
          </p>
        </div>

        {/* Upload Area Placeholder */}
        <Card className="mb-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-primary/10 mb-4 rounded-full p-6">
              <FileUp className="text-primary size-12" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Upload CSV Files</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              Drag and drop your exchange CSV files or click to browse
            </p>
            <Button disabled size="lg">
              Select Files
            </Button>
            <p className="text-muted-foreground mt-4 text-sm">
              Maximum file size: 10MB
            </p>
          </CardContent>
        </Card>

        {/* Supported Exchanges */}
        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-semibold">Supported Exchanges</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="text-primary size-5" />
                    <CardTitle>Binance</CardTitle>
                  </div>
                  <Badge variant="outline">CSV</Badge>
                </div>
                <CardDescription>
                  Import trade history, deposits, and withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Spot trading
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Futures trading
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Deposits & Withdrawals
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Staking rewards
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="text-primary size-5" />
                    <CardTitle>Bybit</CardTitle>
                  </div>
                  <Badge variant="outline">CSV</Badge>
                </div>
                <CardDescription>
                  Import trade history and account transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Spot trading
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Derivatives trading
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Deposits & Withdrawals
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary size-4" />
                    Account transfers
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="text-muted-foreground size-5" />
                  <CardTitle className="text-muted-foreground">Coinbase</CardTitle>
                </div>
                <CardDescription>
                  Support planned for future release
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="text-muted-foreground size-5" />
                  <CardTitle className="text-muted-foreground">Kraken</CardTitle>
                </div>
                <CardDescription>
                  Support planned for future release
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* How to Export Guide */}
        <Card>
          <CardHeader>
            <CardTitle>How to Export from Exchanges</CardTitle>
            <CardDescription>
              Step-by-step instructions for exporting your transaction history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Binance</h3>
              <ol className="text-muted-foreground space-y-2 text-sm">
                <li>1. Go to Orders → Trade History</li>
                <li>2. Select the date range</li>
                <li>3. Click "Export Complete Trade History"</li>
                <li>4. Download the CSV file</li>
              </ol>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-3 font-semibold">Bybit</h3>
              <ol className="text-muted-foreground space-y-2 text-sm">
                <li>1. Go to Assets → Transaction History</li>
                <li>2. Select the transaction type and date range</li>
                <li>3. Click "Export" button</li>
                <li>4. Download the CSV file</li>
              </ol>
            </div>

            <div className="bg-muted flex items-start gap-3 rounded-lg p-4">
              <AlertCircle className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="mb-1 font-medium">Important</p>
                <p className="text-muted-foreground text-sm">
                  Make sure to export all transaction types (trades, deposits, withdrawals, transfers)
                  for accurate tax calculations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
