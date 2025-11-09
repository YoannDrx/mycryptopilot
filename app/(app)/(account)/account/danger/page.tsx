import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { Shield } from "lucide-react";
import { DeleteAccountCard } from "./delete-account-card";

export default function DangerZonePage() {
  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-destructive/10 text-destructive flex items-center justify-center rounded-lg p-2">
          <Shield className="size-5" />
        </div>
        <div>
          <LayoutTitle>Danger Zone</LayoutTitle>
          <LayoutDescription>
            Manage critical account actions and permanent deletions
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <DeleteAccountCard />
      </LayoutContent>
    </>
  );
}
