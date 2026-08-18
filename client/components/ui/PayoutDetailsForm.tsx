"use client";

import { Landmark, Wallet, Banknote } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type PayoutType = "bank_account" | "mobile_wallet" | "both";

export interface PayoutDetailsData {
  payoutType: PayoutType;
  bankDetails: {
    accountTitle: string;
    bankName: string;
    accountNumber: string;
    iban: string;
  };
  walletDetails: {
    easyPaisaNumber: string;
    easyPaisaTitle: string;
    jazzCashNumber: string;
    jazzCashTitle: string;
    sadaPayTagOrNumber: string;
    nayaPayTagOrNumber: string;
  };
}

export function emptyPayoutDetails(): PayoutDetailsData {
  return {
    payoutType: "bank_account",
    bankDetails: {
      accountTitle: "",
      bankName: "",
      accountNumber: "",
      iban: "",
    },
    walletDetails: {
      easyPaisaNumber: "",
      easyPaisaTitle: "",
      jazzCashNumber: "",
      jazzCashTitle: "",
      sadaPayTagOrNumber: "",
      nayaPayTagOrNumber: "",
    },
  };
}

export function payoutHasAnyData(p: PayoutDetailsData | undefined | null): boolean {
  if (!p) return false;
  const bank = p.bankDetails || {};
  const wallet = p.walletDetails || {};
  return Boolean(
    bank.accountTitle?.trim() ||
      bank.bankName?.trim() ||
      bank.accountNumber?.trim() ||
      bank.iban?.trim() ||
      wallet.easyPaisaNumber?.trim() ||
      wallet.easyPaisaTitle?.trim() ||
      wallet.jazzCashNumber?.trim() ||
      wallet.jazzCashTitle?.trim() ||
      wallet.sadaPayTagOrNumber?.trim() ||
      wallet.nayaPayTagOrNumber?.trim()
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────────

interface PayoutDetailsFormProps {
  value: PayoutDetailsData;
  onChange: (value: PayoutDetailsData) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/30 rounded-xl transition-all text-sm font-body";

const labelCls =
  "text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2 block font-body";

const TYPE_TABS: { id: PayoutType; label: string; icon: React.ElementType }[] = [
  { id: "bank_account", label: "Bank Account", icon: Landmark },
  { id: "mobile_wallet", label: "Mobile Wallet", icon: Wallet },
  { id: "both", label: "Both", icon: Banknote },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function PayoutDetailsForm({ value, onChange }: PayoutDetailsFormProps) {
  const setBank = (field: keyof PayoutDetailsData["bankDetails"], val: string) =>
    onChange({
      ...value,
      bankDetails: { ...value.bankDetails, [field]: val },
    });

  const setWallet = (field: keyof PayoutDetailsData["walletDetails"], val: string) =>
    onChange({
      ...value,
      walletDetails: { ...value.walletDetails, [field]: val },
    });

  const showBank = value.payoutType === "bank_account" || value.payoutType === "both";
  const showWallet = value.payoutType === "mobile_wallet" || value.payoutType === "both";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center shrink-0">
          <Wallet size={17} className="text-[#84cc16]" />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-white">
            Payout &amp; Bank Details
          </h3>
          <p className="text-xs text-neutral-400 font-body">
            Shown to merchants so they can pay you for bookings.
          </p>
        </div>
      </div>

      {/* Payout type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = value.payoutType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange({ ...value, payoutType: tab.id })}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-xs font-body font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#1a231d] text-[#84cc16] border-[#84cc16] shadow-lg shadow-[#84cc16]/10"
                  : "bg-transparent text-neutral-400 border-neutral-800 hover:border-[#84cc16]/40 hover:bg-white/5"
              }`}
            >
              <Icon size={17} />
              <span className="leading-tight text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bank details */}
      {showBank && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Landmark size={15} className="text-[#84cc16]/70" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-body">
              Bank Account Details
            </span>
          </div>
          <div>
            <label className={labelCls}>Account Title</label>
            <input
              type="text"
              value={value.bankDetails.accountTitle}
              onChange={(e) => setBank("accountTitle", e.target.value)}
              placeholder="e.g. Muhammad Ali Traders"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bank Name</label>
              <input
                type="text"
                value={value.bankDetails.bankName}
                onChange={(e) => setBank("bankName", e.target.value)}
                placeholder="e.g. Meezan Bank"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input
                type="text"
                value={value.bankDetails.accountNumber}
                onChange={(e) => setBank("accountNumber", e.target.value)}
                placeholder="e.g. 0123456789"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>IBAN (24 characters)</label>
            <input
              type="text"
              value={value.bankDetails.iban}
              onChange={(e) => setBank("iban", e.target.value)}
              placeholder="e.g. PK36MEZN0000000123456789"
              maxLength={24}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* Mobile wallet details */}
      {showWallet && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-[#84cc16]/70" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-body">
              Mobile Wallet Details
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>EasyPaisa Number</label>
              <input
                type="text"
                value={value.walletDetails.easyPaisaNumber}
                onChange={(e) => setWallet("easyPaisaNumber", e.target.value)}
                placeholder="03XXXXXXXXX"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>EasyPaisa Title</label>
              <input
                type="text"
                value={value.walletDetails.easyPaisaTitle}
                onChange={(e) => setWallet("easyPaisaTitle", e.target.value)}
                placeholder="Account holder name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>JazzCash Number</label>
              <input
                type="text"
                value={value.walletDetails.jazzCashNumber}
                onChange={(e) => setWallet("jazzCashNumber", e.target.value)}
                placeholder="03XXXXXXXXX"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>JazzCash Title</label>
              <input
                type="text"
                value={value.walletDetails.jazzCashTitle}
                onChange={(e) => setWallet("jazzCashTitle", e.target.value)}
                placeholder="Account holder name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>SadaPay Tag / Number</label>
              <input
                type="text"
                value={value.walletDetails.sadaPayTagOrNumber}
                onChange={(e) => setWallet("sadaPayTagOrNumber", e.target.value)}
                placeholder="e.g. @muhammadali"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>NayaPay Tag / Number</label>
              <input
                type="text"
                value={value.walletDetails.nayaPayTagOrNumber}
                onChange={(e) => setWallet("nayaPayTagOrNumber", e.target.value)}
                placeholder="e.g. @muhammadali"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
