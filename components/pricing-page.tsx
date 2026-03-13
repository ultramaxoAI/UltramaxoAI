"use client";

import { ArrowLeft, Check, Flame, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PricingPageProps {
	user?: User;
}

const TOTAL_EARLY_ADOPTER_SLOTS = 100;
const SLOTS_TAKEN = 8; // Update this manually or fetch from DB

const pricingPlans = [
	{
		name: "Free",
		price: "Rp 0",
		originalPrice: null,
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
		name: "Early Adopter (Pro)",
		price: "Rp 15.000",
		originalPrice: "Rp 30.000",
		period: "per bulan",
		desc: `Khusus ${TOTAL_EARLY_ADOPTER_SLOTS} pengguna pertama. Harga naik setelah slot habis.`,
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
		price: "Rp 150.000",
		originalPrice: "Rp 360.000",
		period: "per tahun",
		desc: "Hemat 58% dengan komitmen tahunan",
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
	const [loading, setLoading] = useState(false);
	const [hasPendingRequest, setHasPendingRequest] = useState(false);

	// Auto-redirect if user is already PRO
	useEffect(() => {
		if (user?.type === "pro") {
			toast.success("Anda sudah menjadi member PRO!");
			router.push("/chat");
		}
	}, [user, router]);

	// Poll for upgrade status when there's a pending request
	useEffect(() => {
		if (!hasPendingRequest || !user) {
			return;
		}

		const pollInterval = setInterval(async () => {
			try {
				const response = await fetch("/api/user/upgrade-status");
				const data = await response.json();

				if (data.isPro) {
					// User has been upgraded!
					clearInterval(pollInterval);
					setHasPendingRequest(false);

					// Refresh session to get updated user data
					await fetch("/api/auth/session/refresh", { method: "POST" });

					toast.success("Upgrade berhasil! Selamat datang di PRO!");

					// Redirect to chat
					setTimeout(() => {
						window.location.href = "/chat"; // Force reload to ensure session is fresh
					}, 1500);
				}
			} catch (error) {
				console.error("Error polling upgrade status:", error);
			}
		}, 3000); // Poll every 3 seconds

		return () => clearInterval(pollInterval);
	}, [hasPendingRequest, user]);

	const handleUpgrade = async (planName: string) => {
		setSelectedPlan(planName);

		if (!user) {
			toast.error("Silakan login terlebih dahulu");
			router.push("/login?callbackUrl=/plan");
			return;
		}

		const plan = pricingPlans.find((p) => p.name === planName);
		if (!plan) return;

		setLoading(true);

		try {
			// Parsing the price from string like "Rp 30.000" to Number 30000
			const rawPriceString = plan.price.replace(/[^0-9]/g, "");
			const priceNumber = parseInt(rawPriceString, 10) || 0;
			const months = plan.period.includes("year") ? 12 : 1;

			// Call internal invoice API
			const res = await fetch("/api/payment/create-invoice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					planId: planName,
					price: priceNumber,
					months,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Gagal membuat invoice");
			}

			if (data.checkoutUrl) {
				toast.success("Mengarahkan ke pembayaran...");
				window.location.href = data.checkoutUrl;
			} else if (data.fallback) {
				toast.success("Menghubungi Admin via WhatsApp...");
				const text = `Halo Admin, saya ingin upgrade ke paket *${planName}* seharga ${plan.price} untuk akun saya dengan email *${user.email}*. Mohon panduannya.`;
				const waUrl = `https://wa.me/6285191689131?text=${encodeURIComponent(text)}`;
				window.open(waUrl, "_blank");
			} else {
				throw new Error("Checkout URL tidak ditemukan");
			}
		} catch (error) {
			console.error("Gagal memproses upgrade:", error);
			toast.error(error instanceof Error ? error.message : "Gagal memproses upgrade. Coba lagi nanti.");
		} finally {
			setLoading(false);
			setTimeout(() => {
				setSelectedPlan(null);
			}, 500);
		}
	};

	const slotsRemaining = TOTAL_EARLY_ADOPTER_SLOTS - SLOTS_TAKEN;
	const slotPercentage = (SLOTS_TAKEN / TOTAL_EARLY_ADOPTER_SLOTS) * 100;

	return (
		<div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
			{/* Background Effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
				<div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
			</div>

			<div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
				{/* Back Button */}
				<Link
					className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
					href="/chat"
				>
					<ArrowLeft className="h-4 w-4" />
					Kembali ke Chat
				</Link>

				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
						Pilih Paket Anda
					</h1>
					<p className="text-zinc-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
						Tidak ada biaya tersembunyi. Upgrade kapan saja, downgrade kapan
						saja.
					</p>
					<p className="text-sm text-zinc-400 dark:text-gray-500 mt-2">
						Pakai gratis selamanya atau upgrade untuk fitur unlimited
					</p>
				</div>

				{/* FOMO / Scarcity Banner */}
				<div className="max-w-2xl mx-auto mb-12">
					<div className="relative overflow-hidden rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-4 sm:p-5">
						<div className="flex items-center justify-center gap-3 flex-wrap">
							<div className="flex items-center gap-2">
								<Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
								<span className="text-sm font-bold text-amber-800 dark:text-amber-300">
									Promo Early Adopter
								</span>
							</div>
							<div className="h-4 w-px bg-amber-400/50 hidden sm:block" />
							<div className="flex items-center gap-2">
								<Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
								<span className="text-sm text-amber-700 dark:text-amber-200">
									<span className="font-extrabold text-red-600 dark:text-red-400">{slotsRemaining}</span> dari {TOTAL_EARLY_ADOPTER_SLOTS} slot tersedia
								</span>
							</div>
							<div className="h-4 w-px bg-amber-400/50 hidden sm:block" />
							<span className="text-xs text-amber-600/80 dark:text-amber-400/60 font-medium">
								Harga naik 2x setelah slot habis
							</span>
						</div>
						{/* Progress bar showing slots taken */}
						<div className="mt-3 h-1.5 rounded-full bg-amber-200 dark:bg-amber-900/50 overflow-hidden">
							<div
								className="h-full rounded-full bg-linear-to-r from-amber-500 to-red-500 transition-all duration-1000"
								style={{ width: `${slotPercentage}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Pricing Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{pricingPlans.map((plan) => (
						<div
							className={`relative rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
								plan.popular
									? "border-2 border-indigo-400/50 dark:border-indigo-500/40 bg-linear-to-b from-indigo-50 via-white to-purple-50 dark:from-indigo-950/50 dark:via-zinc-900/50 dark:to-purple-950/30 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/15"
									: "border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-white/20 shadow-sm hover:shadow-md"
							}`}
							key={plan.name}
						>
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full text-xs font-semibold shadow-lg shadow-indigo-500/30 text-white flex items-center gap-1.5">
									<Zap className="w-3 h-3" />
									Paling Populer
								</div>
							)}

							<div className="mb-8">
								<p className="font-semibold text-zinc-900 dark:text-white text-lg mb-2">
									{plan.name}
								</p>
								<div className="flex items-end gap-2 mb-1">
									{plan.originalPrice && (
										<span className="text-lg text-zinc-400 dark:text-gray-500 line-through mb-1">
											{plan.originalPrice}
										</span>
									)}
									<span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
										{plan.price}
									</span>
									<span className="text-sm text-zinc-400 dark:text-gray-500 mb-2">
										/ {plan.period}
									</span>
								</div>
								{plan.originalPrice && (
									<span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full mb-2">
										HEMAT 50%
									</span>
								)}
								<p className="text-sm text-zinc-500 dark:text-gray-400 leading-relaxed">
									{plan.desc}
								</p>
							</div>

							<ul className="space-y-4 mb-8">
								{plan.features.map((feat) => (
									<li
										className="flex items-start gap-3 text-sm text-zinc-600 dark:text-gray-300"
										key={feat}
									>
										<Check className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
										<span className="leading-relaxed">{feat}</span>
									</li>
								))}
							</ul>

							<Button
								className={`w-full justify-center h-11 rounded-2xl font-medium transition-all ${
									plan.popular
										? "bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
										: plan.ctaDisabled
											? "bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-gray-400 cursor-not-allowed"
											: "bg-zinc-900 dark:bg-white/10 hover:bg-zinc-800 dark:hover:bg-white/20 text-white"
								}`}
								disabled={plan.ctaDisabled || loading}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									if (!plan.ctaDisabled) {
										handleUpgrade(plan.name);
									}
								}}
								type="button"
							>
								{loading && selectedPlan === plan.name
									? "Processing..."
									: plan.ctaText}
							</Button>
						</div>
					))}
				</div>

				{/* Price Comparison Banner */}
				<div className="max-w-2xl mx-auto mt-12 mb-8">
					<div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-6 text-center">
						<p className="text-sm text-zinc-500 dark:text-gray-400 mb-2">Perbandingan Harga</p>
						<div className="flex items-center justify-center gap-4 flex-wrap">
							<div className="text-center">
								<p className="text-xs text-zinc-400 dark:text-gray-500">ChatGPT Plus</p>
								<p className="text-lg font-bold text-zinc-400 dark:text-gray-500 line-through">~Rp 310.000</p>
							</div>
							<span className="text-zinc-300 dark:text-gray-600 text-2xl">vs</span>
							<div className="text-center">
								<p className="text-xs text-indigo-600 dark:text-indigo-400">Ultramaxo Pro</p>
								<p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Rp 15.000</p>
							</div>
						</div>
						<p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">Kemampuan setara, 20x lebih hemat</p>
					</div>
				</div>

				{/* Footer Note */}
				<div className="text-center mt-8 space-y-4">
					<p className="text-sm text-zinc-500 dark:text-gray-500">
						Dengan melanjutkan, Anda menyetujui{" "}
						<Link
							className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline"
							href="/terms"
						>
							Syarat & Ketentuan
						</Link>{" "}
						kami.
					</p>
					<div className="flex items-center justify-center gap-6 text-xs text-zinc-400 dark:text-gray-600">
						<span>Pembayaran Aman</span>
						<span>Via DompetX</span>
						<span>Aktivasi Instant</span>
					</div>
				</div>
			</div>
		</div>
	);
}
