import { z } from "zod";

/**
 * Schema pour suivre un trader
 */
export const FollowTraderSchema = z.object({
  traderId: z.string().min(1, "Trader ID is required"),
});

/**
 * Schema pour ne plus suivre un trader
 */
export const UnfollowTraderSchema = z.object({
  traderId: z.string().min(1, "Trader ID is required"),
});

/**
 * Types TypeScript
 */
export type FollowTraderInput = z.infer<typeof FollowTraderSchema>;
export type UnfollowTraderInput = z.infer<typeof UnfollowTraderSchema>;
