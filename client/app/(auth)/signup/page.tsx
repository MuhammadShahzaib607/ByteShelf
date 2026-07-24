"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { signupUser, clearError } from "@/redux/slices/authSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import RoleSelector from "@/components/ui/RoleSelector";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, tempEmail } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (tempEmail && !isLoading) {
      router.push("/verify-otp");
    }
  }, [tempEmail, isLoading, router]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Min 8 characters";
    if (!role) newErrors.role = "Select your role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;
    try {
      await dispatch(
        signupUser({ name: name.trim(), email: email.trim().toLowerCase(), password, role })
      ).unwrap();
    } catch {
      // Handled by Redux
    }
  };

  return (
    <div className="w-full max-w-md p-8 md:p-10 bg-white rounded-3xl shadow-xl border border-[#0284C7]/15 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading text-3xl text-[#1E293B] font-bold">
          Create Account
        </h1>
        <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
          Join ByteShelf
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-body">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Full Name"
          placeholder="John Doe"
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          icon={Lock}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <RoleSelector value={role} onChange={setRole} error={errors.role} />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* Footer link */}
      <div className="text-center">
        <p className="text-xs text-[#0F172A]/50 font-body">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#1E293B] font-medium hover:text-[#0284C7] transition-colors underline underline-offset-2"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
