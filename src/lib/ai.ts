import { openai } from "@ai-sdk/openai";

/**
 * Usage :
 *
 * ```ts
 * const result = await generateText({
 *   model: openaiModel,
 *   prompt: 'Invent a new holiday and describe its traditions.',
 * });
 * ```
 *
 * Src :
 *
 * Prompt : https://sdk.vercel.ai/docs/foundations/prompts
 * Tools : https://sdk.vercel.ai/docs/foundations/tools
 */
export const openaiModel = openai("gpt-4o");
