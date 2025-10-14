import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { BookOpen, GraduationCap, TrendingUp, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Crypto School - Courses",
  description: "Learn crypto trading from professional traders. Courses, lessons, and certifications.",
};

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Crypto School
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Master crypto trading with our comprehensive courses designed by professional traders.
            Learn risk management, technical analysis, and trading strategies.
          </p>
        </div>

        {/* Planned Features */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="text-primary size-5" />
                <CardTitle>Interactive Courses</CardTitle>
              </div>
              <CardDescription>
                Step-by-step lessons covering everything from basics to advanced strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Crypto Trading Fundamentals
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Technical Analysis Masterclass
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Risk Management Essentials
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Advanced Trading Strategies
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="text-primary size-5" />
                <CardTitle>Certifications</CardTitle>
              </div>
              <CardDescription>
                Earn certificates and showcase your trading knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Complete courses and quizzes
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Track your learning progress
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Unlock achievement badges
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Share certificates on social media
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="text-primary size-5" />
                <CardTitle>Real Trading Examples</CardTitle>
              </div>
              <CardDescription>
                Learn from actual trades and market scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Case studies from verified traders
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Market analysis breakdowns
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Common mistakes to avoid
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Strategy implementation guides
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <Shield className="text-primary size-5" />
                <CardTitle>Risk-First Approach</CardTitle>
              </div>
              <CardDescription>
                Focus on protecting your capital before chasing profits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Position sizing calculator
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Stop-loss strategies
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Portfolio diversification
                </li>
                <li className="flex items-center gap-2">
                  <div className="bg-primary/20 size-1.5 rounded-full" />
                  Risk/reward optimization
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-12 border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Stay Tuned!</CardTitle>
            <CardDescription>
              We're building an amazing learning experience.
              The Crypto School will launch soon with exclusive content from our verified traders.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
