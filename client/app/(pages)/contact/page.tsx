"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

const supportChannels = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support@byteshelf.com",
    href: "mailto:support@byteshelf.com",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+92 (300) 123-4567",
    href: "tel:+923001234567",
  },
  {
    icon: MapPin,
    label: "Headquarters",
    value: "Karachi, Pakistan",
    href: "https://maps.google.com",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post("/contact", { name, email, subject, message });
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to send message");
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* ─── Header ───────────────────────────────────────────────────────── */}
        <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
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
                <MessageCircle size={12} />
                We&apos;re Here To Help
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Get in{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Touch
                </span>
              </h1>
              <p className="mt-3 text-slate-300 font-body text-base max-w-lg mx-auto">
                Have a question or need help? We&apos;re here for you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-3 bg-white/[0.04] backdrop-blur-xl rounded-3xl p-8 border border-lime-500/15"
              >
                <h2 className="font-heading text-xl font-semibold text-white mb-6">
                  Send us a Message
                </h2>

                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-[#D0F219]/[0.06] border border-lime-500/25 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-[#D0F219]" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-slate-400 font-body">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#D0F219] text-[#12140E] rounded-full text-sm font-body font-medium hover:bg-lime-300 hover:shadow-[0_0_25px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5">
                        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300 font-body">{error}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 block font-body">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="John Doe"
                          className="w-full px-4 py-3 bg-white/[0.05] border border-lime-500/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] transition-all text-sm font-body"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 block font-body">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 bg-white/[0.05] border border-lime-500/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] transition-all text-sm font-body"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 block font-body">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="How can we help?"
                        className="w-full px-4 py-3 bg-white/[0.05] border border-lime-500/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] transition-all text-sm font-body"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 block font-body">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                        placeholder="Tell us more about your inquiry..."
                        className="w-full px-4 py-3 bg-white/[0.05] border border-lime-500/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] transition-all text-sm font-body resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-medium hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Support Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2 space-y-4"
              >
                {supportChannels.map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block bg-white/[0.04] backdrop-blur-xl rounded-2xl p-5 border border-lime-500/15 hover:border-lime-400/40 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(208,242,25,0.08)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center group-hover:bg-[#D0F219]/20 group-hover:scale-110 transition-all duration-300">
                        <channel.icon size={22} className="text-[#D0F219]" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-body uppercase tracking-wider">
                          {channel.label}
                        </p>
                        <p className="text-sm font-semibold text-white font-body mt-0.5">
                          {channel.value}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}

                {/* Response time */}
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-lime-500/10">
                  <Clock size={20} className="text-[#D0F219]" />
                  <div>
                    <p className="text-sm font-semibold text-white font-body">
                      Avg. response time
                    </p>
                    <p className="text-xs text-slate-400 font-body">
                      Under 24 hours, 7 days a week
                    </p>
                  </div>
                </div>

                {/* FAQ Link */}
                <Link
                  href="/help"
                  className="flex items-center gap-3 p-5 rounded-2xl bg-[#D0F219]/[0.06] border border-lime-500/20 hover:bg-[#D0F219]/[0.1] transition-colors group"
                >
                  <MessageCircle size={20} className="text-[#D0F219]" />
                  <div>
                    <p className="text-sm font-semibold text-white font-body">
                      Visit our Help Center
                    </p>
                    <p className="text-xs text-slate-400 font-body">
                      Find quick answers to common questions
                    </p>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
