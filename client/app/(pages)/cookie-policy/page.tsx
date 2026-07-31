"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cookie, Shield, BarChart3, Settings } from "lucide-react";
import LegalLayout from "@/components/layout/LegalLayout";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  required?: boolean;
}

function Toggle({ label, description, enabled, onChange, required }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-lime-500/15">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white font-body">{label}</p>
          {required && (
            <span className="text-[10px] text-lime-200/70 font-body uppercase tracking-wider bg-[#D0F219]/10 px-2 py-0.5 rounded-full border border-lime-500/25">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-body mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={required}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
          enabled ? "bg-[#D0F219]" : "bg-white/[0.08]"
        } ${required ? "opacity-60 cursor-not-allowed" : ""}`}
        aria-label={`${label} toggle`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#12140E] shadow-sm transition-all duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const paragraph =
  "text-sm text-slate-400 font-body leading-relaxed space-y-3";

export default function CookiePolicyPage() {
  const [essential, setEssential] = useState(true);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <LegalLayout
      icon={Cookie}
      title="Cookie Policy"
      lastUpdated="July 2026"
      intro="ByteShelf uses cookies and similar technologies to ensure our platform works properly, enhance your experience, and help us improve. This policy explains what cookies are, how we use them, and how you can control them."
      sections={[
        {
          id: "preferences",
          title: "Your Cookie Preferences",
          content: (
            <div>
              <div className="space-y-3">
                <Toggle
                  label="Essential Cookies"
                  description="Required for the platform to function. Includes authentication tokens, session management, and security features."
                  enabled={essential}
                  onChange={() => {}}
                  required
                />
                <Toggle
                  label="Functional Cookies"
                  description="Remember your preferences and settings to provide a personalized experience across visits."
                  enabled={functional}
                  onChange={() => setFunctional(!functional)}
                />
                <Toggle
                  label="Analytics Cookies"
                  description="Help us understand how you use ByteShelf so we can improve the platform. Includes page views, feature usage, and session duration."
                  enabled={analytics}
                  onChange={() => setAnalytics(!analytics)}
                />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-medium hover:bg-lime-300 hover:shadow-[0_0_25px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
                >
                  Save Preferences
                </button>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-emerald-400 font-body font-medium"
                  >
                    Preferences saved!
                  </motion.span>
                )}
              </div>
            </div>
          ),
        },
        {
          id: "essential",
          title: "Essential Cookies",
          content: (
            <div className={paragraph}>
              <p>
                These cookies are necessary for the website to function and
                cannot be switched off. They are usually set in response to
                actions you take, such as logging in, filling in forms, or
                setting security preferences. You can set your browser to block
                these cookies, but some parts of the platform may not work.
              </p>
              <p className="flex items-center gap-2 text-[#D0F219] text-xs font-semibold uppercase tracking-wider">
                <Shield size={14} /> Always active
              </p>
            </div>
          ),
        },
        {
          id: "functional",
          title: "Functional Cookies",
          content: (
            <div className={paragraph}>
              <p>
                These cookies enable the platform to provide enhanced
                functionality and personalization. They may be set by us or by
                third-party providers whose services we have added to our
                pages. If you disable these cookies, some or all of these
                services may not function properly.
              </p>
              <p className="flex items-center gap-2 text-[#D0F219] text-xs font-semibold uppercase tracking-wider">
                <Settings size={14} /> Personalized experience
              </p>
            </div>
          ),
        },
        {
          id: "analytics",
          title: "Analytics Cookies",
          content: (
            <div className={paragraph}>
              <p>
                These cookies allow us to count visits and traffic sources so
                we can measure and improve the performance of our platform.
                They help us know which pages are the most and least popular
                and see how visitors move around the platform. All information
                these cookies collect is aggregated and therefore anonymous.
              </p>
              <p className="flex items-center gap-2 text-[#D0F219] text-xs font-semibold uppercase tracking-wider">
                <BarChart3 size={14} /> Aggregated &amp; anonymous
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
