"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";

export const uploadImageAction = orgAction
  .metadata({})
  .inputSchema(
    z.object({
      base64: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    }),
  )
  .action(async ({ parsedInput: { base64, fileType, fileSize } }) => {
    // Validate file type
    if (!fileType.startsWith("image/")) {
      throw new ActionError("Invalid file (only images are allowed)");
    }

    // Validate file size (max 2mb)
    if (fileSize > 2 * 1024 * 1024) {
      throw new ActionError("File too large (max 2mb)");
    }

    // In a real app, you would upload to S3/Cloudinary here
    // For now, we just return the base64 string
    return base64;
  });
