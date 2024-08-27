"use client";

import type { ReactElement, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Loader } from "../../components/ui/loader";

export type AlertDialogRenderedDialogProps = {
  title?: string;
  description?: ReactNode;
  action?:
    | {
        label: string;
        onClick: () => void | Promise<void>;
      }
    | ReactElement;
  cancel?: {
    label: string;
    onClick: () => void | Promise<void>;
  };

  loading?: boolean;
  children?: ReactNode;
};

export const AlertDialogRenderedDialog = ({
  title,
  description,
  loading,
  action,
  cancel,
  children,
}: AlertDialogRenderedDialogProps) => {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        {children ? (
          children
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{title ?? ""}</AlertDialogTitle>
              {typeof description === "string" ? (
                <AlertDialogDescription>{description}</AlertDialogDescription>
              ) : (
                description
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading} onClick={cancel?.onClick}>
                {cancel?.label ?? "Cancel"}
              </AlertDialogCancel>

              {action && "label" in action ? (
                <AlertDialogAction disabled={loading} onClick={action.onClick}>
                  {loading ? <Loader /> : action.label}
                </AlertDialogAction>
              ) : (
                action
              )}
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
