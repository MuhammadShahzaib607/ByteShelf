"use client";

import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-body font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/30";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantStyles = {
    primary:
      "bg-[#1E293B] text-white hover:bg-[#0284C7] active:bg-[#0284C7]/90 shadow-md hover:shadow-lg shadow-slate-900/10",
    secondary:
      "bg-[#0284C7] text-white hover:bg-[#0284C7]/80 active:bg-[#0284C7]/70 shadow-sm hover:shadow-md shadow-slate-900/10",
    outline:
      "border-2 border-[#1E293B] text-[#1E293B] bg-transparent hover:bg-[#F8FAFC]/40 active:bg-[#F8FAFC]/60",
    ghost:
      "text-[#1E293B] bg-transparent hover:bg-[#F8FAFC]/40 active:bg-[#F8FAFC]/60",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 active:translate-y-0"}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={18} className="animate-spin mr-2" />}
      <span className={isLoading ? "opacity-70" : ""}>{children}</span>
    </button>
  );
};

export default Button;
