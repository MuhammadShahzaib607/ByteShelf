"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Camera,
  Video,
  CheckCircle,
  Upload,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { signupUser, clearError } from "@/redux/slices/authSlice";
import { uploadToCloudinary, uploadVideoToCloudinary } from "@/lib/cloudinary";
import Input from "@/components/ui/Input";
import RoleSelector from "@/components/ui/RoleSelector";
import AuthShell from "@/components/layout/AuthShell";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  nicFront?: string;
  nicBack?: string;
  livePhoto?: string;
  liveVideo?: string;
}

type Step = "info" | "nic" | "photo" | "video" | "review";

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "nic", label: "NIC" },
  { key: "photo", label: "Photo" },
  { key: "video", label: "Video" },
];

function StepIndicator({ current, stepKey }: { current: Step; stepKey: Step }) {
  const stepConfig = STEPS.find((s) => s.key === stepKey);
  const idx = STEPS.findIndex((s) => s.key === stepKey);
  const curIdx = STEPS.findIndex((s) => s.key === current);
  const isDone = curIdx > idx;
  const isActive = curIdx === idx;

  return (
    <div className={`flex items-center gap-2 ${isDone ? "text-[#ccff00]" : isActive ? "text-[#ccff00]" : "text-slate-600"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-body transition-all duration-300 ${
        isDone
          ? "bg-[#ccff00] text-black"
          : isActive
          ? "bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.35)]"
          : "bg-slate-800 text-slate-500"
      }`}>
        {isDone ? <CheckCircle size={14} /> : idx + 1}
      </div>
      <span className={`text-xs font-medium font-body ${isActive ? "text-white" : "text-slate-500"}`}>{stepConfig?.label || stepKey}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNUP PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, tempEmail } = useAppSelector((state) => state.auth);

  // ─── Form state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // ─── KYC document state ──────────────────────────────────────────────────
  const [nicFront, setNicFront] = useState<string | null>(null);
  const [nicBack, setNicBack] = useState<string | null>(null);
  const [nicFrontPreview, setNicFrontPreview] = useState<string | null>(null);
  const [nicBackPreview, setNicBackPreview] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [liveVideo, setLiveVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ─── Live capture refs ───────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video" | null>(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (tempEmail && !isLoading) {
      router.push("/verify-otp");
    }
  }, [tempEmail, isLoading, router]);

  // ─── Cleanup camera on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── Start camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: "photo" | "video") => {
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setErrors((prev) => ({ ...prev, livePhoto: "Camera access denied. Please allow camera permissions." }));
    }
  }, []);

  // ─── Stop camera ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraMode(null);
  }, []);

  // ─── Capture photo ───────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setLivePhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  // ─── Record video (5 seconds) ────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    setRecording(true);
    setCountdown(5);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setLiveVideo(url);
      stopCamera();
      setRecording(false);
    };

    recorder.start();

    // Countdown + auto-stop after 5 sec
    let remaining = 5;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }
    }, 1000);
  }, [stopCamera]);

  // ─── Upload KYC file to Cloudinary ───────────────────────────────────────
  const uploadImageFile = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      return result.secure_url;
    } catch {
      throw new Error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  // ─── Upload video to Cloudinary (uses /video/upload endpoint) ────────────
  const uploadVideoFile = useCallback(async (blob: Blob, filename: string): Promise<string> => {
    setUploading(true);
    try {
      const result = await uploadVideoToCloudinary(blob);
      return result.secure_url;
    } catch {
      throw new Error("Video upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  // ─── Blob/DataURL to File ────────────────────────────────────────────────
  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (step === "info") {
      if (!name.trim()) newErrors.name = "Full name is required";
      if (!email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
      if (!password) newErrors.password = "Password is required";
      else if (password.length < 8) newErrors.password = "Min 8 characters";
      if (!role) newErrors.role = "Select your role";
    } else if (step === "nic") {
      if (!nicFront) newErrors.nicFront = "Please upload NIC front image";
      if (!nicBack) newErrors.nicBack = "Please upload NIC back image";
    } else if (step === "photo") {
      if (!livePhoto) newErrors.livePhoto = "Please capture a live photo";
    } else if (step === "video") {
      if (!liveVideo) newErrors.liveVideo = "Please record a 5-second video";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handle file upload for NIC images ───────────────────────────────────
  const handleNICFile = useCallback(async (side: "front" | "back", file: File) => {
    try {
      const url = await uploadImageFile(file);
      if (side === "front") {
        setNicFront(url);
        setNicFrontPreview(URL.createObjectURL(file));
      } else {
        setNicBack(url);
        setNicBackPreview(URL.createObjectURL(file));
      }
      setErrors((prev) => ({ ...prev, [`nic${side === "front" ? "Front" : "Back"}`]: undefined }));
    } catch {
      setErrors((prev) => ({ ...prev, [`nic${side === "front" ? "Front" : "Back"}`]: "Upload failed" }));
    }
  }, [uploadImageFile]);

  // ─── Upload captured media ───────────────────────────────────────────────
  const uploadCapturedPhoto = useCallback(async () => {
    if (!livePhoto) return null;
    try {
      const file = dataUrlToFile(livePhoto, `live-photo-${Date.now()}.jpg`);
      const url = await uploadImageFile(file);
      return url;
    } catch {
      return null;
    }
  }, [livePhoto, uploadImageFile]);

  const uploadCapturedVideo = useCallback(async () => {
    if (!liveVideo) return null;
    try {
      const response = await fetch(liveVideo);
      const blob = await response.blob();
      const url = await uploadVideoFile(blob, `live-video-${Date.now()}.webm`);
      return url;
    } catch {
      return null;
    }
  }, [liveVideo, uploadVideoFile]);

  // ─── Handle final submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    dispatch(clearError());
    if (!validateStep()) return;

    // Upload captured media to Cloudinary
    const photoUrl = await uploadCapturedPhoto();
    const videoUrl = await uploadCapturedVideo();

    if (!photoUrl) {
      setErrors((prev) => ({ ...prev, livePhoto: "Failed to upload live photo" }));
      return;
    }
    if (!videoUrl) {
      setErrors((prev) => ({ ...prev, liveVideo: "Failed to upload live video" }));
      return;
    }

    try {
      await dispatch(signupUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        nicFront: nicFront!,
        nicBack: nicBack!,
        livePhoto: photoUrl,
        liveVideo: videoUrl,
      })).unwrap();
    } catch {
      // Handled by Redux
    }
  };

  // ─── Next/Prev step ──────────────────────────────────────────────────────
  const nextStep = () => {
    if (!validateStep()) return;
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1].key);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  return (
    <AuthShell>
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/25 flex items-center justify-center mx-auto mb-3">
          <Shield size={22} className="text-[#ccff00]" />
        </div>
        <h1 className="font-heading text-3xl text-white font-bold">
          Create Account
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-body">
          Join ByteShelf — KYC verification required
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <StepIndicator current={step} stepKey={s.key} />
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-12 h-px mx-2 transition-colors duration-300 ${
                STEPS.findIndex((x) => x.key === step) > i ? "bg-[#ccff00]/60" : "bg-slate-800"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 font-body">{error}</p>
        </div>
      )}

      {/* ═══ STEP 1: BASIC INFO ═══ */}
      {step === "info" && (
        <div className="flex flex-col gap-5">
          <Input
            label="Full Name"
            placeholder="John Doe"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            dark
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
            dark
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
            dark
          />
          <RoleSelector value={role} onChange={setRole} error={errors.role} />
        </div>
      )}

      {/* ═══ STEP 2: NIC UPLOAD ═══ */}
      {step === "nic" && (
        <div className="flex flex-col gap-5">
          {/* NIC Front */}
          <div>
            <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2 block font-body">
              NIC Front Image
            </label>
            <div
              onClick={() => document.getElementById("nic-front-input")?.click()}
              className={`relative w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                nicFrontPreview
                  ? "border-[#ccff00]/50 bg-[#ccff00]/5"
                  : "border-slate-700 hover:border-[#ccff00]/50 bg-slate-950/40 hover:bg-slate-950/60"
              }`}
            >
              {nicFrontPreview ? (
                <>
                  <img src={nicFrontPreview} alt="NIC Front" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[10px] font-semibold font-body">
                    Uploaded
                  </div>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-[#ccff00]/40 mb-1" />
                  <span className="text-xs text-slate-500 font-body">Tap to upload NIC front</span>
                </>
              )}
              <input
                id="nic-front-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleNICFile("front", file);
                }}
              />
            </div>
            {errors.nicFront && <p className="text-xs text-red-500 mt-1 font-body">{errors.nicFront}</p>}
          </div>

          {/* NIC Back */}
          <div>
            <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2 block font-body">
              NIC Back Image
            </label>
            <div
              onClick={() => document.getElementById("nic-back-input")?.click()}
              className={`relative w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                nicBackPreview
                  ? "border-[#ccff00]/50 bg-[#ccff00]/5"
                  : "border-slate-700 hover:border-[#ccff00]/50 bg-slate-950/40 hover:bg-slate-950/60"
              }`}
            >
              {nicBackPreview ? (
                <>
                  <img src={nicBackPreview} alt="NIC Back" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[10px] font-semibold font-body">Uploaded</div>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-[#ccff00]/40 mb-1" />
                  <span className="text-xs text-slate-500 font-body">Tap to upload NIC back</span>
                </>
              )}
              <input
                id="nic-back-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleNICFile("back", file);
                }}
              />
            </div>
            {errors.nicBack && <p className="text-xs text-red-500 mt-1 font-body">{errors.nicBack}</p>}
          </div>
        </div>
      )}

      {/* ═══ STEP 3: LIVE PHOTO ═══ */}
      {step === "photo" && (
        <div className="flex flex-col gap-5">
          <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase font-body">
            Live Photo (Selfie)
          </label>
          <p className="text-xs text-slate-500 font-body -mt-3">
            Take a real-time selfie for identity verification
          </p>

          {!cameraActive && !livePhoto && (
            <div
              onClick={() => startCamera("photo")}
              className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#ccff00]/50 bg-slate-950/40 flex flex-col items-center justify-center cursor-pointer transition-all"
            >
              <Camera size={32} className="text-[#ccff00]/40 mb-2" />
              <span className="text-xs text-slate-500 font-body">Open Camera</span>
            </div>
          )}

          {cameraActive && cameraMode === "photo" && (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover rounded-xl bg-slate-950" />
              <button
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-[#ccff00] text-black rounded-full text-xs font-semibold font-body shadow-lg hover:bg-[#b8e600] active:scale-95 transition-all"
              >
                <Camera size={16} className="inline mr-1.5" />
                Take Snapshot
              </button>
            </div>
          )}

          {livePhoto && !cameraActive && (
            <div className="relative rounded-2xl overflow-hidden border border-[#ccff00]/40">
              <img src={livePhoto} alt="Captured selfie" className="w-full h-44 object-cover" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[10px] font-semibold font-body">
                Captured
              </div>
              <button
                onClick={() => { setLivePhoto(null); startCamera("photo"); }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white rounded-full text-[10px] font-semibold font-body shadow-sm hover:bg-slate-800 transition-all"
              >
                Retake
              </button>
            </div>
          )}
          {errors.livePhoto && <p className="text-xs text-red-500 font-body">{errors.livePhoto}</p>}
        </div>
      )}

      {/* ═══ STEP 4: VIDEO RECORDING ═══ */}
      {step === "video" && (
        <div className="flex flex-col gap-5">
          <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase font-body">
            5-Second Live Video
          </label>
          <p className="text-xs text-slate-500 font-body -mt-3">
            Record a short video to verify your identity
          </p>

          {!cameraActive && !liveVideo && (
            <div
              onClick={() => startCamera("video")}
              className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#ccff00]/50 bg-slate-950/40 flex flex-col items-center justify-center cursor-pointer transition-all"
            >
              <Video size={32} className="text-[#ccff00]/40 mb-2" />
              <span className="text-xs text-slate-500 font-body">Open Camera</span>
            </div>
          )}

          {cameraActive && cameraMode === "video" && (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover rounded-xl bg-slate-950" />
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-red-500 text-white rounded-full text-xs font-semibold font-body shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                >
                  <Video size={16} className="inline mr-1.5" />
                  Start Recording (5s)
                </button>
              ) : (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-semibold font-body flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Recording {countdown}s
                </div>
              )}
            </div>
          )}

          {liveVideo && !cameraActive && (
            <div className="relative rounded-2xl overflow-hidden border border-[#ccff00]/40 bg-black">
              <video src={liveVideo} controls className="w-full h-44 object-cover" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] text-[10px] font-semibold font-body">
                Recorded
              </div>
              <button
                onClick={() => { setLiveVideo(null); startCamera("video"); }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white rounded-full text-[10px] font-semibold font-body shadow-sm hover:bg-slate-800 transition-all"
              >
                Re-record
              </button>
            </div>
          )}
          {errors.liveVideo && <p className="text-xs text-red-500 font-body">{errors.liveVideo}</p>}
        </div>
      )}

      {/* ═══ NAVIGATION BUTTONS ═══ */}
      <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
        {step !== "info" ? (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div /> /* Placeholder to keep right button aligned */
        )}
        <button
          type="button"
          onClick={nextStep}
          disabled={isLoading || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black bg-[#ccff00] hover:bg-[#b8e600] text-sm font-semibold shadow-md shadow-[#ccff00]/10 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading || uploading ? (
            <span>Processing...</span>
          ) : step === STEPS[STEPS.length - 1].key ? (
            <><CheckCircle className="w-4 h-4" /> <span>Submit & Verify</span></>
          ) : (
            <><span>{step === "info" ? "Create Account" : "Continue"}</span></>
          )}
        </button>
      </div>

      {/* Footer link */}
      <div className="text-center">
        <p className="text-xs text-slate-500 font-body">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#ccff00] font-medium hover:text-lime-300 transition-colors underline underline-offset-2"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
