import { z } from "zod";

export const SettingsDetailsFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const SettingsNotificationFormSchema = z.object({
  invoices: z.boolean(),
  promotions: z.boolean(),
});

export type SettingsDetailsFormType = z.infer<typeof SettingsDetailsFormSchema>;
export type SettingsNotificationFormType = z.infer<
  typeof SettingsNotificationFormSchema
>;
