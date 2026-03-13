"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

const CHAT_COOKIE_RESET_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/api/auth/clear-stale-cookies"
		: undefined;
const COOKIE_RESET_FLAG = "auth-cookie-reset-v2";

export default function Page() {
	const [isSuccessful, setIsSuccessful] = useState(false);

	useEffect(() => {
		const resetCookies = async () => {
			if (typeof window === "undefined") {
				return;
			}

			if (window.sessionStorage.getItem(COOKIE_RESET_FLAG) === "1") {
				return;
			}

			window.sessionStorage.setItem(COOKIE_RESET_FLAG, "1");

			try {
				await fetch("/api/auth/clear-stale-cookies", {
					method: "GET",
					cache: "no-store",
					credentials: "include",
				});
			} catch {
				// Ignore cleanup failures; normal login can still continue.
			}

			if (CHAT_COOKIE_RESET_URL) {
				const frame = document.createElement("iframe");
				frame.src = CHAT_COOKIE_RESET_URL;
				frame.style.display = "none";
				frame.setAttribute("aria-hidden", "true");
				document.body.appendChild(frame);

				window.setTimeout(() => {
					frame.remove();
				}, 3000);
			}
		};

		void resetCookies();
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		const error = searchParams.get("error");

		if (!error) {
			return;
		}

		setIsSuccessful(false);

		if (error === "OAuthCallback") {
			toast({
				type: "error",
				description: "Sesi login tidak terbentuk. Coba login lagi setelah refresh sekali.",
			});
			return;
		}

		if (error === "CredentialsSignin") {
			toast({
				type: "error",
				description: "Username atau password salah.",
			});
			return;
		}

		if (error === "OAuthAccountNotLinked") {
			toast({
				type: "error",
				description:
					"Email ini sudah terdaftar. Coba login dengan metode yang sama seperti sebelumnya atau hapus akun lama dulu.",
			});
			return;
		}

		toast({
			type: "error",
			description: `Login gagal: ${error}`,
		});
	}, []);

	return (
		<div className="flex min-h-screen w-full">
			{/* Left Panel — Brand */}
			<div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#0a0f14] flex-col justify-between p-10 xl:p-14">
				{/* Gradient overlays */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(20,184,166,0.15),transparent_60%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(45,212,191,0.08),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-size-[20px_20px] opacity-[0.03]" />

				{/* Logo */}
				<div className="relative z-10">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
							<span className="text-teal-400 font-bold text-sm">U</span>
						</div>
						<span className="text-white font-semibold text-lg tracking-tight">Ultramaxo</span>
					</div>
				</div>

				{/* Headline + Features */}
				<div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
					<h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
						Sign in to continue
						<br />
						<span className="text-teal-400">your journey.</span>
					</h2>
					<p className="mt-5 text-zinc-400 text-base leading-relaxed">
						The most affordable full-featured AI workspace in its class.
					</p>

					{/* Feature highlights */}
					<div className="mt-8 flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
								<svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">Lightning-fast responses, no queue</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
								<svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">Your data stays private and encrypted</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
								<svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
							</div>
							<span className="text-zinc-300 text-sm">Free forever, no credit card required</span>
						</div>
					</div>
				</div>

				{/* Social Proof Footer */}
				<div className="relative z-10">
					<div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-sm px-5 py-4">
						<div className="w-10 h-10 rounded-full bg-teal-500/15 flex items-center justify-center shrink-0">
							<svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<div>
							<p className="text-white text-sm font-semibold">
								Trusted AI workspace
							</p>
							<p className="text-zinc-500 text-xs">
								Used by 150+ active users
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Right Panel — Form */}
			<div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-10 lg:p-14">
				<div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-700">
					{/* Mobile only: show logo */}
					<div className="mb-8 lg:hidden">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
								<span className="text-teal-600 font-bold text-sm">U</span>
							</div>
							<span className="text-zinc-900 font-semibold text-lg tracking-tight">Ultramaxo</span>
						</div>
					</div>

					<AuthForm defaultEmail="" type="login">
						<SubmitButton isSuccessful={isSuccessful}>
							Sign in
						</SubmitButton>
					</AuthForm>

					<p className="mt-6 text-center text-zinc-500 text-sm">
						Don't have an account?{" "}
						<Link
							className="text-teal-600 hover:text-teal-700 transition-colors font-semibold"
							href="/register"
						>
							Sign up
						</Link>
					</p>

					{/* Trust signals */}
					<div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-zinc-400">
						<span>Free forever</span>
						<span className="w-0.5 h-0.5 rounded-full bg-zinc-300" />
						<span>No credit card needed</span>
					</div>
				</div>
			</div>
		</div>
	);
}
