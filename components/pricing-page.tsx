"use client";

import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import type { User } from "next-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PricingPageProps {
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

export function PricingPage({ user }: PricingPageProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName);
    
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Create WhatsApp message
    const plan = pricingPlans.find((p) => p.name === planName);
    if (!plan) return;

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
    
    // Reset selection
    setTimeout(() => {
      setSelectedPlan(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/chat"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Chat
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Pilih Paket Anda
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tidak ada biaya tersembunyi. Upgrade kapan saja, downgrade kapan saja.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pakai gratis selamanya atau upgrade untuk fitur unlimited
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-950/50 to-purple-950/30 shadow-[0_0_60px_rgba(99,102,241,0.15)]"
                  : "border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-xs font-semibold shadow-lg shadow-indigo-500/30">
                  Paling Populer
                </div>
              )}

              <div className="mb-8">
                <p className="font-semibold text-white text-lg mb-2">{plan.name}</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500 mb-2">
                    / {plan.period}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feat, j) => (
                  <li
                    className="flex items-start gap-3 text-sm text-gray-300"
                    key={j}
                  >
                    <Check className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full justify-center h-11 rounded-2xl font-medium transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
                    : plan.ctaDisabled
                    ? "bg-white/10 text-gray-400 cursor-not-allowed"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                disabled={plan.ctaDisabled}
                onClick={() => !plan.ctaDisabled && handleUpgrade(plan.name)}
              >
                {plan.ctaText}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-16 space-y-4">
          <p className="text-sm text-gray-500">
            Dengan melanjutkan, Anda menyetujui{" "}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
              Syarat & Ketentuan
            </Link>{" "}
            kami.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span>🔒 Pembayaran Aman</span>
            <span>📱 Via WhatsApp</span>
            <span>⚡ Aktivasi Instant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
