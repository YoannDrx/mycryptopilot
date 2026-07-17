import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SiteConfig.title,
    short_name: SiteConfig.title,
    description: SiteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#28E8A3",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
