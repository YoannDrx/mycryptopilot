import type { PropsWithChildren } from "react";
import { AppSidebar } from "./_navigation/app-sidebar";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * App Layout (User-Centric)
 * Big Bang (Issue #77 Phase 7) - Simplified user-centric layout
 *
 * Routes user-centric:
 * - /dashboard
 * - /signals
 * - /traders
 * - /pricing
 * - /account
 * - /risk-console
 * - /checkout/[plan]
 */
export default async function AppLayout({ children }: PropsWithChildren) {
  const user = await getRequiredUser();

  // Check if user has trader profile (for conditional TRADER TOOLS section)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  return (
    <SidebarProvider>
      <AppSidebar hasTraderProfile={hasTraderProfile} />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger
            size="lg"
            variant="outline"
            className="size-9 cursor-pointer"
          />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
