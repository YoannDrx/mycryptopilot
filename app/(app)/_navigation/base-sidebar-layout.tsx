import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import { PageBreadcrumb } from "@/components/nowts/page-breadcrumb";
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
 * Layout Standardization (Nov 2025):
 * - Added Layout wrapper with max-w-7xl for consistent container sizing
 * - Added PageBreadcrumb for automatic navigation breadcrumbs
 * - Aligned with Admin space pattern for visual consistency
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
        {/* Sidebar Toggle Button - Top-left corner */}
        <div className="absolute top-4 left-4 z-50">
          <SidebarTrigger
            size="lg"
            variant="outline"
            className="size-9 cursor-pointer"
          />
        </div>

        {/* Breadcrumb Header */}
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <PageBreadcrumb />
          </Layout>
        </header>

        {/* Main Content */}
        <Layout size="lg" className="flex flex-1 flex-col gap-4 pt-0">
          {children}
        </Layout>
      </SidebarInset>
    </SidebarProvider>
  );
}
