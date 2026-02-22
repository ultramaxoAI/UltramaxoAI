"use client";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			setError("Token reset tidak valid");
		}
	}, [token]);

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (newPassword !== confirmPassword) {
			setError("Password tidak sama");
			return;
		}

		if (newPassword.length < 6) {
			setError("Password minimal 6 karakter");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token,
					newPassword,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Gagal reset password");
			}

			setMessage(data.message || "Password berhasil direset!");

			setTimeout(() => {
				router.push("/login");
			}, 2000);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-bg text-zinc-100 flex items-center justify-center px-4 py-8 relative min-h-screen">
			<motion.svg
				animate={{ opacity: 0.4 }}
				className="absolute inset-0 w-full h-full pointer-events-none"
				initial={{ opacity: 0 }}
				transition={{ duration: 0.8 }}
				xmlns="http://www.w3.org/2000/svg"
			>
				<motion.g
					animate={{ opacity: 1 }}
					fill="none"
					initial={{ opacity: 0 }}
					stroke="url(#grad)"
					strokeWidth="0.8"
					transition={{ duration: 1.2 }}
				>
					<motion.path
						animate={{ pathLength: 1 }}
						d="M5 120 L140 80 L260 140 L420 100"
						initial={{ pathLength: 0 }}
						transition={{
							duration: 2.5,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
							ease: "easeInOut",
						}}
					/>
					<motion.path
						animate={{ pathLength: 1 }}
						d="M60 260 L200 210 L320 260 L480 220"
						initial={{ pathLength: 0 }}
						transition={{
							duration: 3,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
							ease: "easeInOut",
						}}
					/>
					<motion.path
						animate={{ pathLength: 1 }}
						d="M40 40 L220 60 L340 40 L520 70"
						initial={{ pathLength: 0 }}
						transition={{
							duration: 2.2,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
							ease: "easeInOut",
						}}
					/>
				</motion.g>
				<defs>
					<linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
						<stop offset="0%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="#8b5cf6" />
					</linearGradient>
				</defs>
			</motion.svg>

			<motion.div
				animate={{ opacity: 1, y: 0, scale: 1 }}
				className="w-full max-w-xl p-[1.5px] rounded-2xl bg-linear-to-r from-white/30 to-white/30 relative"
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				transition={{ type: "spring", stiffness: 320, damping: 28 }}
			>
				<div className="rounded-2xl border border-white/10 bg-[#0f0f15]/85 backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)] p-6 relative">
					<div className="flex items-center gap-3 mb-4 relative z-10">
						<div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black">
							<Bot size={18} />
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Ultramaxo
							</p>
							<h1 className="text-lg font-semibold text-white">
								Reset Password
							</h1>
						</div>
					</div>

					{error && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
							initial={{ opacity: 0, y: -10 }}
						>
							⚠️ {error}
						</motion.div>
					)}

					{message && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs"
							initial={{ opacity: 0, y: -10 }}
						>
							✅ {message}
						</motion.div>
					)}

					<form
						className="space-y-3 relative z-10"
						onSubmit={handleResetPassword}
					>
						<p className="text-xs text-zinc-400 mb-4">
							Masukkan password baru untuk akun kamu.
						</p>

						<label className="block space-y-1 text-sm text-zinc-300">
							<span className="text-[11px] uppercase tracking-wide text-zinc-500">
								Password Baru
							</span>
							<input
								className="w-full rounded-lg border border-zinc-800 bg-[#12121a] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 focus:outline-none"
								minLength={6}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Minimal 6 karakter"
								required
								type="password"
								value={newPassword}
							/>
							<span className="text-[10px] text-zinc-500">
								Password minimal 6 karakter
							</span>
						</label>

						<label className="block space-y-1 text-sm text-zinc-300">
							<span className="text-[11px] uppercase tracking-wide text-zinc-500">
								Konfirmasi Password
							</span>
							<input
								className="w-full rounded-lg border border-zinc-800 bg-[#12121a] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 focus:outline-none"
								minLength={6}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Ketik ulang password"
								required
								type="password"
								value={confirmPassword}
							/>
						</label>

						<motion.button
							className="w-full rounded-lg bg-white text-black font-semibold text-sm py-2.5 shadow-lg shadow-white/10 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading || !token}
							type="submit"
							whileTap={{ scale: 0.98 }}
						>
							{loading ? "Memproses..." : "Reset Password"}
						</motion.button>
					</form>

					<div className="mt-4 text-[11px]">
						<button
							className="text-white/80 hover:text-white font-medium transition-colors"
							onClick={() => router.push("/login")}
							type="button"
						>
							← Kembali ke Login
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ResetPasswordContent />
		</Suspense>
	);
}
