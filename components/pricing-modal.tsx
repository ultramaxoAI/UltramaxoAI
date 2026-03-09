"use client";

import { Check, X } from "lucide-react";
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

const pricingPlans = [
	{
		name: "Free",
		price: "Rp 0",
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
		name: "Pro",
		price: "Rp 30.000",
		period: "per month",
		desc: "For those who need more — completely unlimited",
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
		name: "1 Year",
		price: "Rp 150.000",
		period: "per year",
		desc: "Save more with annual plan",
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
	const [hasPendingRequest, setHasPendingRequest] = useState(false);

	// Poll for upgrade status when there's a pending request
	useEffect(() => {
		if (!hasPendingRequest || !user || !open) {
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

					// Refresh session
					await fetch("/api/auth/session/refresh", { method: "POST" });

					toast.success("🎉 Upgrade successful! Welcome to PRO!");

					// Close modal and reload
					onOpenChange(false);
					setTimeout(() => {
						window.location.reload();
					}, 1500);
				}
			} catch (error) {
				console.error("Error polling upgrade status:", error);
			}
		}, 3000);

		return () => clearInterval(pollInterval);
	}, [hasPendingRequest, user, open, onOpenChange]);

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
				// Fallback if local without API Key, fallback to WhatsApp
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
				onOpenChange(false);
				setSelectedPlan(null);
			}, 500);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-5xl border-0 bg-[#0a0a0a] p-0 overflow-hidden">
				<div className="relative border border-white/10 rounded-2xl overflow-hidden">
					{/* Close Button */}
					<button
						className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<X className="h-4 w-4 text-gray-400" />
					</button>

					{/* Header */}
					<div className="relative bg-gradient-to-b from-zinc-900 to-[#0a0a0a] pt-12 pb-8 px-8 border-b border-white/5">
						<DialogHeader className="text-center space-y-2">
							<DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
								Choose Your Plan
							</DialogTitle>
							<DialogDescription className="text-gray-400 text-base">
								No hidden fees. Upgrade anytime, downgrade anytime.
							</DialogDescription>
						</DialogHeader>
					</div>

					{/* Pricing Cards */}
					<div className="grid md:grid-cols-3 gap-6 p-8">
						{pricingPlans.map((plan, i) => (
							<div
								className={`relative rounded-2xl p-7 border backdrop-blur-sm transition-all duration-300 ${
									plan.popular
										? "border-indigo-500/40 bg-indigo-950/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
										: "border-white/10 bg-white/5 hover:border-white/20"
								}`}
								key={i}
							>
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-xs font-medium shadow-lg shadow-indigo-500/25">
										Most Popular
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
										? "Processing..."
										: plan.ctaText}
								</Button>
							</div>
						))}
					</div>

					{/* Footer note */}
					<div className="px-8 pb-8 text-center">
						<p className="text-xs text-gray-500">
							By continuing, you agree to our{" "}
							<a
								className="text-indigo-400 hover:text-indigo-300"
								href="/terms"
							>
								Terms & Conditions
							</a>
							.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
