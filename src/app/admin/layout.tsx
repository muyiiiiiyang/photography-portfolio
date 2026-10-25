import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Studio",
    template: "%s · BOK_HAMM Studio",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-[#eee8da] text-ink">{children}</div>;
}
