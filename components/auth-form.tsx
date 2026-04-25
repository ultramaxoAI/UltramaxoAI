"use client";

import Link from "next/link";
import { GitIcon, LogoGoogle } from "./icons";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const GOOGLE_OAUTH_HREF = `/oauth/google?callbackUrl=${encodeURIComponent("/chat")}`;
const GITHUB_OAUTH_HREF = `/oauth/github?callbackUrl=${encodeURIComponent("/chat")}`;
const LOGIN_FALLBACK_ACTION = `/api/auth/login-fallback?redirectTo=${encodeURIComponent(
	"/chat",
)}`;

export function AuthForm({
	action,
	onSubmit,
	children,
	type,
	defaultEmail = "",
}: {
	action?: NonNullable<
		string | ((formData: FormData) => void | Promise<void>) | undefined
	>;
	onSubmit?: React.FormEventHandler<HTMLFormElement>;
	children: React.ReactNode;
	type: "login" | "register";
	defaultEmail?: string;
}) {
	const resolvedAction =
		type === "login" && !action ? LOGIN_FALLBACK_ACTION : action;

	return (
		<div className="relative w-full mx-auto">
			<div className="flex flex-col gap-5 w-full">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold tracking-tight text-white">
						{type === "login" ? "Sign in" : "Sign up"}
					</h1>
					<p className="text-zinc-400 text-[13px] leading-relaxed">
						{type === "login"
							? "Welcome back! Enter your details to continue."
							: "Create an account to access all features."}
					</p>
				</div>

				{/* Social Auth */}
				<div className="flex flex-col gap-2.5 relative z-10">
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 shadow-sm transition-all active:scale-[0.98]"
						href={GOOGLE_OAUTH_HREF}
					>
						<LogoGoogle size={16} />
						<span>Continue with Google</span>
					</a>
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 shadow-sm transition-all active:scale-[0.98]"
						href={GITHUB_OAUTH_HREF}
					>
						<GitIcon size={16} />
						<span>Continue with GitHub</span>
					</a>
				</div>

				{/* Divider */}
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-white/10" />
					</div>
					<div className="relative flex justify-center text-xs uppercase tracking-wider">
						<span className="bg-[#0a0f14] px-4 text-zinc-500 font-medium">OR</span>
					</div>
				</div>

				{/* Email/Password Form */}
				<form action={resolvedAction} className="flex flex-col gap-3.5 w-full" method="post" onSubmit={onSubmit}>
					{type === "register" && (
						<div className="flex flex-col gap-1">
							<Label
								className="font-semibold text-zinc-300 text-sm"
								htmlFor="username"
							>
								Username <span className="text-zinc-500 text-xs font-normal">(optional)</span>
							</Label>
							<Input
								autoComplete="username"
								className="bg-white/5 border-white/10 focus:border-white focus:ring-2 focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-white placeholder:text-zinc-500 w-full px-4"
								id="username"
								name="username"
								placeholder="johndoe"
								type="text"
							/>
						</div>
					)}

					<div className="flex flex-col gap-1">
						<Label
							className="font-semibold text-zinc-300 text-sm"
							htmlFor={type === "login" ? "username" : "email"}
						>
							{type === "login" ? "Email or Username" : "Email Address"}
						</Label>
						<Input
							autoComplete={type === "login" ? "username" : "email"}
							autoFocus={type === "login"}
							className="bg-white/5 border-white/10 focus:border-white focus:ring-2 focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-white placeholder:text-zinc-500 w-full px-4"
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
								className="font-semibold text-zinc-300 text-sm"
								htmlFor="password"
							>
								Password
							</Label>
							{type === "login" && (
								<Link
									className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
									href="/forgot-password"
								>
									Forgot password?
								</Link>
							)}
						</div>
						<Input
							className="bg-white/5 border-white/10 focus:border-white focus:ring-2 focus:ring-white/20 transition-all text-sm h-10 rounded-xl text-white placeholder:text-zinc-500 w-full px-4"
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
