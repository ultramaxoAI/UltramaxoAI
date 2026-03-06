"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
		price: "Rp 30.000",
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
		price: "Rp 150.000",
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

					toast.success("🎉 Upgrade berhasil! Selamat datang di PRO!");

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

		// If user is not logged in, redirect to login
		if (!user) {
			toast.error("Silakan login terlebih dahulu");
			router.push("/login");
			return;
		}

		const plan = pricingPlans.find((p) => p.name === planName);
		if (!plan) return;

		setLoading(true);

		try {
			const text = `Halo Admin, saya ingin upgrade ke paket *${planName}* seharga ${plan.price} untuk akun saya dengan email *${user.email}*. Mohon panduannya.`;
			const waUrl = `https://wa.me/6285191689131?text=${encodeURIComponent(text)}`;

			// Optionally log the request to the database
			await fetch("/api/user/upgrade-request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					plan: planName,
					price: plan.price,
				}),
			}).catch(() => {});

			toast.success("Mengarahkan ke WhatsApp Admin...");
			window.open(waUrl, "_blank");
		} catch (error) {
			console.error("Failed to process upgrade:", error);
			toast.error("Terjadi kesalahan. Silakan coba lagi.");
		} finally {
			setLoading(false);
			setTimeout(() => setSelectedPlan(null), 500);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-zinc-950 via-zinc-900 to-black">
			{/* Background Effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
				<div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
			</div>

			<div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
				{/* Back Button */}
				<Link
					className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
					href="/chat"
				>
					<ArrowLeft className="h-4 w-4" />
					Kembali ke Chat
				</Link>

				{/* Header */}
				<div className="text-center mb-16">
					<h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
						Pilih Paket Anda
					</h1>
					<p className="text-gray-400 text-lg max-w-2xl mx-auto">
						Tidak ada biaya tersembunyi. Upgrade kapan saja, downgrade kapan
						saja.
					</p>
					<p className="text-sm text-gray-500 mt-2">
						Pakai gratis selamanya atau upgrade untuk fitur unlimited
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{pricingPlans.map((plan) => (
						<div
							className={`relative rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
								plan.popular
									? "border-2 border-indigo-500/40 bg-linear-to-b from-indigo-950/50 to-purple-950/30 shadow-[0_0_60px_rgba(99,102,241,0.15)]"
									: "border border-white/10 bg-linear-to-b from-white/5 to-white/2 hover:border-white/20"
							}`}
							key={plan.name}
						>
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full text-xs font-semibold shadow-lg shadow-indigo-500/30">
									Paling Populer
								</div>
							)}

							<div className="mb-8">
								<p className="font-semibold text-white text-lg mb-2">
									{plan.name}
								</p>
								<div className="flex items-end gap-2 mb-3">
									<span className="text-4xl font-extrabold text-white">
										{plan.price}
									</span>
									<span className="text-sm text-gray-500 mb-2">
										/ {plan.period}
									</span>
								</div>
								<p className="text-sm text-gray-400 leading-relaxed">
									{plan.desc}
								</p>
							</div>

							<ul className="space-y-4 mb-8">
								{plan.features.map((feat) => (
									<li
										className="flex items-start gap-3 text-sm text-gray-300"
										key={feat}
									>
										<Check className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
										<span className="leading-relaxed">{feat}</span>
									</li>
								))}
							</ul>

							<Button
								className={`w-full justify-center h-11 rounded-2xl font-medium transition-all ${
									plan.popular
										? "bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
										: plan.ctaDisabled
											? "bg-white/10 text-gray-400 cursor-not-allowed"
											: "bg-white/10 hover:bg-white/20 text-white"
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

				{/* Footer Note */}
				<div className="text-center mt-16 space-y-4">
					<p className="text-sm text-gray-500">
						Dengan melanjutkan, Anda menyetujui{" "}
						<Link
							className="text-indigo-400 hover:text-indigo-300 underline"
							href="/terms"
						>
							Syarat & Ketentuan
						</Link>{" "}
						kami.
					</p>
					<div className="flex items-center justify-center gap-6 text-xs text-gray-600">
						<span>🔒 Pembayaran Aman</span>
						<span>💳 Via DompetX</span>
						<span>⚡ Aktivasi Instant</span>
					</div>
				</div>
			</div>
		</div>
	);
}
