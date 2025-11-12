"use client";

import {
  CmdOrOption,
  KeyboardShortcut,
} from "@/components/nowts/keyboard-shortcut";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export type SerializableLink = {
  href: string;
  label: string;
};

export type SerializableGroup = {
  title: string;
  links: SerializableLink[];
};

/**
 * Global Search Command (cmd+k)
 *
 * Affiche tous les liens des 4 espaces (Trading, School, Tax, Account)
 * Utilisé dans toutes les sidebars pour une navigation rapide
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed orgSlug prop (not needed)
 * - Links now use direct URLs (no org prefix)
 */
export function GlobalSearchCommand({
  allLinks,
}: {
  allLinks: SerializableGroup[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Fix hydration: only render Dialog after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleOpen = () => {
    setOpen((open) => !open);
  };

  // Disable hotkeys in test environment to prevent accidental triggers
  useHotkeys("mod+k", toggleOpen, {
    enabled: process.env.NODE_ENV !== "test",
  });

  return (
    <>
      <div className="relative w-full">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          type="search"
          placeholder="Search..."
          className="bg-background w-full appearance-none pl-8 shadow-none"
          onClick={() => {
            setOpen(true);
          }}
          readOnly
        />

        <div className="pointer-events-none absolute top-2.5 right-2.5 inline-flex h-5 items-center gap-1 select-none">
          <KeyboardShortcut eventKey="cmd">
            <CmdOrOption />
          </KeyboardShortcut>
          <KeyboardShortcut eventKey="k">K</KeyboardShortcut>
        </div>
      </div>

      {mounted && (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type to search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {allLinks.map((group, index) => (
              <CommandGroup heading={group.title} key={index}>
                {group.links.map((link) => (
                  <CommandItem
                    key={link.href}
                    onSelect={() => {
                      router.push(link.href);
                      setOpen(false);
                    }}
                  >
                    <Search className="mr-2 size-4" />
                    <span>{link.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
