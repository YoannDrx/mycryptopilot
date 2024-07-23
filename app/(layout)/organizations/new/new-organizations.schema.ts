import { z } from "zod";

export const NewOrganizationSchema = z.object({
  name: z.string(),
  id: z.string(),
  email: z.string(),
});

export type NewOrganizationSchemaType = z.infer<typeof NewOrganizationSchema>;
