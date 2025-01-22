import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Table({ ref, className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  ref,
  className,
  ...props
}: ComponentProps<"thead">) {
  return (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  );
}

export function TableBody({
  ref,
  className,
  ...props
}: ComponentProps<"tbody">) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

export function TableFooter({
  ref,
  className,
  ...props
}: ComponentProps<"tfoot">) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        "bg-primary font-medium text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ ref, className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ ref, className, ...props }: ComponentProps<"th">) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ ref, className, ...props }: ComponentProps<"td">) {
  return (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  ref,
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
