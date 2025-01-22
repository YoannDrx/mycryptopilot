<context>
You need to use next-zod-route to create a safe route.
</context>

<example>

```ts
// app/api/org/[orgId]/route.ts
import { prisma } from "@/lib/prisma";
import { orgRoute } from "@/lib/safe-route";
import { z } from "zod";

export const POST = orgRoute
  // Path params = /orgs/:orgId
  .params(
    z.object({
      orgId: z.string(),
    }),
  )
  // Body params = { name: "John" }
  .body(z.object({ name: z.string() }))
  // Query params = ?a=1&b=2
  .query(z.object({ query: z.string() }))
  .handler(async (req, { params, body, query, context }) => {
    // Safe check orgId
    const orgId = params.orgId;
    await prisma.organization.update({
      where: {
        id: params.orgId,
      },
      data: {
        name: body.name,
      },
    });
  });
```

</example>

<rules>
- Always create org related routes insides `/api/org/[orgId]/*`
- Always use `orgRoute` to create safe routes inside `/api/org/[orgId]/*`
- In general, you can use `authRoute` to create safe routes that is NOT related to orgs.

</rules>
