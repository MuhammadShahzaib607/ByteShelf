"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  showPasswordToggle?: boolean;
  /** Dark glass variant for ByteShelf auth pages (light default preserved for dashboard/warehouse forms) */
  dark?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, showPasswordToggle, type, dark = false, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full">
        {label && (
          <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${
            dark ? "text-slate-300" : "text-[#1E293B]"
          }`}>
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {Icon && (
            <div className={`absolute left-4 pointer-events-none z-10 ${
              dark ? "text-[#84cc16]/70" : "text-[#0284C7]"
            }`}>
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full pl-11 pr-4 py-3.5 rounded-xl
              transition-all text-sm font-body
              ${isPassword && showPasswordToggle ? "pr-12" : ""}
              ${
                dark
                  ? "dark-input bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16]"
                  : "bg-[#F8FAFC]/40 border border-[#0284C7]/20 text-[#0F172A] placeholder:text-[#0F172A]/40 focus:outline-none focus:border-[#0284C7] focus:bg-white"
              }
              ${error ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 transition-colors z-10 ${
                dark
                  ? "text-slate-500 hover:text-[#84cc16]"
                  : "text-[#0284C7]/50 hover:text-[#0284C7]"
              }`}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-red-500 text-xs mt-1.5 ml-1 font-body">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
