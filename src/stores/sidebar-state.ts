"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SidebarState = {
  // État des sections collapsibles
  collapsedSections: Record<string, boolean>;

  // Actions
  toggleSection: (sectionId: string) => void;
  setSectionOpen: (sectionId: string, isOpen: boolean) => void;
  resetSections: () => void;
};

/**
 * Store Zustand pour gérer l'état de la sidebar Trading
 *
 * Persiste dans localStorage pour garder l'état des sections
 * collapsed/expanded entre les sessions
 */
export const useSidebarState = create<SidebarState>()(
  persist(
    (set) => ({
      collapsedSections: {},

      toggleSection: (sectionId: string) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [sectionId]: !state.collapsedSections[sectionId],
          },
        })),

      setSectionOpen: (sectionId: string, isOpen: boolean) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [sectionId]: !isOpen, // collapsed = !isOpen
          },
        })),

      resetSections: () => set({ collapsedSections: {} }),
    }),
    {
      name: "trading-sidebar-state", // Clé localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Helper pour savoir si une section est ouverte
 * Par défaut, les sections sont ouvertes (undefined = false = !false = true)
 */
export const useSectionIsOpen = (sectionId: string): boolean => {
  const collapsedSections = useSidebarState((state) => state.collapsedSections);
  return !collapsedSections[sectionId];
};
