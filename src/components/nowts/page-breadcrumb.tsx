"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href: string;
};

type PageBreadcrumbProps = {
  /**
   * Override auto-generated breadcrumbs with custom items
   */
  items?: BreadcrumbItem[];
  /**
   * Show home icon as first item
   * @default true
   */
  showHome?: boolean;
};

/**
 * PageBreadcrumb Component
 *
 * Automatically generates breadcrumbs from the current URL pathname.
 * Used in BaseSidebarLayout to provide consistent navigation across all user spaces.
 *
 * @example
 * // Auto-generated from URL
 * <PageBreadcrumb />
 * // URL: /dashboard/trader/signals → Home / Dashboard / Trader / Signals
 *
 * @example
 * // Custom items
 * <PageBreadcrumb items={[
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Settings", href: "/dashboard/settings" }
 * ]} />
 */
export function PageBreadcrumb({
  items,
  showHome = true,
}: PageBreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if not provided
  const breadcrumbItems = items ?? generateBreadcrumbsFromPathname(pathname);

  // Don't render if only home or less than 2 items
  if (breadcrumbItems.length < 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">
                  <Home className="size-4" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Generate breadcrumb items from pathname
 *
 * Converts URL segments to readable labels and builds href chain
 * Filters out dynamic segments like [id], [slug], etc.
 *
 * @example
 * "/dashboard/trader/signals" → [
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Trader", href: "/dashboard/trader" },
 *   { label: "Signals", href: "/dashboard/trader/signals" }
 * ]
 */
function generateBreadcrumbsFromPathname(pathname: string): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, "").split("/");

  // Filter out empty segments and dynamic route segments
  const validSegments = segments.filter(
    (segment) =>
      segment &&
      !segment.startsWith("[") &&
      !segment.startsWith("(") &&
      segment !== "orgs",
  );

  // Build breadcrumb items with cumulative hrefs
  const items: BreadcrumbItem[] = [];
  let cumulativeHref = "";

  for (const segment of validSegments) {
    cumulativeHref += `/${segment}`;

    items.push({
      label: formatSegmentLabel(segment),
      href: cumulativeHref,
    });
  }

  return items;
}

/**
 * Format URL segment to readable label
 *
 * Converts kebab-case and snake_case to Title Case
 *
 * @example
 * "trader-tools" → "Trader Tools"
 * "risk_console" → "Risk Console"
 * "account" → "Account"
 */
function formatSegmentLabel(segment: string): string {
  return segment
    .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}
