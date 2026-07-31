"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CalendarDays,
  Sparkles,
  Quote,
  CheckCircle,
  Lightbulb,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPostBySlug } from "@/lib/blogData";
import BlogCarousel from "@/components/ui/BlogCarousel";
import type { BlogContentBlock } from "@/lib/blogData";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function ContentBlock({ block }: { block: BlogContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <motion.h2
          variants={fadeUp}
          className="font-heading text-xl sm:text-2xl font-bold text-white mt-10 mb-4 tracking-tight"
        >
          {block.text}
        </motion.h2>
      );
    case "quote":
      return (
        <motion.blockquote
          variants={fadeUp}
          className="relative my-8 pl-6 border-l-2 border-[#D0F219] py-2"
        >
          <Quote size={18} className="absolute -left-1 -top-4 text-[#D0F219]/40" />
          <p className="font-heading text-lg sm:text-xl font-semibold text-lime-100 italic leading-relaxed">
            “{block.text}”
          </p>
        </motion.blockquote>
      );
    case "list":
      return (
        <motion.ul
          variants={fadeUp}
          className="my-5 space-y-2.5"
        >
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 font-body leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#D0F219] shrink-0" />
              {item}
            </li>
          ))}
        </motion.ul>
      );
    case "takeaways":
      return (
        <motion.div
          variants={fadeUp}
          className="my-8 rounded-2xl bg-[#D0F219]/[0.06] border border-lime-500/25 p-6 sm:p-7"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center">
              <Lightbulb size={15} className="text-[#D0F219]" />
            </div>
            <h3 className="font-heading text-base font-bold text-white">
              Key Takeaways
            </h3>
          </div>
          <ul className="space-y-3">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200 font-body leading-relaxed">
                <CheckCircle size={15} className="text-[#D0F219] shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      );
    default:
      return (
        <motion.p
          variants={fadeUp}
          className="my-4 text-[15px] text-slate-300 font-body leading-relaxed"
        >
          {block.text}
        </motion.p>
      );
  }
}

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-lime-500/15 flex items-center justify-center mx-auto mb-5">
              <Newspaper size={28} className="text-lime-400/40" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-3">
              Article not found
            </h1>
            <p className="text-sm text-slate-400 font-body mb-8">
              The article you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-semibold hover:bg-lime-300 hover:shadow-[0_0_25px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-28 sm:pt-32 pb-10 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-slate-400 font-body hover:text-[#D0F219] transition-colors mb-8"
              >
                <ArrowLeft size={15} />
                Back to Blog
              </Link>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-body mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[#D0F219] font-semibold">
                  {post.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-[#D0F219]" />
                  {post.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} className="text-[#D0F219]" />
                  {post.readTime}
                </span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                {post.title}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-400 font-body leading-relaxed max-w-2xl">
                {post.excerpt}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Cover / Carousel */}
        <section className="py-8 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {post.images.length > 1 ? (
                <BlogCarousel images={post.images} alt={post.title} />
              ) : (
                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden">
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Article body */}
        <section className="py-10 pb-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.article
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              transition={{ staggerChildren: 0.08 }}
              className="max-w-2xl mx-auto"
            >
              {post.content.map((block, i) => (
                <ContentBlock key={i} block={block} />
              ))}
            </motion.article>

            {/* Post footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-14 max-w-2xl mx-auto"
            >
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 p-6 sm:p-8 text-center">
                <div className="inline-flex items-center gap-1.5 section-badge-lime mb-3">
                  <Sparkles size={12} />
                  Fresh from the blog
                </div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Enjoyed this article?
                </h3>
                <p className="mt-2 text-sm text-slate-400 font-body">
                  Explore more guides, news, and stories from ByteShelf.
                </p>
                <Link
                  href="/blog"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-semibold hover:bg-lime-300 hover:shadow-[0_0_25px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
                >
                  Browse All Articles
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
