import { prisma } from "@/lib/prisma";
import { orgRoute, SafeRouteError } from "@/lib/safe-route";
import { z } from "zod";

export const POST = orgRoute
  .params(
    z.object({
      orgId: z.string(),
    }),
  )
  .body(z.object({ name: z.string() }))
  .handler(async (req, { params, body }) => {
    throw SafeRouteError;
    await prisma.organization.update({
      where: {
        id: params.orgId,
      },
      data: {
        name: body.name,
      },
    });
  });
