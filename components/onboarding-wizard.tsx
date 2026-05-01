"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ChevronRight,
	Send,
	ShieldAlert,
	Sparkles,
	TerminalSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function OnboardingWizard() {
	const { data: session, status } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState<1 | 2>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		// Only show for authenticated non-guest users who haven't completed onboarding
		if (status === "authenticated" && session?.user) {
			// Don't show for guest users
			if (session.user.type === "guest") return;

			// If onboardingReason is already set in DB, user has completed onboarding
			if (session.user.onboardingReason) return;

			// Show onboarding for new users who haven't selected a reason yet
			const timer = setTimeout(() => setIsOpen(true), 1500);
			return () => clearTimeout(timer);
		}
	}, [status, session]);

	const handleSelectReason = async (reason: string) => {
		if (!session?.user?.id) return;

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/user/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason }),
			});

			if (response.ok) {
				setStep(2);
			} else {
				toast.error("Gagal menyimpan preferensi. Silakan coba lagi.");
			}
		} catch (_error) {
			toast.error("Terjadi kesalahan jaringan.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFinish = () => {
		setIsOpen(false);
	};

	const REASONS = [
		{
			id: "Belajar Hacking & CTF",
			title: "Keamanan Siber & CTF",
			description:
				"Mempelajari kerentanan sistem, eksploitasi, dan teknik pertahanan.",
			icon: <ShieldAlert className="text-red-500" size={24} />,
		},
		{
			id: "Koding Ekstrem",
			title: "Pengembangan Perangkat Lunak",
			description:
				"Membangun aplikasi kompleks dengan bantuan AI tanpa sensor.",
			icon: <TerminalSquare className="text-blue-500" size={24} />,
		},
		{
			id: "Eksplorasi Bebas",
			title: "Eksplorasi Kapabilitas AI",
			description:
				"Menguji batas kecerdasan buatan dalam memberikan solusi tak terbatas.",
			icon: <Sparkles className="text-amber-500" size={24} />,
		},
	];

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60">
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 10 }}
					transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
					className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
				>
					{/* Header */}
					<div className="relative p-6 sm:p-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e]">
						<div className="flex items-center gap-3">
							<div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
								<Sparkles
									size={20}
									className="text-zinc-500 dark:text-zinc-100"
								/>
							</div>
							<div>
								<h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
									{step === 1
										? "Selamat Datang di Ultramaxo"
										: "Bergabung dengan Komunitas"}
								</h2>
								<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
									{step === 1
										? "Mari sesuaikan pengalaman Anda untuk hasil yang lebih terarah."
										: "Langkah terakhir sebelum Anda memulai eksplorasi."}
								</p>
							</div>
						</div>
					</div>

					{/* Body */}
					<div className="p-6 sm:p-8 bg-white dark:bg-zinc-950">
						{step === 1 ? (
							<div className="space-y-6">
								<div className="space-y-3">
									<h3 className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
										Pilih Tujuan Utama Anda
									</h3>
									<div className="grid grid-cols-1 gap-3">
										{REASONS.map((option) => (
											<button
												key={option.id}
												onClick={() => handleSelectReason(option.id)}
												disabled={isSubmitting}
												className="flex items-center gap-4 w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<div className="size-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
													{option.icon}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
														{option.title}
													</p>
													<p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 pr-4 line-clamp-2">
														{option.description}
													</p>
												</div>
												<ChevronRight className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
											</button>
										))}
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-6 text-center py-4">
								<div className="mx-auto size-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
									<Send size={40} className="text-blue-500" />
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">
									Akses Komunitas Khusus
								</h3>
								<p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
									Bergabunglah dengan grup Telegram kami untuk berdiskusi dengan
									sesama pengembang, berbagi teknik lanjutan, dan mendapatkan
									pembaruan eksklusif seputar ekosistem Ultramaxo.
								</p>

								<div className="pt-8 flex flex-col sm:flex-row items-center gap-3 justify-center border-t border-zinc-200 dark:border-zinc-800 mt-8">
									<button
										onClick={handleFinish}
										className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
									>
										Mungkin Nanti
									</button>
									<a
										href="https://t.me/+CQR8SWdH5nE2OTdk"
										target="_blank"
										rel="noopener noreferrer"
										onClick={handleFinish}
										className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
									>
										Bergabung ke Telegram <ChevronRight size={16} />
									</a>
								</div>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
