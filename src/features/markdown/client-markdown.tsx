import { ErrorBoundary } from "@/components/utils/error-boundaries";
import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import type { ComponentPropsWithoutRef } from "react";

type ClientMarkdownProps = ComponentPropsWithoutRef<typeof Markdown>;

export const ClientMarkdown = ({
  children,
  className,
  ...props
}: ClientMarkdownProps) => {
  return (
    <ErrorBoundary>
      <Markdown className={cn("prose dark:prose-invert", className)} {...props}>
        {children}
      </Markdown>
    </ErrorBoundary>
  );
};
