import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { GraduationCap } from "lucide-react";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";

/**
 * My Learning Page
 *
 * Big Bang (Issue #77 Phase 11) - Placeholder for multi-sidebar architecture
 *
 * Display user's course progress and achievements
 * TODO: Implement learning progress tracking
 */
export default async function MyLearningPage() {
  await getRequiredUser();

  return (
    <>
      <LayoutHeader className="flex items-center gap-3">
        <GraduationCap className="size-8" />
        <div>
          <LayoutTitle>My Learning</LayoutTitle>
          <LayoutDescription>
            Track your progress and achievements
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>No courses enrolled yet</CardTitle>
            <CardDescription>
              Start learning by enrolling in your first course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Typography variant="muted">
              Once the Crypto School launches, you'll be able to:
            </Typography>
            <ul className="text-muted-foreground mt-3 ml-6 list-disc space-y-1">
              <li>Track completion progress for each course</li>
              <li>Earn certificates and badges</li>
              <li>Review lessons and save notes</li>
              <li>Access downloadable resources</li>
            </ul>
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
