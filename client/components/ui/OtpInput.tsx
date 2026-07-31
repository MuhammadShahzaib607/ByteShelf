"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const digits = value.split("").slice(0, length);
  const digitArray = Array.from({ length }, (_, i) => digits[i] || "");

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digitArray];
    newDigits[index] = char;
    onChange(newDigits.join("").slice(0, length));
    if (char && index < length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digitArray[index] && index > 0) {
        const newDigits = [...digitArray];
        newDigits[index - 1] = "";
        onChange(newDigits.join("").slice(0, length));
        focusInput(index - 1);
      } else {
        const newDigits = [...digitArray];
        newDigits[index] = "";
        onChange(newDigits.join("").slice(0, length));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
    }
  };

  useEffect(() => {
    const firstEmpty = digitArray.findIndex((d) => !d);
    if (firstEmpty >= 0) focusInput(firstEmpty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {digitArray.map((digit, index) => {
          const isFocused = focusedIndex === index;
          return (
            <div
              key={index}
              className={`
                relative w-11 h-12 sm:w-12 sm:h-14 rounded-xl border-2 bg-slate-950
                flex items-center justify-center transition-all duration-150
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${error ? "bg-red-950/20" : ""}
                ${
                  isFocused
                    ? "border-[#ccff00] shadow-[0_0_0_2px_#ccff00_inset,0_0_20px_rgba(204,255,0,0.15)]"
                    : digit
                    ? "border-[#ccff00]/50"
                    : error
                    ? "border-red-500"
                    : "border-slate-800"
                }
              `}
            >
              <input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => {
                  setFocusedIndex(index);
                  inputRefs.current[index]?.select();
                }}
                onBlur={() => setFocusedIndex(-1)}
                onPaste={handlePaste}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label={`Digit ${index + 1}`}
              />
              <span
                className={`font-heading text-xl sm:text-2xl font-semibold select-none ${
                  digit ? "text-white" : "text-[#ccff00]/30"
                }`}
              >
                {digit || "•"}
              </span>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center font-body">{error}</p>
      )}
    </div>
  );
};

export default OtpInput;
