import { Typography } from "@/components/nowts/typography";
import { Check, X } from "lucide-react";
import { SectionLayout } from "./section-layout";

const COMPARISON_ROWS = [
  {
    category: "Proof & Verification",
    telegram: "Screenshots (easily faked)",
    mycryptopilot: "Binance/Bybit API Sync (on-chain proof)",
    highlight: true,
  },
  {
    category: "Risk Management",
    telegram: "None (you're on your own)",
    mycryptopilot: "Automated Console (2% rule calculator)",
    highlight: true,
  },
  {
    category: "Signal Format",
    telegram: "Text messages (unstructured)",
    mycryptopilot: "Structured cards (Entry/TP/SL/Rationale)",
    highlight: false,
  },
  {
    category: "Performance Tracking",
    telegram: "Manual spreadsheets",
    mycryptopilot: "Automated journal + analytics",
    highlight: false,
  },
  {
    category: "Payments",
    telegram: "Credit card / PayPal (fiat only)",
    mycryptopilot: "Crypto pro-rata (USDC/USDT)",
    highlight: true,
  },
  {
    category: "Trader Transparency",
    telegram: "No real stats (trust-based)",
    mycryptopilot: "Win rate, payoff ratio, max drawdown (verified)",
    highlight: false,
  },
];

export function ComparisonTable() {
  return (
    <SectionLayout size="lg" variant="card" containerClassName="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Typography variant="h2" className="text-4xl font-bold md:text-5xl">
            Telegram/Discord Signals vs MyCryptoPilot Ecosystem
          </Typography>
          <Typography variant="large" className="text-muted-foreground mt-4">
            We're not just another signal provider. Here's the factual
            difference.
          </Typography>
        </div>

        {/* Table */}
        <div className="border-border overflow-hidden rounded-lg border shadow-lg">
          {/* Header Row */}
          <div className="bg-muted/50 grid grid-cols-3 gap-4 p-4 font-semibold">
            <div className="text-muted-foreground">Feature</div>
            <div className="flex items-center gap-2 text-center">
              <X className="size-5 text-red-500" />
              <span>Telegram/Discord</span>
            </div>
            <div className="flex items-center gap-2 text-center">
              <Check className="text-primary size-5" />
              <span className="text-primary">MyCryptoPilot</span>
            </div>
          </div>

          {/* Data Rows */}
          {COMPARISON_ROWS.map((row, index) => (
            <div
              key={row.category}
              className={`border-border grid grid-cols-3 gap-4 border-t p-4 ${
                row.highlight ? "bg-primary/5" : "bg-background"
              } ${index % 2 === 0 && !row.highlight ? "bg-muted/20" : ""}`}
            >
              <div className="font-semibold">{row.category}</div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <X className="size-4 shrink-0 text-red-500" />
                <span>{row.telegram}</span>
              </div>
              <div className="text-primary flex items-center gap-2 text-sm font-medium">
                <Check className="size-4 shrink-0" />
                <span>{row.mycryptopilot}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <Typography variant="muted">
            💡 Our goal: give you the tools to manage risk, verify performance,
            and trade with confidence—not just copy signals blindly.
          </Typography>
        </div>
      </div>
    </SectionLayout>
  );
}
