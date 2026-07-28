"use client";

import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCheckingAuth } = useAppSelector((s) => s.auth);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 size={32} className="animate-spin text-[#38BDF8]" />
      </div>
    );
  }

  return <>{children}</>;
}
