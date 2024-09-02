"use client";

import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { create } from "zustand";
import type { AlertDialogRenderedDialogProps } from "./AlertDialogRenderedDialog";

 type AlertDialogType = AlertDialogRenderedDialogProps & {
  id: string;
};

type AlertDialogStore = {
  dialogs: AlertDialogType[];
  addDialog: (dialog: AlertDialogRenderedDialogProps) => string;
  removeDialog: (dialogId: string) => void;
};

export const useAlertDialogStore = create<AlertDialogStore>((set, get) => ({
  dialogs: [],
  addDialog: (dialog) => {
    const id = Math.random().toString(36).slice(2, 9);
    const { removeDialog } = get();

    const newDialog: AlertDialogType = {
      ...dialog,
      cancel: {
        label: dialog.cancel?.label ?? "Cancel",
        onClick: () => {
          if (dialog.cancel && "onClick" in dialog.cancel) {
            dialog.cancel?.onClick();
            return;
          }
          removeDialog(id);
        },
      },
      action:
        dialog.action && "onClick" in dialog.action
          ? {
              label: dialog.action?.label ?? "",
              onClick: () => {
                if (dialog.action && "onClick" in dialog.action === false) {
                  logger.error("Invalid dialog action");
                  removeDialog(id);
                  return;
                }

                // check if it's a promise
                const onClickReturn = dialog.action?.onClick();

                if (onClickReturn instanceof Promise) {
                  set((state) => {
                    const dialog = state.dialogs.find(
                      (dialog) => dialog.id === id,
                    );

                    if (dialog) {
                      dialog.loading = true;
                    }

                    return { dialogs: [...state.dialogs] };
                  });

                  onClickReturn
                    .then(() => {
                      removeDialog(id);
                    })
                    .catch((e) => {
                      toast.error("Some error occurred", {
                        description: e.message,
                      });
                    });
                } else {
                  removeDialog(id);
                }
              },
            }
          : dialog.action,
      loading: false,
      id,
    };

    set((state) => ({ dialogs: [...state.dialogs, newDialog] }));

    return id;
  },
  removeDialog: (dialogId) =>
    set((state) => ({
      dialogs: state.dialogs.filter((dialog) => dialog.id !== dialogId),
    })),
}));

export const alertDialog = {
  add: (dialog: AlertDialogRenderedDialogProps) =>
    useAlertDialogStore.getState().addDialog(dialog),
  remove: (dialogId: string) =>
    useAlertDialogStore.getState().removeDialog(dialogId),
};
