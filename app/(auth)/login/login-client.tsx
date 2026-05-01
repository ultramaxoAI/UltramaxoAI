"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

export default function LoginClient() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const resetCookies = async () => {
			try {
				await fetch("/api/auth/clear-stale-cookies", {
					method: "GET",
					cache: "no-store",
					credentials: "include",
				});
			} catch {
				// Ignore cleanup failures; normal login can still continue.
			}
		};

		void resetCookies();
	}, []);

	useEffect(() => {
		const error = searchParams?.get("error");
		const provider = searchParams?.get("provider");
		const providerLabel = provider ? ` (${provider})` : "";

		if (!error) return;

		void fetch("/api/auth/clear-stale-cookies", {
			method: "GET",
			cache: "no-store",
			credentials: "include",
		}).catch(() => {});

		const cleanUrl = new URL(window.location.href);
		cleanUrl.searchParams.delete("error");
		cleanUrl.searchParams.delete("provider");
		window.history.replaceState(null, "", cleanUrl.toString());

		if (error === "OAuthCallback") {
			toast({
				type: "error",
				description:
					`Login session could not be established${providerLabel}. Please try again.`,
			});
			return;
		}

		if (error === "OAuthAccountNotLinked") {
			toast({
				type: "error",
				description:
					"Sign in failed. If you're logging in with username/password, double-check the admin credentials on the server and try again.",
			});
			return;
		}

		const errorMessage = (() => {
			switch (error) {
				case "CredentialsSignin":
					return "Invalid username or password.";
				case "Configuration":
					return "Login configuration failed during callback. For local Google login, make sure the OAuth redirect URI is allowed.";
				case "ProviderConfig":
					return "Google/GitHub login is not configured on the server yet.";
				case "MissingCredentials":
					return "Please enter your email/username and password.";
				case "Unverified":
					return "Email not verified. Check your inbox and verify first.";
				default:
					return `Sign in failed: ${error}`;
			}
		})();

		toast({ type: "error", description: errorMessage });
	}, [searchParams]);

	return (
		<div className="flex min-h-dvh w-full overflow-y-auto bg-background">
			<div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-zinc-950 dark:bg-black flex-col justify-between p-10 xl:p-14">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.03),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] bg-size-[20px_20px] opacity-[0.03]" />

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

				<div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
					<h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
						Sign in to continue
						<br />
						<span className="text-zinc-300">your journey.</span>
					</h2>
					<p className="mt-5 text-zinc-400 text-base leading-relaxed">
						The most affordable full-featured AI workspace in its class.
					</p>
				</div>
			</div>

			<div className="flex flex-1 items-center justify-center border-zinc-200 border-l bg-background p-4 py-8 dark:border-white/10 sm:p-10 lg:p-14">
				<div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-700 relative z-10">
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

					<AuthForm defaultEmail="" type="login">
						<SubmitButton isSuccessful={false}>Sign in</SubmitButton>
					</AuthForm>

					<p className="mt-6 text-center text-muted-foreground text-sm">
						Don't have an account?{" "}
						<Link
							className="text-foreground/80 hover:text-foreground transition-colors font-semibold"
							href="/register"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
