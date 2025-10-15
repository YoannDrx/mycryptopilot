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
          "/orgs/*/dashboard/",
          "/orgs/*/settings/",
          "/orgs/*/account/",
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
          "/orgs/*/dashboard/",
          "/orgs/*/settings/",
          "/orgs/*/account/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
