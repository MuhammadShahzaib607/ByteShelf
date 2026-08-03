"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const FloatingChatButton: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth status from localStorage
    const legacy = localStorage.getItem("byteshelf_access_token");
    const stored = localStorage.getItem("auth_tokens");
    let hasToken = false;

    if (legacy) {
      hasToken = true;
    } else if (stored) {
      try {
        const parsed = JSON.parse(stored);
        hasToken = !!parsed.accessToken;
      } catch {
        // ignore
      }
    }

    setIsLoggedIn(hasToken);
  }, []);

  // Hide on the messages page itself to avoid redundancy
  const isMessagesPage = pathname.startsWith("/messages");

  if (!isLoggedIn || isMessagesPage) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
      transition={{ duration: 0.3, delay: 0.5 }}
      onClick={() => router.push("/messages")}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neutral-900 border border-[#84cc16]/40 text-[#84cc16] shadow-xl shadow-black/50 hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-[0_0_20px_rgba(132,204,22,0.2)] transition-all duration-300 flex items-center justify-center"
      aria-label="Open Messages"
    >
      <MessageCircle size={24} strokeWidth={2.2} />
    </motion.button>
  );
};

export default FloatingChatButton;
