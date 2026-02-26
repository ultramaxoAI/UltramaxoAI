"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const token = searchParams.get("token");
	const email = searchParams.get("email");

	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (!token || !email) {
			setStatus("error");
			setErrorMessage("Link verifikasi tidak valid atau tidak lengkap.");
			return;
		}

		const verifyEmail = async () => {
			try {
				const response = await fetch("/api/auth/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, code: token }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Gagal memverifikasi akun.");
				}

				setStatus("success");

				// Refresh session if already logged in via email (optional but safe)
				router.refresh();

				setTimeout(() => {
					router.push("/login"); // Redirect to login page to sign in automatically or manually
				}, 3000);
			} catch (err: unknown) {
				setStatus("error");
				const errorMessage =
					err instanceof Error
						? err.message
						: "Terjadi kesalahan saat verifikasi.";
				setErrorMessage(errorMessage);
			}
		};

		// Run verification immediately
		verifyEmail();
	}, [token, email, router]);

	return (
		<div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md"
				initial={{ opacity: 0, y: 20 }}
			>
				<div className="flex items-center justify-center mb-8">
					<div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
						<span className="text-2xl font-black text-black">U</span>
					</div>
				</div>

				<div className="bg-[#121214] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
					<div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
						{status === "loading" && (
							<>
								<motion.div
									animate={{ rotate: 360 }}
									className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
									transition={{
										duration: 2,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								>
									<Loader2 className="w-8 h-8 text-blue-500" />
								</motion.div>
								<h1 className="text-2xl font-bold text-white tracking-tight">
									Memverifikasi Akun...
								</h1>
								<p className="text-zinc-400 text-sm leading-relaxed">
									Harap tunggu sebentar selagi kami mengkonfirmasi kredensial
									Anda yang aman.
								</p>
							</>
						)}

						{status === "success" && (
							<motion.div
								animate={{ scale: 1, opacity: 1 }}
								className="flex flex-col items-center"
								initial={{ scale: 0.8, opacity: 0 }}
							>
								<div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
									<CheckCircle2 className="w-8 h-8 text-emerald-500" />
								</div>
								<h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
									Verifikasi Berhasil!
								</h1>
								<p className="text-zinc-400 text-sm mb-8 leading-relaxed">
									Selamat, akun Anda telah diaktifkan secara utuh. Anda akan
									dialihkan secara otomatis sesaat lagi...
								</p>
								<button
									className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)]"
									onClick={() => router.push("/login")}
									type="button"
								>
									Masuk Sekarang Secara Manual
								</button>
							</motion.div>
						)}

						{status === "error" && (
							<motion.div
								animate={{ scale: 1, opacity: 1 }}
								className="flex flex-col items-center"
								initial={{ scale: 0.8, opacity: 0 }}
							>
								<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
									<XCircle className="w-8 h-8 text-red-500" />
								</div>
								<h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
									Gagal Memverifikasi
								</h1>
								<p className="text-red-400 text-sm mb-8 max-w-[260px] leading-relaxed font-medium">
									{errorMessage}
								</p>
								<button
									className="px-8 py-3 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition-colors text-sm"
									onClick={() => router.push("/login")}
									type="button"
								>
									Kembali ke Halaman Login
								</button>
							</motion.div>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
}

export default function VerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[#050505] flex items-center justify-center">
					<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
				</div>
			}
		>
			<VerifyContent />
		</Suspense>
	);
}
