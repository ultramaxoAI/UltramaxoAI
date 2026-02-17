"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { User } from "next-auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

const pricingPlans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    desc: "Coba semua fitur dasar tanpa biaya",
    features: [
      "AI Chat (UltraAgent)",
      "Basic code editor",
      "Riwayat chat terbatas",
      "Syntax highlighting",
      "Upload file standar",
    ],
    popular: false,
    ctaText: "Paket Saat Ini",
    ctaDisabled: true,
  },
  {
    name: "Pro",
    price: "Rp 20.000",
    period: "per bulan",
    desc: "Untuk yang butuh lebih — tanpa batas",
    features: [
      "AI Chat (UltraAgent Pro)",
      "Semua fitur Free",
      "Chat tanpa limit",
      "Riwayat chat permanen",
      "Code workspace lengkap",
      "Full artifacts system",
      "Priority support",
    ],
    popular: true,
    ctaText: "Upgrade Sekarang",
    ctaDisabled: false,
  },
  {
    name: "1 Tahun",
    price: "Rp 120.000",
    period: "per tahun",
    desc: "Hemat lebih banyak dengan paket tahunan",
    features: [
      "Semua fitur Pro",
      "Dedicated support",
      "Custom deployment",
      "SLA guarantee",
      "Advanced analytics",
    ],
    popular: false,
    ctaText: "Upgrade Sekarang",
    ctaDisabled: false,
  },
];

export function PricingModal({ open, onOpenChange, user }: PricingModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName);
    
    // Create WhatsApp message
    const plan = pricingPlans.find((p) => p.name === planName);
    if (!plan || !user) return;

    const message = `Halo, saya ingin upgrade ke paket ${planName}:\n\n` +
      `📦 Paket: ${planName}\n` +
      `💰 Harga: ${plan.price}\n` +
      `⏱️ Periode: ${plan.period}\n` +
      `👤 Email: ${user.email}\n`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/6285191689131?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank");
    
    // Close modal after a short delay
    setTimeout(() => {
      onOpenChange(false);
      setSelectedPlan(null);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-0 bg-[#0a0a0a] p-0 overflow-hidden">
        <div className="relative border border-white/10 rounded-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>

          {/* Header */}
          <div className="relative bg-gradient-to-b from-zinc-900 to-[#0a0a0a] pt-12 pb-8 px-8 border-b border-white/5">
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Pilih Paket Anda
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-base">
                Tidak ada biaya tersembunyi. Upgrade kapan saja, downgrade kapan saja.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 p-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 border backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? "border-indigo-500/40 bg-indigo-950/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-xs font-medium shadow-lg shadow-indigo-500/25">
                    Paling Populer
                  </div>
                )}

                <div className="mb-7">
                  <p className="font-semibold text-white mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-3xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500 mb-1">
                      / {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{plan.desc}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li
                      className="flex items-start gap-3 text-sm text-gray-300"
                      key={j}
                    >
                      <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full justify-center ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                      : plan.ctaDisabled
                      ? "bg-white/10 text-gray-400 cursor-not-allowed"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  disabled={plan.ctaDisabled || (!user && plan.name !== "Free")}
                  onClick={() => !plan.ctaDisabled && handleUpgrade(plan.name)}
                >
                  {plan.ctaText}
                </Button>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-8 pb-8 text-center">
            <p className="text-xs text-gray-500">
              Dengan melanjutkan, Anda menyetujui{" "}
              <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
                Syarat & Ketentuan
              </a>{" "}
              kami.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
