import type { AuthRole } from "@/lib/auth/auth-permissions";
import type { IconProps } from "@radix-ui/react-icons/dist/types";
import type { LucideIcon } from "lucide-react";

/**
 * Badge types for navigation links
 * Used to display plan requirements, counts, or status indicators
 */
export type NavLinkBadgeType =
  | { type: "plan"; plan: "FREE" | "PRO" | "ULTRA" }
  | {
      type: "count";
      count: number;
      variant?: "default" | "success" | "warning";
    }
  | { type: "new" }
  | { type: "trader" }
  | { type: "custom"; label: string; variant?: string };

/**
 * Cross-link for navigation items
 * Used to link to related pages (e.g., "→ Connect Exchange")
 */
export type NavigationCrossLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export type NavigationGroup = {
  title: string;
  roles?: AuthRole[];
  links: NavigationLink[];
  defaultOpenStartPath?: string;
  // Extended properties for new sidebar
  icon?: LucideIcon;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: NavLinkBadgeType;
};

export type NavigationLink = {
  href: string;
  Icon:
    | React.ForwardRefExoticComponent<
        IconProps & React.RefAttributes<SVGSVGElement>
      >
    | LucideIcon;
  label: string;
  roles?: AuthRole[];
  hidden?: boolean;
  links?: NavigationLink[];
  // Extended properties for new sidebar
  badge?: NavLinkBadgeType;
  highlightCount?: number;
  requiresPlan?: "PRO" | "ULTRA";
  crossLink?: NavigationCrossLink;
  condition?: boolean;
  description?: string;
};
