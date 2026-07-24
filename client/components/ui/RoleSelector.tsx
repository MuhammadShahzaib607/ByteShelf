"use client";

import { Store, Warehouse } from "lucide-react";

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const roles: RoleOption[] = [
  {
    value: "merchant",
    label: "Merchant",
    description: "E-commerce Brand / Retailer",
    icon: <Store size={24} />,
  },
  {
    value: "warehouseOwner",
    label: "Warehouse Owner",
    description: "Space Provider / Logistics",
    icon: <Warehouse size={24} />,
  },
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, error }) => {
  return (
    <div className="w-full my-2">
      <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-3 block">
        I want to join as
      </label>
      <div className="grid grid-cols-2 gap-3 w-full">
        {roles.map((role) => {
          const isSelected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={`
                p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2
                cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? "border-[#1E293B] bg-[#F8FAFC]/60 text-[#1E293B]"
                    : "border-gray-200 bg-transparent text-gray-500 hover:border-[#0284C7]/40"
                }
              `}
            >
              <div className={isSelected ? "text-[#1E293B]" : "text-gray-400"}>
                {role.icon}
              </div>
              <div className="text-center">
                <p
                  className={`font-heading text-sm font-semibold ${
                    isSelected ? "text-[#1E293B]" : "text-gray-500"
                  }`}
                >
                  {role.label}
                </p>
                <p className="text-[10px] mt-0.5 opacity-70">{role.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 font-body">{error}</p>
      )}
    </div>
  );
};

export default RoleSelector;
