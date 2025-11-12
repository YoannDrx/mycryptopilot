"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ViewMode = "cards" | "table";

type SignalsViewState = {
  // Mode d'affichage actuel
  viewMode: ViewMode;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

/**
 * Store Zustand pour gérer la préférence d'affichage des signaux
 *
 * Persiste dans localStorage pour garder la préférence
 * cards/table entre les sessions
 */
export const useSignalsViewState = create<SignalsViewState>()(
  persist(
    (set) => ({
      viewMode: "cards", // Par défaut: vue cards

      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === "cards" ? "table" : "cards",
        })),
    }),
    {
      name: "signals-view-state", // Clé localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
