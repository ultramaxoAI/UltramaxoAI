"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
	const router = useRouter();

	const [isSuccessful, setIsSuccessful] = useState(false);

	const [state, formAction] = useActionState<LoginActionState, FormData>(
		login,
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
				description: "Invalid username or password!",
			});
		} else if (state.status === "invalid_data") {
			toast({
				type: "error",
				description: "Failed to validate your data!",
			});
		} else if (state.status === "success") {
			setIsSuccessful(true);
			updateSession();
			router.refresh();
		}
	}, [state.status]);

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-black relative overflow-hidden py-8">
			<div className="flex w-full max-w-[440px] flex-col gap-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-6">
				<AuthForm action={formAction} defaultEmail="" type="login">
					<SubmitButton isSuccessful={isSuccessful}>Sign In</SubmitButton>
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
