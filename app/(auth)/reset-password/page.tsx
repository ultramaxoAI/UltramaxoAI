"use client";
import { motion } from "framer-motion";
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
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Terjadi kesalahan yang tidak diketahui.";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-black p-4 text-slate-200 md:p-6">
			<div
				aria-hidden
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.05),transparent_60%)]"
			/>
			<div
				aria-hidden
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.03),transparent_50%)]"
			/>
			<div
				aria-hidden
				className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-size-[20px_20px] opacity-[0.03]"
			/>

			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="relative w-full max-w-md z-10"
				initial={{ opacity: 0, y: 20 }}
			>
				<div className="flex items-center justify-center mb-8">
					<div className="flex items-center gap-2.5">
						<div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
							<span className="text-white font-bold text-lg">U</span>
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-white/10 bg-[#0a0f14]/80 backdrop-blur-xl p-7 shadow-2xl">
					<h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
						Reset Password
					</h1>
					<p className="text-zinc-400 text-[13px] text-center mb-6 leading-relaxed">
						Enter your new password below.
					</p>

					{error && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-center"
							initial={{ opacity: 0, y: -5 }}
						>
							{error}
						</motion.div>
					)}

					{message && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-4 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs flex items-center justify-center"
							initial={{ opacity: 0, y: -5 }}
						>
							{message}
						</motion.div>
					)}

					<form
						className="space-y-4 relative z-10"
						onSubmit={handleResetPassword}
					>
						<div className="flex flex-col gap-1.5">
							<label
								className="block text-sm font-semibold text-zinc-300"
								htmlFor="new-password"
							>
								New Password
							</label>
							<input
								className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
								id="new-password"
								minLength={6}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Minimum 6 characters"
								required
								type="password"
								value={newPassword}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								className="block text-sm font-semibold text-zinc-300"
								htmlFor="confirm-password"
							>
								Confirm Password
							</label>
							<input
								className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
								id="confirm-password"
								minLength={6}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Re-enter your password"
								required
								type="password"
								value={confirmPassword}
							/>
						</div>

						<button
							className="w-full h-10 mt-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm shadow-white/10"
							disabled={loading || !token}
							type="submit"
						>
							{loading ? "Processing..." : "Reset Password"}
						</button>
					</form>

					<div className="text-center mt-6">
						<button
							className="text-zinc-500 hover:text-white transition-colors text-sm"
							onClick={() => router.push("/login")}
							type="button"
						>
							Back to login
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
