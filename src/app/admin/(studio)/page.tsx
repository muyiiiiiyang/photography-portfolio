import type { Metadata } from "next";

import { Studio } from "../_components/Studio";
import { getAdminSnapshot } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "工作台",
};

export default async function StudioPage() {
  const snapshot = await getAdminSnapshot();
  return <Studio initial={snapshot} />;
}
