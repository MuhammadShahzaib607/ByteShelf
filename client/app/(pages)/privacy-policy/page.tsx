"use client";

import { Shield } from "lucide-react";
import LegalLayout from "@/components/layout/LegalLayout";
import Link from "next/link";

const paragraph =
  "text-sm text-slate-400 font-body leading-relaxed space-y-3";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      icon={Shield}
      title="Privacy Policy"
      lastUpdated="July 2026"
      intro="ByteShelf is committed to protecting your privacy. This policy explains what data we collect, how we use it, and the rights you hold over it."
      sections={[
        {
          id: "data-collection",
          title: "Data Collection",
          content: (
            <div className={paragraph}>
              <p>
                ByteShelf collects information you provide directly when
                creating an account, listing a warehouse, or making a booking.
                This includes your name, email address, phone number, and
                business details.
              </p>
              <p>
                We also automatically collect certain technical data when you
                use our platform, including IP addresses, browser type, device
                information, and usage patterns through cookies and similar
                technologies.
              </p>
              <p>
                Warehouse location data (address, coordinates, images) is
                collected to facilitate accurate booking and inventory
                management. This data is only shared with authorized users who
                have a legitimate business need.
              </p>
            </div>
          ),
        },
        {
          id: "usage",
          title: "Usage",
          content: (
            <div className={paragraph}>
              <p>
                We use your data to operate, maintain, and improve ByteShelf's
                micro-warehousing platform. This includes processing bookings,
                facilitating communication between merchants and warehouse
                owners, and sending service updates.
              </p>
              <p>
                Your email address may be used to send transactional
                notifications (booking confirmations, payment receipts) and
                occasional product updates. You can opt out of marketing
                communications at any time.
              </p>
              <p>
                Aggregated, anonymized data may be used for analytics and
                platform improvement. We never sell your personal information
                to third parties.
              </p>
            </div>
          ),
        },
        {
          id: "security",
          title: "Security",
          content: (
            <div className={paragraph}>
              <p>
                ByteShelf implements industry-standard security measures to
                protect your data, including SSL/TLS encryption for all data in
                transit, encrypted storage at rest, and regular security
                audits.
              </p>
              <p>
                Access to your account and data is protected by authentication
                tokens and secure session management. We recommend using
                strong, unique passwords and enabling two-factor authentication
                when available.
              </p>
              <p>
                In the event of a data breach, we will notify affected users
                within 72 hours as required by applicable regulations.
              </p>
            </div>
          ),
        },
        {
          id: "storage-rights",
          title: "Storage Rights",
          content: (
            <div className={paragraph}>
              <p>
                You retain full ownership of all data you submit to ByteShelf.
                We act as a data processor, not a data owner.
              </p>
              <p>
                You have the right to access, correct, or delete your personal
                data at any time through your account settings or by contacting
                our support team. Account deletion will remove your personal
                data within 30 days, subject to legal retention requirements.
              </p>
              <p>
                Data associated with completed bookings and transactions may be
                retained for record-keeping and legal compliance purposes for
                the period required by applicable laws.
              </p>
            </div>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          content: (
            <div className={paragraph}>
              <p>
                ByteShelf uses cookies and similar tracking technologies to
                enhance your experience, analyze platform usage, and deliver
                relevant content. You can control cookie preferences through
                your browser settings.
              </p>
              <p>
                Essential cookies are required for the platform to function
                (authentication, session management). Analytics cookies help us
                understand how you use the platform so we can improve it.
              </p>
              <p>
                For more details, please see our{" "}
                <Link
                  href="/cookie-policy"
                  className="text-[#D0F219] underline underline-offset-2 hover:text-lime-300 transition-colors"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
