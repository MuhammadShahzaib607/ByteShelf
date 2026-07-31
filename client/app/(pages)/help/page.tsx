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

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* ─── Search Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#D0F219]/[0.07] blur-3xl" />
            <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-badge-lime inline-flex mx-auto mb-6">
                <HelpCircle size={12} />
                Help Center
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">
                How Can We{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Help You?
                </span>
              </h1>
              <p className="mt-3 text-slate-300 font-body text-base max-w-lg mx-auto">
                Find answers, guides, and support resources.
              </p>

              {/* Search */}
              <div className="mt-8 max-w-xl mx-auto relative">
                <Search
                  size={18}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D0F219]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for answers..."
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-lime-500/25 rounded-full text-white placeholder:text-slate-500 backdrop-blur-md focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] focus:shadow-[0_0_30px_rgba(208,242,25,0.12)] transition-all text-sm font-body"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Support Categories ───────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  variants={fadeUp}
                  custom={i}
                  className="group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mb-4 group-hover:bg-[#D0F219]/20 group-hover:scale-110 transition-all duration-300">
                    <cat.icon size={20} className="text-[#D0F219]" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-white mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-body mb-4">{cat.desc}</p>
                  <ul className="space-y-2">
                    {cat.links.map((link) => (
                      <li key={link} className="text-xs text-lime-200/80 font-body font-medium flex items-center gap-1.5 hover:text-[#D0F219] transition-colors">
                        <ArrowRight size={11} className="text-[#D0F219]" />
                        {link}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── FAQ Accordion ─────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <MessageCircle size={12} />
                Frequently Asked Questions
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                Quick{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Answers
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-lime-500/15"
            >
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle size={32} className="mx-auto text-[#D0F219]/30 mb-3" />
                  <p className="text-sm text-slate-400 font-body">
                    No results found. Try a different search term.
                  </p>
                </div>
              ) : (
                filteredFaqs.map((faq, i) => (
                  <div key={i} className="border-b border-lime-500/10 last:border-0">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-white font-body flex-1">
                        {faq.q}
                      </span>
                      <motion.div
                        animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 w-6 h-6 rounded-full bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center"
                      >
                        <ChevronDown size={14} className="text-[#D0F219]" />
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
                          <p className="pb-4 text-sm text-slate-400 font-body leading-relaxed -mt-2">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </motion.div>
          </div>
        </section>

        {/* ─── Still Need Help ───────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#D0F219]/[0.12] via-[#12140E] to-[#0D0F0A] rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-lime-950/30 border border-lime-500/20"
            >
              <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-[#D0F219]/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-[#D0F219]" />
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  Still Need Help?
                </h2>
                <p className="mt-3 text-slate-400 font-body text-sm sm:text-base max-w-md mx-auto">
                  Our support team is ready to assist you.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-medium text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                  >
                    Contact Support
                    <ArrowRight size={18} />
                  </Link>
                  <a
                    href="mailto:support@byteshelf.com"
                    className="inline-flex items-center gap-2 px-8 py-3.5 border border-lime-500/30 text-lime-200 rounded-full font-body font-medium text-base hover:bg-lime-400/10 hover:border-lime-400/50 active:scale-95 transition-all duration-200"
                  >
                    Email Us
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
