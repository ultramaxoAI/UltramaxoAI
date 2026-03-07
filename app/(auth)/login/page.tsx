"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

const SESSION_POLL_ATTEMPTS = 12;
const SESSION_POLL_DELAY_MS = 250;

async function waitForSession() {
	for (let attempt = 0; attempt < SESSION_POLL_ATTEMPTS; attempt++) {
		try {
			const response = await fetch("/api/auth/session", {
				cache: "no-store",
				credentials: "same-origin",
				headers: {
					"cache-control": "no-store",
				},
			});

			if (response.ok) {
				const session = await response.json();
				if (session?.user?.id) {
					return true;
				}
			}
		} catch {
			// Ignore transient session fetch failures while the cookie is propagating.
		}

		await new Promise((resolve) => {
			window.setTimeout(resolve, SESSION_POLL_DELAY_MS);
		});
	}

	return false;
}

export default function Page() {
	const [isSuccessful, setIsSuccessful] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();

		const form = event.currentTarget;
		const formData = new FormData(form);

		startTransition(async () => {
			const result: LoginActionState = await login({ status: "idle" }, formData);

			if (result.status === "failed") {
				toast({
					type: "error",
					description: "Invalid username or password!",
				});
				return;
			}

			if (result.status === "unverified") {
				toast({
					type: "error",
					description: "Akun belum diverifikasi. Cek email Anda dulu.",
				});
				return;
			}

			if (result.status === "invalid_data") {
				toast({
					type: "error",
					description: "Failed to validate your data!",
				});
				return;
			}

			if (result.status !== "success") {
				toast({
					type: "error",
					description: "Login gagal. Coba lagi.",
				});
				return;
			}

			setIsSuccessful(true);

			await waitForSession();
			window.location.replace("/chat");
		});
	};

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		const error = searchParams.get("error");

		if (!error) {
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
				<AuthForm defaultEmail="" onSubmit={handleSubmit} type="login">
					<SubmitButton isSuccessful={isSuccessful} pendingOverride={isPending}>
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
