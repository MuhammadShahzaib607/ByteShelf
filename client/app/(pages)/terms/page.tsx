"use client";

import { motion } from "framer-motion";
import { FileText, Scale, AlertTriangle } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content:
      "These Terms & Conditions govern your use of ByteShelf's micro-warehousing platform. By creating an account, listing warehouse space, or booking shelves, you agree to be bound by these terms. If you do not agree, please do not use our services.",
  },
  {
    title: "2. Merchant Obligations",
    content:
      "Merchants agree to provide accurate information when creating accounts and making bookings. All inventory stored through ByteShelf must comply with applicable laws and regulations. Merchants are responsible for the safety and legality of their stored goods. Prohibited items include hazardous materials, perishables requiring specialized storage, and any goods that violate local or national laws.",
  },
  {
    title: "3. Warehouse Owner Guarantees",
    content:
      "Warehouse owners listing on ByteShelf guarantee that their spaces are accurately represented, meet safety standards, and are available for the durations listed. Owners must maintain clear access to booked shelves and provide accurate inventory tracking. Any changes to available shelf counts or pricing must be updated in real-time on the platform.",
  },
  {
    title: "4. Shelf Booking & Cancellation",
    content:
      "Bookings are confirmed upon successful payment processing. Merchants may cancel bookings up to 48 hours before the start date for a full refund. Cancellations within 48 hours are subject to a 25% processing fee. Warehouse owners may cancel bookings only in exceptional circumstances with at least 72 hours notice, and must provide alternative space or a full refund.",
  },
  {
    title: "5. Payment Terms",
    content:
      "All payments are processed through ByteShelf's secure payment system. Merchants are billed monthly based on their booked shelf count and duration. Payment is due within 7 days of the invoice date. Late payments may result in temporary suspension of access to booked shelves.",
  },
  {
    title: "6. Liability & Insurance",
    content:
      "ByteShelf acts as a marketplace connecting merchants with warehouse owners. We are not liable for loss, damage, or theft of stored goods. Warehouse owners are encouraged to maintain adequate insurance coverage. Merchants should ensure their goods are appropriately insured during storage.",
  },
  {
    title: "7. Dispute Resolution",
    content:
      "In the event of a dispute between a merchant and warehouse owner, ByteShelf offers a mediation service to facilitate resolution. If mediation fails, disputes shall be resolved through binding arbitration in accordance with the laws of Pakistan. Both parties agree to resolve disputes in good faith before pursuing legal action.",
  },
  {
    title: "8. Account Termination",
    content:
      "ByteShelf reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose a risk to other users. Users may terminate their accounts at any time by contacting support. Upon termination, all active bookings must be settled, and stored goods must be removed within 14 days.",
  },
  {
    title: "9. Modifications",
    content:
      "These terms may be updated from time to time. Users will be notified of material changes via email and platform notification. Continued use of the platform after changes constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <FileText size={20} className="text-[#0284C7]" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1E293B]">
                Terms & Conditions
              </h1>
            </div>
            <p className="text-[#0F172A]/50 font-body text-sm mb-2">
              Last updated: July 2026
            </p>
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body leading-relaxed">
                These terms constitute a legally binding agreement between you
                and ByteShelf. Please read them carefully before using our
                platform.
              </p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-[#E2E8F0] space-y-10"
          >
            {sections.map((section, i) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center shrink-0 mt-0.5">
                    <Scale size={14} className="text-[#0284C7]" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[#1E293B] mb-3">
                      {section.title}
                    </h2>
                    <p className="text-sm text-[#0F172A]/70 font-body leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}
          </motion.div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-[#0F172A]/40 font-body">
              For questions about these terms, please contact{" "}
              <a href="mailto:legal@byteshelf.com" className="text-[#0284C7] underline underline-offset-2">
                legal@byteshelf.com
              </a>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
