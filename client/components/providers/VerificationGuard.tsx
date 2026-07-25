"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { Loader2 } from "lucide-react";

// Pages that should be accessible even without verification
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-otp",
  "/verification-pending",
  "/about",
  "/contact",
  "/terms",
  "/privacy-policy",
  "/cookie-policy",
];

export default function VerificationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isCheckingAuth, accessToken } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Skip during auth check or if no token (handled by AuthGuard)
    if (isCheckingAuth || !accessToken) return;

    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p)
    );

    // Always allow admin users and public pages
    if (user?.role === "admin" || isPublic) return;

    // If user has pending or rejected verification, redirect to pending page
    if (
      user?.verificationStatus === "pending" ||
      (user?.verificationStatus === "rejected" && !user?.isVerified)
    ) {
      router.replace("/verification-pending");
    }
  }, [user, isCheckingAuth, accessToken, pathname, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  return <>{children}</>;
}
