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
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between items-center py-8 px-4 bg-[#F8FAFC]">
      <main className="flex-1 flex items-center justify-center w-full pt-16">
        {children}
      </main>
    </div>
  );
}
