"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ChevronRight,
	Send,
	ShieldAlert,
	Sparkles,
	TerminalSquare,
	Workflow,
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
				const payload = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				toast.error(
					payload?.error || "Gagal menyimpan preferensi. Silakan coba lagi.",
				);
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
			id: "Membangun produk lebih cepat",
			title: "Build Faster",
			description:
				"Saya ingin menulis, menguji, dan mengirim pekerjaan lebih cepat dengan bantuan AI.",
			icon: <TerminalSquare className="text-cyan-400" size={24} />,
		},
		{
			id: "Menggunakan API platform",
			title: "Use the API",
			description:
				"Saya butuh akses model, key management, dan endpoint yang siap dipakai di workflow developer.",
			icon: <Workflow className="text-emerald-400" size={24} />,
		},
		{
			id: "Eksplorasi workspace AI",
			title: "Explore the Workspace",
			description:
				"Saya ingin mencoba chat, dokumen, artifact, dan cara kerja Ultramaxo secara langsung.",
			icon: <Sparkles className="text-amber-400" size={24} />,
		},
		{
			id: "Bergabung dengan komunitas",
			title: "Join the Community",
			description:
				"Saya datang dari komunitas, teman, atau ingin ikut diskusi dan update seputar Ultramaxo.",
			icon: <ShieldAlert className="text-violet-400" size={24} />,
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
					className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#08090c] shadow-[0_32px_120px_rgba(0,0,0,0.55)]"
				>
					<div className="relative border-white/10 border-b bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
						<div className="flex items-center gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
								<Sparkles size={20} className="text-cyan-300" />
							</div>
							<div>
								<h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
									{step === 1
										? "Selamat datang di Ultramaxo"
										: "Masuk ke komunitas"}
								</h2>
								<p className="mt-1 text-sm text-white/60">
									{step === 1
										? "Pilih alasan utama Anda bergabung agar pengalaman awal terasa lebih relevan."
										: "Satu langkah ringan sebelum Anda mulai memakai workspace."}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-[#08090c] p-6 sm:p-8">
						{step === 1 ? (
							<div className="space-y-6">
								<div className="space-y-3">
									<h3 className="text-xs font-bold tracking-[0.24em] text-white/45 uppercase">
										Why Ultramaxo
									</h3>
									<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
										{REASONS.map((option) => (
											<button
												key={option.id}
												onClick={() => handleSelectReason(option.id)}
												disabled={isSubmitting}
												className="group flex w-full items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-50"
												type="button"
											>
												<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 transition-transform duration-300 group-hover:scale-105">
													{option.icon}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-base font-bold text-white">
														{option.title}
													</p>
													<p className="mt-1 pr-2 text-xs text-white/58 sm:text-sm">
														{option.description}
													</p>
												</div>
												<ChevronRight className="shrink-0 text-white/30 transition-colors group-hover:text-cyan-300" />
											</button>
										))}
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-6 text-center py-4">
								<div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-[24px] border border-cyan-400/20 bg-cyan-400/10">
									<Send size={40} className="text-cyan-300" />
								</div>
								<h3 className="mb-2 text-lg font-bold text-white sm:text-xl">
									Join komunitas Ultramaxo
								</h3>
								<p className="mx-auto max-w-md text-sm leading-relaxed text-white/60">
									Masuk ke grup Telegram untuk update produk, diskusi sesama
									pengguna, dan jalur komunikasi paling cepat dengan komunitas.
								</p>

								<div className="mt-8 flex flex-col items-center justify-center gap-3 border-white/10 border-t pt-8 sm:flex-row">
									<button
										onClick={handleFinish}
										className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white/55 transition-colors hover:bg-white/5 hover:text-white sm:w-auto"
										type="button"
									>
										Mungkin Nanti
									</button>
									<a
										href="https://whatsapp.com/channel/0029VbCYCY6HltYHdOeG660L"
										target="_blank"
										rel="noopener noreferrer"
										onClick={handleFinish}
										className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-cyan-50 sm:w-auto"
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
