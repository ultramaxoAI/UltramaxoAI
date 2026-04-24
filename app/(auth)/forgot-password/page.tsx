"use client";

import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotPasswordForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSendResetLink = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!email) {
			setError("Email harus diisi");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Format email tidak valid");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const text = await response.text();
			let data: { error?: string; message?: string };
			try {
				data = JSON.parse(text) as { error?: string; message?: string };
			} catch {
				throw new Error("Server error: Invalid response");
			}

			if (!response.ok) {
				throw new Error(data.error || "Gagal mengirim link reset");
			}

			setSuccess(
				data.message || "Link reset password telah dikirim ke email Anda",
			);
			setTimeout(() => {
				router.push("/login");
			}, 3000);
		} catch (err) {
			const error = err as Error;
			setError(error.message || "Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-[#0a0f14] text-slate-200 relative overflow-hidden">
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
						Forgot Password
					</h1>
					<p className="text-zinc-400 text-[13px] text-center mb-6 leading-relaxed">
						Enter your email address to receive a password reset link
					</p>

					<form className="space-y-4" onSubmit={handleSendResetLink}>
						<div className="flex flex-col gap-1.5">
							<label
								className="block text-sm font-semibold text-zinc-300"
								htmlFor="email"
							>
								Email Address
							</label>
							<div className="relative">
								<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
								<input
									className="w-full pl-10 pr-4 h-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@example.com"
									required
									type="email"
									value={email}
								/>
							</div>
						</div>

						{(error || success) && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className={`p-3 rounded-xl text-xs flex items-center justify-center ${
									success
										? "bg-white/10 border border-white/20 text-white"
										: "bg-red-500/10 border border-red-500/20 text-red-400"
								}`}
								initial={{ opacity: 0, y: -5 }}
							>
								{error || success}
							</motion.div>
						)}

						<button
							className="w-full h-10 mt-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm shadow-white/10"
							disabled={loading}
							type="submit"
						>
							{loading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Mengirim...
								</>
							) : (
								<>
									Send Reset Link
									<ArrowRight className="w-4 h-4 ml-1" />
								</>
							)}
						</button>
						<div className="text-center mt-6">
							<button 
								type="button" 
								onClick={() => router.push('/login')}
								className="text-zinc-500 hover:text-white transition-colors text-sm"
							>
								Back to login
							</button>
						</div>
					</form>
				</div>
			</motion.div>
		</div>
	);
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ForgotPasswordForm />
		</Suspense>
	);
}
