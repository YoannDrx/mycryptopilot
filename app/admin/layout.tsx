import type { LayoutParams } from "@/types/next";
import { AdminNavigation } from "./_navigation/admin-navigation";

export default async function AdminLayout(props: LayoutParams) {
  return <AdminNavigation>{props.children}</AdminNavigation>;
}
