import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { BookOpen } from "lucide-react";

/**
 * Courses Page
 *
 * Big Bang (Issue #77 Phase 11) - Placeholder for multi-sidebar architecture
 *
 * Display crypto trading courses catalog
 * TODO: Implement courses system
 */
export default async function CoursesPage() {
  await getRequiredUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BookOpen className="size-8" />
        <div>
          <Typography variant="h1">Crypto School</Typography>
          <Typography variant="muted">
            Learn crypto trading from verified professionals
          </Typography>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Crypto School feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Typography variant="muted">
            We're building a comprehensive learning platform that will include:
          </Typography>
          <ul className="text-muted-foreground mt-3 ml-6 list-disc space-y-1">
            <li>Beginner to advanced trading courses</li>
            <li>Technical analysis tutorials</li>
            <li>Risk management strategies</li>
            <li>Market psychology and discipline</li>
            <li>Certifications from verified traders</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
