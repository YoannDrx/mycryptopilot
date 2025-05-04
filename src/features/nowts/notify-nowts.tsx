import { SiteConfig } from "@/site-config";

/**
 * This component is used to notify Nowts when a new deployment is made.
 */
export const NotifyNowts = async () => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  await fetch("https://codelynx.dev/api/nowts/deploy", {
    method: "POST",
    body: JSON.stringify({
      domain: SiteConfig.domain,
      vercelDomain: process.env.VERCEL_URL,
    }),
  });

  return null;
};
