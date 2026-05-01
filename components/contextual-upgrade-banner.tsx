"use client";

import { ArrowRight, Flame, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ContextualUpgradeBannerProps {
	messageCount: number;
	isRateLimited?: boolean;
	userType?: string;
}

const TRIGGER_THRESHOLD = 5;
const DISMISS_KEY = "ultra-upgrade-banner-dismissed";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function ContextualUpgradeBanner({
	messageCount,
	isRateLimited = false,
	userType = "regular",
}: ContextualUpgradeBannerProps) {
	const [visible, setVisible] = useState(false);
	const [mode, setMode] = useState<"milestone" | "rateLimit">("milestone");

	useEffect(() => {
		// Don't show to Pro users
		if (userType === "pro") return;

		// Check if dismissed recently
		const dismissedAt = localStorage.getItem(DISMISS_KEY);
		if (dismissedAt) {
			const elapsed = Date.now() - parseInt(dismissedAt, 10);
			if (elapsed < DISMISS_COOLDOWN_MS) return;
		}

		// Rate limit takes priority
		if (isRateLimited) {
			setMode("rateLimit");
			setVisible(true);
			return;
		}

		// Show after reaching message threshold
		if (
			messageCount >= TRIGGER_THRESHOLD &&
			messageCount % TRIGGER_THRESHOLD === 0
		) {
			setMode("milestone");
			setVisible(true);
		}
	}, [messageCount, isRateLimited, userType]);

	const dismiss = () => {
		setVisible(false);
		localStorage.setItem(DISMISS_KEY, Date.now().toString());
	};

	if (!visible) return null;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
			{mode === "rateLimit" ? (
				<div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 p-5 shadow-lg shadow-amber-500/5">
					<button
						className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-300 transition-colors"
						onClick={dismiss}
						type="button"
					>
						<X className="w-4 h-4" />
					</button>

					<div className="flex items-start gap-4">
						<div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
							<Flame className="w-5 h-5 text-amber-400 animate-pulse" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-bold text-amber-200 mb-1">
								Batas percakapan gratis tercapai
							</h3>
							<p className="text-xs text-amber-300/70 leading-relaxed mb-3">
								Anda telah mencapai batas permintaan. Upgrade ke Pro untuk chat
								tanpa batas, tanpa antri.
							</p>
							<div className="flex items-center gap-3 flex-wrap">
								<Link
									className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 transition-all"
									href="/plan"
								>
									<Zap className="w-3.5 h-3.5" />
									Upgrade Pro — Rp 15.000/bln
								</Link>
								<span className="text-xs text-amber-400/50 line-through">
									Rp 30.000
								</span>
								<span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full">
									HEMAT 50%
								</span>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-linear-to-r from-indigo-950/30 via-purple-950/20 to-indigo-950/30 p-5 shadow-lg shadow-indigo-500/5">
					<button
						className="absolute top-3 right-3 text-indigo-400/60 hover:text-indigo-300 transition-colors"
						onClick={dismiss}
						type="button"
					>
						<X className="w-4 h-4" />
					</button>

					<div className="flex items-start gap-4">
						<div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-indigo-400" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-bold text-indigo-200 mb-1">
								Anda sudah mengirim {messageCount} pesan hari ini
							</h3>
							<p className="text-xs text-indigo-300/70 leading-relaxed mb-3">
								Nikmati chat tanpa batas, riwayat permanen, dan full artifact
								system dengan upgrade ke Pro.
							</p>
							<div className="flex items-center gap-3 flex-wrap">
								<Link
									className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all"
									href="/plan"
								>
									<ArrowRight className="w-3.5 h-3.5" />
									Lihat Paket Pro
								</Link>
								<button
									className="text-xs text-indigo-400/60 hover:text-indigo-300 transition-colors"
									onClick={dismiss}
									type="button"
								>
									Nanti saja
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
