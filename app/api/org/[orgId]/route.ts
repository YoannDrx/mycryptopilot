import { orgRoute } from "@/lib/actions/safe-routes";
import { z } from "zod";

export const GET = orgRoute
  .params(
    z.object({
      orgId: z.string(),
    }),
  )
  .handler(async (req, params) => {});
