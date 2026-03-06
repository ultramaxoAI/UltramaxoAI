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
		<div className="flex min-h-screen w-full items-center justify-center bg-[#050505] relative overflow-hidden py-8">
			<div className="flex w-full max-w-[440px] flex-col gap-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-6">
				{verificationSent ? (
					<div className="bg-[#18181b] p-8 rounded-3xl border border-white/10 text-center shadow-2xl flex flex-col items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
							<span className="text-3xl">📧</span>
						</div>
						<h2 className="text-2xl font-bold text-white tracking-tight">
							Cek Email Anda
						</h2>
						<p className="text-zinc-400 text-sm leading-relaxed mb-4">
							Kami telah mengirimkan tautan verifikasi ke email yang Anda
							daftarkan. Silakan klik tautan tersebut untuk menyelesaikan proses
							pendaftaran.
						</p>
						<p className="text-zinc-500 text-xs mt-2 italic shadow-inner bg-black/30 p-3 rounded-xl w-full">
							Boleh ditutup halaman ini.
						</p>
					</div>
				) : (
					<AuthForm action={formAction} defaultEmail="" type="register">
						<SubmitButton isSuccessful={isSuccessful}>Buat Akun</SubmitButton>
						<p className="mt-6 text-center text-zinc-500 text-sm">
							Sudah punya akun?{" "}
							<Link
								className="text-white hover:text-zinc-300 transition-colors font-semibold"
								href="/login"
							>
								Masuk di sini
							</Link>
						</p>
					</AuthForm>
				)}
			</div>
		</div>
	);
}
