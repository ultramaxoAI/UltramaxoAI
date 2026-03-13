"use client";

import Link from "next/link";
import { GitIcon, LogoGoogle } from "./icons";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const CHAT_CALLBACK_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";
const GOOGLE_OAUTH_HREF = `/oauth/google?callbackUrl=${encodeURIComponent(CHAT_CALLBACK_URL)}`;
const GITHUB_OAUTH_HREF = `/oauth/github?callbackUrl=${encodeURIComponent(CHAT_CALLBACK_URL)}`;
const LOGIN_FALLBACK_ACTION = `/api/auth/login-fallback?redirectTo=${encodeURIComponent(
	CHAT_CALLBACK_URL,
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
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900">
						{type === "login" ? "Sign in" : "Sign up"}
					</h1>
					<p className="text-zinc-500 text-[13px] leading-relaxed">
						{type === "login"
							? "Welcome back! Enter your details to continue."
							: "Create an account to access all features."}
					</p>
				</div>

				{/* Social Auth */}
				<div className="flex flex-col gap-2.5 relative z-10">
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 shadow-sm transition-all active:scale-[0.98]"
						href={GOOGLE_OAUTH_HREF}
					>
						<LogoGoogle size={16} />
						<span>Continue with Google</span>
					</a>
					<a
						className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 shadow-sm transition-all active:scale-[0.98]"
						href={GITHUB_OAUTH_HREF}
					>
						<GitIcon size={16} />
						<span>Continue with GitHub</span>
					</a>
				</div>

				{/* Divider */}
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-zinc-200" />
					</div>
					<div className="relative flex justify-center text-xs uppercase tracking-wider">
						<span className="bg-white px-4 text-zinc-400 font-medium">OR</span>
					</div>
				</div>

				{/* Email/Password Form */}
				<form action={resolvedAction} className="flex flex-col gap-3.5 w-full" method="post" onSubmit={onSubmit}>
					{type === "register" && (
						<div className="flex flex-col gap-1">
							<Label
								className="font-semibold text-zinc-700 text-sm"
								htmlFor="username"
							>
								Username <span className="text-zinc-400 text-xs font-normal">(optional)</span>
							</Label>
							<Input
								autoComplete="username"
								className="bg-white border-zinc-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm h-10 rounded-xl text-zinc-900 placeholder:text-zinc-400 w-full px-4"
								id="username"
								name="username"
								placeholder="johndoe"
								type="text"
							/>
						</div>
					)}

					<div className="flex flex-col gap-1">
						<Label
							className="font-semibold text-zinc-700 text-sm"
							htmlFor={type === "login" ? "username" : "email"}
						>
							{type === "login" ? "Email or Username" : "Email Address"}
						</Label>
						<Input
							autoComplete={type === "login" ? "username" : "email"}
							autoFocus={type === "login"}
							className="bg-white border-zinc-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm h-10 rounded-xl text-zinc-900 placeholder:text-zinc-400 w-full px-4"
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
								className="font-semibold text-zinc-700 text-sm"
								htmlFor="password"
							>
								Password
							</Label>
							{type === "login" && (
								<Link
									className="text-xs text-teal-600 hover:text-teal-700 transition-colors font-medium"
									href="/forgot-password"
								>
									Forgot password?
								</Link>
							)}
						</div>
						<Input
							className="bg-white border-zinc-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm h-10 rounded-xl text-zinc-900 w-full px-4"
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
