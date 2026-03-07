"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

function getCredentialsActionUrl() {
	const targetUrl =
		typeof window !== "undefined" &&
		window.location.hostname.endsWith("ultramaxo.tech")
			? "https://chat.ultramaxo.tech/chat"
			: "/chat";
	const redirectTo = `/oauth/complete?target=${encodeURIComponent(targetUrl)}`;
	return `/api/auth/login-fallback?redirectTo=${encodeURIComponent(redirectTo)}`;
}

export default function Page() {
	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		const error = searchParams.get("error");

		if (!error) {
			return;
		}

		if (error === "OAuthCallback") {
			toast({
				type: "error",
				description: "Sesi login tidak terbentuk. Coba login lagi setelah refresh sekali.",
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
		<div className="flex min-h-screen w-full items-center justify-center bg-black relative overflow-hidden py-8">
			<div className="flex w-full max-w-110 flex-col gap-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-6">
				<AuthForm action={getCredentialsActionUrl()} defaultEmail="" type="login">
					<SubmitButton isSuccessful={false}>
						Sign In
					</SubmitButton>
					<p className="mt-6 text-center text-zinc-500 text-sm">
						Don't have an account?{" "}
						<Link
							className="text-white hover:text-zinc-300 transition-colors font-semibold"
							href="/register"
						>
							Register here
						</Link>
					</p>
				</AuthForm>
			</div>
		</div>
	);
}
