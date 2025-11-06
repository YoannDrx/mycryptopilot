import type { NavigationLink } from "@/features/navigation/navigation.type";
import { FileUp, FileText } from "lucide-react";

/**
 * Tax Space Links
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed /orgs/:organizationSlug prefix
 * - Direct URLs (no slug replacement needed)
 *
 * 2 liens pour la section Tax & Declaration :
 * - Import Transactions (upload CSV exchanges)
 * - Tax Reports (rapports fiscaux)
 */
export const TAX_LINKS: NavigationLink[] = [
  {
    href: "/tax/import",
    Icon: FileUp,
    label: "Import Transactions",
  },
  {
    href: "/tax/reports",
    Icon: FileText,
    label: "Tax Reports",
  },
];
