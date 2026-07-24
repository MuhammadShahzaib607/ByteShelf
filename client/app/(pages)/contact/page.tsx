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
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

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

    // Simulate form submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#1E293B] tracking-tight">
              Get in Touch
            </h1>
            <p className="mt-3 text-[#0F172A]/50 font-body text-base max-w-lg mx-auto">
              Have a question or need help? We&apos;re here for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0]"
            >
              <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-6">
                Send us a Message
              </h2>

              {success ? (
                <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#0284C7]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-[#0284C7]" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-sm text-[#0F172A]/50 font-body">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-body">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Tell us more about your inquiry..."
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Support Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              {supportChannels.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0284C7]/20 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center group-hover:bg-[#0284C7]/5 transition-colors">
                      <channel.icon size={22} className="text-[#0284C7]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#0F172A]/50 font-body uppercase tracking-wider">
                        {channel.label}
                      </p>
                      <p className="text-sm font-semibold text-[#1E293B] font-body mt-0.5">
                        {channel.value}
                      </p>
                    </div>
                  </div>
                </a>
              ))}

              {/* FAQ Link */}
              <Link
                href="/#pricing"
                className="flex items-center gap-3 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white transition-colors group"
              >
                <MessageCircle size={20} className="text-[#0284C7]" />
                <div>
                  <p className="text-sm font-semibold text-[#1E293B] font-body">
                    Visit our FAQ
                  </p>
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    Find quick answers to common questions
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
