"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
	const router = useRouter();

	const [isSuccessful, setIsSuccessful] = useState(false);
	const [verificationSent, setVerificationSent] = useState(false);

	const [state, formAction] = useActionState<RegisterActionState, FormData>(
		register,
		{
			status: "idle",
		},
	);

	const { update: updateSession } = useSession();

	// biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
	useEffect(() => {
		if (state.status === "failed") {
			toast({
				type: "error",
				description: "Gagal membuat akun!",
			});
		} else if (state.status === "invalid_data") {
			toast({
				type: "error",
				description: "Gagal memvalidasi data Anda!",
			});
		} else if (state.status === "user_exists") {
			toast({
				type: "error",
				description: "Email sudah terdaftar!",
			});
		} else if (state.status === "username_exists") {
			toast({
				type: "error",
				description: "Username sudah dipakai!",
			});
		} else if (state.status === "password_mismatch") {
			toast({
				type: "error",
				description: "Password tidak sama!",
			});
		} else if (state.status === "invalid_code") {
			toast({
				type: "error",
				description: "Kode verifikasi tidak valid!",
			});
		} else if (state.status === "verification_sent") {
			setIsSuccessful(true);
			setVerificationSent(true);
		} else if (state.status === "success") {
			setIsSuccessful(true);
			updateSession();
			router.refresh();
			router.push("/chat");
		}
	}, [state.status]);

	return (
		<div className="flex min-h-dvh w-full overflow-y-auto bg-background">
			{/* Left Panel — Brand */}
			<div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-zinc-950 dark:bg-black flex-col justify-between p-10 xl:p-14">
				{/* Gradient overlays */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.03),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-size-[20px_20px] opacity-[0.03]" />

				{/* Logo */}
				<div className="relative z-10">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
							<span className="text-white font-bold text-sm">U</span>
						</div>
						<span className="text-white font-semibold text-lg tracking-tight">
							Ultramaxo
						</span>
					</div>
				</div>

				{/* Headline + Features */}
				<div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
					<h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
						Start building
						<br />
						<span className="text-zinc-300">something great.</span>
					</h2>
					<p className="mt-5 text-zinc-400 text-base leading-relaxed">
						Create a free account and get instant access to all AI workspace
						features.
					</p>

					{/* Feature highlights */}
					<div className="mt-8 flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
								<svg
									className="w-4 h-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">
								Instant access without setup
							</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
								<svg
									className="w-4 h-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">
								Powerful AI for coding, analysis, and research
							</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
								<svg
									className="w-4 h-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
									/>
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">
								No time limits, no credit card required
							</span>
						</div>
					</div>
				</div>

				{/* Social Proof Footer */}
				<div className="relative z-10">
					<div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4">
						<div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
							<svg
								className="w-5 h-5 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<div>
							<p className="text-white text-sm font-semibold">
								Ready to use instantly
							</p>
							<p className="text-zinc-500 text-xs">
								No setup required. Sign up and start.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Right Panel — Form */}
			<div className="flex flex-1 items-center justify-center border-zinc-200 border-l bg-background p-4 py-8 dark:border-white/10 sm:p-10 lg:p-14">
				<div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-700 relative z-10">
					{/* Mobile only: show logo */}
					<div className="mb-8 lg:hidden">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white/10 flex items-center justify-center">
								<span className="text-white font-bold text-sm">U</span>
							</div>
							<span className="text-foreground font-semibold text-lg tracking-tight">
								Ultramaxo
							</span>
						</div>
					</div>

					{verificationSent ? (
						<div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-2xl border border-zinc-200 dark:border-white/10 text-center flex flex-col items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center mb-2">
								<svg
									className="w-8 h-8 text-zinc-900 dark:text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
								Check Your Email
							</h2>
							<p className="text-muted-foreground text-sm leading-relaxed mb-4">
								We've sent a verification link to your registered email address.
								Please click the link to complete your registration.
							</p>
							<p className="text-zinc-500 text-xs italic bg-zinc-100 dark:bg-white/5 p-3 rounded-xl w-full border border-zinc-200 dark:border-white/5">
								You may close this page now.
							</p>
						</div>
					) : (
						<>
							<AuthForm action={formAction} defaultEmail="" type="register">
								<SubmitButton isSuccessful={isSuccessful}>
									Create Account
								</SubmitButton>
							</AuthForm>
							<p className="mt-6 text-center text-muted-foreground text-sm">
								Already have an account?{" "}
								<Link
									className="text-foreground/80 hover:text-foreground transition-colors font-semibold"
									href="/login"
								>
									Sign in here
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
