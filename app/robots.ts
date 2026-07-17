import { getServerUrl } from "@/lib/server-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/account/",
          "/dashboard/",
          "/checkout/",
          "/pricing",
          "/payment/",
          "/posts/",
          "/invite/",
          "/follow/",
          "/home",
          "/school/",
          "/tax/",
          "/my-trades",
          "/*?*", // Disallow URLs with query parameters
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/account/",
          "/dashboard/",
          "/checkout/",
          "/pricing",
          "/payment/",
          "/posts/",
          "/invite/",
          "/follow/",
          "/home",
          "/school/",
          "/tax/",
          "/my-trades",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
