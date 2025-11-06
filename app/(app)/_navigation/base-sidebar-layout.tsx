import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { PropsWithChildren } from "react";

/**
 * Base Sidebar Layout
 *
 * Layout wrapper partagé par les 4 espaces (Trading, School, Tax, Account)
 * Contient la structure de base : SidebarProvider + SidebarInset + Header
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed OrgBreadcrumb (org-based)
 * - Simplified header
 *
 * Chaque espace passe sa sidebar personnalisée via la prop `sidebar`
 */
export async function BaseSidebarLayout({
  sidebar,
  children,
}: PropsWithChildren<{ sidebar: React.ReactNode }>) {
  return (
    <SidebarProvider>
      {sidebar}
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
