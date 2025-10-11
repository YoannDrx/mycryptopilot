/**
 * API Route: Image Proxy
 *
 * GET /api/image-proxy?url=<external-url>
 *
 * Proxies external images to bypass Next.js Image domain restrictions.
 * This allows using external images without adding domains to next.config.ts.
 *
 * Security:
 * - Only allows HTTPS URLs
 * - Validates URL format with Zod
 * - Forwards proper Content-Type headers
 * - Sets cache headers for performance
 */

import { route } from "@/lib/zod-route";
import { z } from "zod";

const querySchema = z.object({
  url: z.string().url().startsWith("https://"),
});

export const GET = route.query(querySchema).handler(async (req, { query }) => {
  try {
    // Fetch the external image with browser-like headers to bypass basic bot protection
    const response = await fetch(query.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: new URL(query.url).origin,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    if (!response.ok) {
      return new Response("Failed to fetch image", { status: 404 });
    }

    // Get the image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type from external response
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // Return the image with proper headers
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Failed to proxy image", { status: 500 });
  }
});
