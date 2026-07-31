"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { verifyOtp, resendOtp, clearError } from "@/redux/slices/authSlice";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";
import AuthShell from "@/components/layout/AuthShell";

export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, tempEmail } = useAppSelector((state) => state.auth);

  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!tempEmail) router.push("/signup");
  }, [tempEmail, router]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async () => {
    setLocalError(null);
    dispatch(clearError());
    if (!otp || otp.length < 6) {
      setLocalError("Enter the complete 6-digit code");
      return;
    }
    try {
      const result = await dispatch(verifyOtp({ email: tempEmail!, otp })).unwrap();
      setSuccessMsg(result.message || "Verified!");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      // Handled by Redux
    }
  };

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !tempEmail) return;
    setLocalError(null);
    dispatch(clearError());
    try {
      await dispatch(resendOtp({ email: tempEmail })).unwrap();
      setResendTimer(60);
    } catch {
      // Handled by Redux
    }
  }, [resendTimer, tempEmail, dispatch]);

  const displayError = localError || error;

  return (
    <AuthShell>
      {/* Back */}
      <button
        onClick={() => router.push("/signup")}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors font-body self-start"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/25 flex items-center justify-center mx-auto mb-3">
          <Mail size={20} className="text-[#ccff00]" />
        </div>
        <h1 className="font-heading text-2xl text-white font-bold">
          Verify Email
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-body">
          Code sent to
        </p>
        <p className="font-heading text-sm font-semibold text-white mt-0.5">
          {tempEmail || ""}
        </p>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
          <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 font-body">{successMsg}</p>
        </div>
      )}

      {/* Error */}
      {displayError && !successMsg && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 font-body">{displayError}</p>
        </div>
      )}

      {/* OTP */}
      <div>
        <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-3 block text-center font-body">
          Verification Code
        </label>
        <OtpInput
          length={6}
          value={otp}
          onChange={setOtp}
          error={displayError || undefined}
          disabled={isLoading || !!successMsg}
        />
      </div>

      <Button
        onClick={handleVerify}
        fullWidth
        size="lg"
        isLoading={isLoading}
        disabled={otp.length < 6 || !!successMsg}
      >
        {isLoading ? "Verifying..." : "Verify Account"}
      </Button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-xs text-slate-500 font-body">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resendTimer > 0 || isLoading || !!successMsg}
            className={`font-medium underline underline-offset-2 transition-colors ${
              resendTimer > 0 || isLoading || !!successMsg
                ? "text-slate-600 cursor-not-allowed"
                : "text-[#ccff00] hover:text-lime-300"
            }`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
