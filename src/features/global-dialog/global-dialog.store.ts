import { create } from "zustand";

/**
 * DEPRECATED: Global dialog system kept for future use
 * "org-plan" dialog removed - Big Bang (Issue #77 Phase 11)
 * No active dialogs - reserved for future features
 */
export type DialogType = never;

export const useGlobalDialogStore = create<{
  openDialog: DialogType | null;
  setOpenDialog: (dialog: DialogType | null) => void;
}>((set) => ({
  openDialog: null,
  setOpenDialog: (dialog) => set({ openDialog: dialog }),
}));

export const openGlobalDialog = (dialog: DialogType) => {
  useGlobalDialogStore.getState().setOpenDialog(dialog);
};

export const closeGlobalDialog = () => {
  useGlobalDialogStore.getState().setOpenDialog(null);
};
