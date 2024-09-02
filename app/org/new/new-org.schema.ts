import { z } from "zod";

export const NewOrgsSchema = z.object({
  name: z.string(),
  id: z.string(),
  email: z.string(),
});

export type NewOrganizationSchemaType = z.infer<typeof NewOrgsSchema>;
