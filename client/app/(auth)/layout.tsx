"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { accessToken, isCheckingAuth } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    if (isCheckingAuth) return;
    if (accessToken) {
      router.replace("/");
    }
  }, [accessToken, isCheckingAuth, router]);

  // ─── Show loading spinner while checking auth ────────────────────────────
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#05080e]">
        <Loader2 size={32} className="animate-spin text-[#ccff00]" />
      </div>
    );
  }

  // Full-bleed dark shell — the 50/50 split-screen layout is rendered by the
  // page itself via the shared AuthShell component.
  return (
    <div className="min-h-screen bg-[#05080e] relative overflow-hidden">
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
