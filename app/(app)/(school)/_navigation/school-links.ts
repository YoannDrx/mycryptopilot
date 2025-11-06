import type { NavigationLink } from "@/features/navigation/navigation.type";
import { BookOpen, GraduationCap } from "lucide-react";

/**
 * School Space Links
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed /orgs/:organizationSlug prefix
 * - Direct URLs (no slug replacement needed)
 *
 * 2 liens pour la section Crypto School :
 * - Courses (catalogue des cours)
 * - My Learning (suivi de progression)
 */
export const SCHOOL_LINKS: NavigationLink[] = [
  {
    href: "/school/courses",
    Icon: BookOpen,
    label: "Courses",
  },
  {
    href: "/school/my-learning",
    Icon: GraduationCap,
    label: "My Learning",
  },
];
