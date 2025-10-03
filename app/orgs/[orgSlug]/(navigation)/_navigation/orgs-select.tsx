/**
 * MyCryptoPilot: Organization selector hidden
 *
 * In MyCryptoPilot, users have a single personal account (not multiple orgs).
 * This component is kept for compatibility but returns null to hide the selector.
 */

import type { AuthOrganization } from "@/lib/auth/auth-type";
import type { ReactNode } from "react";

type OrganizationsSelectProps = {
  currentOrgSlug?: string;
  children?: ReactNode;
  orgs: AuthOrganization[];
};

export const OrgsSelect = (_props: OrganizationsSelectProps) => {
  // MyCryptoPilot: Hide organization selector (users have single personal account)
  return null;
};
