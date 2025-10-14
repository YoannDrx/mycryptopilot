import type { NavigationLink } from "@/features/navigation/navigation.type";
import { FileUp, FileText } from "lucide-react";

const ORGANIZATION_PATH = `/orgs/:organizationSlug`;

/**
 * Tax Space Links
 *
 * 2 liens pour la section Tax & Declaration :
 * - Import Transactions (upload CSV exchanges)
 * - Tax Reports (rapports fiscaux)
 */
export const TAX_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/import`,
    Icon: FileUp,
    label: "Import Transactions",
  },
  {
    href: `${ORGANIZATION_PATH}/reports`,
    Icon: FileText,
    label: "Tax Reports",
  },
];
