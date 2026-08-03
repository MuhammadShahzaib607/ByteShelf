"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
    <footer className="bg-[#0D0F0A] border-t border-[#84cc16]/15 text-slate-300">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Statement */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center group mb-4">
              <Image
                src="/logo.png"
                alt="ByteShelf Logo"
                width={40}
                height={40}
                className="object-contain transition-[filter] group-hover:drop-shadow-[0_0_12px_rgba(132,204,22,0.4)]"
              />
              <span className="font-heading text-lg font-semibold text-white tracking-tight">
                ByteShelf
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed font-body max-w-xs">
              The modern micro-warehousing platform connecting merchants with
              verified storage space. Pay per shelf, not per square foot.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#84cc16]/60 mb-4 font-body">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link, index) => (
                <li key={`${link.label}-${link.href}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#84cc16]/60 mb-4 font-body">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/how-it-works" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">How It Works</Link></li>
              <li><Link href="/about" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">About Us</Link></li>
              <li><Link href="/help" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Help</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#84cc16]/60 mb-4 font-body">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy-policy" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="text-sm text-slate-400 hover:text-[#84cc16] transition-colors font-body">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-[#84cc16]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-body">
            &copy; {year} ByteShelf. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600 font-body">Built with care for growing brands</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
