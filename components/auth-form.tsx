"use client";

import Link from "next/link";
import { GitIcon, LogoGoogle } from "./icons";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function buildCallbackPath(path: string) {
	return encodeURIComponent(path.startsWith("/") ? path : "/chat");
}

export function AuthForm({
	action,
	onSubmit,
	children,
	type,
	defaultEmail = "",
	callbackUrl = "/chat",
}: {
	action?: NonNullable<
		string | ((formData: FormData) => void | Promise<void>) | undefined
	>;
	onSubmit?: React.FormEventHandler<HTMLFormElement>;
	children: React.ReactNode;
	type: "login" | "register";
	defaultEmail?: string;
	callbackUrl?: string;
}) {
	const googleOAuthHref = `/oauth/google?callbackUrl=${buildCallbackPath(callbackUrl)}`;
	const githubOAuthHref = `/oauth/github?callbackUrl=${buildCallbackPath(callbackUrl)}`;
	const loginFallbackAction = `/api/auth/login-fallback?redirectTo=${buildCallbackPath(callbackUrl)}`;
	const resolvedAction =
		type === "login" && !action ? loginFallbackAction : action;
	const isServerAction = typeof resolvedAction === "function";
	const formProps = isServerAction
		? { action: resolvedAction }
		: {
				action: resolvedAction,
				method: "post" as const,
				onSubmit,
			};

	return (
		<div className="relative w-full mx-auto">
			<div className="flex flex-col gap-5 w-full">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
						{type === "login" ? "Sign in" : "Sign up"}
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed">
						{type === "login"
							? "Welcome back! Enter your details to continue."
							: "Create an account to access all features."}
					</p>
				</div>

				{/* Social Auth */}
				<div className="flex flex-col gap-2.5 relative z-10">
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-[0.98]"
						href={googleOAuthHref}
					>
						<LogoGoogle size={16} />
						<span>Continue with Google</span>
					</a>
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 shadow-sm transition-all active:scale-[0.98]"
						href={githubOAuthHref}
					>
						<GitIcon size={16} />
						<span>Continue with GitHub</span>
					</a>
				</div>

				{/* Divider */}
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-zinc-200 dark:border-white/10" />
					</div>
					<div className="relative flex justify-center text-xs uppercase tracking-wider">
						<span className="bg-white dark:bg-[#0a0f14] px-4 text-zinc-400 dark:text-zinc-500 font-medium">
							OR
						</span>
					</div>
				</div>

				{/* Email/Password Form */}
				<form className="flex flex-col gap-3.5 w-full" {...formProps}>
					{type === "register" && (
						<div className="flex flex-col gap-1">
							<Label
								className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm"
								htmlFor="username"
							>
								Username{" "}
								<span className="text-zinc-400 dark:text-zinc-500 text-xs font-normal">
									(optional)
								</span>
							</Label>
							<Input
								autoComplete="username"
								className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 focus:border-zinc-900 dark:focus:border-white focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 w-full px-4"
								id="username"
								name="username"
								placeholder="johndoe"
								type="text"
							/>
						</div>
					)}

					<div className="flex flex-col gap-1">
						<Label
							className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm"
							htmlFor={type === "login" ? "username" : "email"}
						>
							{type === "login" ? "Email or Username" : "Email Address"}
						</Label>
						<Input
							autoComplete={type === "login" ? "username" : "email"}
							autoFocus={type === "login"}
							className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 focus:border-zinc-900 dark:focus:border-white focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 w-full px-4"
							defaultValue={defaultEmail}
							id={type === "login" ? "username" : "email"}
							name={type === "login" ? "username" : "email"}
							placeholder={
								type === "login"
									? "name@example.com or johndoe"
									: "name@email.com"
							}
							required
							type={type === "login" ? "text" : "email"}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<div className="flex justify-between items-center">
							<Label
								className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm"
								htmlFor="password"
							>
								Password
							</Label>
							{type === "login" && (
								<Link
									className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
									href="/forgot-password"
								>
									Forgot password?
								</Link>
							)}
						</div>
						<Input
							className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 focus:border-zinc-900 dark:focus:border-white focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 w-full px-4"
							id="password"
							name="password"
							placeholder="Enter your password"
							required
							type="password"
						/>
					</div>

					<div className="mt-1 flex flex-col gap-3">{children}</div>
				</form>
			</div>
		</div>
	);
}
