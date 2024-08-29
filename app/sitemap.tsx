import { getPosts } from "@/features/posts/post-manager";
import type { MetadataRoute } from "next";

export default async function sitemap(): MetadataRoute.Sitemap {
  const posts = await getPosts();
  return [
    {
      url: "https://codeline.app",
      lastModified: new Date(),
    },
    {
      url: "https://codeline.app/login",
      lastModified: new Date(),
    },
    {
      url: "https://codeline.app/home",
      lastModified: new Date(),
    },
  ];
}
