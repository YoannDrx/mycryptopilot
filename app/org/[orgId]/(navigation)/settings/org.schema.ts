import { OrganizationMembershipRole } from "@prisma/client";
import { z } from "zod";

/**
 * Warning
 * The schema here is used in settings.action.ts with `z.union`
 * You should never make all properties optional in a union schema
 * because `union` will always return the first schema that matches
 * So if you make all properties optional, the first schema will always match
 * and the second schema will never be used
 */
export const OrgDetailsFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const OrgMemberFormSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      role: z.nativeEnum(OrganizationMembershipRole),
    }),
  ),
});

export const OrgDangerFormSchema = z.object({
  id: z.string(),
});

export type OrgDetailsFormSchemaType = z.infer<typeof OrgDetailsFormSchema>;
export type OrgMemberFormSchemaType = z.infer<typeof OrgMemberFormSchema>;
export type OrgDangerFormSchemaType = z.infer<typeof OrgDangerFormSchema>;
