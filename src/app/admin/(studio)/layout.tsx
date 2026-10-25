import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { isAuthenticated } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
