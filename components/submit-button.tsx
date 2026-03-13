"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/icons";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
				"relative w-full rounded-xl h-11 text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50 border-0 shadow-md shadow-teal-600/20",
				className,
			)}
			disabled={isPending || isSuccessful}
			type="submit"
		>
			{children}

			{(isPending || isSuccessful) && (
				<span className="absolute right-4 animate-spin text-white/70">
					<LoaderIcon />
				</span>
			)}

			<output aria-live="polite" className="sr-only">
				{isPending || isSuccessful ? "Loading" : "Submit form"}
			</output>
		</Button>
	);
}
