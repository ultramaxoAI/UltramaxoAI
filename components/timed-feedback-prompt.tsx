"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const FEEDBACK_DELAY_MS = 60 * 1000;
const EXCLUDED_PATH_PREFIXES = [
	"/admin",
	"/login",
	"/register",
	"/verify",
	"/forgot-password",
	"/reset-password",
	"/oauth",
	"/maintenance",
];

function isExcludedPath(pathname: string) {
	return EXCLUDED_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

export function TimedFeedbackPrompt() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const [isOpen, setIsOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const eligibility = useMemo(() => {
		if (status !== "authenticated" || !session?.user?.id) {
			return {
				eligible: false,
				storageKey: null,
			};
		}

		if (session.user.role === "admin" || isExcludedPath(pathname)) {
			return {
				eligible: false,
				storageKey: null,
			};
		}

		return {
			eligible: true,
			storageKey: `timed-feedback:${session.user.id}:v1`,
			showAtKey: `timed-feedback:${session.user.id}:v1:show-at`,
		};
	}, [pathname, session?.user?.id, session?.user?.role, status]);

	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		if (
			!eligibility.eligible ||
			!eligibility.storageKey ||
			!("showAtKey" in eligibility) ||
			!eligibility.showAtKey
		) {
			setIsOpen(false);
			return;
		}

		if (window.sessionStorage.getItem(eligibility.storageKey)) {
			setIsOpen(false);
			return;
		}

		const storedShowAt = window.sessionStorage.getItem(eligibility.showAtKey);
		const showAt =
			storedShowAt !== null
				? Number(storedShowAt)
				: Date.now() + FEEDBACK_DELAY_MS;

		if (storedShowAt === null) {
			window.sessionStorage.setItem(eligibility.showAtKey, String(showAt));
		}

		const remainingMs = Math.max(0, showAt - Date.now());

		timerRef.current = setTimeout(() => {
			setIsOpen(true);
		}, remainingMs);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [eligibility]);

	const handleDismiss = () => {
		if (eligibility.storageKey) {
			window.sessionStorage.setItem(eligibility.storageKey, "dismissed");
		}
		setIsOpen(false);
	};

	const handleSubmit = async () => {
		const normalizedMessage = message.trim();

		if (!normalizedMessage) {
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/user/feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: normalizedMessage,
					source: "timed_prompt",
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || "Gagal mengirim feedback");
			}

			if (eligibility.storageKey) {
				window.sessionStorage.setItem(eligibility.storageKey, "submitted");
			}

			setMessage("");
			setIsOpen(false);
			toast({
				type: "success",
				description: "Terima kasih. Feedback kamu sudah kami simpan.",
			});
		} catch (error) {
			toast({
				type: "error",
				description:
					error instanceof Error
						? error.message
						: "Feedback belum berhasil dikirim.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[70] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[380px]">
			<div
				className={cn(
					"pointer-events-auto overflow-hidden rounded-[28px] border border-black/8 bg-[#f8f6f1]/96 p-5 text-[#171717] shadow-[0_24px_70px_rgba(17,19,21,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111315]/96 dark:text-[#f3f4f1]",
				)}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<div className="inline-flex items-center rounded-full border border-black/7 bg-white/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6e69] shadow-[0_10px_24px_rgba(16,18,20,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#8f948e] dark:shadow-none">
							Feedback
						</div>
						<div>
							<h3 className="text-[1.05rem] font-semibold tracking-[-0.03em]">
								Bantu kami tingkatkan Ultramaxo
							</h3>
							<p className="mt-1 text-sm leading-6 text-[#5f6258] dark:text-[#9ea59f]">
								Ada yang terasa kurang pas atau bisa dibuat lebih enak?
								Tulis singkat di sini.
							</p>
						</div>
					</div>

					<Button
						aria-label="Tutup feedback prompt"
						className="rounded-full text-[#7c807a] hover:text-[#171717] dark:text-[#7f857f] dark:hover:text-[#f3f4f1]"
						onClick={handleDismiss}
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<X />
					</Button>
				</div>

				<div className="mt-4 space-y-4">
					<Textarea
						className="min-h-[120px] rounded-[22px] border-black/8 bg-[#fbfaf6] px-4 py-3 text-sm leading-7 placeholder:text-[#8a8e87] focus-visible:border-[#171717] focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-[#17191b] dark:placeholder:text-[#7f857f]"
						maxLength={400}
						onChange={(event) => setMessage(event.target.value)}
						placeholder="Bagian mana yang terasa kurang nyaman, membingungkan, atau bisa dibuat lebih rapi?"
						value={message}
					/>

					<div className="flex items-end justify-between gap-4">
						<div className="space-y-1">
							<p className="text-[11px] uppercase tracking-[0.16em] text-[#8b8f88] dark:text-[#6f756f]">
								Quick note
							</p>
							<p className="text-xs leading-5 text-[#7b7f78] dark:text-[#7f857f]">
								Feedback singkat lebih berguna daripada pesan panjang.
							</p>
						</div>
						<div className="flex items-center gap-2 self-end">
							<Button
								className="rounded-full text-[#656963] hover:text-[#171717] dark:text-[#929892] dark:hover:text-[#f3f4f1]"
								onClick={handleDismiss}
								size="sm"
								type="button"
								variant="ghost"
							>
								Close
							</Button>
							<Button
								className="rounded-full bg-[#171717] px-5 text-[#f5f1ea] hover:bg-[#2b2d2f] dark:bg-[#f1eee7] dark:text-[#111315] dark:hover:bg-white"
								disabled={isSubmitting || !message.trim()}
								onClick={handleSubmit}
								size="sm"
								type="button"
							>
								{isSubmitting ? "Sending..." : "Send note"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
