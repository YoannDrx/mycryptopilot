"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

type SafeImageProps = ComponentProps<typeof Image>;

/**
 * SafeImage component
 *
 * Automatically handles external images by proxying them through our API.
 * This allows using images from any domain without modifying next.config.ts.
 *
 * Usage:
 * ```tsx
 * <SafeImage
 *   src="https://external-domain.com/image.png"
 *   alt="External image"
 *   width={300}
 *   height={300}
 * />
 * ```
 *
 * Features:
 * - Internal images: uses Next.js Image optimization directly
 * - External images: proxies through /api/image-proxy
 * - Maintains all Next.js Image props and behavior
 */
export function SafeImage({ src, ...props }: SafeImageProps) {
  // Check if URL is external (starts with http:// or https://)
  const isExternal =
    typeof src === "string" &&
    (src.startsWith("http://") || src.startsWith("https://"));

  // If external, proxy through our API
  const proxiedSrc = isExternal
    ? `/api/image-proxy?url=${encodeURIComponent(src as string)}`
    : src;

  return <Image src={proxiedSrc} {...props} />;
}
