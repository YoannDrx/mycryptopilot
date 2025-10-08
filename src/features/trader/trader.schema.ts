import { z } from "zod";

/**
 * Schema pour la création d'un profil trader
 */
export const CreateTraderProfileSchema = z.object({
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(50, "Display name must be less than 50 characters"),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),
  priceMonthlyUSD: z
    .number()
    .int()
    .min(0, "Price must be positive")
    .max(10000, "Price must be less than 10000")
    .default(0),
  image: z.string().url().optional().nullable(),
});

export type CreateTraderProfileType = z.infer<typeof CreateTraderProfileSchema>;

/**
 * Schema pour la mise à jour d'un profil trader
 */
export const UpdateTraderProfileSchema = z.object({
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),
  priceMonthlyUSD: z
    .number()
    .int()
    .min(0, "Price must be positive")
    .max(10000, "Price must be less than 10000")
    .optional(),
  image: z.string().url().optional().nullable(),
});

export type UpdateTraderProfileType = z.infer<typeof UpdateTraderProfileSchema>;

/**
 * Schema pour toggle trader role
 */
export const ToggleTraderRoleSchema = z.object({
  enabled: z.boolean(),
});

export type ToggleTraderRoleType = z.infer<typeof ToggleTraderRoleSchema>;
