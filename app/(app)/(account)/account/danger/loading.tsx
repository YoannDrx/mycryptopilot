import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { Shield } from "lucide-react";

export default function RouteLoading() {
  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-destructive/10 text-destructive flex items-center justify-center rounded-lg p-2">
          <Shield className="size-5" />
        </div>
        <div>
          <LayoutTitle>Danger Zone</LayoutTitle>
          <LayoutDescription>
            Manage critical account actions and permanent deletions
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <CardDescription>
              <Skeleton className="h-4 w-full" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
