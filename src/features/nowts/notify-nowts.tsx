import { getServerUrl } from "@/lib/server-url";
import { upfetch } from "@/lib/up-fetch";

/**
 * This component is used to notify Nowts when a new deployment is made.
 * Only use this component inside a "force-static" page.
 */

export const NotifyNowts = async () => {
  await upfetch("https://codelynx.dev/api/nowts/deploy", {
    method: "POST",
    body: JSON.stringify({
      domain: getServerUrl(),
      vercelDomain: process.env.VERCEL_URL ?? "",
    }),
  });

  return null;
};
