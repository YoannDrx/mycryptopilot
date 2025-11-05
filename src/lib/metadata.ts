import type { Metadata, ResolvingMetadata } from "next";

/**
 * Add a suffix to the title of the parent metadata
 *
 * If a layout in /users/ define the title as "Users", the title will be append to the title as "Users · My suffix"
 *
 * @param suffix The suffix to append to the title
 * @returns
 */
export const combineWithParentMetadata =
  (metadata: Metadata) =>
  async (
    _: {
      params: Promise<Record<string, string>>;
      searchParams?: Promise<Record<string, string | string[] | undefined>>;
    },
    parent: ResolvingMetadata,
  ): Promise<Metadata> => {
    const parentMetadata = await parent;
    return {
      ...metadata,
      title: `${parentMetadata.title?.absolute} · ${metadata.title}`,
    };
  };

/**
 * DEPRECATED: orgMetadata removed - Big Bang (Issue #77 Phase 10)
 *
 * Organization-based metadata is no longer needed in user-centric architecture.
 * Use direct metadata exports in page.tsx files instead.
 */
