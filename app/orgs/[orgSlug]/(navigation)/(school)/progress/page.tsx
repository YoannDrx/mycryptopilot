import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Metadata } from "next";
import { Award, BookOpen, Trophy, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "My Progress - Crypto School",
  description: "Track your learning progress, achievements, and certifications.",
};

export default function ProgressPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            My Learning Progress
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your journey to becoming a professional crypto trader
          </p>
        </div>

        {/* Overview Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Courses Started</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">of 12 available</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Courses Completed</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">0% completion</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Certificates Earned</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">Beginner level</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Learning Streak</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="text-muted-foreground size-4" />
                <span className="text-muted-foreground text-xs">days in a row</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              Your progress across all available courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Crypto Trading Fundamentals</span>
                <span className="text-muted-foreground text-sm">0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Technical Analysis Masterclass</span>
                <span className="text-muted-foreground text-sm">0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Risk Management Essentials</span>
                <span className="text-muted-foreground text-sm">0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Advanced Trading Strategies</span>
                <span className="text-muted-foreground text-sm">0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>
              Unlock badges by completing courses and reaching milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted flex aspect-square items-center justify-center rounded-lg"
                >
                  <Award className="text-muted-foreground size-8 opacity-30" />
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-center text-sm">
              Complete courses to unlock achievements
            </p>
          </CardContent>
        </Card>

        {/* Learning Path */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Learning Path</CardTitle>
            <CardDescription>
              Follow this path to maximize your trading education
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="bg-primary/20 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Start with Fundamentals</p>
                  <p className="text-muted-foreground text-sm">
                    Learn the basics of crypto trading, market types, and order types
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Master Technical Analysis</p>
                  <p className="text-muted-foreground text-sm">
                    Study charts, indicators, and patterns to predict market movements
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Focus on Risk Management</p>
                  <p className="text-muted-foreground text-sm">
                    Learn to protect your capital with proper position sizing and stop-losses
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium">Apply Advanced Strategies</p>
                  <p className="text-muted-foreground text-sm">
                    Implement professional trading strategies and refine your approach
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
