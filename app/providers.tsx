"use client";

import { Toaster } from "@/components/ui/sonner";
import { DialogManagerRenderer } from "@/features/dialog-manager/dialog-manager-renderer";
import { GlobalDialogLazy } from "@/features/global-dialog/global-dialog-lazy";
import { SearchParamsMessageToastSuspended } from "@/features/searchparams-message/search-params-message-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

const queryClient = new QueryClient();

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <DialogManagerRenderer />
        <GlobalDialogLazy />
        <SearchParamsMessageToastSuspended />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
};
