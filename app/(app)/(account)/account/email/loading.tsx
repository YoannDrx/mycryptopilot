import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { Mail } from "lucide-react";

export default function PageLoading() {
  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Mail className="size-5" />
        </div>
        <div>
          <LayoutTitle>Email Preferences</LayoutTitle>
          <LayoutDescription>
            Manage your email notifications and preferences
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Manage which emails you want to receive. Critical security and
              payment emails cannot be disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master Toggle */}
            <div className="border-b pb-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>

            {/* Notification Emails Section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
              ))}
            </div>

            {/* Marketing Section */}
            <div className="space-y-4 border-t pt-4">
              <Skeleton className="h-6 w-44" />
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-52" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
