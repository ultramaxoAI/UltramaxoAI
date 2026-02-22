"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Chat page error boundary caught an error:", error);
	}, [error]);

	return (
		<div className="flex h-dvh w-full flex-col items-center justify-center p-4">
			<div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
				<div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
					<svg
						className="h-6 w-6 text-red-600 dark:text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
						Something went wrong
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						We couldn't load this chat. This might be a temporary issue or your
						connection to the server was lost.
					</p>
				</div>
				<div className="flex w-full flex-col gap-2 relative z-50">
					<Button onClick={() => reset()} className="w-full relative z-[60]">
						Try again
					</Button>
					<Button variant="outline" asChild className="w-full relative z-[60]">
						<Link href="/">Back to Home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
