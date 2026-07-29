"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  MessageCircle,
  Search,
  ArrowRight,
  LifeBuoy,
  FileText,
  Shield,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    q: "How do I create an account?",
    a: "Click 'Join Free' on the top right, fill in your details, and verify your email via OTP. Once verified, you can start browsing warehouses or listing your space.",
  },
  {
    q: "How does pricing work?",
    a: "You pay per shelf per month — no long-term lease required. Each warehouse sets its own price, so you can compare and choose what fits your budget.",
  },
  {
    q: "How do I book shelves?",
    a: "Browse available warehouses, select the number of shelves you need, choose your dates, and confirm your booking. The owner will receive a notification and confirm your request.",
  },
  {
    q: "Can I list my warehouse space?",
    a: "Absolutely! Sign up as a Warehouse Owner, create your warehouse profile with photos and pricing, and start earning from unused shelf space.",
  },
  {
    q: "How does KYC verification work?",
    a: "After signing up, you'll need to submit your NIC (front and back), a live photo, and a live video for verification. An admin will review and approve your documents.",
  },
  {
    q: "How do I track my inventory?",
    a: "Use the inbound planning tool to create shipment plans, then scan QR codes on carton arrival to update inventory in real time.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us via the contact form, email us at support@byteshelf.com, or use the in-app chat feature to talk to an admin directly.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use industry-standard encryption for data transmission and storage. Your documents and personal information are kept confidential.",
  },
];

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    desc: "New to ByteShelf? Start here.",
    links: ["Creating an account", "Setting up your profile", "Understanding roles"],
  },
  {
    icon: FileText,
    title: "Bookings & Payments",
    desc: "Managing your bookings and payments.",
    links: ["How to book shelves", "Payment methods", "Cancellation policy"],
  },
  {
    icon: Shield,
    title: "Verification & Security",
    desc: "KYC, document uploads, and safety.",
    links: ["Verification process", "Document requirements", "Privacy & security"],
  },
  {
    icon: LifeBuoy,
    title: "Technical Support",
    desc: "Troubleshooting and technical help.",
    links: ["Common issues", "Browser requirements", "Contact support"],
  },
];

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0284C7]/5 border border-[#0284C7]/10 text-[#0284C7]/70 text-sm font-body mb-6">
              <HelpCircle size={14} />
              Help Center
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#1E293B] tracking-tight">
              How Can We Help You?
            </h1>
            <p className="mt-3 text-[#0F172A]/50 font-body text-base max-w-lg mx-auto">
              Find answers, guides, and support resources.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A]/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body"
              />
            </div>
          </motion.div>
        </section>

        {/* Categories */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center mb-4">
                  <cat.icon size={20} className="text-[#0284C7]" />
                </div>
                <h3 className="font-heading text-base font-semibold text-[#1E293B] mb-1">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#0F172A]/50 font-body mb-3">{cat.desc}</p>
                <ul className="space-y-1.5">
                  {cat.links.map((link) => (
                    <li key={link} className="text-xs text-[#0284C7] font-body font-medium flex items-center gap-1">
                      <ArrowRight size={10} />
                      {link}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0284C7]/5 border border-[#0284C7]/10 text-[#0284C7]/70 text-sm font-body mb-4">
              <MessageCircle size={14} />
              Frequently Asked Questions
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
              Quick Answers
            </h2>
          </motion.div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
                <p className="text-sm text-[#0F172A]/50 font-body">
                  No results found. Try a different search term.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <div key={i} className="border-b border-[#E2E8F0] last:border-0">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-[#1E293B] font-body flex-1">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 w-6 h-6 rounded-full bg-[#F8FAFC] flex items-center justify-center"
                    >
                      <ChevronDown size={14} className="text-[#0284C7]" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaqIndex === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-sm text-[#0F172A]/60 font-body leading-relaxed -mt-2">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Still need help */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-[#E2E8F0]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0284C7]/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-[#0284C7]" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
              Still Need Help?
            </h2>
            <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-md mx-auto">
              Our support team is ready to assist you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-full font-body font-medium text-base hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
              >
                Contact Support
                <ArrowRight size={18} />
              </Link>
              <a
                href="mailto:support@byteshelf.com"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#E2E8F0] text-[#1E293B] rounded-full font-body font-medium text-base hover:bg-[#F8FAFC]/60 transition-all duration-300"
              >
                Email Us
              </a>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
