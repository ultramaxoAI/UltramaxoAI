"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function SubmitButton({
	children,
	isSuccessful,
	pendingOverride,
	className,
}: {
	children: React.ReactNode;
	isSuccessful: boolean;
	pendingOverride?: boolean;
	className?: string;
}) {
	const { pending } = useFormStatus();
	const isPending = pendingOverride ?? pending;

	return (
		<Button
			aria-disabled={isPending || isSuccessful}
			className={cn(
				"relative w-full rounded-xl h-11 text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 border-0 shadow-md shadow-white/10",
				className,
			)}
			disabled={isPending || isSuccessful}
			type="submit"
		>
			{children}

			{(isPending || isSuccessful) && (
				<span className="absolute right-4 animate-spin text-black/70">
					<LoaderIcon />
				</span>
			)}

			<output aria-live="polite" className="sr-only">
				{isPending || isSuccessful ? "Loading" : "Submit form"}
			</output>
		</Button>
	);
}
