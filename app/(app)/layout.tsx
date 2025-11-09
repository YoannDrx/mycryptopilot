import type { PropsWithChildren } from "react";
import { getRequiredUser } from "@/lib/auth/auth-user";

/**
 * App Layout (User-Centric)
 * Big Bang (Issue #77 Phase 11) - Multi-Sidebar Architecture Restored
 *
 * This layout only ensures user authentication.
 * Each route group manages its own sidebar:
 * - (trading)/* → TradingSidebar
 * - (account)/* → AccountSidebar
 * - (school)/* → SchoolSidebar
 * - (tax)/* → TaxSidebar
 *
 * Routes are organized into 4 spaces:
 * - Trading: /dashboard, /signals, /traders, /pricing, /checkout, /risk-console
 * - Account: /account/*
 * - School: /school/*
 * - Tax: /tax/*
 */
export default async function AppLayout({ children }: PropsWithChildren) {
  // Ensure user is authenticated
  await getRequiredUser();

  // Each route group handles its own layout with sidebar
  return <>{children}</>;
}
