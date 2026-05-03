"use client";

import { Check, Flame, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface PricingModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user?: User;
}

const TOTAL_EARLY_ADOPTER_SLOTS = 100;
const SLOTS_TAKEN = 8;

const pricingPlans = [
	{
		name: "Free",
		price: "Rp 0",
		originalPrice: null,
		period: "forever",
		desc: "Try all basic features at no cost",
		features: [
			"AI Chat (UltraAgent)",
			"Basic code editor",
			"Limited chat history",
			"Syntax highlighting",
			"Standard file upload",
		],
		popular: false,
		ctaText: "Current Plan",
		ctaDisabled: true,
	},
	{
		name: "Early Adopter (Pro)",
		price: "Rp 15.000",
		originalPrice: "Rp 30.000",
		period: "per month",
		desc: `Only for first ${TOTAL_EARLY_ADOPTER_SLOTS} users. Price doubles after slots run out.`,
		features: [
			"AI Chat (UltraAgent Pro)",
			"All Free features",
			"Unlimited chat",
			"Permanent chat history",
			"Complete code workspace",
			"Full artifacts system",
			"Priority support",
		],
		popular: true,
		ctaText: "Upgrade Now",
		ctaDisabled: false,
	},
	{
		name: "1 Tahun",
		price: "Rp 150.000",
		originalPrice: "Rp 360.000",
		period: "per tahun",
		desc: "Hemat 58% dengan komitmen tahunan",
		features: [
			"All Pro features",
			"Dedicated support",
			"Custom deployment",
			"SLA guarantee",
			"Advanced analytics",
		],
		popular: false,
		ctaText: "Upgrade Now",
		ctaDisabled: false,
	},
];

export function PricingModal({ open, onOpenChange, user }: PricingModalProps) {
	const router = useRouter();
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [qrisData, setQrisData] = useState<{
		qris: string;
		requestId: string;
		planName: string;
		price: string;
		checkoutUrl?: string | null;
	} | null>(null);
	const [checkStatusLoading, setCheckStatusLoading] = useState(false);

	// Poll for upgrade status when there's a pending QRIS payment
	useEffect(() => {
		if (!qrisData || !open) {
			return;
		}

		let currentIntervalMs = 3000;
		const maxIntervalMs = 15000;

		const pollPayment = async () => {
			if (!qrisData?.requestId) return;
			try {
				const response = await fetch(
					`/api/payment/check-qris?requestId=${qrisData.requestId}`,
				);
				const data = await response.json();

				if (data.paid) {
					// User has been upgraded!
					toast.success("🎉 Pembayaran Berhasil! Selamat datang di PRO!");

					// Refresh session
					await fetch("/api/auth/session/refresh", { method: "POST" });

					// Close modal and reload
					onOpenChange(false);
					setQrisData(null);
					setTimeout(() => window.location.reload(), 1500);
				} else {
					// Exponential backoff
					if (currentIntervalMs < maxIntervalMs) {
						currentIntervalMs = Math.min(
							currentIntervalMs + 2000,
							maxIntervalMs,
						);
						scheduleNextPoll();
					}
				}
			} catch (error) {
				console.error("Error polling payment status:", error);
				// Still try to poll again even on error to be safe
				scheduleNextPoll();
			}
		};

		let timerId: NodeJS.Timeout;
		const scheduleNextPoll = () => {
			timerId = setTimeout(() => {
				pollPayment();
			}, currentIntervalMs);
		};

		// Start first poll
		scheduleNextPoll();

		return () => clearTimeout(timerId);
	}, [qrisData, open, onOpenChange]);

	const handleUpgrade = async (planName: string) => {
		setSelectedPlan(planName);

		if (!user) {
			toast.error("Please log in first");
			router.push("/login");
			return;
		}

		const plan = pricingPlans.find((p) => p.name === planName);
		if (!plan) return;

		setLoading(true);

		try {
			// Parsing the price from string like "Rp 30.000" or "Rp 150.000" to Number 30000 / 150000
			const rawPriceString = plan.price.replace(/[^0-9]/g, "");
			const priceNumber = parseInt(rawPriceString, 10) || 0;
			const months =
				plan.period.includes("tahun") || plan.period.includes("year") ? 12 : 1;

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

			if ((data.qris || data.checkoutUrl) && data.requestId) {
				setQrisData({
					qris: data.qris || "",
					requestId: data.requestId,
					planName: planName,
					price: plan.price,
					checkoutUrl: data.checkoutUrl || null,
				});
				toast.success(
					data.qris
						? "Silakan scan kode QRIS untuk menyelesaikan pembayaran"
						: "Checkout YoBasePay siap dibuka",
				);
			} else {
				throw new Error("Gagal mengambil data pembayaran");
			}
		} catch (error) {
			console.error("Gagal memproses upgrade:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Gagal memproses upgrade. Coba lagi nanti.",
			);
		} finally {
			setLoading(false);
			setTimeout(() => {
				// Don't reset selected plan if currently showing QRIS
				if (!qrisData) setSelectedPlan(null);
			}, 500);
		}
	};

	const handleManualCheck = async () => {
		if (!qrisData?.requestId) return;
		setCheckStatusLoading(true);
		try {
			const res = await fetch(
				`/api/payment/check-qris?requestId=${qrisData.requestId}`,
			);
			const data = await res.json();
			if (data.paid) {
				toast.success("🎉 Pembayaran Berhasil diverifikasi!");
				await fetch("/api/auth/session/refresh", { method: "POST" });
				onOpenChange(false);
				setQrisData(null);
				setTimeout(() => window.location.reload(), 1500);
			} else {
				toast.error(
					"Pembayaran belum diterima. Pastikan Anda sudah scan dan bayar.",
					{ duration: 4000 },
				);
			}
		} catch (_error) {
			toast.error("Gagal mengecek status.");
		} finally {
			setCheckStatusLoading(false);
		}
	};

	const handleBack = () => {
		setQrisData(null);
		setSelectedPlan(null);
	};

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) handleBack();
				onOpenChange(open);
			}}
			open={open}
		>
			<DialogContent className="max-w-5xl border-0 bg-white dark:bg-[#09090b] p-0 overflow-hidden shadow-2xl">
				<div className="relative border border-zinc-200 dark:border-white/[0.08] rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] backdrop-blur-sm">
					{/* Close Button */}
					<button
						type="button"
						className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<X className="h-4 w-4 text-zinc-500 dark:text-gray-400" />
					</button>

					{qrisData ? (
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
								Checkout {qrisData.planName}
							</h2>
							<p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
								{qrisData.qris
									? "Scan kode QRIS di bawah ini dengan aplikasi Bank atau E-Wallet kesayangan Anda untuk membayar "
									: "Lanjutkan pembayaran lewat halaman checkout YoBasePay untuk membayar "}
								<b>{qrisData.price}</b>.
							</p>

							{qrisData.qris ? (
								<div className="bg-white p-4 rounded-3xl shrink-0 mb-8 flex justify-center items-center overflow-hidden w-64 h-64 border border-zinc-200 dark:border-zinc-700 relative mx-auto shadow-sm">
									<img
										src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisData.qris)}&color=0a0a0a`}
										alt="QRIS Payment"
										className="w-full h-full object-contain mix-blend-multiply"
									/>
								</div>
							) : null}

							<div className="flex flex-col gap-3 w-full max-w-[280px]">
								{qrisData.checkoutUrl ? (
									<Button
										onClick={() =>
											window.open(qrisData.checkoutUrl || "", "_blank")
										}
										variant="outline"
										className="w-full rounded-xl h-12"
									>
										Buka Checkout YoBasePay
									</Button>
								) : null}
								<Button
									onClick={handleManualCheck}
									disabled={checkStatusLoading}
									className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-medium"
								>
									{checkStatusLoading ? "Mengecek..." : "Saya Sudah Bayar"}
								</Button>
								<Button
									onClick={handleBack}
									variant="ghost"
									className="w-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl h-12"
								>
									Pilih Paket Lain
								</Button>
							</div>
							<p className="mt-8 text-xs text-zinc-500 animate-pulse">
								Menunggu pembayaran... (Auto-verify aktif)
							</p>
						</div>
					) : (
						<>
							{/* Header */}
							<div className="relative pt-12 pb-6 px-8 border-b border-zinc-200 dark:border-white/[0.08] z-10">
								<DialogHeader className="text-center space-y-2">
									<DialogTitle className="text-3xl font-bold text-zinc-900 dark:text-white">
										Choose Your Plan
									</DialogTitle>
									<DialogDescription className="text-zinc-600 dark:text-zinc-400 text-base">
										No hidden fees. Upgrade anytime, downgrade anytime.
									</DialogDescription>
								</DialogHeader>
								{/* FOMO Banner */}
								<div className="max-w-md mx-auto mt-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-3 backdrop-blur-sm">
									<div className="flex items-center justify-center gap-2 flex-wrap text-sm">
										<Flame className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
										<span className="font-bold text-zinc-900 dark:text-white">
											Early Adopter
										</span>
										<div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
										<span className="text-zinc-600 dark:text-zinc-300">
											<span className="font-extrabold text-indigo-600 dark:text-indigo-400">
												{TOTAL_EARLY_ADOPTER_SLOTS - SLOTS_TAKEN}
											</span>
											/{TOTAL_EARLY_ADOPTER_SLOTS} slot
										</span>
									</div>
								</div>
							</div>

							{/* Pricing Cards */}
							<div className="grid md:grid-cols-3 gap-6 p-8 relative z-10">
								{pricingPlans.map((plan) => (
									<div
										className={`relative rounded-3xl p-7 flex flex-col transition-colors ${
											plan.popular
												? "border border-indigo-500/30 bg-white dark:bg-white/[0.02] shadow-[0_0_30px_rgba(99,102,241,0.05)]"
												: "border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
										}`}
										key={plan.name}
									>
										{plan.popular && (
											<>
												<div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
												<div className="absolute top-4 right-5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wide">
													Populer
												</div>
											</>
										)}

										<div className="mb-7 mt-2 relative z-10">
											<p className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
												{plan.name}
											</p>
											<div className="flex items-end gap-1.5 mb-2">
												{plan.originalPrice && (
													<span className="text-sm line-through mb-1 text-zinc-400 dark:text-zinc-500">
														{plan.originalPrice}
													</span>
												)}
												<span className="text-3xl font-bold text-zinc-900 dark:text-white">
													{plan.price}
												</span>
												<span className="text-xs mb-1 text-zinc-500 dark:text-zinc-400">
													/ {plan.period}
												</span>
											</div>
											<p className="text-sm text-zinc-600 dark:text-zinc-400">
												{plan.desc}
											</p>
										</div>

										<ul className="space-y-4 mb-8 flex-1 relative z-10">
											{plan.features.map((feat, j) => (
												<li
													className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
													key={`${plan.name}-feat-${j}`}
												>
													<Check
														className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"}`}
													/>
													{feat}
												</li>
											))}
										</ul>

										<Button
											className={`w-full justify-center h-12 rounded-xl text-sm font-medium relative z-10 transition-all ${
												plan.popular
													? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
													: plan.ctaDisabled
														? "bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-transparent"
														: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
											}`}
											disabled={
												plan.ctaDisabled ||
												loading ||
												(!user && plan.name !== "Free")
											}
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
									</div>
								))}
							</div>

							{/* Footer note */}
							<div className="px-8 pb-8 text-center text-zinc-500 dark:text-zinc-400">
								<p className="text-xs">
									By continuing, you agree to our{" "}
									<a
										className="text-zinc-900 dark:text-white underline hover:no-underline"
										href="/terms"
									>
										Terms & Conditions
									</a>
									.
								</p>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
