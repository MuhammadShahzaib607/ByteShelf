"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginUser, clearError } from "@/redux/slices/authSlice";
import { fetchProfile } from "@/redux/slices/profileSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthShell from "@/components/layout/AuthShell";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, tempEmail, accessToken } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (accessToken) router.push("/");
  }, [accessToken, router]);

  useEffect(() => {
    if (error && tempEmail && error.toLowerCase().includes("otp")) {
      router.push("/verify-otp");
    }
  }, [error, tempEmail, router]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;
    try {
      await dispatch(loginUser({ email: email.trim().toLowerCase(), password })).unwrap();
      // Fetch profile to determine role before redirecting
      try {
        const profileResult = await dispatch(fetchProfile()).unwrap();
        if (profileResult?.role === "warehouseOwner") {
          window.location.href = "/dashboard";
          return;
        }
      } catch {
        // Profile fetch failed — fall through to default redirect
      }
      // Default redirect for non-owners or failed profile fetch
      window.location.href = "/";
    } catch {
      // Handled by Redux + useEffect
    }
  };

  return (
    <AuthShell>
      {/* Header */}
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="ByteShelf Logo"
          width={48}
          height={48}
          className="object-contain drop-shadow-[0_0_12px_rgba(204,255,0,0.3)] block mx-auto mb-4"
        />
        <h1 className="font-heading text-3xl text-white font-bold">
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-body">
          Sign in to your account
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 font-body">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          dark
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={Lock}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          dark
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Footer link */}
      <div className="text-center">
        <p className="text-xs text-slate-500 font-body">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#ccff00] font-medium hover:text-lime-300 transition-colors underline underline-offset-2"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
