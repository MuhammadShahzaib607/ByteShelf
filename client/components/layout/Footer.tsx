"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("byteshelf_access_token") ||
      localStorage.getItem("auth_tokens");
    setIsLoggedIn(!!token);
  }, []);

  // Auth-conditional links: hide Sign In / Register when logged in
  const platformLinks = isLoggedIn
    ? [
        { href: "/explore", label: "Browse Warehouses" },
        { href: "/explore", label: "Explore" },
      ]
    : [
        { href: "/explore", label: "Browse Warehouses" },
        { href: "/explore", label: "Explore" },
        { href: "/signup", label: "Get Started" },
        { href: "/login", label: "Sign In" },
      ];

  return (
    <footer className="bg-[#1E293B] text-white/80">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Statement */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span className="font-heading text-lg font-semibold text-white tracking-tight">
                ByteShelf
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed font-body max-w-xs">
              The modern micro-warehousing platform connecting merchants with
              verified storage space. Pay per shelf, not per square foot.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-4 font-body">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link, index) => (
                <li key={`${link.label}-${link.href}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-4 font-body">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors font-body">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-white/70 hover:text-white transition-colors font-body">Careers</Link></li>
              <li><Link href="/blog" className="text-sm text-white/70 hover:text-white transition-colors font-body">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-white/70 hover:text-white transition-colors font-body">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-4 font-body">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy-policy" className="text-sm text-white/70 hover:text-white transition-colors font-body">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/70 hover:text-white transition-colors font-body">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="text-sm text-white/70 hover:text-white transition-colors font-body">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 font-body">
            &copy; {year} ByteShelf. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 font-body">Built with care for growing brands</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
