import type { PageParams } from "@/types/next";
import { SettingsDetailsForm } from "./SettingsDetailsForm";

export default async function RoutePage(props: PageParams<{}>) {
  return (
    <SettingsDetailsForm
      defaultValues={{
        name: "Jean",
        email: "jean@gmail.com",
      }}
    />
  );
}
