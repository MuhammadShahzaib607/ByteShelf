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
    "relative inline-flex items-center justify-center font-body font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ccff00]/40";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantStyles = {
    primary:
      "bg-[#ccff00] text-black hover:bg-[#b8e600] active:bg-[#b8e600]/90 shadow-md hover:shadow-[0_0_30px_rgba(204,255,0,0.35)] shadow-slate-950/30",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-700/90 shadow-sm hover:shadow-md shadow-slate-950/20",
    outline:
      "border-2 border-slate-700 text-slate-200 bg-transparent hover:bg-white/5 active:bg-white/10",
    ghost:
      "text-slate-200 bg-transparent hover:bg-white/5 active:bg-white/10",
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
