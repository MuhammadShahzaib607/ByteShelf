"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  ArrowRight,
  Clock,
  CalendarDays,
  Mail,
  CheckCircle,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { blogCategories, blogPosts, getFeaturedPost } from "@/lib/blogData";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const featured = getFeaturedPost();
  const filteredPosts = blogPosts.filter(
    (p) => activeCategory === "all" || p.category === activeCategory
  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="relative max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-badge-lime inline-flex mx-auto mb-6">
                <Newspaper size={12} />
                The ByteShelf Blog
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Insights for Smarter{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Storage
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-body leading-relaxed">
                Guides, product updates, and stories from merchants and
                warehouse owners building flexible supply chains with ByteShelf.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── Featured Post ────────────────────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href={`/blog/${featured.slug}`}
                className="group relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(208,242,25,0.10)] block"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Cover */}
                  <div className="relative h-56 md:h-auto overflow-hidden">
                    <img
                      src={featured.cover}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0F0A]/80 backdrop-blur-md border border-lime-500/30 text-[11px] font-semibold text-white font-body uppercase tracking-wider">
                      <Sparkles size={12} className="text-[#D0F219]" />
                      Featured
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 sm:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-body mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[#D0F219] font-semibold">
                        {featured.categoryLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-[#D0F219]" />
                        {featured.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-[#D0F219]" />
                        {featured.readTime}
                      </span>
                    </div>
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3 leading-snug group-hover:text-[#D0F219] transition-colors duration-200">
                      {featured.title}
                    </h2>
                    <p className="text-sm text-slate-400 font-body leading-relaxed mb-6">
                      {featured.excerpt}
                    </p>
                    <div>
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D0F219] text-[#12140E] rounded-full text-sm font-body font-semibold hover:bg-lime-300 hover:shadow-[0_0_25px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200">
                        Read Article
                        <ArrowRight
                          size={15}
                          className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Category Filters + Grid ──────────────────────────────────────── */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2.5 mb-12"
            >
              {blogCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 ${
                    activeCategory === cat.id
                      ? "bg-[#D0F219] text-[#12140E] shadow-[0_0_20px_rgba(208,242,25,0.3)]"
                      : "bg-white/[0.04] border border-lime-500/15 text-slate-300 hover:border-lime-400/50 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </motion.div>

            {/* Grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post) => (
                  <motion.article
                    key={post.slug}
                    layout
                    variants={fadeUp}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)] flex flex-col h-full block"
                    >
                      {/* Cover */}
                      <div className="h-44 overflow-hidden relative">
                        <img
                          src={post.cover}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full bg-[#0D0F0A]/80 backdrop-blur-md border border-lime-500/30 text-[10px] font-semibold text-[#D0F219] font-body uppercase tracking-wider">
                          {post.categoryLabel}
                        </span>
                      </div>
                      {/* Body */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-body mb-3">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-[#D0F219]" />
                            {post.date}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={12} className="text-[#D0F219]" />
                            {post.readTime}
                          </span>
                        </div>
                        <h3 className="font-heading text-base font-semibold text-white mb-2 leading-snug group-hover:text-[#D0F219] transition-colors duration-200">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-400 font-body leading-relaxed line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D0F219] font-body">
                            Read Article
                            <ArrowRight
                              size={14}
                              className="group-hover:translate-x-1 transition-transform duration-200"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-sm text-slate-400 font-body">
                  No articles in this category yet — check back soon.
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ─── Newsletter CTA ────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#D0F219]/[0.12] via-[#12140E] to-[#0D0F0A] rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-lime-950/30 border border-lime-500/20"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-[#D0F219]" />
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  Get Storage Insights{" "}
                  <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                    Every Week
                  </span>
                </h2>
                <p className="mt-3 text-slate-400 font-body text-sm sm:text-base max-w-md mx-auto">
                  Join the newsletter for practical logistics tips, product
                  updates, and success stories. No spam, ever.
                </p>

                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[#D0F219] font-body font-semibold"
                  >
                    <CheckCircle size={18} />
                    You&apos;re subscribed!
                  </motion.div>
                ) : (
                  <form
                    onSubmit={handleSubscribe}
                    className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full sm:w-72 px-5 py-3.5 bg-white/[0.05] border border-lime-500/25 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400/60 focus:bg-white/[0.08] focus:shadow-[0_0_30px_rgba(208,242,25,0.12)] transition-all text-sm font-body"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-semibold text-sm hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                    >
                      Subscribe
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
