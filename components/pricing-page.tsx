"use client";

import { ArrowLeft, Check, Flame, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
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
	const [qrisData, setQrisData] = useState<{ qris: string, requestId: string, planName: string, price: string } | null>(null);
	const [checkStatusLoading, setCheckStatusLoading] = useState(false);

	// Auto-redirect if user is already PRO
	useEffect(() => {
		if (user?.type === "pro") {
			toast.success("Anda sudah menjadi member PRO!");
			router.push("/chat");
		}
	}, [user, router]);

	// Poll for upgrade status when there's a pending QRIS payment
	useEffect(() => {
		if (!qrisData) return;

		let currentIntervalMs = 3000;
		const maxIntervalMs = 15000;

		const pollPayment = async () => {
			if (!qrisData?.requestId) return;
			try {
				const response = await fetch(`/api/payment/check-qris?requestId=${qrisData.requestId}`);
				const data = await response.json();

				if (data.paid) {
					clearInterval(timerId);
					toast.success("🎉 Pembayaran Berhasil! Selamat datang di PRO!");
					await fetch("/api/auth/session/refresh", { method: "POST" });
					setTimeout(() => { window.location.href = "/chat"; }, 1500);
				} else {
					if (currentIntervalMs < maxIntervalMs) {
						currentIntervalMs = Math.min(currentIntervalMs + 2000, maxIntervalMs);
						scheduleNextPoll();
					}
				}
			} catch (error) {
				console.error("Error polling payment status:", error);
				scheduleNextPoll();
			}
		};

		let timerId: NodeJS.Timeout;
		const scheduleNextPoll = () => {
			timerId = setTimeout(() => {
				pollPayment();
			}, currentIntervalMs);
		};

		scheduleNextPoll();
		return () => clearTimeout(timerId);
	}, [qrisData]);

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

			if (data.qris && data.requestId) {
				setQrisData({
					qris: data.qris,
					requestId: data.requestId,
					planName: planName,
					price: plan.price,
				});
				toast.success("Silakan scan kode QRIS untuk menyelesaikan pembayaran");
			} else if (data.fallback) {
				toast.success("Menghubungi Admin via WhatsApp...");
				const text = `Halo Admin, saya ingin upgrade ke paket *${planName}* seharga ${plan.price} untuk akun saya dengan email *${user.email}*. Mohon panduannya.`;
				const waUrl = `https://wa.me/6285191689131?text=${encodeURIComponent(text)}`;
				window.open(waUrl, "_blank");
			} else {
				throw new Error("Gagal mengambil QRIS pembayaran");
			}
		} catch (error) {
			console.error("Gagal memproses upgrade:", error);
			toast.error(error instanceof Error ? error.message : "Gagal memproses upgrade. Coba lagi nanti.");
		} finally {
			setLoading(false);
			setTimeout(() => {
				if (!qrisData) setSelectedPlan(null);
			}, 500);
		}
	};
	
	const handleManualCheck = async () => {
		if (!qrisData?.requestId) return;
		setCheckStatusLoading(true);
		try {
			const res = await fetch(`/api/payment/check-qris?requestId=${qrisData.requestId}`);
			const data = await res.json();
			if (data.paid) {
				toast.success("🎉 Pembayaran Berhasil diverifikasi!");
				await fetch("/api/auth/session/refresh", { method: "POST" });
				setQrisData(null);
				setTimeout(() => { window.location.href = "/chat"; }, 1500);
			} else {
				toast.error("Pembayaran belum diterima. Pastikan Anda sudah scan dan bayar.", { duration: 4000 });
			}
		} catch (error) {
			toast.error("Gagal mengecek status.");
		} finally {
			setCheckStatusLoading(false);
		}
	};

	const slotsRemaining = TOTAL_EARLY_ADOPTER_SLOTS - SLOTS_TAKEN;

	return (
		<div className="min-h-screen bg-white dark:bg-[#09090b] font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/20">
			<div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
				{/* Back Button */}
				<Link
					className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
					href="/chat"
				>
					<ArrowLeft className="h-4 w-4" />
					Kembali ke Chat
				</Link>

				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl sm:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">
						{qrisData ? "Checkout Pembayaran" : "Tingkatkan pengalaman Anda"}
					</h1>
					{!qrisData && (
						<p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
							Pilih paket yang sesuai dengan kebutuhan Anda. Upgrade kapan saja.
						</p>
					)}
				</div>

				{/* FOMO / Scarcity Banner */}
				<div className="max-w-3xl mx-auto mb-12">
					<div className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] backdrop-blur-sm p-4 sm:p-5">
						<div className="flex items-center justify-center gap-3 flex-wrap">
							<div className="flex items-center gap-2">
								<Flame className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
								<span className="text-sm font-bold text-zinc-900 dark:text-white">
									Promo Early Adopter
								</span>
							</div>
							<div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
							<div className="flex items-center gap-2">
								<Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
								<span className="text-sm text-zinc-600 dark:text-zinc-300">
									<span className="font-bold text-indigo-600 dark:text-indigo-400">{slotsRemaining}</span> dari {TOTAL_EARLY_ADOPTER_SLOTS} slot
								</span>
							</div>
							<div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
							<span className="text-sm text-zinc-500 dark:text-zinc-400">
								Harga naik 2x setelah slot habis
							</span>
						</div>
					</div>
				</div>

				{/* Content Switch: QRIS or Plans */}
				{qrisData ? (
					<div className="flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto bg-white dark:bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-zinc-200 dark:border-white/[0.08]">
						<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Checkout {qrisData.planName}</h2>
						<p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">Scan kode QRIS di bawah ini dengan aplikasi Bank atau E-Wallet kesayangan Anda untuk membayar <b>{qrisData.price}</b>.</p>
						
						<div className="bg-white p-4 rounded-3xl shrink-0 mb-8 flex justify-center items-center w-64 h-64 border border-zinc-200 dark:border-zinc-700 relative mx-auto">
							<QRCode 
								value={qrisData.qris} 
								size={256} 
								style={{ height: "auto", maxWidth: "100%", width: "100%" }}
								viewBox={`0 0 256 256`}
							/>
						</div>

						<div className="flex flex-col gap-3 w-full max-w-[280px]">
							<Button 
								onClick={handleManualCheck} 
								disabled={checkStatusLoading}
								className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-medium"
							>
								{checkStatusLoading ? "Mengecek..." : "Saya Sudah Bayar"}
							</Button>
							<Button 
								onClick={() => { setQrisData(null); setSelectedPlan(null); }}
								variant="ghost"	
								className="w-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl h-12"
							>
								Pilih Paket Lain
							</Button>
						</div>
						<p className="mt-8 text-xs text-zinc-500 animate-pulse">Menunggu pembayaran... (Auto-verify aktif)</p>
					</div>
				) : (
					<>
						{/* Pricing Cards */}
						<div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
							{pricingPlans.map((plan) => (
								<div
									className={`relative rounded-3xl p-8 flex flex-col transition-colors ${
										plan.popular
											? "border border-indigo-500/30 bg-white dark:bg-white/[0.02] shadow-[0_0_30px_rgba(99,102,241,0.05)]"
											: "border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
									}`}
									key={plan.name}
								>
									{plan.popular && (
										<>
											<div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
											<div className="absolute top-4 right-6 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wide">
												Populer
											</div>
										</>
									)}

									<div className="mb-8 relative z-10">
										<h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">
											{plan.name}
										</h2>
										<div className="flex items-end gap-2 mb-2">
											{plan.originalPrice && (
												<span className="text-lg line-through mb-1 text-zinc-400 dark:text-zinc-500">
													{plan.originalPrice}
												</span>
											)}
											<span className="text-4xl font-bold text-zinc-900 dark:text-white">
												{plan.price}
											</span>
											<span className="text-sm mb-1 text-zinc-500 dark:text-zinc-400">
												/ {plan.period}
											</span>
										</div>
										<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
											{plan.desc}
										</p>
									</div>

									<Button
										className={`w-full justify-center h-12 rounded-xl text-base font-medium mb-8 relative z-10 transition-all ${
											plan.popular
												? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
												: plan.ctaDisabled
													? "bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-transparent"
													: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
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
											? "Memproses..."
											: plan.ctaText}
									</Button>

									<ul className="space-y-4 flex-1 relative z-10">
										{plan.features.map((feat) => (
											<li
												className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
												key={feat}
											>
												<Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.popular ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"}`} />
												<span className="leading-relaxed">{feat}</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>

						{/* Price Comparison Banner */}
						<div className="max-w-3xl mx-auto mt-12 mb-8">
							<div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-8 sm:p-10 text-center backdrop-blur-md">
								<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-200/50 dark:from-white/5 via-transparent to-transparent pointer-events-none" />
								<p className="relative z-10 text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-8 tracking-wide">Penawaran Terbaik</p>
								<div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
									<div className="text-center">
										<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">ChatGPT Plus</p>
										<p className="text-2xl font-bold text-zinc-400 dark:text-zinc-600 line-through">~Rp 310.000</p>
									</div>
									<div className="relative z-10 hidden sm:flex text-zinc-300 dark:text-zinc-600 font-medium text-lg">
										VS
									</div>
									<div className="text-center">
										<p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">Ultramaxo Pro</p>
										<p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Rp 15.000</p>
									</div>
								</div>
								<div className="relative z-10 mt-8 inline-block px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
									<p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Kemampuan Setara, Hemat 20x Lipat</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Footer Note */}
				<div className="text-center mt-12 space-y-4">
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Dengan melanjutkan, Anda menyetujui{" "}
						<Link
							className="text-zinc-900 dark:text-white underline hover:no-underline"
							href="/terms"
						>
							Syarat & Ketentuan
						</Link>{" "}
						kami.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400 dark:text-zinc-500">
						<span>Pembayaran Aman</span>
						<span>Status: Terverifikasi</span>
						<span>Aktivasi Instant</span>
					</div>
				</div>
			</div>
		</div>
	);
}
