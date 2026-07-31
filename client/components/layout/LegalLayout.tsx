"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarClock, LucideIcon } from "lucide-react";

interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalLayoutProps {
  icon: LucideIcon;
  title: string;
  lastUpdated: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
  footer?: React.ReactNode;
}

export default function LegalLayout({
  icon: Icon,
  title,
  lastUpdated,
  intro,
  sections,
  footer,
}: LegalLayoutProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id || "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Parent pages build `sections` inline, so depend on the stable id list
  // instead of the array reference (which changes every render).
  const sectionIds = sections.map((s) => s.id).join(",");

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-32 sm:pt-40 pb-12 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#D0F219]/[0.07] blur-3xl" />
            <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center">
                  <Icon size={22} className="text-[#D0F219]" />
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white">
                  {title}
                </h1>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-lime-500/20 text-xs text-lime-200 font-body">
                <CalendarClock size={13} className="text-[#D0F219]" />
                Last Updated: {lastUpdated}
              </div>
              {intro && (
                <p className="mt-6 text-sm sm:text-base text-slate-400 font-body leading-relaxed max-w-2xl">
                  {intro}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Body */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
              {/* Sidebar */}
              <motion.nav
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:w-60 shrink-0"
                aria-label="On this page"
              >
                <div className="lg:sticky lg:top-28">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-body mb-3 px-4">
                    On this page
                  </p>
                  <div className="space-y-1">
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-body transition-all duration-200 border ${
                          activeId === s.id
                            ? "bg-[#D0F219]/10 border-lime-500/25 text-[#D0F219] font-semibold"
                            : "border-transparent text-slate-400 hover:text-[#D0F219] hover:bg-lime-400/5"
                        }`}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.nav>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex-1 min-w-0"
              >
                <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-lime-500/15 space-y-10">
                  {sections.map((s, i) => (
                    <motion.section
                      key={s.id}
                      id={s.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.4, delay: 0.05 * i }}
                      className="scroll-mt-32"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#D0F219] to-emerald-400" />
                        <h2 className="font-heading text-xl font-bold text-white">
                          {s.title}
                        </h2>
                      </div>
                      {s.content}
                    </motion.section>
                  ))}
                </div>

                {footer && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 text-center"
                  >
                    {footer}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
