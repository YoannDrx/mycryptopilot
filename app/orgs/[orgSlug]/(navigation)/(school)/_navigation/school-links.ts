import type { NavigationLink } from "@/features/navigation/navigation.type";
import { BookOpen, GraduationCap } from "lucide-react";

const ORGANIZATION_PATH = `/orgs/:organizationSlug`;

/**
 * School Space Links
 *
 * 2 liens pour la section Crypto School :
 * - Courses (catalogue des cours)
 * - My Progress (suivi de progression)
 */
export const SCHOOL_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/courses`,
    Icon: BookOpen,
    label: "Courses",
  },
  {
    href: `${ORGANIZATION_PATH}/progress`,
    Icon: GraduationCap,
    label: "My Progress",
  },
];
