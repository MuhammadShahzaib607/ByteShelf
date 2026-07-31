"use client";

import { FileText, AlertTriangle } from "lucide-react";
import LegalLayout from "@/components/layout/LegalLayout";

const termsSections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content:
      "These Terms & Conditions govern your use of ByteShelf's micro-warehousing platform. By creating an account, listing warehouse space, or booking shelves, you agree to be bound by these terms. If you do not agree, please do not use our services.",
  },
  {
    id: "merchant-obligations",
    title: "2. Merchant Obligations",
    content:
      "Merchants agree to provide accurate information when creating accounts and making bookings. All inventory stored through ByteShelf must comply with applicable laws and regulations. Merchants are responsible for the safety and legality of their stored goods. Prohibited items include hazardous materials, perishables requiring specialized storage, and any goods that violate local or national laws.",
  },
  {
    id: "owner-guarantees",
    title: "3. Warehouse Owner Guarantees",
    content:
      "Warehouse owners listing on ByteShelf guarantee that their spaces are accurately represented, meet safety standards, and are available for the durations listed. Owners must maintain clear access to booked shelves and provide accurate inventory tracking. Any changes to available shelf counts or pricing must be updated in real-time on the platform.",
  },
  {
    id: "booking-cancellation",
    title: "4. Shelf Booking & Cancellation",
    content:
      "Bookings are confirmed upon successful payment processing. Merchants may cancel bookings up to 48 hours before the start date for a full refund. Cancellations within 48 hours are subject to a 25% processing fee. Warehouse owners may cancel bookings only in exceptional circumstances with at least 72 hours notice, and must provide alternative space or a full refund.",
  },
  {
    id: "payment-terms",
    title: "5. Payment Terms",
    content:
      "All payments are processed through ByteShelf's secure payment system. Merchants are billed monthly based on their booked shelf count and duration. Payment is due within 7 days of the invoice date. Late payments may result in temporary suspension of access to booked shelves.",
  },
  {
    id: "liability",
    title: "6. Liability & Insurance",
    content:
      "ByteShelf acts as a marketplace connecting merchants with warehouse owners. We are not liable for loss, damage, or theft of stored goods. Warehouse owners are encouraged to maintain adequate insurance coverage. Merchants should ensure their goods are appropriately insured during storage.",
  },
  {
    id: "dispute-resolution",
    title: "7. Dispute Resolution",
    content:
      "In the event of a dispute between a merchant and warehouse owner, ByteShelf offers a mediation service to facilitate resolution. If mediation fails, disputes shall be resolved through binding arbitration in accordance with the laws of Pakistan. Both parties agree to resolve disputes in good faith before pursuing legal action.",
  },
  {
    id: "account-termination",
    title: "8. Account Termination",
    content:
      "ByteShelf reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose a risk to other users. Users may terminate their accounts at any time by contacting support. Upon termination, all active bookings must be settled, and stored goods must be removed within 14 days.",
  },
  {
    id: "modifications",
    title: "9. Modifications",
    content:
      "These terms may be updated from time to time. Users will be notified of material changes via email and platform notification. Continued use of the platform after changes constitutes acceptance of the updated terms.",
  },
];

const paragraph = "text-sm text-slate-400 font-body leading-relaxed space-y-3";

export default function TermsPage() {
  return (
    <LegalLayout
      icon={FileText}
      title="Terms & Conditions"
      lastUpdated="July 2026"
      sections={termsSections.map((s) => ({
        id: s.id,
        title: s.title,
        content: (
          <div className={paragraph}>
            <p>{s.content}</p>
          </div>
        ),
      }))}
      footer={
        <div className="inline-flex items-start gap-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 max-w-lg text-left">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 font-body leading-relaxed">
            These terms constitute a legally binding agreement between you and
            ByteShelf. Please read them carefully before using our platform.
          </p>
        </div>
      }
    />
  );
}
