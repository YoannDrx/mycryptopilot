"use client";

import { useEffect } from "react";

export const RefreshPageOrganization = (params: {
  replaceId?: boolean;
  orgSlug?: string | null;
  orgId?: string;
}) => {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const { replaceId, orgSlug, orgId } = params;

    if (replaceId && orgSlug && orgId) {
      currentUrl.href = currentUrl.href.replace(
        `/orgs/${orgId}`,
        `/orgs/${orgSlug}`,
      );

      window.location.href = currentUrl.href;
      return;
    }

    window.location.reload();
  }, [params]);

  return null;
};
