"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";

const sections = [
  { id: "data-collection", label: "Data Collection" },
  { id: "usage", label: "Usage" },
  { id: "security", label: "Security" },
  { id: "storage-rights", label: "Storage Rights" },
  { id: "cookies", label: "Cookies" },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("data-collection");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <Shield size={20} className="text-[#0284C7]" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1E293B]">
                Privacy Policy
              </h1>
            </div>
            <p className="text-[#0F172A]/50 font-body text-sm">
              Last updated: July 2026
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Sidebar Navigation */}
            <motion.nav
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:w-56 shrink-0"
            >
              <div className="lg:sticky lg:top-32 space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-body transition-all duration-200 ${
                      activeSection === s.id
                        ? "bg-[#F8FAFC] text-[#0284C7] font-semibold"
                        : "text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.nav>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 min-w-0"
            >
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-[#E2E8F0] space-y-10">
                {/* Data Collection */}
                <section id="data-collection">
                  <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-4">
                    Data Collection
                  </h2>
                  <div className="space-y-3 text-sm text-[#0F172A]/70 font-body leading-relaxed">
                    <p>
                      ByteShelf collects information you provide directly when
                      creating an account, listing a warehouse, or making a
                      booking. This includes your name, email address, phone
                      number, and business details.
                    </p>
                    <p>
                      We also automatically collect certain technical data when
                      you use our platform, including IP addresses, browser
                      type, device information, and usage patterns through
                      cookies and similar technologies.
                    </p>
                    <p>
                      Warehouse location data (address, coordinates, images) is
                      collected to facilitate accurate booking and inventory
                      management. This data is only shared with authorized users
                      who have a legitimate business need.
                    </p>
                  </div>
                </section>

                {/* Usage */}
                <section id="usage">
                  <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-4">
                    Usage
                  </h2>
                  <div className="space-y-3 text-sm text-[#0F172A]/70 font-body leading-relaxed">
                    <p>
                      We use your data to operate, maintain, and improve
                      ByteShelf&apos;s micro-warehousing platform. This includes
                      processing bookings, facilitating communication between
                      merchants and warehouse owners, and sending service
                      updates.
                    </p>
                    <p>
                      Your email address may be used to send transactional
                      notifications (booking confirmations, payment receipts)
                      and occasional product updates. You can opt out of
                      marketing communications at any time.
                    </p>
                    <p>
                      Aggregated, anonymized data may be used for analytics and
                      platform improvement. We never sell your personal
                      information to third parties.
                    </p>
                  </div>
                </section>

                {/* Security */}
                <section id="security">
                  <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-4">
                    Security
                  </h2>
                  <div className="space-y-3 text-sm text-[#0F172A]/70 font-body leading-relaxed">
                    <p>
                      ByteShelf implements industry-standard security measures
                      to protect your data, including SSL/TLS encryption for all
                      data in transit, encrypted storage at rest, and regular
                      security audits.
                    </p>
                    <p>
                      Access to your account and data is protected by
                      authentication tokens and secure session management. We
                      recommend using strong, unique passwords and enabling
                      two-factor authentication when available.
                    </p>
                    <p>
                      In the event of a data breach, we will notify affected
                      users within 72 hours as required by applicable
                      regulations.
                    </p>
                  </div>
                </section>

                {/* Storage Rights */}
                <section id="storage-rights">
                  <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-4">
                    Storage Rights
                  </h2>
                  <div className="space-y-3 text-sm text-[#0F172A]/70 font-body leading-relaxed">
                    <p>
                      You retain full ownership of all data you submit to
                      ByteShelf. We act as a data processor, not a data owner.
                    </p>
                    <p>
                      You have the right to access, correct, or delete your
                      personal data at any time through your account settings or
                      by contacting our support team. Account deletion will
                      remove your personal data within 30 days, subject to legal
                      retention requirements.
                    </p>
                    <p>
                      Data associated with completed bookings and transactions
                      may be retained for record-keeping and legal compliance
                      purposes for the period required by applicable laws.
                    </p>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies">
                  <h2 className="font-heading text-xl font-bold text-[#1E293B] mb-4">
                    Cookies
                  </h2>
                  <div className="space-y-3 text-sm text-[#0F172A]/70 font-body leading-relaxed">
                    <p>
                      ByteShelf uses cookies and similar tracking technologies
                      to enhance your experience, analyze platform usage, and
                      deliver relevant content. You can control cookie
                      preferences through your browser settings.
                    </p>
                    <p>
                      Essential cookies are required for the platform to
                      function (authentication, session management). Analytics
                      cookies help us understand how you use the platform so we
                      can improve it.
                    </p>
                    <p>
                      For more details, please see our{" "}
                      <a
                        href="/cookie-policy"
                        className="text-[#0284C7] underline underline-offset-2 hover:text-[#0284C7]/80 transition-colors"
                      >
                        Cookie Policy
                      </a>
                      .
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
