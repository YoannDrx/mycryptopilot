"use client";

import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export type AuthProvider = "github" | "google";

export const useIsLastUsedProvider = (provider: AuthProvider) => {
  const { data } = useQuery({
    queryFn: () => {
      return authClient.isLastUsedLoginMethod(provider);
    },
    queryKey: ["lastUsedProvider", provider],
    staleTime: Infinity,
  });

  return data ?? false;
};
