"use client";

import { useEffect, useRef, useState } from "react";
// Type-only import: erased at compile time, so html5-qrcode is never pulled
// into the server/prerender bundle. The runtime module is loaded via dynamic
// import() inside the effect below — this makes the component 100% SSR-safe
// (no "window is not defined" crashes during `next build`).
import type { Html5Qrcode } from "html5-qrcode";

export interface CartonQRScannerProps {
  /**
   * Called exactly once with the trimmed decoded text after a successful
   * scan. A per-scan lock + automatic pause guarantee a single QR code can
   * never trigger duplicate API calls.
   */
  onScanSuccess: (decodedText: string) => void;
  /** Called for per-frame decode errors — usually safe to ignore. */
  onScanError?: (errorMessage: string) => void;
  /**
   * Called when the camera cannot be started (permission denied, no camera,
   * insecure/HTTP context, device in use). If you provide this, render your
   * own error UI; otherwise the component shows an inline warning.
   */
  onCameraError?: (errorMessage: string) => void;
  /**
   * Called as soon as the scanner element is mounted and the video feed is
   * about to attach — reveal your camera container here (html5-qrcode needs
   * the mount element to be visible before start()).
   */
  onCameraReady?: () => void;
  /**
   * Pause (false) / resume (true) decoding. Set false while you are
   * processing a scan result — the component pauses the camera and ignores
   * further decodes, then resumes + clears its lock when set back to true.
   */
  active?: boolean;
  /** DOM id for the camera mount element (must be unique on the page). */
  elementId?: string;
  /** Classes for the camera mount element — give it a non-zero size. */
  className?: string;
  /** Decode frames per second. */
  fps?: number;
}

function friendlyCameraError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/NotAllowed|Permission|denied/i.test(message)) {
    return "Camera permission denied. Allow camera access in your browser settings, then retry.";
  }
  if (/NotFound|no camera/i.test(message)) {
    return "No camera was found on this device. Use the manual input below instead.";
  }
  if (/NotReadable|in use|Insecure|NotSupported|Unavailable/i.test(message)) {
    return "Could not start the camera (it may be in use by another app or require HTTPS). Use the manual input below.";
  }
  return `Could not start the camera scanner (${message}). Use the manual input below instead.`;
}

export default function CartonQRScanner({
  onScanSuccess,
  onScanError,
  onCameraError,
  onCameraReady,
  active = true,
  elementId = "carton-reader-element",
  className = "",
  fps = 15,
}: CartonQRScannerProps) {
  const [fatalError, setFatalError] = useState<string | null>(null);

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);
  const activeRef = useRef(active);
  const callbacksRef = useRef({ onScanSuccess, onScanError, onCameraError, onCameraReady });

  // Keep refs fresh without re-running the camera effect. (Ref writes are
  // done in an effect, not during render, per the React hooks lint rules.)
  useEffect(() => {
    callbacksRef.current = { onScanSuccess, onScanError, onCameraError, onCameraReady };
    activeRef.current = active;
  });

  // ─── Camera lifecycle (client-only) ─────────────────────────────────────
  useEffect(() => {
    // SSR / prerender guard — never touches the DOM or camera during build.
    if (typeof window === "undefined") return;

    let disposed = false;

    async function start() {
      // HTTPS + mediaDevices guard: `getUserMedia` is undefined in insecure
      // (non-HTTPS, non-localhost) contexts.
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg =
          window.isSecureContext === false
            ? "Camera access requires a secure (HTTPS) connection. Please open this page over HTTPS."
            : "Camera access is not supported by this browser.";
        setFatalError(msg);
        callbacksRef.current.onCameraError?.(msg);
        return;
      }

      try {
        // Dynamic import keeps html5-qrcode entirely out of the server bundle.
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (disposed) return;

        // Tear down any previous instance bound to the same element.
        if (html5QrRef.current) {
          try {
            await html5QrRef.current.stop();
          } catch {}
          try {
            await html5QrRef.current.clear();
          } catch {}
        }

        // formatsToSupport + experimentalFeatures live on the constructor
        // config (Html5QrcodeFullConfig), not on the start() scan config.
        const html5Qr = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128, // common carton barcode
          ],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        html5QrRef.current = html5Qr;
        lockRef.current = false;

        // Reveal the container before attaching the video — html5-qrcode
        // requires the mount element to be visible when start() runs.
        callbacksRef.current.onCameraReady?.();

        await html5Qr.start(
          // Force the rear/back camera so workers can scan carton QR labels.
          { facingMode: "environment" },
          {
            fps,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // A single QR code is decoded every frame — fire once, then pause
            // so the parent's API call can never double-fire on one scan.
            if (lockRef.current) return;
            const code = decodedText.trim();
            if (!code) return;
            lockRef.current = true;
            try {
              html5QrRef.current?.pause(true);
            } catch {}
            callbacksRef.current.onScanSuccess(code);
          },
          (error: string) => {
            // Per-frame errors are expected — surface but never treat as fatal.
            callbacksRef.current.onScanError?.(error);
          }
        );

        if (disposed) {
          try {
            await html5Qr.stop();
          } catch {}
          try {
            await html5Qr.clear();
          } catch {}
          return;
        }

        // If `active` was already false while the camera was starting.
        if (!activeRef.current) {
          try {
            html5Qr.pause(true);
          } catch {}
        }
      } catch (err) {
        if (disposed) return;
        const msg = friendlyCameraError(err);
        setFatalError(msg);
        callbacksRef.current.onCameraError?.(msg);
      }
    }

    start();

    // CRITICAL: release the camera track + clear the UI on unmount so the
    // camera light turns off and the element never leaks across navigation.
    // (Promise.resolve() normalizes the possibly-void/possibly-promise result
    // so a rejection can never become an unhandled error.)
    return () => {
      disposed = true;
      const inst = html5QrRef.current;
      html5QrRef.current = null;
      if (inst) {
        try {
          Promise.resolve(inst.stop()).catch(() => {});
        } catch {}
        try {
          Promise.resolve(inst.clear()).catch(() => {});
        } catch {}
      }
    };
  }, [elementId, fps]);

  // ─── Pause / resume driven by the `active` prop ─────────────────────────
  useEffect(() => {
    const inst = html5QrRef.current;
    if (!inst) return;
    if (active) {
      lockRef.current = false;
      try {
        inst.resume();
      } catch {}
    } else {
      try {
        inst.pause(true);
      } catch {}
    }
  }, [active]);

  // Inline fallback warning (only when the parent doesn't render its own).
  if (fatalError && !onCameraError) {
    return (
      <div className="w-full p-4 rounded-2xl bg-red-100 text-red-700 text-sm text-center">
        ⚠️ {fatalError}
      </div>
    );
  }

  return (
    <div
      id={elementId}
      className={className}
      aria-label="Carton QR code scanner camera view"
    />
  );
}
