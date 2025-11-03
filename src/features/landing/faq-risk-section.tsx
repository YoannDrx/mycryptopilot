import { Typography } from "@/components/nowts/typography";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SectionLayout } from "./section-layout";

const RISK_FAQS = [
  {
    question: "What is the 2% rule and why is it important?",
    answer:
      "The 2% rule means you never risk more than 2% of your total capital on a single trade. This protects you from devastating losses and ensures you can survive losing streaks. Our risk console automatically calculates your ideal position size based on this rule, your capital, and the signal's stop loss.",
  },
  {
    question: "How does the risk console calculate my position size?",
    answer:
      "The console takes your total capital, multiplies it by your risk percentage (e.g., 2%), then divides by the distance between entry and stop loss. This gives you the maximum position size that respects your risk tolerance. For example: $10,000 capital × 2% risk = $200 max risk. If stop loss is 5% away from entry, position size = $200 / 5% = $4,000.",
  },
  {
    question: "How do you verify Binance/Bybit stats?",
    answer:
      "Traders connect their exchange accounts via read-only API keys. We fetch real trade history, calculate win rate, payoff ratio, and max drawdown directly from Binance/Bybit APIs. No screenshots, no manual input—just on-chain proof of performance. All verified traders display a badge and transparent stats.",
  },
  {
    question: "Is the risk console really free?",
    answer:
      "Yes! All plans (Free, Pro, Ultra) include access to the risk console. The Free plan allows 5 calculations per day, Pro allows 50/day, and Ultra is unlimited. This ensures everyone can protect their capital, regardless of their plan.",
  },
  {
    question: "Can I use the risk console without following traders?",
    answer:
      "Absolutely. The risk console is a standalone tool. You can use it to calculate position sizing for your own trades, even if you're not following any signals. Just input your capital, risk tolerance, entry price, and stop loss—it works for any trading strategy.",
  },
  {
    question: "What if I want to risk more than 2%?",
    answer:
      "The console lets you adjust risk from 1% to 5%. However, we strongly recommend staying at 1-2% for conservative trading and 2-3% for moderate risk. Risking more than 3% per trade significantly increases your chances of blowing your account during a losing streak.",
  },
  {
    question: "Do traders' stats include losing trades?",
    answer:
      "Yes. We fetch the entire trade history from exchange APIs—wins AND losses. Win rate, payoff ratio, and max drawdown are calculated from real data. Traders can't hide losses or cherry-pick winning trades. Transparency is core to our risk-first approach.",
  },
  {
    question: "How is MyCryptoPilot different from Telegram signal groups?",
    answer:
      "Telegram groups rely on screenshots (easily faked) and don't provide risk management tools. MyCryptoPilot verifies stats with Binance/Bybit APIs, includes an automated risk console, tracks your performance with a trading journal, and offers copy-trading automation. We're a complete risk-first ecosystem, not just a signal provider.",
  },
];

export function FAQRiskSection() {
  return (
    <SectionLayout size="lg">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Typography variant="h2" className="text-4xl font-bold md:text-5xl">
            Risk Management FAQs
          </Typography>
          <Typography variant="large" className="text-muted-foreground mt-4">
            Everything you need to know about protecting your capital.
          </Typography>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {RISK_FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Typography variant="p" className="text-muted-foreground mb-6">
            Ready to start managing your risk like a professional trader?
          </Typography>
          <Button size="lg" asChild>
            <Link href="/auth/signup">Start with Free Risk Console</Link>
          </Button>
        </div>
      </div>
    </SectionLayout>
  );
}
