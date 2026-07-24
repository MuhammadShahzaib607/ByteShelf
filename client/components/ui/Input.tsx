"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, showPasswordToggle, type, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full">
        {label && (
          <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {Icon && (
            <div className="absolute left-4 text-[#0284C7] pointer-events-none z-10">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC]/40 border border-[#0284C7]/20
              rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/40
              focus:outline-none focus:border-[#0284C7] focus:bg-white
              transition-all text-sm font-body
              ${isPassword && showPasswordToggle ? "pr-12" : ""}
              ${error ? "border-red-500 bg-red-50/50" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#0284C7]/50 hover:text-[#0284C7] transition-colors z-10"
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
