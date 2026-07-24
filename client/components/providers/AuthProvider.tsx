"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import {
  setAuthFromStorage,
  setCheckingAuth,
} from "@/redux/slices/authSlice";
import { fetchProfile } from "@/redux/slices/profileSlice";
import { UNAUTHORIZED_EVENT } from "@/lib/axios";

// ─── Token helpers ──────────────────────────────────────────────────────────────

function getStoredTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  // Priority 1: Check byteshelf_access_token (legacy / external source)
  const legacyToken = localStorage.getItem("byteshelf_access_token");
  if (legacyToken) {
    return { accessToken: legacyToken, refreshToken: null };
  }

  // Priority 2: Check auth_tokens (standard app storage)
  const stored = localStorage.getItem("auth_tokens");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.accessToken) {
        return {
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken || null,
        };
      }
    } catch {
      // Malformed — ignore
    }
  }

  return { accessToken: null, refreshToken: null };
}

// ─── AuthProvider ───────────────────────────────────────────────────────────────

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // ─── Listen for 401 soft-redirect events ─────────────────────────────────
  const handleUnauthorized = useCallback(() => {
    // Tokens already cleared by the axios interceptor
    dispatch(setCheckingAuth(false));
    const path = window.location.pathname;
    if (path !== "/login" && path !== "/signup") {
      router.push("/login");
    }
  }, [dispatch, router]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [handleUnauthorized]);

  // ─── Hydrate auth from stored tokens on mount ────────────────────────────
  useEffect(() => {
    const tokens = getStoredTokens();

    if (tokens.accessToken) {
      // Hydrate Redux with tokens from storage
      dispatch(
        setAuthFromStorage({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || "",
        })
      );

      // Fetch user profile (this will sync auth.user via extraReducer in authSlice)
      dispatch(fetchProfile());
    } else {
      // No token found — mark auth check complete
      dispatch(setCheckingAuth(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally run only once on mount

  return <>{children}</>;
}
