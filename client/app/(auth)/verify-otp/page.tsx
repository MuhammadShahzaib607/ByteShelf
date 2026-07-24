"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { verifyOtp, resendOtp, clearError } from "@/redux/slices/authSlice";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";

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
    <div className="w-full max-w-md p-8 md:p-10 bg-white rounded-3xl shadow-xl border border-[#0284C7]/15 flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => router.push("/signup")}
        className="flex items-center gap-1.5 text-xs text-[#0F172A]/50 hover:text-[#0F172A] transition-colors font-body self-start"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
          <Mail size={20} className="text-[#0284C7]" />
        </div>
        <h1 className="font-heading text-2xl text-[#1E293B] font-bold">
          Verify Email
        </h1>
        <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
          Code sent to
        </p>
        <p className="font-heading text-sm font-semibold text-[#1E293B] mt-0.5">
          {tempEmail || ""}
        </p>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2.5">
          <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-700 font-body">{successMsg}</p>
        </div>
      )}

      {/* Error */}
      {displayError && !successMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-body">{displayError}</p>
        </div>
      )}

      {/* OTP */}
      <div>
        <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-3 block text-center">
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
        <p className="text-xs text-[#0F172A]/50 font-body">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resendTimer > 0 || isLoading || !!successMsg}
            className={`font-medium underline underline-offset-2 transition-colors ${
              resendTimer > 0 || isLoading || !!successMsg
                ? "text-[#0F172A]/30 cursor-not-allowed"
                : "text-[#1E293B] hover:text-[#0284C7]"
            }`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </p>
      </div>
    </div>
  );
}
