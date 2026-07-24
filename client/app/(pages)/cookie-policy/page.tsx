"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cookie, Shield, BarChart3, Settings } from "lucide-react";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  required?: boolean;
}

function Toggle({ label, description, enabled, onChange, required }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1E293B] font-body">{label}</p>
          {required && (
            <span className="text-[10px] text-[#0F172A]/40 font-body uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-[#0F172A]/50 font-body mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={required}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
          enabled
            ? "bg-[#0284C7]"
            : "bg-[#E2E8F0]"
        } ${required ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={`${label} toggle`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

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
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <Cookie size={20} className="text-[#0284C7]" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1E293B]">
                Cookie Policy
              </h1>
            </div>
            <p className="text-[#0F172A]/50 font-body text-sm">
              Last updated: July 2026
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Introduction */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0]">
              <p className="text-sm text-[#0F172A]/70 font-body leading-relaxed">
                ByteShelf uses cookies and similar technologies to ensure our
                platform works properly, enhance your experience, and help us
                improve. This policy explains what cookies are, how we use them,
                and how you can control them.
              </p>
            </div>

            {/* Toggle Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0]">
              <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-6">
                Your Cookie Preferences
              </h2>

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
                  className="px-6 py-2.5 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10"
                >
                  Save Preferences
                </button>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-emerald-600 font-body font-medium"
                  >
                    Preferences saved!
                  </motion.span>
                )}
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0] space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-[#0284C7]" />
                  <h3 className="font-heading text-base font-semibold text-[#1E293B]">Essential Cookies</h3>
                </div>
                <p className="text-sm text-[#0F172A]/70 font-body leading-relaxed">
                  These cookies are necessary for the website to function and
                  cannot be switched off. They are usually set in response to
                  actions you take, such as logging in, filling in forms, or
                  setting security preferences. You can set your browser to block
                  these cookies, but some parts of the platform may not work.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-[#0284C7]" />
                  <h3 className="font-heading text-base font-semibold text-[#1E293B]">Functional Cookies</h3>
                </div>
                <p className="text-sm text-[#0F172A]/70 font-body leading-relaxed">
                  These cookies enable the platform to provide enhanced
                  functionality and personalization. They may be set by us or by
                  third-party providers whose services we have added to our
                  pages. If you disable these cookies, some or all of these
                  services may not function properly.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={16} className="text-[#0284C7]" />
                  <h3 className="font-heading text-base font-semibold text-[#1E293B]">Analytics Cookies</h3>
                </div>
                <p className="text-sm text-[#0F172A]/70 font-body leading-relaxed">
                  These cookies allow us to count visits and traffic sources so
                  we can measure and improve the performance of our platform.
                  They help us know which pages are the most and least popular
                  and see how visitors move around the platform. All information
                  these cookies collect is aggregated and therefore anonymous.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
